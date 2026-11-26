"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { articleBodyLimit, articleTitleLimit, knowledgePath } from "@/lib/knowledge-fields";
import { changeKnowledgeArticle, createKnowledgeDraft, requireKnowledgeEditor, type ArticleChange, type ArticleDraft } from "@/lib/knowledge";

type ArticleState = { error?: string; message?: string; revision?: number };

function readDraft(fields: FormData): ArticleDraft | string {
  const rawTitle = fields.get("title");
  const rawBody = fields.get("body");
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const body = typeof rawBody === "string" ? rawBody.trim() : "";
  const visibility = fields.get("visibility");
  if (!title || title.length > articleTitleLimit) return `Enter a title from 1 to ${articleTitleLimit} characters.`;
  if (!body || body.length > articleBodyLimit) return `Enter article text from 1 to ${articleBodyLimit} characters.`;
  if (visibility !== "CUSTOMER" && visibility !== "INTERNAL") return "Choose the article visibility.";
  return { title, body, visibility };
}

export async function createArticleAction(slug: string, _state: ArticleState, fields: FormData): Promise<ArticleState> {
  const access = await requireKnowledgeEditor(slug);
  const draft = readDraft(fields);
  if (typeof draft === "string") return { error: draft };

  const article = await createKnowledgeDraft(access, draft);
  const base = knowledgePath(slug);
  revalidatePath(base);
  redirect(`${base}/${article.id}`);
}

export async function changeArticleAction(slug: string, id: string, _state: ArticleState, fields: FormData): Promise<ArticleState> {
  const access = await requireKnowledgeEditor(slug);
  const rawRevision = fields.get("revision");
  const revision = Number(rawRevision);
  if (typeof rawRevision !== "string" || !/^\d+$/.test(rawRevision) || !Number.isSafeInteger(revision) || revision >= 2_147_483_647) {
    return { error: "Reload the article to get its current revision." };
  }

  const intent = fields.get("intent") ?? "save";
  let change: ArticleChange;
  if (intent === "unpublish") {
    change = { intent };
  } else if (intent === "save" || intent === "publish") {
    const draft = readDraft(fields);
    if (typeof draft === "string") return { error: draft, revision };
    change = { intent, draft };
  } else {
    return { error: "Choose a valid article action.", revision };
  }

  if (!await changeKnowledgeArticle(access, id, revision, change)) {
    return { error: "Another edit was saved. Copy your changes and reload before saving again.", revision };
  }
  const base = knowledgePath(slug);
  revalidatePath(base);
  revalidatePath(`${base}/${id}`);
  const message = intent === "unpublish" ? "Article unpublished." : intent === "publish" ? "Article published." : "Draft saved.";
  return { message, revision: revision + 1 };
}
