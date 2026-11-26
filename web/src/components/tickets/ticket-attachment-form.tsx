"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { attachmentAccept, attachmentMaxBytes } from "@/lib/ticket-attachment-fields";

export function TicketAttachmentForm({ endpoint, staff }: { endpoint: string; staff: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [uploaded, setUploaded] = useState(false);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setUploaded(false);
    const form = event.currentTarget;
    const fields = new FormData(form);
    const file = fields.get("attachment");

    if (!(file instanceof File) || !file.size || file.size > attachmentMaxBytes) {
      setError("Choose a non-empty file no larger than 5 MB.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        redirect: "manual",
        referrerPolicy: "same-origin",
        headers: {
          "X-Attachment-Name": encodeURIComponent(file.name),
          "X-Attachment-Visibility": fields.get("attachmentVisibility") === "internal" ? "internal" : "public",
        },
        body: file,
      });

      if (response.status === 201) {
        form.reset();
        setUploaded(true);
        router.refresh();
      } else if (response.headers.get("content-type")?.includes("application/json")) {
        const result = await response.json();
        setError(result.error ?? "The attachment could not be uploaded.");
      } else {
        setError("The attachment could not be uploaded. Refresh the ticket and try again.");
      }
    } catch {
      setError("The connection interrupted the upload. Check the attachment list before trying again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-3" method="post" action={endpoint} onSubmit={upload} aria-busy={pending}>
      <label className="auth-field">
        Add a file
        <input name="attachment" type="file" accept={attachmentAccept} aria-describedby="attachment-rules" required />
      </label>
      <p id="attachment-rules" className="text-sm text-[var(--muted)]">PDF, PNG, JPEG or TXT. Up to 5 MB per file.</p>
      {staff && (
        <label className="auth-field max-w-xs">
          File visibility
          <select name="attachmentVisibility" defaultValue="public">
            <option value="public">Visible to requester</option>
            <option value="internal">Staff only</option>
          </select>
        </label>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      {uploaded && <p className="text-sm text-[var(--muted)]" role="status">Attachment uploaded.</p>}
      <button className="auth-button auth-button-secondary justify-self-start" type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload attachment"}
      </button>
    </form>
  );
}
