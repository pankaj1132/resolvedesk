"use client";

import { useActionState } from "react";
import { createTicketAction } from "@/app/workspaces/[slug]/tickets/actions";
import { ticketTextLimit, ticketTitleLimit } from "@/lib/ticket-fields";

export function TicketCreateForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(createTicketAction.bind(null, slug), {});

  return (
    <form className="grid gap-4" action={action}>
      <label className="auth-field">
        Title
        <input name="title" maxLength={ticketTitleLimit} required />
      </label>
      <label className="auth-field">
        Description
        <textarea name="description" rows={6} maxLength={ticketTextLimit} required />
      </label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="auth-button auth-button-primary justify-self-start" type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit ticket"}
      </button>
    </form>
  );
}
