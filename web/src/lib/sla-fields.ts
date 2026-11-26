import type { TicketPriority } from "@/generated/prisma/enums";

export const slaPriorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export const maxSlaHours = 720;
export const reportingDays = 30;
export const hourMillis = 3_600_000;
const istOffset = 330 * 60_000;

export type SlaTargets = { responseHours: number; resolutionHours: number };

export const defaultSlaTargets: Record<TicketPriority, SlaTargets> = {
  LOW: { responseHours: 24, resolutionHours: 96 },
  NORMAL: { responseHours: 8, resolutionHours: 48 },
  HIGH: { responseHours: 4, resolutionHours: 24 },
  URGENT: { responseHours: 1, resolutionHours: 8 },
};

export function slaDeadlines(createdAt: Date, targets: SlaTargets) {
  return {
    responseDueAt: new Date(createdAt.getTime() + targets.responseHours * hourMillis),
    resolutionDueAt: new Date(createdAt.getTime() + targets.resolutionHours * hourMillis),
  };
}

export function istDateInput(date: Date) {
  return new Date(date.getTime() + istOffset).toISOString().slice(0, 16);
}

export function parseIstDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}+05:30`);
  return Number.isFinite(date.getTime()) && istDateInput(date) === value ? date : null;
}
