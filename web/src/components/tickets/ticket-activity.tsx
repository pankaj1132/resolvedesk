import { TicketTime } from "@/components/tickets/ticket-time";
import type { findTicket } from "@/lib/tickets";

type ActivityTicket = Pick<NonNullable<Awaited<ReturnType<typeof findTicket>>>,
  "createdAt" | "requester" | "messages" | "attachments" | "activities">;

export function TicketActivity({ ticket }: { ticket: ActivityTicket }) {
  const activity = [
    { id: "created", at: ticket.createdAt, actor: ticket.requester.name, summary: "Opened this ticket", internal: false },
    ...ticket.messages.map((message) => ({
      id: `message-${message.id}`, at: message.createdAt, actor: message.author.name,
      summary: message.internal ? "Added an internal note" : "Posted a reply", internal: message.internal,
    })),
    ...ticket.attachments.map((file) => ({
      id: `attachment-${file.id}`, at: file.createdAt, actor: file.author.name,
      summary: `Attached ${file.fileName}`, internal: file.internal,
    })),
    ...ticket.activities.map((event) => ({
      id: `activity-${event.id}`, at: event.createdAt, actor: event.actor.name,
      summary: event.summary, internal: event.internal,
    })),
  ].sort((left, right) => right.at.getTime() - left.at.getTime());

  return (
    <section className="account-card grid gap-3" aria-labelledby="history-heading">
      <h2 id="history-heading" className="text-xl font-semibold">Ticket history</h2>
      <ol className="divide-y divide-[var(--border)] text-sm">
        {activity.map((event) => (
          <li key={event.id} className="grid gap-1 py-3">
            <p className="wrap-anywhere font-medium">{event.summary}</p>
            <p className="flex flex-wrap gap-x-2 text-[var(--muted)]">
              <span>{event.actor}</span>
              <TicketTime date={event.at} />
              {event.internal && <span className="font-medium text-amber-900">Staff only</span>}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
