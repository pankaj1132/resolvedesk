import Link from "next/link";
import { TicketTime } from "@/components/tickets/ticket-time";
import { ticketPriorityLabels } from "@/lib/ticket-fields";
import type { listSlaEscalations } from "@/lib/workspace-operations";

type SlaEscalationProps = Awaited<ReturnType<typeof listSlaEscalations>> & { ticketList: string };

export function SlaEscalations({ tickets, hasMore, ticketList }: SlaEscalationProps) {
  return (
    <section className="account-card grid gap-4" aria-labelledby="escalations-heading">
      <h2 id="escalations-heading" className="text-xl font-semibold">SLA escalations</h2>
      {tickets.length ? (
        <ul className="grid gap-3">
          {tickets.map((ticket) => (
            <li className="account-detail grid gap-1 text-sm" key={ticket.id}>
              <Link className="auth-link w-fit wrap-anywhere" href={`${ticketList}/${ticket.id}`}>{ticket.title}</Link>
              <p className="text-[var(--muted)]">{ticketPriorityLabels[ticket.priority]} priority · {ticket.assignee?.name ?? "Unassigned"}</p>
              {ticket.responseOverdue && <p>First response overdue · <TicketTime date={ticket.responseDueAt} /></p>}
              {ticket.resolutionOverdue && <p>Resolution overdue · <TicketTime date={ticket.resolutionDueAt} /></p>}
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-[var(--muted)]">No active SLA escalations.</p>}
      {hasMore && <p className="text-sm text-[var(--muted)]">Showing the 50 least recently updated overdue tickets.</p>}
    </section>
  );
}
