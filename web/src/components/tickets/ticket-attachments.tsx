import { TicketAttachmentForm } from "@/components/tickets/ticket-attachment-form";
import { TicketTime } from "@/components/tickets/ticket-time";
import type { findTicket } from "@/lib/tickets";

type TicketAttachmentsProps = {
  endpoint: string;
  staff: boolean;
  writable: boolean;
  files: NonNullable<Awaited<ReturnType<typeof findTicket>>>["attachments"];
};

export function TicketAttachments({ endpoint, staff, writable, files }: TicketAttachmentsProps) {
  return (
    <section className="account-card grid gap-4" aria-labelledby="attachments-heading">
      <h2 id="attachments-heading" className="text-xl font-semibold">Attachments</h2>
      {files.length ? (
        <ul className="grid gap-2">
          {files.map((file) => (
            <li key={file.id} className="account-detail grid gap-1">
              <a className="auth-link w-fit wrap-anywhere" href={`${endpoint}/${file.id}`} download>{file.fileName}</a>
              <p className="flex flex-wrap gap-x-2 text-sm text-[var(--muted)]">
                <span>{Math.max(1, Math.ceil(file.byteSize / 1024))} KB</span>
                <span>{file.author.name}</span>
                <TicketTime date={file.createdAt} />
                {file.internal && <span className="font-medium text-amber-900">Staff only</span>}
              </p>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-[var(--muted)]">No attachments yet.</p>}
      {writable && <TicketAttachmentForm endpoint={endpoint} staff={staff} />}
    </section>
  );
}
