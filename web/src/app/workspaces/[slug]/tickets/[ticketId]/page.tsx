import { notFound } from "next/navigation";
import { TicketActivity } from "@/components/tickets/ticket-activity";
import { TicketAttachments } from "@/components/tickets/ticket-attachments";
import { TicketConversation } from "@/components/tickets/ticket-conversation";
import { TicketMessageForm } from "@/components/tickets/ticket-message-form";
import { TicketSettingsForm } from "@/components/tickets/ticket-settings-form";
import { TicketShell } from "@/components/tickets/ticket-shell";
import { TicketSla } from "@/components/tickets/ticket-sla";
import { isTicketDone, ticketPriorityLabels, ticketStatusLabels } from "@/lib/ticket-fields";
import { findTicket, listTicketAssignees, requireTicketAccess } from "@/lib/tickets";

export const metadata = { title: "Ticket" };

export default async function TicketPage({ params }: PageProps<"/workspaces/[slug]/tickets/[ticketId]">) {
  const { slug, ticketId } = await params;
  const access = await requireTicketAccess(slug);
  const [ticket, assignees] = await Promise.all([findTicket(access, ticketId), listTicketAssignees(access)]);
  if (!ticket) notFound();

  const writable = ticket.status !== "CLOSED";
  const ticketList = `/workspaces/${access.organization.slug}/tickets`;

  return (
    <TicketShell back={{ href: ticketList, label: "Back to tickets" }}>
      <section className="account-card grid gap-4" aria-labelledby="ticket-heading">
        <h1 id="ticket-heading" className="wrap-anywhere text-3xl font-semibold tracking-tight">{ticket.title}</h1>
        <dl className="grid gap-2 text-sm sm:grid-cols-3">
          <div className="account-detail">
            <dt>Status</dt>
            <dd>{ticketStatusLabels[ticket.status]}</dd>
          </div>
          <div className="account-detail">
            <dt>Priority</dt>
            <dd>{ticketPriorityLabels[ticket.priority]}</dd>
          </div>
          <div className="account-detail">
            <dt>Assignee</dt>
            <dd>{ticket.assignee?.name ?? "Unassigned"}</dd>
          </div>
        </dl>
        <TicketSla
          responseDueAt={ticket.responseDueAt}
          resolutionDueAt={ticket.resolutionDueAt}
          firstResponseAt={ticket.firstResponseAt}
          resolvedAt={ticket.resolvedAt}
          resolved={isTicketDone(ticket.status)}
          resolutionOverride={ticket.resolutionOverride}
        />
        {access.staff && ticket.tags.length > 0 && (
          <p className="wrap-anywhere text-sm text-[var(--muted)]">Staff-only tags · {ticket.tags.join(", ")}</p>
        )}
      </section>
      <div className={access.staff ? "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]" : "grid gap-6"}>
        <section className="account-card grid gap-5" aria-labelledby="conversation-heading">
          <h2 id="conversation-heading" className="text-xl font-semibold">Conversation</h2>
          <TicketConversation
            slug={access.organization.slug}
            createdAt={ticket.createdAt}
            description={ticket.description}
            requester={ticket.requester}
            messages={ticket.messages}
          />
          {writable ? (
            <TicketMessageForm slug={access.organization.slug} ticketId={ticket.id} staff={access.staff} />
          ) : (
            <p className="text-sm text-[var(--muted)]">This ticket is closed. A staff member can reopen it.</p>
          )}
        </section>
        {access.staff && (
          <aside className="account-card grid gap-4" aria-labelledby="ticket-settings-heading">
            <h2 id="ticket-settings-heading" className="text-xl font-semibold">Ticket settings</h2>
            <TicketSettingsForm
              slug={access.organization.slug}
              ticket={{
                id: ticket.id, status: ticket.status, priority: ticket.priority, assigneeId: ticket.assigneeId,
                resolutionOverride: ticket.resolutionOverride, resolutionDueAt: ticket.resolutionDueAt,
                tags: ticket.tags,
              }}
              assignees={assignees}
            />
          </aside>
        )}
      </div>
      <TicketAttachments endpoint={`${ticketList}/${ticket.id}/attachments`} files={ticket.attachments} staff={access.staff} writable={writable} />
      <TicketActivity ticket={ticket} />
    </TicketShell>
  );
}
