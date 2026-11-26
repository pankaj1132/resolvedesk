"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function GoogleSignInButton({ destination, errorPath }: { destination: string; errorPath: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    setError("");

    try {
      const { data, error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: destination,
        errorCallbackURL: errorPath,
        disableRedirect: true,
      });

      if (!error && data.url) {
        window.location.assign(data.url);
        return;
      }
    } catch {
      // Keep the current page available for a retry.
    }

    setError("Could not start Google sign-in. Please try again.");
    setPending(false);
  }

  return (
    <>
      <button className="auth-button auth-button-secondary" type="button" onClick={signIn} disabled={pending}>
        {pending ? "Opening Google…" : "Continue with Google"}
      </button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </>
  );
}
