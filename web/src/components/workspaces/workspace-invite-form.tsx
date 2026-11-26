"use client";

import { useActionState, useState } from "react";
import { inviteWorkspaceAction } from "@/app/workspaces/actions";

export function WorkspaceInviteForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(inviteWorkspaceAction.bind(null, slug), {});
  const [copiedLink, setCopiedLink] = useState("");
  const [copyFailed, setCopyFailed] = useState(false);
  const inviteUrl = state.inviteUrl;

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(link);
      setCopyFailed(false);
    } catch {
      setCopyFailed(true);
    }
  }

  return (
    <div className="grid gap-4">
      <form className="grid gap-3 sm:grid-cols-[1fr_10rem]" action={action}>
        <label className="auth-field">
          Invite email
          <input name="email" type="email" autoComplete="email" maxLength={254} required />
        </label>
        <label className="auth-field">
          Role
          <select name="role" defaultValue="AGENT">
            <option value="AGENT">Agent</option>
            <option value="REQUESTER">Requester</option>
          </select>
        </label>
        {state.error && <p className="form-error sm:col-span-2" role="alert">{state.error}</p>}
        <button className="auth-button auth-button-primary justify-self-start" disabled={pending}>
          {pending ? "Creating invite…" : "Create invite link"}
        </button>
      </form>
      {inviteUrl && !pending && (
        <div className="account-detail grid gap-3">
          <label className="auth-field">
            Private invite link
            <input value={inviteUrl} readOnly onFocus={(event) => event.currentTarget.select()} />
          </label>
          <p className="text-sm text-[var(--muted)]">
            Share this link privately with the invited address. It works once and expires after 48 hours.
          </p>
          <button
            className="auth-button auth-button-secondary justify-self-start"
            type="button"
            onClick={() => copyLink(inviteUrl)}
          >
            {copiedLink === inviteUrl ? "Copied" : "Copy invite link"}
          </button>
          {copyFailed && <p className="form-error" role="alert">Select and copy the link from the field.</p>}
        </div>
      )}
    </div>
  );
}
