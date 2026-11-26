"use client";

import { useActionState, useState } from "react";
import { changeArticleAction, createArticleAction } from "@/app/workspaces/[slug]/knowledge/actions";
import { articleBodyLimit, articleTitleLimit, knowledgeVisibilityLabels } from "@/lib/knowledge-fields";
import type { ArticleDraft } from "@/lib/knowledge";

type EditorialDraft = ArticleDraft & { id: string; revision: number };

export function ArticleForm({ slug, article, published }: { slug: string; article?: EditorialDraft; published: boolean }) {
  const handler = article ? changeArticleAction.bind(null, slug, article.id) : createArticleAction.bind(null, slug);
  const [state, action, pending] = useActionState(handler, {});
  const [baseRevision] = useState(article?.revision);
  const [title, setTitle] = useState(article?.title ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [visibility, setVisibility] = useState(article?.visibility ?? "INTERNAL");

  return (
    <form className="grid gap-4" action={action} aria-busy={pending}>
      {article && <input name="revision" type="hidden" value={state.revision ?? baseRevision} />}
      <label className="auth-field">
        Article title
        <input name="title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={articleTitleLimit} required />
      </label>
      <label className="auth-field max-w-xs">
        Audience when published
        <select name="visibility" value={visibility} onChange={(event) => setVisibility(event.target.value === "CUSTOMER" ? "CUSTOMER" : "INTERNAL")}>
          <option value="INTERNAL">{knowledgeVisibilityLabels.INTERNAL}</option>
          <option value="CUSTOMER">{knowledgeVisibilityLabels.CUSTOMER}</option>
        </select>
      </label>
      <label className="auth-field">
        Article text
        <textarea name="body" rows={12} value={body} onChange={(event) => setBody(event.target.value)} maxLength={articleBodyLimit} required />
      </label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.message && !pending && <p className="text-sm text-[var(--muted)]" role="status">{state.message}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button className="auth-button auth-button-secondary" type="submit" name="intent" value="save" disabled={pending}>
          {article ? "Save draft" : "Create draft"}
        </button>
        {article && (
          <button className="auth-button auth-button-primary" type="submit" name="intent" value="publish" disabled={pending}>
            {published ? "Publish changes" : "Publish article"}
          </button>
        )}
        {published && (
          <button className="auth-button auth-button-secondary" type="submit" name="intent" value="unpublish" formNoValidate disabled={pending}>
            Unpublish
          </button>
        )}
        {pending && <span className="text-sm text-[var(--muted)]" role="status">Saving…</span>}
      </div>
    </form>
  );
}
