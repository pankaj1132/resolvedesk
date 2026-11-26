"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function LogoutButton({ destination = "/login" }: { destination?: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    setError("");

    try {
      const { error } = await authClient.signOut();

      if (!error) {
        window.location.replace(destination);
        return;
      }
    } catch {
      // Keep the dashboard open so the user can try again.
    }

    setError("Could not sign out. Please try again.");
    setPending(false);
  }

  return (
    <div className="grid gap-2">
      <button className="auth-button auth-button-secondary" type="button" onClick={signOut} disabled={pending}>
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
