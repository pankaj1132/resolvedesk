"use client";

import { useActionState, useRef, useState } from "react";
import { addTicketMessageAction } from "@/app/workspaces/[slug]/tickets/actions";
import { TicketArticlePicker } from "@/components/knowledge/ticket-article-picker";
import { knowledgePath } from "@/lib/knowledge-fields";
import { ticketTextLimit } from "@/lib/ticket-fields";

export function TicketMessageForm({ slug, ticketId, staff }: { slug: string; ticketId: string; staff: boolean }) {
  const [state, action, pending] = useActionState(addTicketMessageAction.bind(null, slug, ticketId), {});
  const [visibility, setVisibility] = useState("public");
  const message = useRef<HTMLTextAreaElement>(null);

  function addArticleLink(article: { id: string; title: string }) {
    const input = message.current;
    if (!input || visibility !== "public") return false;

    const end = input.value.length;
    const separator = end ? "\n\n" : "";
    const link = `${separator}${article.title}\n${knowledgePath(slug)}/${article.id}`;
    if (end + link.length > ticketTextLimit) return false;

    input.setRangeText(link, end, end, "end");
    input.focus();
    return true;
  }

  return (
    <form className="grid gap-4" action={action}>
      {staff && (
        <label className="auth-field max-w-xs">
          Visibility
          <select name="visibility" value={visibility} onChange={(event) => setVisibility(event.target.value)}>
            <option value="public">Reply (visible to requester)</option>
            <option value="internal">Internal note (staff only)</option>
          </select>
        </label>
      )}
      {staff && visibility === "public" && (
        <TicketArticlePicker endpoint={`/workspaces/${slug}/tickets/${ticketId}/knowledge`} insert={addArticleLink} />
      )}
      <label className="auth-field">
        Message
        <textarea ref={message} name="body" rows={4} maxLength={ticketTextLimit} required />
      </label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="auth-button auth-button-primary justify-self-start" type="submit" disabled={pending}>
        {pending ? "Posting…" : "Post message"}
      </button>
    </form>
  );
}
