"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseIstDateInput } from "@/lib/sla-fields";
import { isTicketPriority, isTicketStatus, maxTicketTagLength, maxTicketTags, readTicketTags, ticketTextLimit, ticketTitleLimit } from "@/lib/ticket-fields";
import { addTicketMessage, createTicket, requireTicketAccess, updateTicketSettings } from "@/lib/tickets";

export type TicketActionState = { error?: string; saved?: boolean };

function text(fields: FormData, key: string) {
  const value = fields.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function refreshTicketPaths(slug: string, id: string) {
  revalidatePath(`/workspaces/${slug}/tickets`);
  revalidatePath(`/workspaces/${slug}/tickets/${id}`);
  revalidatePath(`/workspaces/${slug}/operations`);
  revalidatePath(`/workspaces/${slug}/notifications`);
}

export async function createTicketAction(slug: string, _state: TicketActionState, fields: FormData): Promise<TicketActionState> {
  const access = await requireTicketAccess(slug);
  const title = text(fields, "title");
  const description = text(fields, "description");

  if (!title || title.length > ticketTitleLimit) {
    return { error: `Enter a title between 1 and ${ticketTitleLimit} characters.` };
  }
  if (!description || description.length > ticketTextLimit) {
    return { error: `Enter a description between 1 and ${ticketTextLimit} characters.` };
  }

  const ticket = await createTicket(access, title, description);
  refreshTicketPaths(slug, ticket.id);
  redirect(`/workspaces/${slug}/tickets/${ticket.id}`);
}

export async function updateTicketAction(slug: string, id: string, _state: TicketActionState, fields: FormData): Promise<TicketActionState> {
  const access = await requireTicketAccess(slug);
  const status = fields.get("status");
  const priority = fields.get("priority");
  if (!isTicketStatus(status) || !isTicketPriority(priority)) {
    return { error: "Choose a valid status and priority." };
  }

  const assigneeId = fields.get("assigneeId");
  if (typeof assigneeId !== "string") return { error: "Choose a valid assignee." };

  const rawOverride = fields.get("resolutionOverride");
  if (typeof rawOverride !== "string") return { error: "Choose a valid resolution deadline." };
  const override = rawOverride ? parseIstDateInput(rawOverride) : null;
  if (rawOverride && !override) return { error: "Choose a valid resolution deadline in IST." };

  const tags = readTicketTags(fields.get("tags"));
  if (!tags) return { error: `Use up to ${maxTicketTags} comma-separated tags, each up to ${maxTicketTagLength} letters, numbers or hyphens.` };
  const error = await updateTicketSettings(access, id, { status, priority, assigneeId: assigneeId || null, override, tags });
  if (error) return { error };

  refreshTicketPaths(slug, id);
  return { saved: true };
}

export async function addTicketMessageAction(slug: string, id: string, _state: TicketActionState, fields: FormData): Promise<TicketActionState> {
  const access = await requireTicketAccess(slug);
  const body = text(fields, "body");
  if (!body || body.length > ticketTextLimit) {
    return { error: `Enter a message between 1 and ${ticketTextLimit} characters.` };
  }

  const saved = await addTicketMessage(access, id, body, fields.get("visibility") === "internal");
  if (!saved) return { error: "This ticket is closed. A staff member can reopen it." };
  refreshTicketPaths(slug, id);
  return { saved: true };
}
