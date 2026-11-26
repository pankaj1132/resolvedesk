import { TicketCreateForm } from "@/components/tickets/ticket-create-form";
import { TicketShell } from "@/components/tickets/ticket-shell";
import { requireTicketAccess } from "@/lib/tickets";

export const metadata = { title: "New ticket" };

export default async function NewTicketPage({ params }: PageProps<"/workspaces/[slug]/tickets/new">) {
  const { slug } = await params;
  const { organization } = await requireTicketAccess(slug);

  return (
    <TicketShell back={{ href: `/workspaces/${organization.slug}/tickets`, label: "Back to tickets" }}>
      <section className="account-card grid max-w-2xl gap-5" aria-labelledby="new-ticket-heading">
        <h1 id="new-ticket-heading" className="text-3xl font-semibold tracking-tight">New ticket</h1>
        <TicketCreateForm slug={organization.slug} />
      </section>
    </TicketShell>
  );
}
