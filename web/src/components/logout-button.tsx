"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError("Could not sign out. Please try again.");
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="text-right">
      <button type="button" onClick={logout} disabled={pending}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50">
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
