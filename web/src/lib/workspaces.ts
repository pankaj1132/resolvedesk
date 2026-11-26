import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import type { WorkspaceRole } from "@/generated/prisma/enums";

export const workspaceRoleLabels: Record<WorkspaceRole, string> = {
  OWNER: "Owner",
  AGENT: "Agent",
  REQUESTER: "Requester",
};

type InviteRole = Exclude<WorkspaceRole, "OWNER">;

export function listWorkspaces(userId: string) {
  return db.workspaceMembership.findMany({
    where: { userId },
    orderBy: { organization: { name: "asc" } },
    select: { role: true, organization: { select: { name: true, slug: true } } },
  });
}

export function findWorkspaceMembership(slug: string, userId: string) {
  return db.workspaceMembership.findFirst({
    where: { userId, organization: { slug } },
    select: { role: true, organization: { select: { id: true, name: true, slug: true } } },
  });
}

export function listWorkspaceMembers(organizationId: string) {
  return db.workspaceMembership.findMany({
    where: { organizationId },
    orderBy: { user: { name: "asc" } },
    select: { userId: true, role: true, user: { select: { name: true, email: true } } },
  });
}

export function createWorkspace(name: string, userId: string) {
  const label = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const slug = `${label.slice(0, 40).replace(/-$/, "") || "workspace"}-${randomBytes(8).toString("hex")}`;

  return db.organization.create({
    data: { name, slug, memberships: { create: { userId, role: "OWNER" } } },
    select: { slug: true },
  });
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createInvitation(organizationId: string, email: string, role: InviteRole) {
  const member = await db.workspaceMembership.findFirst({
    where: { organizationId, user: { email: { equals: email, mode: "insensitive" } } },
    select: { userId: true },
  });
  if (member) return null;

  const token = randomBytes(32).toString("base64url");
  const values = { role, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) };

  await db.workspaceInvitation.upsert({
    where: { organizationId_email: { organizationId, email } },
    create: { organizationId, email, ...values },
    update: values,
  });
  return token;
}

function activeInvitation(token: string, email: string) {
  return { tokenHash: hashToken(token), email: email.toLowerCase(), expiresAt: { gt: new Date() } };
}

export function findInvitation(token: string, email: string) {
  return db.workspaceInvitation.findUnique({
    where: activeInvitation(token, email),
    select: { role: true, organization: { select: { name: true } } },
  });
}

export function acceptInvitation(token: string, user: { id: string; email: string }) {
  return db.$transaction(async (tx) => {
    const where = activeInvitation(token, user.email);
    const invitation = await tx.workspaceInvitation.findUnique({
      where,
      select: { organizationId: true, role: true, organization: { select: { slug: true } } },
    });
    if (!invitation || invitation.role === "OWNER") return null;

    const consumed = await tx.workspaceInvitation.deleteMany({ where });
    if (consumed.count !== 1) return null;

    const membership = { organizationId: invitation.organizationId, userId: user.id };
    await tx.workspaceMembership.upsert({
      where: { organizationId_userId: membership },
      create: { ...membership, role: invitation.role },
      update: {},
    });

    return invitation.organization.slug;
  });
}
