import { readArticleSearch } from "@/lib/knowledge-fields";
import { requireKnowledgeEditor, ticketArticleSuggestions } from "@/lib/knowledge";

export async function GET(request: Request, context: RouteContext<"/workspaces/[slug]/tickets/[ticketId]/knowledge">) {
  const { slug, ticketId } = await context.params;
  const access = await requireKnowledgeEditor(slug);
  const query = readArticleSearch(new URL(request.url).searchParams.get("q"));
  const articles = await ticketArticleSuggestions(access, ticketId, query);
  return Response.json({ articles }, { headers: { "Cache-Control": "private, no-store" } });
}
