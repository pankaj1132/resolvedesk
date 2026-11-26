import "server-only";

import { notFound } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import type { TicketPriority, TicketStatus, WorkspaceRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { slaDeadlines } from "@/lib/sla-fields";
import { isTicketDone, ticketPriorityLabels, ticketStatusLabels, type readTicketFilters } from "@/lib/ticket-fields";
import { notifyTicketResponse, notifyTicketUsers, supportRecipients } from "@/lib/ticket-notifications";
import { ticketSlaTargets } from "@/lib/workspace-operations";
import { findWorkspaceMembership } from "@/lib/workspaces";

const staffRoles: WorkspaceRole[] = ["OWNER", "AGENT"];
const pageSize = 20;

export async function requireTicketAccess(slug: string) {
  const { user } = await requireSession();
  const membership = await findWorkspaceMembership(slug, user.id);
  if (!membership) notFound();

  return { organization: membership.organization, userId: user.id, role: membership.role, staff: staffRoles.includes(membership.role) };
}

export type TicketAccess = Awaited<ReturnType<typeof requireTicketAccess>>;

function scopedTickets(access: TicketAccess) {
  return {
    organizationId: access.organization.id,
    requesterId: access.staff ? undefined : access.userId,
  };
}

export function ticketScope(access: TicketAccess, id: string) {
  return { ...scopedTickets(access), id };
}

async function lockTicketSettings(tx: Prisma.TransactionClient, access: TicketAccess, id: string) {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Ticket" WHERE id = ${id} AND "organizationId" = ${access.organization.id} FOR UPDATE
  `;
  if (!rows.length) notFound();
  return ticketScope(access, id);
}

export async function lockTicketConversation(tx: Prisma.TransactionClient, access: TicketAccess, id: string) {
  const scope = ticketScope(access, id);
  const writable = await tx.ticket.updateMany({ where: { ...scope, status: { not: "CLOSED" } }, data: { updatedAt: new Date() } });
  if (writable.count) return true;

  const ticket = await tx.ticket.findUnique({ where: scope, select: { id: true } });
  if (!ticket) notFound();
  return false;
}

async function reopenAfterRequesterResponse(
  tx: Prisma.TransactionClient,
  access: TicketAccess,
  id: string,
  response: "reply" | "attachment",
) {
  if (access.staff) return;

  const reopened = await tx.ticket.updateMany({
    where: { ...ticketScope(access, id), status: { in: ["WAITING_ON_CUSTOMER", "RESOLVED"] } },
    data: { status: "OPEN", resolvedAt: null },
  });
  if (reopened.count) {
    await tx.ticketActivity.create({
      data: { ticketId: id, actorId: access.userId, summary: `Reopened after a requester ${response}` },
    });
  }
}

export async function recordPublicResponse(tx: Prisma.TransactionClient, access: TicketAccess, id: string, response: "reply" | "attachment", occurredAt: Date) {
  const where = ticketScope(access, id);
  const ticket = await tx.ticket.findUniqueOrThrow({
    where,
    select: { id: true, assigneeId: true, requesterId: true, firstResponseAt: true },
  });
  if (response === "reply" && access.staff && !ticket.firstResponseAt && ticket.requesterId !== access.userId) {
    await tx.ticket.update({ where, data: { firstResponseAt: occurredAt } });
  }

  await reopenAfterRequesterResponse(tx, access, id, response);
  await notifyTicketResponse(tx, access, ticket, response === "reply" ? "New reply on a ticket" : "New attachment on a ticket");
}

export async function listTickets(access: TicketAccess, filters: ReturnType<typeof readTicketFilters>) {
  const query = filters.query.replace(/[\\%_]/g, "\\$&");
  const search = { contains: query, mode: "insensitive" as const };
  const assignment = access.staff ? filters.assignee : undefined;
  const tickets = await db.ticket.findMany({
    where: {
      ...scopedTickets(access),
      status: filters.status,
      priority: filters.priority,
      assigneeId: assignment === "mine" ? access.userId : assignment === "unassigned" ? null : undefined,
      tags: access.staff && filters.tag ? { has: filters.tag } : undefined,
      OR: query ? [{ title: search }, { description: search }] : undefined,
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    skip: (filters.page - 1) * pageSize,
    take: pageSize + 1,
    select: {
      id: true, title: true, status: true, priority: true,
      tags: access.staff,
      assignee: { select: { name: true } },
    },
  });

  return { tickets: tickets.slice(0, pageSize), hasNextPage: tickets.length > pageSize };
}

export function findTicket(access: TicketAccess, id: string) {
  const visibility = access.staff ? undefined : { internal: false };
  return db.ticket.findFirst({
    where: ticketScope(access, id),
    select: {
      id: true, title: true, description: true, status: true, priority: true, assigneeId: true, createdAt: true,
      tags: access.staff,
      responseDueAt: true, resolutionDueAt: true, resolutionOverride: true, firstResponseAt: true, resolvedAt: true,
      requester: { select: { name: true } },
      assignee: { select: { name: true } },
      messages: {
        where: visibility,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true, body: true, internal: true, createdAt: true, author: { select: { name: true } } },
      },
      attachments: {
        where: visibility,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true, fileName: true, byteSize: true, internal: true, createdAt: true, author: { select: { name: true } } },
      },
      activities: {
        where: visibility,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true, summary: true, internal: true, createdAt: true, actor: { select: { name: true } } },
      },
    },
  });
}

export function createTicket(access: TicketAccess, title: string, description: string) {
  return db.$transaction(async (tx) => {
    const organizationId = access.organization.id;
    const targets = await ticketSlaTargets(tx, organizationId, "NORMAL");
    const createdAt = new Date();
    const ticket = await tx.ticket.create({
      data: { organizationId, requesterId: access.userId, title, description, createdAt, ...slaDeadlines(createdAt, targets) },
      select: { id: true },
    });
    const recipients = await supportRecipients(tx, organizationId, null);
    await notifyTicketUsers(tx, access, ticket.id, recipients, "New ticket in your workspace");
    return ticket;
  });
}

export async function listTicketAssignees(access: TicketAccess) {
  if (!access.staff) return [];

  return db.workspaceMembership.findMany({
    where: { organizationId: access.organization.id, role: { in: staffRoles } },
    orderBy: [{ user: { name: "asc" } }, { userId: "asc" }],
    select: { userId: true, user: { select: { name: true, email: true } } },
  });
}

export async function updateTicketSettings(
  access: TicketAccess,
  id: string,
  settings: { status: TicketStatus; priority: TicketPriority; assigneeId: string | null; override: Date | null; tags: string[] },
) {
  if (!access.staff) notFound();

  return db.$transaction(async (tx) => {
    const assignee = settings.assigneeId ? await tx.workspaceMembership.findFirst({
      where: { organizationId: access.organization.id, userId: settings.assigneeId, role: { in: staffRoles } },
      select: { user: { select: { name: true } } },
    }) : null;
    if (settings.assigneeId && !assignee) return "Choose an Owner or Agent from this workspace.";

    const where = await lockTicketSettings(tx, access, id);
    const before = await tx.ticket.findUniqueOrThrow({
      where,
      select: {
        status: true, priority: true, requesterId: true, assigneeId: true, assignee: { select: { name: true } },
        createdAt: true, firstResponseAt: true, resolutionDueAt: true, resolutionOverride: true, tags: true,
      },
    });
    const { status, priority, assigneeId, override, tags } = settings;
    const priorityChanged = before.priority !== priority;
    const statusChanged = before.status !== status;
    if (statusChanged && status === "CLOSED" && before.status !== "RESOLVED") return "Resolve the ticket before closing it.";
    if (statusChanged && before.status === "CLOSED" && status !== "OPEN") return "Reopen the ticket before moving it to another status.";
    const assignmentChanged = before.assigneeId !== assigneeId;
    const tagsChanged = before.tags.join(",") !== tags.join(",");
    const resolutionOverride = Boolean(override);
    const overrideChanged = before.resolutionOverride !== resolutionOverride ||
      (override !== null && before.resolutionDueAt.getTime() !== override.getTime());
    const recalculate = priorityChanged || (before.resolutionOverride && !override);
    const targets = recalculate ? await ticketSlaTargets(tx, access.organization.id, priority) : null;
    const deadlines = targets ? slaDeadlines(before.createdAt, targets) : null;
    const keepResponse = before.firstResponseAt !== null || isTicketDone(before.status);
    const resolutionDueAt = override ?? deadlines?.resolutionDueAt ?? before.resolutionDueAt;

    const activity = [];
    if (statusChanged) {
      activity.push({ summary: `Status changed from ${ticketStatusLabels[before.status]} to ${ticketStatusLabels[status]}`, internal: false });
    }
    if (priorityChanged) {
      activity.push({ summary: `Priority changed from ${ticketPriorityLabels[before.priority]} to ${ticketPriorityLabels[priority]}`, internal: true });
    }
    if (assignmentChanged) {
      activity.push({ summary: `Assignee changed from ${before.assignee?.name ?? "Unassigned"} to ${assignee?.user.name ?? "Unassigned"}`, internal: true });
    }
    if (overrideChanged) {
      activity.push({ summary: override ? "Set a custom resolution deadline" : "Restored the SLA resolution deadline", internal: true });
    }
    if (tagsChanged) {
      activity.push({ summary: tags.length ? `Set ticket tags to ${tags.join(", ")}` : "Cleared ticket tags", internal: true });
    }

    if (activity.length) {
      await tx.ticket.update({
        where,
        data: {
          status, priority, assigneeId, resolutionOverride, resolutionDueAt, tags,
          responseDueAt: priorityChanged && !keepResponse ? deadlines?.responseDueAt : undefined,
          resolvedAt: statusChanged && status !== "CLOSED" ? (status === "RESOLVED" ? new Date() : null) : undefined,
        },
      });
      await tx.ticketActivity.createMany({
        data: activity.map((entry) => ({ ...entry, ticketId: id, actorId: access.userId })),
      });
      if (statusChanged) await notifyTicketUsers(tx, access, id, [before.requesterId], `Ticket status changed to ${ticketStatusLabels[status]}`);
      if (assignmentChanged && assigneeId) await notifyTicketUsers(tx, access, id, [assigneeId], "A ticket was assigned to you");
    }
    return null;
  });
}

export async function addTicketMessage(access: TicketAccess, id: string, body: string, internal: boolean) {
  if (internal && !access.staff) notFound();

  return db.$transaction(async (tx) => {
    if (!await lockTicketConversation(tx, access, id)) return false;
    const message = await tx.ticketMessage.create({
      data: { ticketId: id, authorId: access.userId, body, internal },
      select: { createdAt: true },
    });
    if (!internal) await recordPublicResponse(tx, access, id, "reply", message.createdAt);
    return true;
  });
}
