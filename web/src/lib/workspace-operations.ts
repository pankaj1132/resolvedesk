import "server-only";

import { notFound } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import type { TicketPriority } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { defaultSlaTargets, hourMillis, reportingDays, slaPriorities, type SlaTargets } from "@/lib/sla-fields";
import type { TicketAccess } from "@/lib/tickets";

export async function ticketSlaTargets(tx: Prisma.TransactionClient, organizationId: string, priority: TicketPriority) {
  return await tx.workspaceSlaPolicy.findUnique({
    where: { organizationId_priority: { organizationId, priority } },
    select: { responseHours: true, resolutionHours: true },
  }) ?? defaultSlaTargets[priority];
}

export async function workspaceSlaTargets(organizationId: string) {
  const policies = await db.workspaceSlaPolicy.findMany({ where: { organizationId } });
  const targets = { ...defaultSlaTargets };
  for (const { priority, responseHours, resolutionHours } of policies) {
    targets[priority] = { responseHours, resolutionHours };
  }
  return targets;
}

export function saveWorkspaceSlaTargets(access: TicketAccess, targets: Record<TicketPriority, SlaTargets>) {
  if (access.role !== "OWNER") notFound();

  const organizationId = access.organization.id;
  return db.$transaction(slaPriorities.map((priority) => db.workspaceSlaPolicy.upsert({
    where: { organizationId_priority: { organizationId, priority } },
    create: { organizationId, priority, ...targets[priority] },
    update: targets[priority],
  })));
}

function overdueScope(organizationId: string, now: Date): Prisma.TicketWhereInput {
  return {
    organizationId,
    status: { notIn: ["RESOLVED", "CLOSED"] },
    OR: [{ firstResponseAt: null, responseDueAt: { lt: now } }, { resolutionDueAt: { lt: now } }],
  };
}

export async function listSlaEscalations(access: TicketAccess, now: Date, personal = false) {
  if (!access.staff) notFound();
  const assignment = personal && access.role !== "OWNER"
    ? { OR: [{ assigneeId: access.userId }, { assigneeId: null }] }
    : {};

  const tickets = await db.ticket.findMany({
    where: { AND: [overdueScope(access.organization.id, now), assignment] },
    orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
    take: 51,
    select: {
      id: true, title: true, priority: true, responseDueAt: true, firstResponseAt: true, resolutionDueAt: true,
      assignee: { select: { name: true } },
    },
  });
  return {
    tickets: tickets.slice(0, 50).map((ticket) => ({
      ...ticket,
      responseOverdue: !ticket.firstResponseAt && ticket.responseDueAt < now,
      resolutionOverdue: ticket.resolutionDueAt < now,
    })),
    hasMore: tickets.length > 50,
  };
}

type TicketMetrics = {
  backlog: number;
  firstReplies: number;
  meanFirstResponseHours: number | null;
  resolutions: number;
  meanResolutionHours: number | null;
};

export async function getWorkspaceMetrics(access: TicketAccess, now: Date) {
  if (!access.staff) notFound();
  const organizationId = access.organization.id;
  const since = new Date(now.getTime() - reportingDays * 24 * hourMillis);

  const [metrics, overdue] = await Promise.all([
    db.$queryRaw<TicketMetrics[]>`
      SELECT count(*) FILTER (WHERE status NOT IN ('RESOLVED', 'CLOSED'))::int AS backlog,
        count(*) FILTER (WHERE "createdAt" >= ${since} AND "firstResponseAt" IS NOT NULL)::int AS "firstReplies",
        (avg(extract(epoch FROM ("firstResponseAt" - "createdAt")) / 3600)
          FILTER (WHERE "createdAt" >= ${since}))::float8 AS "meanFirstResponseHours",
        count(*) FILTER (WHERE "createdAt" >= ${since} AND status IN ('RESOLVED', 'CLOSED') AND "resolvedAt" IS NOT NULL)::int AS resolutions,
        (avg(extract(epoch FROM ("resolvedAt" - "createdAt")) / 3600)
          FILTER (WHERE "createdAt" >= ${since} AND status IN ('RESOLVED', 'CLOSED')))::float8 AS "meanResolutionHours"
      FROM "Ticket" WHERE "organizationId" = ${organizationId}
    `,
    db.ticket.count({ where: overdueScope(organizationId, now) }),
  ]);
  return { ...metrics[0], overdue };
}
