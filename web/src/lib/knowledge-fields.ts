import type { KnowledgeVisibility } from "@/generated/prisma/enums";

export const articleTitleLimit = 140;
export const articleBodyLimit = 20_000;
export const articleSearchLimit = 120;

export const knowledgeVisibilityLabels: Record<KnowledgeVisibility, string> = {
  INTERNAL: "Staff only",
  CUSTOMER: "Customer-facing",
};

export function knowledgePath(slug: string) {
  return `/workspaces/${slug}/knowledge`;
}

export function isArticleLink(text: string, slug: string) {
  const prefix = `${knowledgePath(slug)}/`;
  return text.startsWith(prefix) && /^[a-z0-9]{20,40}$/.test(text.slice(prefix.length));
}

export function readArticleSearch(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, articleSearchLimit) : "";
}

export function readArticlePage(value: unknown) {
  const page = typeof value === "string" ? Number(value) : 1;
  return Number.isInteger(page) && page > 0 && page <= 100_000_000 ? page : 1;
}
