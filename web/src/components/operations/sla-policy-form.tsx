"use client";

import { useActionState } from "react";
import { saveSlaAction } from "@/app/workspaces/[slug]/operations/actions";
import { maxSlaHours, slaPriorities, type defaultSlaTargets } from "@/lib/sla-fields";
import { ticketPriorityLabels } from "@/lib/ticket-fields";

export function SlaPolicyForm({ slug, targets }: { slug: string; targets: typeof defaultSlaTargets }) {
  const [state, action, pending] = useActionState(saveSlaAction.bind(null, slug), {});

  return (
    <form className="grid gap-4" action={action}>
      <p className="text-sm text-[var(--muted)]">Targets use calendar hours from ticket creation. Updates apply to new tickets and deadlines recalculated after a ticket change.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {slaPriorities.map((priority) => (
          <fieldset className="account-detail grid gap-3" key={priority}>
            <legend className="px-1 text-sm font-semibold">{ticketPriorityLabels[priority]}</legend>
            <label className="auth-field">
              First response (hours)
              <input type="number" name={`response-${priority}`} min={1} max={maxSlaHours} defaultValue={targets[priority].responseHours} required />
            </label>
            <label className="auth-field">
              Resolution (hours)
              <input type="number" name={`resolution-${priority}`} min={1} max={maxSlaHours} defaultValue={targets[priority].resolutionHours} required />
            </label>
          </fieldset>
        ))}
      </div>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.saved && !pending && <p className="text-sm text-[var(--muted)]" role="status">SLA targets saved.</p>}
      <button className="auth-button auth-button-primary justify-self-start" disabled={pending} type="submit">
        {pending ? "Saving…" : "Save SLA targets"}
      </button>
    </form>
  );
}
