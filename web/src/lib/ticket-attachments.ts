import "server-only";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { attachmentLimit, attachmentMaxBytes } from "@/lib/ticket-attachment-fields";
import { lockTicketConversation, recordPublicResponse, ticketScope, type TicketAccess } from "@/lib/tickets";

export function attachmentName(header: string | null) {
  if (!header) return null;

  try {
    const name = decodeURIComponent(header).trim();
    const hasControls = Array.from(name).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127);
    return name && name.length <= 160 && !hasControls && !/[\\/:*?"<>|]/.test(name) ? name : null;
  } catch {
    return null;
  }
}

export async function readAttachmentBody(body: ReadableStream<Uint8Array> | null) {
  if (!body) return Buffer.alloc(0);

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return Buffer.concat(chunks, bytes);

      bytes += value.byteLength;
      if (bytes > attachmentMaxBytes) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
}

export function isSupportedAttachment(name: string, data: Buffer) {
  const dot = name.lastIndexOf(".");
  if (dot < 1 || !data.length) return false;

  const extension = name.slice(dot).toLowerCase();
  switch (extension) {
    case ".pdf": return data.subarray(0, 5).equals(Buffer.from("%PDF-"));
    case ".png": return data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    case ".jpg":
    case ".jpeg": return data.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
    case ".txt":
      try {
        return !new TextDecoder("utf-8", { fatal: true }).decode(data).includes("\0");
      } catch {
        return false;
      }
    default: return false;
  }
}

export async function requireAttachmentTarget(access: TicketAccess, id: string, internal: boolean) {
  if (internal && !access.staff) notFound();
  const ticket = await db.ticket.findFirst({ where: ticketScope(access, id), select: { status: true } });
  if (!ticket) notFound();
  return ticket.status !== "CLOSED";
}

export function storeTicketAttachment(access: TicketAccess, id: string, fileName: string, data: Uint8Array<ArrayBuffer>, internal: boolean) {
  return db.$transaction(async (tx) => {
    if (!await lockTicketConversation(tx, access, id)) return "closed" as const;
    const ticketFiles = await tx.ticketAttachment.count({ where: { ticketId: id, internal } });
    if (ticketFiles >= attachmentLimit) return null;

    const attachment = await tx.ticketAttachment.create({
      data: { ticketId: id, authorId: access.userId, fileName, data, byteSize: data.byteLength, internal },
      select: { id: true, createdAt: true },
    });
    if (!internal) await recordPublicResponse(tx, access, id, "attachment", attachment.createdAt);
    return { id: attachment.id };
  }, { timeout: 20_000 });
}

export function findTicketDownload(access: TicketAccess, ticketId: string, id: string) {
  return db.ticketAttachment.findFirst({
    where: { id, ticket: ticketScope(access, ticketId), internal: access.staff ? undefined : false },
    select: { fileName: true, byteSize: true, data: true },
  });
}

export function attachmentDisposition(name: string) {
  const quoted = name.replace(/[^\x20-\x7e]|["\\]/g, "_");
  const encoded = encodeURIComponent(name).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${quoted}"; filename*=UTF-8''${encoded}`;
}
