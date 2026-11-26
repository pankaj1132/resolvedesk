BEGIN;

-- CreateEnum
CREATE TYPE "KnowledgeVisibility" AS ENUM ('INTERNAL', 'CUSTOMER');

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "visibility" "KnowledgeVisibility" NOT NULL DEFAULT 'INTERNAL',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "publishedTitle" TEXT,
    "publishedBody" TEXT,
    "publishedVisibility" "KnowledgeVisibility",
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeArticle_organizationId_updatedAt_id_idx" ON "KnowledgeArticle"("organizationId", "updatedAt", "id");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_organizationId_publishedVisibility_publish_idx" ON "KnowledgeArticle"("organizationId", "publishedVisibility", "publishedAt", "id");

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
