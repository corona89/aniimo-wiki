"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";

type HistoryItem = {
  id: string;
  source: "dcinside" | "reddit";
  nativeId: string;
  url: string;
  title: string;
  postedAt: string;
  ingestedAt: string;
  contentHash: string | null;
};

type HistoryResponse = { items: HistoryItem[]; total: number };

/** Admin-only panel: lists ingested documents with their sha-256 hash and source link. */
export function IngestHistoryPanel() {
  const { t } = useI18n();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const fetchHistory = useCallback(async (): Promise<HistoryResponse> => {
    const res = await fetch("/api/admin/ingest-history?limit=200", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as HistoryResponse;
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchHistory().then(
      (data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    ).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchHistory]);

  const refresh = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const data = await fetchHistory();
      setItems(data.items);
      setTotal(data.total);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">{t.ingest.historyCount(total)}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="btn btn-primary px-3 py-1.5 text-xs"
        >
          {loading ? t.ingest.historyRefreshing : t.ingest.historyRefresh}
        </button>
      </div>

      {failed ? (
        <p className="mt-3 text-sm" style={{ color: "var(--fire)" }}>
          {t.ingest.historyFailed}
        </p>
      ) : null}

      {!loading && !failed && items.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">{t.ingest.historyEmpty}</p>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-3 max-h-[28rem] overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[var(--paper)]">
              <tr className="border-b border-[var(--line)] text-[var(--muted)]">
                <th className="whitespace-nowrap py-2 pr-3 font-medium">{t.ingest.thDate}</th>
                <th className="whitespace-nowrap py-2 pr-3 font-medium">{t.ingest.thSource}</th>
                <th className="py-2 pr-3 font-medium">{t.ingest.thTitle}</th>
                <th className="py-2 font-medium">{t.ingest.thHash}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-[var(--line)] align-top">
                  <td className="whitespace-nowrap py-2 pr-3 text-[var(--ink-soft)]">
                    {item.ingestedAt}
                  </td>
                  <td className="whitespace-nowrap py-2 pr-3">
                    {item.source === "dcinside" ? t.ingest.historySourceDc : t.ingest.historySourceRd}
                  </td>
                  <td className="py-2 pr-3">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="link-moss break-all"
                    >
                      {item.title || item.url}
                    </a>
                  </td>
                  <td className="py-2">
                    <code
                      className="break-all text-[10px] text-[var(--ink-soft)]"
                      title={item.contentHash ?? undefined}
                    >
                      {item.contentHash ?? "—"}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
