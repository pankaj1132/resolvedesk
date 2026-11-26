"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password-policy";

export function EmailAuthForm({ mode, destination }: { mode: "login" | "signup"; destination: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const fields = new FormData(event.currentTarget);
    const name = String(fields.get("name") ?? "").trim();
    const email = String(fields.get("email") ?? "").trim();
    const password = String(fields.get("password") ?? "");

    if (isSignup && !name) {
      setError("Enter your name.");
      return;
    }

    if (isSignup && password !== fields.get("confirmation")) {
      setError("Your passwords do not match.");
      return;
    }

    setPending(true);

    try {
      const result = isSignup
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });

      if (!result.error) {
        window.location.replace(destination);
        return;
      }

      if (result.error.status === 429) {
        setError("Too many attempts. Wait a moment and try again.");
      } else if (result.error.status >= 500) {
        setError("The sign-in service is unavailable. Please try again.");
      } else if (isSignup) {
        setError("Could not create your account. If you've already registered, try signing in.");
      } else {
        setError("Check your email and password and try again.");
      }
    } catch {
      setError("Could not connect. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4" method="post" onSubmit={submit} aria-busy={pending}>
      {isSignup && (
        <label className="auth-field">
          Name
          <input name="name" autoComplete="name" required />
        </label>
      )}
      <label className="auth-field">
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="auth-field">
        Password
        <input
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          minLength={isSignup ? MIN_PASSWORD_LENGTH : undefined}
          maxLength={MAX_PASSWORD_LENGTH}
          required
        />
        {isSignup && (
          <span className="text-xs font-normal text-[var(--muted)]">
            Use {MIN_PASSWORD_LENGTH} to {MAX_PASSWORD_LENGTH} characters.
          </span>
        )}
      </label>
      {isSignup && (
        <label className="auth-field">
          Confirm password
          <input name="confirmation" type="password" autoComplete="new-password" required />
        </label>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="auth-button auth-button-primary" type="submit" disabled={pending}>
        {pending ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
