import { reportingDays } from "@/lib/sla-fields";
import type { getWorkspaceMetrics } from "@/lib/workspace-operations";

const hours = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

function average(value: number | null) {
  return value === null ? "No data" : `${hours.format(value)} h`;
}

export function WorkspaceMetrics({ metrics }: { metrics: Awaited<ReturnType<typeof getWorkspaceMetrics>> }) {
  return (
    <section className="account-card grid gap-4" aria-labelledby="metrics-heading">
      <h2 id="metrics-heading" className="text-xl font-semibold">Workspace report</h2>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="account-detail">
          <dt>Active backlog</dt>
          <dd className="text-xl">{metrics.backlog}</dd>
        </div>
        <div className="account-detail">
          <dt>Overdue tickets</dt>
          <dd className="text-xl">{metrics.overdue}</dd>
        </div>
        <div className="account-detail">
          <dt>Avg. first response</dt>
          <dd className="text-xl">{average(metrics.meanFirstResponseHours)}</dd>
          <dd className="text-xs text-[var(--muted)]">{metrics.firstReplies} {metrics.firstReplies === 1 ? "ticket" : "tickets"} with a reply</dd>
        </div>
        <div className="account-detail">
          <dt>Avg. resolution</dt>
          <dd className="text-xl">{average(metrics.meanResolutionHours)}</dd>
          <dd className="text-xs text-[var(--muted)]">{metrics.resolutions} {metrics.resolutions === 1 ? "ticket" : "tickets"} with a recorded resolution</dd>
        </div>
      </dl>
      <p className="text-sm text-[var(--muted)]">Backlog and overdue totals cover all active tickets. Averages use tickets opened in the last {reportingDays} days and measure from ticket creation to the first public reply from another staff member or the latest recorded resolution.</p>
    </section>
  );
}
