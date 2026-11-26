import Link from "next/link";
import { workspaceRoleLabels, type listWorkspaces } from "@/lib/workspaces";

export function WorkspaceList({ memberships }: { memberships: Awaited<ReturnType<typeof listWorkspaces>> }) {
  if (memberships.length === 0) {
    return <p className="text-sm text-[var(--muted)]">You haven’t joined a workspace yet.</p>;
  }

  return (
    <ul className="grid gap-2">
      {memberships.map(({ organization, role }) => (
        <li key={organization.slug} className="account-detail flex items-center justify-between gap-4">
          <Link className="auth-link" href={`/workspaces/${organization.slug}`}>{organization.name}</Link>
          <span className="text-sm text-[var(--muted)]">{workspaceRoleLabels[role]}</span>
        </li>
      ))}
    </ul>
  );
}
