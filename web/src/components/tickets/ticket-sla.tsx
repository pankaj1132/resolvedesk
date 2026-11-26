import { TicketTime } from "@/components/tickets/ticket-time";

type TicketSlaProps = {
  responseDueAt: Date;
  resolutionDueAt: Date;
  firstResponseAt: Date | null;
  resolvedAt: Date | null;
  resolved: boolean;
  resolutionOverride: boolean;
};

function deadlineStatus(dueAt: Date, completedAt: Date | null, resolved: boolean, now: Date) {
  if (completedAt) return completedAt <= dueAt ? "Met target" : "Completed late";
  if (resolved) return "Completion time unavailable";
  return dueAt < now ? "Overdue" : "Pending";
}

export function TicketSla({ responseDueAt, resolutionDueAt, firstResponseAt, resolvedAt, resolved, resolutionOverride }: TicketSlaProps) {
  const now = new Date();
  const response = resolved && !firstResponseAt ? "Resolved without a public staff reply" : deadlineStatus(responseDueAt, firstResponseAt, resolved, now);
  const resolution = deadlineStatus(resolutionDueAt, resolvedAt, resolved, now);

  return (
    <dl className="grid gap-2 text-sm sm:grid-cols-2" aria-label="Ticket deadlines">
      <div className="account-detail">
        <dt>First response due</dt>
        <dd><TicketTime date={responseDueAt} /></dd>
        <dd className={response === "Overdue" ? "mt-1 text-red-800" : "mt-1"}>{response}</dd>
      </div>
      <div className="account-detail">
        <dt>{resolutionOverride ? "Custom resolution deadline" : "Resolution due"}</dt>
        <dd><TicketTime date={resolutionDueAt} /></dd>
        <dd className={resolution === "Overdue" ? "mt-1 text-red-800" : "mt-1"}>{resolution}</dd>
      </div>
    </dl>
  );
}
