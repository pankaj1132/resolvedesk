import "server-only";

import { notFound } from "next/navigation";
import type { KnowledgeVisibility } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { requireTicketAccess, ticketScope, type TicketAccess } from "@/lib/tickets";

const pageSize = 20;

export type ArticleDraft = { title: string; body: string; visibility: KnowledgeVisibility };
export type ArticleChange = { intent: "save" | "publish"; draft: ArticleDraft } | { intent: "unpublish" };

export async function requireKnowledgeEditor(slug: string) {
  const access = await requireTicketAccess(slug);
  if (!access.staff) notFound();
  return access;
}

function searchText(query: string) {
  return { contains: query.replace(/[\\%_]/g, "\\$&"), mode: "insensitive" as const };
}

function customerPublication(organizationId: string, query = "") {
  const text = searchText(query);
  return {
    organizationId,
    publishedVisibility: "CUSTOMER" as const,
    publishedAt: { not: null },
    OR: query ? [{ publishedTitle: text }, { publishedBody: text }] : undefined,
  };
}

export async function listKnowledgeArticles(access: TicketAccess, query: string, page: number) {
  const organizationId = access.organization.id;
  const pagination = { skip: (page - 1) * pageSize, take: pageSize + 1 };

  if (!access.staff) {
    const articles = await db.knowledgeArticle.findMany({
      where: customerPublication(organizationId, query),
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      ...pagination,
      select: { id: true, publishedTitle: true, publishedAt: true },
    });
    return {
      articles: articles.slice(0, pageSize).map(({ id, publishedTitle, publishedAt }) => ({
        id, title: publishedTitle ?? "Article", date: publishedAt, publication: null,
      })),
      hasNext: articles.length > pageSize,
    };
  }

  const text = searchText(query);
  const articles = await db.knowledgeArticle.findMany({
    where: {
      organizationId,
      OR: query ? [{ title: text }, { body: text }, { publishedTitle: text }, { publishedBody: text }] : undefined,
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    ...pagination,
    select: { id: true, title: true, updatedAt: true, publishedVisibility: true },
  });
  return {
    articles: articles.slice(0, pageSize).map(({ id, title, updatedAt, publishedVisibility }) => ({
      id, title, date: updatedAt, publication: publishedVisibility ?? "DRAFT" as const,
    })),
    hasNext: articles.length > pageSize,
  };
}

export function findCustomerArticle(access: TicketAccess, id: string) {
  return db.knowledgeArticle.findFirst({
    where: { ...customerPublication(access.organization.id), id },
    select: { publishedTitle: true, publishedBody: true, publishedAt: true },
  });
}

export function findEditorialArticle(access: TicketAccess, id: string) {
  if (!access.staff) notFound();
  return db.knowledgeArticle.findFirst({
    where: { id, organizationId: access.organization.id },
    select: {
      id: true, title: true, body: true, visibility: true, revision: true,
      publishedTitle: true, publishedBody: true, publishedVisibility: true, publishedAt: true,
      author: { select: { name: true } },
    },
  });
}

export function createKnowledgeDraft(access: TicketAccess, draft: ArticleDraft) {
  if (!access.staff) notFound();
  return db.knowledgeArticle.create({
    data: { ...draft, organizationId: access.organization.id, authorId: access.userId },
    select: { id: true },
  });
}

export async function changeKnowledgeArticle(access: TicketAccess, id: string, revision: number, change: ArticleChange) {
  if (!access.staff) notFound();
  const where = { id, organizationId: access.organization.id };
  const article = await db.knowledgeArticle.findFirst({ where, select: { id: true } });
  if (!article) notFound();

  const publication = change.intent === "publish" ? {
    publishedTitle: change.draft.title, publishedBody: change.draft.body,
    publishedVisibility: change.draft.visibility, publishedAt: new Date(),
  } : change.intent === "unpublish" ? {
    publishedTitle: null, publishedBody: null, publishedVisibility: null, publishedAt: null,
  } : {};

  const saved = await db.knowledgeArticle.updateMany({
    where: { ...where, revision },
    data: { ...(change.intent === "unpublish" ? {} : change.draft), ...publication, revision: { increment: 1 } },
  });
  return saved.count === 1;
}

export async function ticketArticleSuggestions(access: TicketAccess, ticketId: string, query: string) {
  if (!access.staff) notFound();
  const ticket = await db.ticket.findFirst({ where: ticketScope(access, ticketId), select: { id: true } });
  if (!ticket) notFound();

  const articles = await db.knowledgeArticle.findMany({
    where: customerPublication(access.organization.id, query),
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: 8,
    select: { id: true, publishedTitle: true },
  });
  return articles.flatMap(({ id, publishedTitle }) => publishedTitle ? [{ id, title: publishedTitle }] : []);
}
