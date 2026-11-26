"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { defaultSlaTargets, maxSlaHours, slaPriorities } from "@/lib/sla-fields";
import { ticketPriorityLabels } from "@/lib/ticket-fields";
import { requireTicketAccess } from "@/lib/tickets";
import { saveWorkspaceSlaTargets } from "@/lib/workspace-operations";

type SlaActionState = { error?: string; saved?: boolean };

export async function saveSlaAction(slug: string, _state: SlaActionState, fields: FormData): Promise<SlaActionState> {
  const access = await requireTicketAccess(slug);
  if (access.role !== "OWNER") notFound();

  const targets = { ...defaultSlaTargets };
  for (const priority of slaPriorities) {
    const responseHours = Number(fields.get(`response-${priority}`));
    const resolutionHours = Number(fields.get(`resolution-${priority}`));
    if (!Number.isInteger(responseHours) || !Number.isInteger(resolutionHours) || responseHours < 1 ||
      resolutionHours > maxSlaHours || resolutionHours < responseHours) {
      return { error: `Use whole-hour targets from 1 to ${maxSlaHours} for ${ticketPriorityLabels[priority]}. Resolution must be at least as long as first response.` };
    }
    targets[priority] = { responseHours, resolutionHours };
  }
  await saveWorkspaceSlaTargets(access, targets);
  revalidatePath(`/workspaces/${slug}/operations`);
  return { saved: true };
}
