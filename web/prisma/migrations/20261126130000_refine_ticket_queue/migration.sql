BEGIN;

-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'CLOSED';

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Ticket_organizationId_assigneeId_updatedAt_id_idx" ON "Ticket"("organizationId", "assigneeId", "updatedAt", "id");

-- CreateIndex
CREATE INDEX "Ticket_tags_idx" ON "Ticket" USING GIN ("tags");

COMMIT;
