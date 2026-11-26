"use client";

import { useActionState } from "react";
import { acceptInvitationAction } from "@/app/workspaces/actions";

export function WorkspaceAcceptForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInvitationAction.bind(null, token), {});

  return (
    <form className="mt-5 grid gap-3" action={action}>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="auth-button auth-button-primary justify-self-start" disabled={pending}>
        {pending ? "Joining workspace…" : "Accept invitation"}
      </button>
    </form>
  );
}
