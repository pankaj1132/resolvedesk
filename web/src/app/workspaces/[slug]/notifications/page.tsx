import Link from "next/link";
import { markNotificationsReadAction } from "@/app/workspaces/[slug]/notifications/actions";
import { SlaEscalations } from "@/components/operations/sla-escalations";
import { TicketShell } from "@/components/tickets/ticket-shell";
import { TicketTime } from "@/components/tickets/ticket-time";
import { listTicketNotifications } from "@/lib/ticket-notifications";
import { requireTicketAccess } from "@/lib/tickets";
import { listSlaEscalations } from "@/lib/workspace-operations";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage({ params }: PageProps<"/workspaces/[slug]/notifications">) {
  const { slug } = await params;
  const access = await requireTicketAccess(slug);
  const [inbox, escalations] = await Promise.all([
    listTicketNotifications(access),
    access.staff ? listSlaEscalations(access, new Date(), true) : null,
  ]);
  const workspacePath = `/workspaces/${access.organization.slug}`;
  const ticketList = `${workspacePath}/tickets`;

  return (
    <TicketShell back={{ href: workspacePath, label: access.organization.name }}>
      <section className="account-card grid gap-4" aria-labelledby="notifications-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 id="notifications-heading" className="text-3xl font-semibold tracking-tight">Notifications</h1>
          {inbox.unread > 0 && (
            <form action={markNotificationsReadAction.bind(null, slug)}>
              <button className="auth-button auth-button-secondary" type="submit">Mark all as read</button>
            </form>
          )}
        </div>
        <p className="text-sm text-[var(--muted)]">{inbox.unread} unread · showing up to 50 recent notifications</p>
        {inbox.notifications.length ? (
          <ul className="grid gap-2">
            {inbox.notifications.map((notification) => (
              <li key={notification.id} className="account-detail grid gap-1 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link className="auth-link wrap-anywhere" href={`${ticketList}/${notification.ticket.id}`}>{notification.ticket.title}</Link>
                  {!notification.readAt && <span className="font-medium">Unread</span>}
                </div>
                <p>{notification.message}</p>
                <TicketTime date={notification.createdAt} />
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-[var(--muted)]">No notifications yet.</p>}
      </section>
      {escalations && <SlaEscalations ticketList={ticketList} {...escalations} />}
    </TicketShell>
  );
}
