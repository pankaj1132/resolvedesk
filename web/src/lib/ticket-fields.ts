import type { TicketPriority, TicketStatus } from "@/generated/prisma/enums";

export const ticketStatusLabels: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  WAITING_ON_CUSTOMER: "Waiting on customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const ticketPriorityLabels: Record<TicketPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export const ticketTitleLimit = 120;
export const ticketTextLimit = 5_000;
export const maxTicketTags = 8;
export const maxTicketTagLength = 32;
export const ticketTagsInputLimit = maxTicketTags * (maxTicketTagLength + 2);
const tagPattern = /^[a-z0-9][a-z0-9-]{0,31}$/;

export function isTicketDone(status: TicketStatus) {
  return status === "RESOLVED" || status === "CLOSED";
}

function normalizeTag(value: string) {
  return value.trim().toLowerCase();
}

export function readTicketTags(value: unknown) {
  if (typeof value !== "string" || value.length > ticketTagsInputLimit) return null;
  const tags = [...new Set(value.split(",").map(normalizeTag).filter(Boolean))].sort();
  return tags.length <= maxTicketTags && tags.every((tag) => tagPattern.test(tag)) ? tags : null;
}

export function isTicketStatus(value: unknown): value is TicketStatus {
  return typeof value === "string" && Object.hasOwn(ticketStatusLabels, value);
}

export function isTicketPriority(value: unknown): value is TicketPriority {
  return typeof value === "string" && Object.hasOwn(ticketPriorityLabels, value);
}

export function readTicketFilters(params: Record<string, string | string[] | undefined>, staff: boolean) {
  const query = typeof params.q === "string" ? params.q.trim().slice(0, ticketTitleLimit) : "";
  const page = typeof params.page === "string" ? Number(params.page) : 1;
  const tag = staff && typeof params.tag === "string" ? normalizeTag(params.tag) : "";

  return {
    query,
    status: isTicketStatus(params.status) ? params.status : undefined,
    priority: isTicketPriority(params.priority) ? params.priority : undefined,
    tag: tagPattern.test(tag) ? tag : undefined,
    assignee: staff && (params.assignee === "mine" || params.assignee === "unassigned") ? params.assignee : undefined,
    page: Number.isInteger(page) && page > 0 && page <= 100_000_000 ? page : 1,
  };
}
