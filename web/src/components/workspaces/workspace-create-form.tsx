"use client";

import { useActionState } from "react";
import { createWorkspaceAction } from "@/app/workspaces/actions";

export function WorkspaceCreateForm() {
  const [state, action, pending] = useActionState(createWorkspaceAction, {});

  return (
    <form className="grid max-w-md gap-3" action={action}>
      <label className="auth-field">
        Workspace name
        <input name="name" maxLength={80} required />
      </label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="auth-button auth-button-primary justify-self-start" disabled={pending}>
        {pending ? "Creating workspace…" : "Create workspace"}
      </button>
    </form>
  );
}
