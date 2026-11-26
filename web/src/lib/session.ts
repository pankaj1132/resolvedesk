import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

// Call this inside every protected page/action; a client redirect is not authorization.
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
