"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";

type IngestResponse = {
  from?: string;
  to?: string;
  fetched?: { dcinside: number; reddit: number };
  useful?: number;
  injected?: number;
  duplicates?: number;
  skipped?: number;
  errors?: string[];
  graphLog?: string;
  error?: string;
};

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

/** Admin-only panel: pick community sources + a date range, then inject into the graph. */
export function CommunityIngestPanel() {
  const { t } = useI18n();
  const [dcinside, setDcinside] = useState(true);
  const [reddit, setReddit] = useState(true);
  const [from, setFrom] = useState(() => isoDaysAgo(7));
  const [to, setTo] = useState(() => isoDaysAgo(0));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IngestResponse | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const valid = (dcinside || reddit) && from !== "" && to !== "" && from <= to;

  async function inject(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    setResult(null);
    setErrorKey(null);
    const sources = [dcinside ? "dcinside" : "", reddit ? "reddit" : ""].filter(Boolean);
    try {
      const res = await fetch("/api/admin/ingest-community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources, from, to }),
      });
      const data = (await res.json()) as IngestResponse;
      if (!res.ok) {
        setErrorKey(data.error ?? "failed");
      } else {
        setResult(data);
      }
    } catch {
      setErrorKey("failed");
    } finally {
      setLoading(false);
    }
  }

  const errorText = (() => {
    if (!errorKey) return null;
    if (errorKey === "jev_key_missing") return t.ingest.jevMissing;
    if (errorKey === "range_too_wide") return t.ingest.rangeTooWide;
    if (errorKey === "invalid_request") return t.ingest.badRange;
    if (errorKey === "unauthorized") return t.auth.adminOnly;
    return t.ingest.failed;
  })();

  return (
    <form onSubmit={inject} className="mt-4 space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={dcinside}
            onChange={(e) => setDcinside(e.target.checked)}
            disabled={loading}
          />
          {t.ingest.sourceDc}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={reddit}
            onChange={(e) => setReddit(e.target.checked)}
            disabled={loading}
          />
          {t.ingest.sourceReddit}
        </label>
      </div>

      <div className="flex flex-wrap items-end gap-3 text-sm">
        <label className="block">
          <span className="text-[var(--muted)]">{t.ingest.from}</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            disabled={loading}
            className="mt-1 block rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-[var(--muted)]">{t.ingest.to}</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={loading}
            className="mt-1 block rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2"
          />
        </label>
        <button type="submit" className="btn btn-primary shrink-0" disabled={!valid || loading}>
          {loading ? t.ingest.working : t.ingest.inject}
        </button>
      </div>

      {errorText ? (
        <p className="text-sm" style={{ color: "var(--fire)" }}>
          {errorText}
        </p>
      ) : null}

      {result ? (
        <div className="wiki-card p-4 text-sm leading-6">
          <p>{t.ingest.resultFetched(result.fetched?.dcinside ?? 0, result.fetched?.reddit ?? 0)}</p>
          <p>{t.ingest.resultUseful(result.useful ?? 0)}</p>
          <p>
            {t.ingest.resultInjected(result.injected ?? 0)} · {t.ingest.resultDuplicates(result.duplicates ?? 0)}
          </p>
          <p>{t.ingest.resultSkipped(result.skipped ?? 0)}</p>
          {result.errors && result.errors.length > 0 ? (
            <div className="mt-2">
              <p className="font-medium">{t.ingest.errorPrefix}</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-[var(--muted)]">
                {result.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.graphLog ? <p className="mt-2 text-xs text-[var(--muted)]">{result.graphLog}</p> : null}
        </div>
      ) : null}
    </form>
  );
}
