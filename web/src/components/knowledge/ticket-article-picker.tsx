"use client";

import { useState } from "react";
import { articleSearchLimit, readArticleSearch } from "@/lib/knowledge-fields";

type ArticleSuggestion = { id: string; title: string };

export function TicketArticlePicker({ endpoint, insert }: { endpoint: string; insert: (article: ArticleSuggestion) => boolean }) {
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<ArticleSuggestion[] | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    if (pending) return;
    setPending(true);
    setError("");
    setArticles(null);
    const params = new URLSearchParams({ q: readArticleSearch(query) });

    try {
      const response = await fetch(`${endpoint}?${params}`, { redirect: "manual" });
      if (!response.ok) throw new Error("Article search failed.");
      const result: { articles: ArticleSuggestion[] } = await response.json();
      setArticles(result.articles);
    } catch {
      setError("Could not load articles. Try again.");
    } finally {
      setPending(false);
    }
  }

  function add(article: ArticleSuggestion) {
    if (insert(article)) {
      setArticles(null);
      setError("");
    } else {
      setError("Shorten the reply before adding the link.");
    }
  }

  return (
    <fieldset className="account-detail grid gap-3" aria-busy={pending}>
      <legend className="px-1 text-sm font-semibold">Add a Knowledge Base link</legend>
      <div className="grid items-end gap-2 sm:grid-cols-[1fr_auto]">
        <label className="auth-field">
          Find a customer-facing article
          <input
            type="search" value={query} maxLength={articleSearchLimit} disabled={pending}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              void search();
            }}
          />
        </label>
        <button className="auth-button auth-button-secondary" type="button" onClick={search} disabled={pending}>
          {pending ? "Searching…" : "Find articles"}
        </button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {articles?.length ? (
        <ul className="grid gap-2">
          {articles.map((article) => (
            <li key={article.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="wrap-anywhere">{article.title}</span>
              <button
                className="auth-button auth-button-secondary" type="button" onClick={() => add(article)}
                aria-label={`Add link to ${article.title}`}
              >
                Add link
              </button>
            </li>
          ))}
        </ul>
      ) : articles && <p className="text-sm text-[var(--muted)]">No published customer-facing articles match.</p>}
    </fieldset>
  );
}
