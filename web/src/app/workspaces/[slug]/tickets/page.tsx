import Link from "next/link";
import { TicketQueue } from "@/components/tickets/ticket-queue";
import { TicketShell } from "@/components/tickets/ticket-shell";
import { readTicketFilters } from "@/lib/ticket-fields";
import { listTickets, requireTicketAccess } from "@/lib/tickets";

export const metadata = { title: "Tickets" };

export default async function TicketsPage({ params, searchParams }: PageProps<"/workspaces/[slug]/tickets">) {
  const { slug } = await params;
  const access = await requireTicketAccess(slug);
  const filters = readTicketFilters(await searchParams, access.staff);
  const result = await listTickets(access, filters);
  const workspaceHref = `/workspaces/${access.organization.slug}`;
  const ticketHref = `${workspaceHref}/tickets`;

  return (
    <TicketShell back={{ href: workspaceHref, label: access.organization.name }}>
      <section className="account-card grid gap-6" aria-labelledby="ticket-list-heading">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 id="ticket-list-heading" className="text-3xl font-semibold tracking-tight">
            {access.staff ? "Ticket inbox" : "My tickets"}
          </h1>
          <Link className="auth-button auth-button-primary inline-flex items-center" href={`${ticketHref}/new`}>
            New ticket
          </Link>
        </div>
        <TicketQueue href={ticketHref} filters={filters} staff={access.staff} {...result} />
      </section>
    </TicketShell>
  );
}
