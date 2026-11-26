"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { authHref, isInvitationToken } from "@/lib/auth-destination";
import { getSession, requireSession } from "@/lib/session";
import { acceptInvitation, createInvitation, createWorkspace, findWorkspaceMembership } from "@/lib/workspaces";

export type WorkspaceActionState = { error?: string; inviteUrl?: string };

export async function createWorkspaceAction(
  _previous: WorkspaceActionState,
  fields: FormData,
): Promise<WorkspaceActionState> {
  const { user } = await requireSession();
  const nameField = fields.get("name");
  const name = typeof nameField === "string" ? nameField.trim() : "";

  if (!name || name.length > 80) {
    return { error: "Enter a workspace name between 1 and 80 characters." };
  }

  const workspace = await createWorkspace(name, user.id);
  revalidatePath("/dashboard");
  redirect(`/workspaces/${workspace.slug}`);
}

export async function inviteWorkspaceAction(
  slug: string,
  _previous: WorkspaceActionState,
  fields: FormData,
): Promise<WorkspaceActionState> {
  const { user } = await requireSession();
  const membership = await findWorkspaceMembership(slug, user.id);
  if (membership?.role !== "OWNER") notFound();

  const email = String(fields.get("email") ?? "").trim().toLowerCase();
  const role = fields.get("role");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (role !== "AGENT" && role !== "REQUESTER") {
    return { error: "Choose Agent or Requester." };
  }

  const token = await createInvitation(membership.organization.id, email, role);
  if (!token) return { error: "That email already belongs to this workspace." };

  return { inviteUrl: new URL(`/invite/${token}`, process.env.BETTER_AUTH_URL).href };
}

export async function acceptInvitationAction(token: string): Promise<WorkspaceActionState> {
  if (!isInvitationToken(token)) notFound();

  const session = await getSession();
  if (!session) redirect(authHref("/login", `/invite/${token}`));

  const slug = await acceptInvitation(token, session.user);
  if (!slug) return { error: "This invitation is no longer available. Ask the workspace owner for a new link." };

  revalidatePath("/dashboard");
  redirect(`/workspaces/${slug}`);
}
