import type { Metadata } from "next";
import { ResolveDeskBrand } from "@/components/resolve-desk-brand";
import { LogoutButton } from "@/components/auth/logout-button";
import { WorkspaceCreateForm } from "@/components/workspaces/workspace-create-form";
import { WorkspaceList } from "@/components/workspaces/workspace-list";
import { requireSession } from "@/lib/session";
import { listWorkspaces } from "@/lib/workspaces";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { user } = await requireSession();
  const memberships = await listWorkspaces(user.id);

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:py-12">
      <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <ResolveDeskBrand />
        <LogoutButton />
      </header>
      <section className="account-card mb-6 grid gap-5" aria-labelledby="workspaces-heading">
        <h1 id="workspaces-heading" className="text-3xl font-semibold tracking-tight">
          Your workspaces
        </h1>
        <WorkspaceList memberships={memberships} />
        <WorkspaceCreateForm />
      </section>
      <section className="account-card" aria-labelledby="account-heading">
        <h2 id="account-heading" className="text-xl font-semibold tracking-tight">Your account</h2>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="account-detail">
            <dt>Name</dt>
            <dd>{user.name}</dd>
          </div>
          <div className="account-detail">
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
