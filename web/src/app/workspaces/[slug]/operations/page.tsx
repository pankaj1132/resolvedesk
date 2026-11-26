import { notFound } from "next/navigation";
import { SlaEscalations } from "@/components/operations/sla-escalations";
import { SlaPolicyForm } from "@/components/operations/sla-policy-form";
import { WorkspaceMetrics } from "@/components/operations/workspace-metrics";
import { TicketShell } from "@/components/tickets/ticket-shell";
import { requireTicketAccess } from "@/lib/tickets";
import { getWorkspaceMetrics, listSlaEscalations, workspaceSlaTargets } from "@/lib/workspace-operations";

export const metadata = { title: "Operations" };

export default async function OperationsPage({ params }: PageProps<"/workspaces/[slug]/operations">) {
  const { slug } = await params;
  const access = await requireTicketAccess(slug);
  if (!access.staff) notFound();

  const { organization } = access;
  const now = new Date();
  const [metrics, escalations, targets] = await Promise.all([
    getWorkspaceMetrics(access, now),
    listSlaEscalations(access, now),
    access.role === "OWNER" ? workspaceSlaTargets(organization.id) : null,
  ]);
  const workspacePath = `/workspaces/${organization.slug}`;

  return (
    <TicketShell back={{ href: workspacePath, label: organization.name }}>
      <h1 className="text-3xl font-semibold tracking-tight">Operations</h1>
      <WorkspaceMetrics metrics={metrics} />
      <SlaEscalations ticketList={`${workspacePath}/tickets`} {...escalations} />
      {targets && (
        <section className="account-card grid gap-4" aria-labelledby="sla-heading">
          <h2 id="sla-heading" className="text-xl font-semibold">Workspace SLA targets</h2>
          <SlaPolicyForm slug={organization.slug} targets={targets} />
        </section>
      )}
    </TicketShell>
  );
}
