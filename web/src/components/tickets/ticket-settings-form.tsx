"use client";

import { useActionState } from "react";
import { updateTicketAction } from "@/app/workspaces/[slug]/tickets/actions";
import { istDateInput } from "@/lib/sla-fields";
import { ticketPriorityLabels, ticketStatusLabels, ticketTagsInputLimit } from "@/lib/ticket-fields";
import type { findTicket, listTicketAssignees } from "@/lib/tickets";

type TicketSettingsProps = {
  slug: string;
  ticket: Pick<NonNullable<Awaited<ReturnType<typeof findTicket>>>,
    "id" | "status" | "priority" | "assigneeId" | "resolutionOverride" | "resolutionDueAt" | "tags">;
  assignees: Awaited<ReturnType<typeof listTicketAssignees>>;
};

export function TicketSettingsForm({ slug, ticket, assignees }: TicketSettingsProps) {
  const [state, action, pending] = useActionState(updateTicketAction.bind(null, slug, ticket.id), {});
  const override = ticket.resolutionOverride ? istDateInput(ticket.resolutionDueAt) : "";
  const tags = ticket.tags.join(", ");

  return (
    <form className="grid gap-4" action={action} key={`${ticket.status}:${ticket.priority}:${ticket.assigneeId ?? ""}:${override}:${tags}`}>
      <label className="auth-field">
        Status
        <select name="status" defaultValue={ticket.status}>
          {Object.entries(ticketStatusLabels).map(([value, label]) => (
            <option key={value} value={value} disabled={
              ticket.status === "CLOSED" ? value !== "CLOSED" && value !== "OPEN" : value === "CLOSED" && ticket.status !== "RESOLVED"
            }>{label}</option>
          ))}
        </select>
      </label>
      <label className="auth-field">
        Priority
        <select name="priority" defaultValue={ticket.priority}>
          {Object.entries(ticketPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="auth-field">
        Assignee
        <select name="assigneeId" defaultValue={ticket.assigneeId ?? ""}>
          <option value="">Unassigned</option>
          {assignees.map(({ userId, user }) => <option key={userId} value={userId}>{user.name} ({user.email})</option>)}
        </select>
      </label>
      <label className="auth-field">
        Custom resolution deadline (IST)
        <input name="resolutionOverride" type="datetime-local" defaultValue={override} aria-describedby="override-help" />
      </label>
      <p id="override-help" className="text-xs text-[var(--muted)]">Clear the field to use the SLA deadline.</p>
      <label className="auth-field">
        Staff-only tags
        <input name="tags" defaultValue={tags} maxLength={ticketTagsInputLimit} placeholder="billing, login" />
      </label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.saved && !pending && <p className="text-sm text-[var(--muted)]" role="status">Ticket updated.</p>}
      <button className="auth-button auth-button-primary justify-self-start" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
