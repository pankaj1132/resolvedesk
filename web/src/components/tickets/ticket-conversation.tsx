import Link from "next/link";
import type { findTicket } from "@/lib/tickets";
import { TicketTime } from "@/components/tickets/ticket-time";
import { isArticleLink } from "@/lib/knowledge-fields";

type TicketConversationProps = Pick<NonNullable<Awaited<ReturnType<typeof findTicket>>>, "createdAt" | "description" | "requester" | "messages"> & { slug: string };

export function TicketConversation({ createdAt, description, requester, messages, slug }: TicketConversationProps) {
  const thread = [
    { id: "initial", createdAt, body: description, author: requester, internal: false },
    ...messages,
  ];

  return (
    <ol className="grid gap-3">
      {thread.map((message) => (
        <li key={message.id} className={message.internal ? "account-detail border-l-4 border-amber-500" : "account-detail"}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-semibold">{message.author.name}</span>
            {message.internal && <span className="font-medium text-amber-900">Internal note</span>}
            <TicketTime date={message.createdAt} />
          </div>
          <p className="mt-2 wrap-anywhere whitespace-pre-wrap text-sm leading-relaxed">
            {message.body.split(/(\s+)/).map((part, index) => isArticleLink(part, slug)
              ? <Link href={part} className="auth-link" key={`${index}-${part}`}>{part}</Link>
              : part)}
          </p>
        </li>
      ))}
    </ol>
  );
}
