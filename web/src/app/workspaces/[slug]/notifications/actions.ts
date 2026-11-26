"use server";

import { revalidatePath } from "next/cache";
import { markTicketNotificationsRead } from "@/lib/ticket-notifications";
import { requireTicketAccess } from "@/lib/tickets";

export async function markNotificationsReadAction(slug: string) {
  const access = await requireTicketAccess(slug);
  await markTicketNotificationsRead(access);
  revalidatePath(`/workspaces/${slug}/notifications`);
}
