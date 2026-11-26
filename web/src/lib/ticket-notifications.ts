import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { TicketAccess } from "@/lib/tickets";

export async function notifyTicketUsers(
  tx: Prisma.TransactionClient,
  access: TicketAccess,
  ticketId: string,
  recipients: string[],
  message: string,
) {
  const data = [...new Set(recipients)].filter((userId) => userId !== access.userId)
    .map((userId) => ({ userId, ticketId, message }));
  if (data.length) await tx.ticketNotification.createMany({ data });
}

export async function supportRecipients(tx: Prisma.TransactionClient, organizationId: string, assigneeId: string | null) {
  if (assigneeId) return [assigneeId];

  const owners = await tx.workspaceMembership.findMany({
    where: { organizationId, role: "OWNER" },
    select: { userId: true },
  });
  return owners.map((owner) => owner.userId);
}

export async function notifyTicketResponse(
  tx: Prisma.TransactionClient,
  access: TicketAccess,
  ticket: { id: string; requesterId: string; assigneeId: string | null },
  message: string,
) {
  const recipients = access.staff
    ? [ticket.requesterId]
    : await supportRecipients(tx, access.organization.id, ticket.assigneeId);
  await notifyTicketUsers(tx, access, ticket.id, recipients, message);
}

function notificationScope(access: TicketAccess) {
  return {
    userId: access.userId,
    ticket: { organizationId: access.organization.id, requesterId: access.staff ? undefined : access.userId },
  };
}

export async function listTicketNotifications(access: TicketAccess) {
  const where = notificationScope(access);
  const [notifications, unread] = await Promise.all([
    db.ticketNotification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
      select: { id: true, message: true, readAt: true, createdAt: true, ticket: { select: { id: true, title: true } } },
    }),
    db.ticketNotification.count({ where: { ...where, readAt: null } }),
  ]);
  return { notifications, unread };
}

export function markTicketNotificationsRead(access: TicketAccess) {
  return db.ticketNotification.updateMany({
    where: { ...notificationScope(access), readAt: null },
    data: { readAt: new Date() },
  });
}
