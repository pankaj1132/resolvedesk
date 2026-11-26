import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ResolveDeskBrand } from "@/components/resolve-desk-brand";
import { LogoutButton } from "@/components/auth/logout-button";
import { WorkspaceAcceptForm } from "@/components/workspaces/workspace-accept-form";
import { authHref, isInvitationToken } from "@/lib/auth-destination";
import { getSession } from "@/lib/session";
import { findInvitation, workspaceRoleLabels } from "@/lib/workspaces";

export const metadata = { title: "Workspace invitation", robots: { index: false, follow: false } };

export default async function InvitationPage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  if (!isInvitationToken(token)) notFound();

  const signIn = authHref("/login", `/invite/${token}`);
  const session = await getSession();
  if (!session) redirect(signIn);

  const invitation = await findInvitation(token, session.user.email);

  return (
    <main className="auth-shell">
      <ResolveDeskBrand />
      <section className="account-card" aria-labelledby="invitation-heading">
        <h1 id="invitation-heading" className="text-3xl font-semibold tracking-tight">
          Workspace invitation
        </h1>
        {invitation ? (
          <>
            <p className="mt-3 break-words">
              Join <strong>{invitation.organization.name}</strong> as {workspaceRoleLabels[invitation.role]}.
            </p>
            <WorkspaceAcceptForm token={token} />
          </>
        ) : (
          <div className="mt-3 grid gap-3">
            <p>This invitation is unavailable for <strong>{session.user.email}</strong>.</p>
            <p className="text-sm text-[var(--muted)]">
              Sign in with the invited email or ask the workspace owner for a fresh link.
            </p>
            <LogoutButton destination={signIn} />
            <Link className="auth-link w-fit text-sm" href="/dashboard">Back to dashboard</Link>
          </div>
        )}
      </section>
    </main>
  );
}
