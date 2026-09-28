"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";

type QnaResponse = {
  answer: string;
  mode: "llm" | "grounded-fallback";
  category: string;
  generator: string;
  sources: { title: string; url: string; type: string; accessed: string }[];
  facts: { id: string; type: string; confidence: string; name: { ko?: string | null; en?: string | null } }[];
};

export function QnaClient() {
  const { t, locale } = useI18n();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QnaResponse | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/qna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, locale }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={ask} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t.qna.placeholder}
          className="w-full rounded-full border border-[var(--line)] bg-[var(--paper-2)] px-5 py-3 text-base outline-none ring-[var(--moss)] focus:ring-2"
        />
        <button type="submit" className="btn btn-primary shrink-0" disabled={loading}>
          {loading ? t.qna.thinking : t.qna.ask}
        </button>
      </form>

      {result ? (
        <div className="mt-6 space-y-5">
          <div className="wiki-card p-6">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
              <span className="font-display text-base text-[var(--ink)]">{t.qna.answer}</span>
              <span className="chip chip-community">{result.category}</span>
              <span className="chip chip-unknown">
                {result.mode === "llm" ? t.qna.modeLlm : t.qna.modeFallback}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--ink-soft)]">{result.answer}</p>
          </div>

          {result.facts.length > 0 ? (
            <div className="wiki-card p-5">
              <p className="font-display text-sm">{t.qna.facts}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {result.facts.map((f) => (
                  <li key={f.id} className="chip chip-community">
                    {(locale === "en" ? f.name.en : f.name.ko) ?? f.name.en ?? f.name.ko ?? f.id}
                    <span className="ml-1 opacity-70">· {f.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.sources.length > 0 ? (
            <div className="wiki-card p-5">
              <p className="font-display text-sm">{t.qna.sources}</p>
              <ul className="mt-2 space-y-1 text-xs">
                {result.sources.map((s) => (
                  <li key={s.url}>
                    <a className="link-moss" href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                    {s.accessed ? <span className="text-[var(--muted)]"> · {s.accessed}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
