"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

type Props = { mode: "login" | "signup"; googleEnabled: boolean; googleError?: boolean };
const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60";

export function AuthForm({ mode, googleEnabled, googleError = false }: Props) {
  const router = useRouter();
  const signup = mode === "signup";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(googleError
    ? "Google sign-in could not complete. Try again, or use your original sign-in method."
    : "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (signup && !name) return setError("Please enter your name.");
    if (signup && password !== String(form.get("confirmPassword") ?? "")) return setError("Passwords do not match.");
    setPending(true);
    setError("");
    try {
      const result = signup
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(signup
          ? "Could not create your account. Check your details or sign in if you already have an account."
          : "Could not sign in. Check your email and password, or try again shortly.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Connection failed. Please try again.");
    } finally { setPending(false); }
  }

  async function googleSignIn() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const result = await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard", errorCallbackURL: "/login?error=google" });
      if (result.error) {
        setError("Google sign-in could not start. Please try again.");
        setPending(false);
      }
    } catch {
      setError("Connection failed. Please try again.");
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12 text-slate-900">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <Link href="/" className="text-xl font-bold tracking-tight text-indigo-700">ResolveDesk</Link>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">{signup ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-slate-600">{signup ? "A better support experience starts here." : "Sign in to continue to your workspace."}</p>
        <button type="button" disabled={pending || !googleEnabled} onClick={googleSignIn}
          className="mt-7 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
          Continue with Google
        </button>
        {!googleEnabled && <p className="mt-2 text-xs text-slate-500">Google sign-in is currently unavailable.</p>}
        <div className="my-6 flex items-center gap-3 text-xs text-slate-500">
          <span className="h-px flex-1 bg-slate-200" />or continue with email<span className="h-px flex-1 bg-slate-200" />
        </div>
        {error && <p id="auth-error" role="alert" className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={submit} aria-describedby={error ? "auth-error" : undefined}>
          <fieldset disabled={pending} className="space-y-4">
            {signup && <label className="block text-sm font-medium">Full name
              <input name="name" autoComplete="name" maxLength={100} required className={inputClass} />
            </label>}
            <label className="block text-sm font-medium">Email address
              <input name="email" type="email" autoComplete="email" maxLength={254} required className={inputClass} />
            </label>
            <label className="block text-sm font-medium">Password
              <input name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={8} maxLength={128} required className={inputClass} />
            </label>
            {signup && <>
              <p className="text-xs text-slate-500">Use at least 8 characters.</p>
              <label className="block text-sm font-medium">Confirm password
                <input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className={inputClass} />
              </label>
            </>}
            <button type="submit" className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {pending ? "Please wait…" : signup ? "Create account" : "Sign in"}
            </button>
          </fieldset>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          {signup ? "Already have an account? " : "New to ResolveDesk? "}
          <Link href={signup ? "/login" : "/signup"} className="font-semibold text-indigo-700 hover:underline">{signup ? "Sign in" : "Create account"}</Link>
        </p>
      </section>
    </main>
  );
}
