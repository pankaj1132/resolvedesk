import Link from "next/link";
import { TicketTime } from "@/components/tickets/ticket-time";
import { articleSearchLimit, knowledgeVisibilityLabels } from "@/lib/knowledge-fields";
import type { listKnowledgeArticles } from "@/lib/knowledge";

type ArticleListProps = Awaited<ReturnType<typeof listKnowledgeArticles>> & { base: string; query: string; page: number };

function pageLink(base: string, query: string, page: number) {
  const params = new URLSearchParams({ page: String(page) });
  if (query) params.set("q", query);
  return `${base}?${params}`;
}

export function ArticleList({ articles, hasNext, base, query, page }: ArticleListProps) {
  return (
    <div className="grid gap-4">
      <form action={base} className="grid items-end gap-2 sm:grid-cols-[1fr_auto]" method="get">
        <label className="auth-field">
          Search articles
          <input name="q" type="search" defaultValue={query} maxLength={articleSearchLimit} />
        </label>
        <button className="auth-button auth-button-secondary" type="submit">Search</button>
      </form>
      {articles.length ? (
        <ul className="grid gap-2">
          {articles.map(({ id, title, date, publication }) => (
            <li key={id} className="account-detail grid gap-1">
              <Link className="auth-link w-fit wrap-anywhere" href={`${base}/${id}`}>{title}</Link>
              <div className="flex flex-wrap gap-x-3 text-sm">
                {publication && <span>{publication === "DRAFT" ? "Draft" : `Published · ${knowledgeVisibilityLabels[publication]}`}</span>}
                {date && <TicketTime date={date} />}
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-[var(--muted)]">{query ? "No articles match this search." : "No articles to show."}</p>}
      {(page > 1 || hasNext) && (
        <nav className="flex flex-wrap gap-4 text-sm" aria-label="Article pages">
          {page > 1 && <Link className="auth-link" href={pageLink(base, query, page - 1)}>Previous page</Link>}
          <span>Page {page}</span>
          {hasNext && <Link className="auth-link" href={pageLink(base, query, page + 1)}>Next page</Link>}
        </nav>
      )}
    </div>
  );
}
