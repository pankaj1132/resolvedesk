import { notFound } from "next/navigation";
import { attachmentDisposition, findTicketDownload } from "@/lib/ticket-attachments";
import { requireTicketAccess } from "@/lib/tickets";

export async function GET(_request: Request, context: RouteContext<"/workspaces/[slug]/tickets/[ticketId]/attachments/[attachmentId]">) {
  const { slug, ticketId, attachmentId } = await context.params;
  const access = await requireTicketAccess(slug);
  const attachment = await findTicketDownload(access, ticketId, attachmentId);
  if (!attachment) notFound();

  return new Response(new Uint8Array(attachment.data), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": attachmentDisposition(attachment.fileName),
      "Content-Length": String(attachment.byteSize),
      "Content-Type": "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
