import { notFound } from "next/navigation";
import { ArticleContent } from "@/components/knowledge/article-content";
import { ArticleForm } from "@/components/knowledge/article-form";
import { TicketShell } from "@/components/tickets/ticket-shell";
import { findCustomerArticle, findEditorialArticle } from "@/lib/knowledge";
import { knowledgePath, knowledgeVisibilityLabels } from "@/lib/knowledge-fields";
import { requireTicketAccess } from "@/lib/tickets";

export const metadata = { title: "Knowledge Base article" };

export default async function ArticlePage({ params }: PageProps<"/workspaces/[slug]/knowledge/[articleId]">) {
  const { slug, articleId } = await params;
  const access = await requireTicketAccess(slug);
  const back = { href: knowledgePath(access.organization.slug), label: "Back to Knowledge Base" };

  if (!access.staff) {
    const article = await findCustomerArticle(access, articleId);
    if (!article?.publishedTitle || !article.publishedBody || !article.publishedAt) notFound();

    return (
      <TicketShell back={back}>
        <ArticleContent title={article.publishedTitle} body={article.publishedBody} publishedAt={article.publishedAt} />
      </TicketShell>
    );
  }

  const article = await findEditorialArticle(access, articleId);
  if (!article) notFound();
  const { publishedTitle, publishedBody, publishedAt, publishedVisibility } = article;

  return (
    <TicketShell back={back}>
      <section className="account-card grid gap-5" aria-labelledby="article-editor-heading">
        <div className="grid gap-2">
          <h1 id="article-editor-heading" className="text-3xl font-semibold tracking-tight">Article editor</h1>
          <p className="text-sm text-[var(--muted)]">Created by {article.author.name}</p>
          <p className="text-sm text-[var(--muted)]">
            {publishedVisibility ? `Live audience · ${knowledgeVisibilityLabels[publishedVisibility]}. Saving a draft keeps the live version unchanged.` : "Draft available to workspace staff."}
          </p>
        </div>
        <ArticleForm
          key={article.id}
          slug={access.organization.slug}
          article={{ id: article.id, revision: article.revision, title: article.title, body: article.body, visibility: article.visibility }}
          published={Boolean(publishedAt)}
        />
      </section>
      {publishedAt && publishedTitle && publishedBody && (
        <section className="grid gap-2" aria-label="Published version">
          <p className="text-sm font-semibold text-[var(--muted)]">Published version</p>
          <ArticleContent title={publishedTitle} body={publishedBody} publishedAt={publishedAt} heading="h2" />
        </section>
      )}
    </TicketShell>
  );
}
