BEGIN;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "firstResponseAt" TIMESTAMP(3),
ADD COLUMN     "resolutionDueAt" TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP + '2 days'::interval),
ADD COLUMN     "resolutionOverride" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "responseDueAt" TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP + '08:00:00'::interval);

-- CreateTable
CREATE TABLE "WorkspaceSlaPolicy" (
    "organizationId" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL,
    "responseHours" INTEGER NOT NULL,
    "resolutionHours" INTEGER NOT NULL,

    CONSTRAINT "WorkspaceSlaPolicy_pkey" PRIMARY KEY ("organizationId","priority")
);

-- CreateTable
CREATE TABLE "TicketNotification" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketNotification_userId_readAt_createdAt_idx" ON "TicketNotification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "TicketNotification_ticketId_idx" ON "TicketNotification"("ticketId");

-- CreateIndex
CREATE INDEX "Ticket_organizationId_createdAt_idx" ON "Ticket"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_organizationId_status_responseDueAt_idx" ON "Ticket"("organizationId", "status", "responseDueAt");

-- CreateIndex
CREATE INDEX "Ticket_organizationId_status_resolutionDueAt_idx" ON "Ticket"("organizationId", "status", "resolutionDueAt");

-- AddForeignKey
ALTER TABLE "WorkspaceSlaPolicy" ADD CONSTRAINT "WorkspaceSlaPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketNotification" ADD CONSTRAINT "TicketNotification_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketNotification" ADD CONSTRAINT "TicketNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Apply the default priority targets to tickets created before SLA tracking.
UPDATE "Ticket"
SET "responseDueAt" = "createdAt" + CASE priority
    WHEN 'LOW' THEN INTERVAL '24 hours'
    WHEN 'NORMAL' THEN INTERVAL '8 hours'
    WHEN 'HIGH' THEN INTERVAL '4 hours'
    ELSE INTERVAL '1 hour'
END,
"resolutionDueAt" = "createdAt" + CASE priority
    WHEN 'LOW' THEN INTERVAL '96 hours'
    WHEN 'NORMAL' THEN INTERVAL '48 hours'
    WHEN 'HIGH' THEN INTERVAL '24 hours'
    ELSE INTERVAL '8 hours'
END;

-- Recover the first public staff reply when the conversation provides it.
UPDATE "Ticket" AS ticket
SET "firstResponseAt" = history."firstResponse"
FROM (
    SELECT message."ticketId", MIN(message."createdAt") AS "firstResponse"
    FROM "TicketMessage" AS message
    JOIN "Ticket" AS source ON source.id = message."ticketId"
    JOIN "WorkspaceMembership" AS staff ON staff."organizationId" = source."organizationId"
        AND staff."userId" = message."authorId" AND staff.role IN ('OWNER', 'AGENT')
    WHERE NOT message.internal AND message."authorId" <> source."requesterId"
        AND message."createdAt" >= source."createdAt"
    GROUP BY message."ticketId"
) AS history
WHERE ticket.id = history."ticketId";

-- Preserve unknown legacy resolution times when the activity log has no event.
UPDATE "Ticket" AS ticket
SET "resolvedAt" = history."lastResolution"
FROM (
    SELECT "ticketId", MAX("createdAt") AS "lastResolution"
    FROM "TicketActivity"
    WHERE NOT internal AND summary LIKE 'Status changed from % to Resolved'
    GROUP BY "ticketId"
) AS history
WHERE ticket.id = history."ticketId" AND ticket.status = 'RESOLVED'
    AND history."lastResolution" >= ticket."createdAt";

COMMIT;
