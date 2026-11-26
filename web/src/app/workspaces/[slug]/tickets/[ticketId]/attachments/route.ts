import { revalidatePath } from "next/cache";
import { attachmentLimit, attachmentMaxBytes } from "@/lib/ticket-attachment-fields";
import { attachmentName, isSupportedAttachment, readAttachmentBody, requireAttachmentTarget, storeTicketAttachment } from "@/lib/ticket-attachments";
import { requireTicketAccess } from "@/lib/tickets";

function rejected(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request, context: RouteContext<"/workspaces/[slug]/tickets/[ticketId]/attachments">) {
  const origin = process.env.BETTER_AUTH_URL;
  if (!origin || request.headers.get("origin") !== new URL(origin).origin) {
    return rejected("Submit attachments from ResolveDesk.", 403);
  }

  const { slug, ticketId } = await context.params;
  const access = await requireTicketAccess(slug);
  const visibility = request.headers.get("x-attachment-visibility");
  if (visibility !== "public" && visibility !== "internal") return rejected("Choose who can see the file.", 400);
  const internal = visibility === "internal";
  if (!await requireAttachmentTarget(access, ticketId, internal)) return rejected("This ticket is closed.", 409);

  const name = attachmentName(request.headers.get("x-attachment-name"));
  if (!name) return rejected("Use a file name up to 160 characters without path separators.", 400);
  if (Number(request.headers.get("content-length")) > attachmentMaxBytes) return rejected("Choose a file no larger than 5 MB.", 413);

  let data;
  try {
    data = await readAttachmentBody(request.body);
  } catch {
    return rejected("The file could not be read. Try again.", 400);
  }
  if (!data) return rejected("Choose a file no larger than 5 MB.", 413);
  if (!isSupportedAttachment(name, data)) return rejected("Choose a valid PDF, PNG, JPEG or UTF-8 text file.", 415);

  const attachment = await storeTicketAttachment(access, ticketId, name, data, internal);
  if (attachment === "closed") return rejected("This ticket is closed.", 409);
  if (!attachment) return rejected(`This ticket already has ${attachmentLimit} attachments with that visibility.`, 409);

  revalidatePath(`/workspaces/${slug}/tickets`);
  revalidatePath(`/workspaces/${slug}/tickets/${ticketId}`);
  revalidatePath(`/workspaces/${slug}/operations`);
  revalidatePath(`/workspaces/${slug}/notifications`);
  return Response.json(attachment, { status: 201 });
}
