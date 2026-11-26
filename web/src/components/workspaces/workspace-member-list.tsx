import { workspaceRoleLabels, type listWorkspaceMembers } from "@/lib/workspaces";

export function WorkspaceMemberList({ members }: { members: Awaited<ReturnType<typeof listWorkspaceMembers>> }) {
  return (
    <ul className="grid gap-2">
      {members.map(({ userId, user, role }) => (
        <li key={userId} className="account-detail flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 break-words">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-[var(--muted)]">{user.email}</p>
          </div>
          <span className="text-sm text-[var(--muted)]">{workspaceRoleLabels[role]}</span>
        </li>
      ))}
    </ul>
  );
}
