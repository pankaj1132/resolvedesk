import Link from "next/link";
import { maxTicketTagLength, ticketPriorityLabels, ticketStatusLabels, type readTicketFilters } from "@/lib/ticket-fields";
import type { listTickets } from "@/lib/tickets";

type TicketQueueProps = Awaited<ReturnType<typeof listTickets>> & {
  href: string;
  staff: boolean;
  filters: ReturnType<typeof readTicketFilters>;
};

function pageHref(href: string, filters: TicketQueueProps["filters"], page: number) {
  const params = new URLSearchParams({ page: String(page) });
  if (filters.query) params.set("q", filters.query);
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.assignee) params.set("assignee", filters.assignee);
  if (filters.tag) params.set("tag", filters.tag);
  return `${href}?${params}`;
}

export function TicketQueue({ href, filters, tickets, hasNextPage, staff }: TicketQueueProps) {
  const filtering = Boolean(filters.query || filters.status || filters.priority || filters.assignee || filters.tag);

  return (
    <div className="grid gap-5">
      <form className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3" action={href}>
        <label className="auth-field">
          Search tickets
          <input name="q" type="search" defaultValue={filters.query} placeholder="Title or description" />
        </label>
        <label className="auth-field">
          Status
          <select name="status" defaultValue={filters.status ?? ""}>
            <option value="">All statuses</option>
            {Object.entries(ticketStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="auth-field">
          Priority
          <select name="priority" defaultValue={filters.priority ?? ""}>
            <option value="">All priorities</option>
            {Object.entries(ticketPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {staff && (
          <>
            <label className="auth-field">
              Assignment
              <select name="assignee" defaultValue={filters.assignee ?? ""}>
                <option value="">All assignments</option>
                <option value="mine">Assigned to me</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </label>
            <label className="auth-field">
              Tag
              <input name="tag" defaultValue={filters.tag ?? ""} maxLength={maxTicketTagLength} placeholder="billing" />
            </label>
          </>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button className="auth-button auth-button-secondary" type="submit">Apply filters</button>
          {filtering && <Link className="auth-link text-sm" href={href}>Clear filters</Link>}
        </div>
      </form>

      {tickets.length > 0 ? (
        <ul className="grid gap-3">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="account-detail grid gap-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link className="auth-link min-w-0 wrap-break-word" href={`${href}/${ticket.id}`}>
                  {ticket.title}
                </Link>
                <span className="rounded-full border border-[var(--border)] bg-white px-2.5 py-1 text-xs font-medium">
                  {ticketStatusLabels[ticket.status]}
                </span>
              </div>
              <p className="text-sm text-[var(--muted)]">
                {ticketPriorityLabels[ticket.priority]} priority · {ticket.assignee?.name ?? "Unassigned"}
              </p>
              {staff && ticket.tags.length > 0 && (
                <div className="flex flex-wrap gap-2" aria-label="Staff-only tags">
                  {ticket.tags.map((tag) => (
                    <Link key={tag} className="rounded-full border border-[var(--border)] bg-white px-2.5 py-1 text-xs" href={pageHref(href, { ...filters, tag }, 1)}>
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-[var(--muted)]">No tickets to show.</p>}

      {(filters.page > 1 || hasNextPage) && (
        <nav className="flex flex-wrap items-center gap-4 text-sm" aria-label="Ticket pages">
          {filters.page > 1 && <Link className="auth-link" href={pageHref(href, filters, filters.page - 1)}>Previous page</Link>}
          <span>Page {filters.page}</span>
          {hasNextPage && <Link className="auth-link" href={pageHref(href, filters, filters.page + 1)}>Next page</Link>}
        </nav>
      )}
    </div>
  );
}
