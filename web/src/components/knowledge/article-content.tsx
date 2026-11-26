import { TicketTime } from "@/components/tickets/ticket-time";

export function ArticleContent({ title, body, publishedAt, heading: Heading = "h1" }: {
  title: string; body: string; publishedAt: Date; heading?: "h1" | "h2";
}) {
  return (
    <article className="account-card grid gap-4" aria-labelledby="published-article-heading">
      <Heading id="published-article-heading" className="wrap-anywhere text-2xl font-semibold tracking-tight">{title}</Heading>
      <p className="text-sm text-[var(--muted)]">Published <TicketTime date={publishedAt} /></p>
      <p className="wrap-anywhere whitespace-pre-wrap leading-relaxed">{body}</p>
    </article>
  );
}
