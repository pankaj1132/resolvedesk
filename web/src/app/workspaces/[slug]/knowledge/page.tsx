import Link from "next/link";
import { ArticleList } from "@/components/knowledge/article-list";
import { TicketShell } from "@/components/tickets/ticket-shell";
import { listKnowledgeArticles } from "@/lib/knowledge";
import { knowledgePath, readArticlePage, readArticleSearch } from "@/lib/knowledge-fields";
import { requireTicketAccess } from "@/lib/tickets";

export const metadata = { title: "Knowledge Base" };

export default async function KnowledgePage({ params, searchParams }: PageProps<"/workspaces/[slug]/knowledge">) {
  const { slug } = await params;
  const access = await requireTicketAccess(slug);
  const values = await searchParams;
  const query = readArticleSearch(values.q);
  const page = readArticlePage(values.page);
  const base = knowledgePath(access.organization.slug);
  const results = await listKnowledgeArticles(access, query, page);

  return (
    <TicketShell back={{ href: `/workspaces/${access.organization.slug}`, label: access.organization.name }}>
      <section className="account-card grid gap-5" aria-labelledby="knowledge-heading">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 id="knowledge-heading" className="text-3xl font-semibold tracking-tight">Knowledge Base</h1>
          {access.staff && <Link className="auth-button auth-button-primary inline-flex items-center" href={`${base}/new`}>New article</Link>}
        </div>
        <ArticleList base={base} query={query} page={page} {...results} />
      </section>
    </TicketShell>
  );
}
