import { ArticleForm } from "@/components/knowledge/article-form";
import { TicketShell } from "@/components/tickets/ticket-shell";
import { requireKnowledgeEditor } from "@/lib/knowledge";
import { knowledgePath } from "@/lib/knowledge-fields";

export const metadata = { title: "New article" };

export default async function NewArticlePage({ params }: PageProps<"/workspaces/[slug]/knowledge/new">) {
  const { slug } = await params;
  const { organization } = await requireKnowledgeEditor(slug);

  return (
    <TicketShell back={{ href: knowledgePath(organization.slug), label: "Back to Knowledge Base" }}>
      <section className="account-card grid gap-5" aria-labelledby="new-article-heading">
        <h1 id="new-article-heading" className="text-3xl font-semibold tracking-tight">New article</h1>
        <ArticleForm slug={organization.slug} published={false} />
      </section>
    </TicketShell>
  );
}
