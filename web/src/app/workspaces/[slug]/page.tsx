import Link from "next/link";
import { notFound } from "next/navigation";
import { ResolveDeskBrand } from "@/components/resolve-desk-brand";
import { LogoutButton } from "@/components/auth/logout-button";
import { WorkspaceInviteForm } from "@/components/workspaces/workspace-invite-form";
import { WorkspaceMemberList } from "@/components/workspaces/workspace-member-list";
import { requireSession } from "@/lib/session";
import { findWorkspaceMembership, listWorkspaceMembers, workspaceRoleLabels } from "@/lib/workspaces";

export const metadata = { title: "Workspace" };

export default async function WorkspacePage({ params }: PageProps<"/workspaces/[slug]">) {
  const { user } = await requireSession();
  const { slug } = await params;
  const membership = await findWorkspaceMembership(slug, user.id);
  if (!membership) notFound();

  const { organization, role } = membership;
  const members = role === "OWNER" ? await listWorkspaceMembers(organization.id) : null;

  return (
    <main className="mx-auto grid w-full max-w-4xl gap-6 px-5 py-8 sm:py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <ResolveDeskBrand />
        <LogoutButton />
      </header>
      <Link className="auth-link w-fit text-sm" href="/dashboard">All workspaces</Link>
      <section className="account-card" aria-labelledby="workspace-heading">
        <h1 id="workspace-heading" className="break-words text-3xl font-semibold tracking-tight">
          {organization.name}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Your role: {workspaceRoleLabels[role]}</p>
        <nav className="mt-5 flex flex-wrap gap-2" aria-label="Workspace sections">
          <Link className="auth-button auth-button-primary inline-flex items-center" href={`/workspaces/${organization.slug}/tickets`}>
            View tickets
          </Link>
          <Link className="auth-button auth-button-secondary inline-flex items-center" href={`/workspaces/${organization.slug}/notifications`}>
            Notifications
          </Link>
          <Link className="auth-button auth-button-secondary inline-flex items-center" href={`/workspaces/${organization.slug}/knowledge`}>
            Knowledge Base
          </Link>
          {role !== "REQUESTER" && (
            <Link className="auth-button auth-button-secondary inline-flex items-center" href={`/workspaces/${organization.slug}/operations`}>
              Operations
            </Link>
          )}
        </nav>
      </section>
      {members && (
        <>
          <section className="account-card grid gap-4" aria-labelledby="invite-heading">
            <h2 id="invite-heading" className="text-xl font-semibold">Invite a member</h2>
            <WorkspaceInviteForm slug={organization.slug} />
          </section>
          <section className="account-card grid gap-4" aria-labelledby="members-heading">
            <h2 id="members-heading" className="text-xl font-semibold">Members</h2>
            <WorkspaceMemberList members={members} />
          </section>
        </>
      )}
    </main>
  );
}
