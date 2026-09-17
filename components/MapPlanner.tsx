"use client";

import "leaflet/dist/leaflet.css";
import type * as LType from "leaflet";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";
import {
  type MapMarker,
  bulkPutMarkers,
  clearMarkers,
  deleteMarker,
  getAllMarkers,
  putMarker,
} from "@/lib/markersDb";

const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const TOPO_URL = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
const TOPO_ATTR =
  'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)';

export const MARKER_TYPES = [
  "spawn_aniimo",
  "spawn_weather",
  "spawn_time",
  "chest",
  "gathering",
  "boss",
  "egg",
  "teleporter",
  "sanctum",
  "puzzle",
  "rv_park",
  "landmark",
  "ecological_observation",
  "branch",
] as const;

const TYPE_COLOR: Record<string, string> = {
  spawn_aniimo: "#2f7d54",
  spawn_weather: "#2f78c4",
  spawn_time: "#5b4a86",
  chest: "#c98a2b",
  gathering: "#43a047",
  boss: "#e5602f",
  egg: "#d8a93a",
  teleporter: "#2f6f86",
  sanctum: "#8a4bd0",
  puzzle: "#b24a2c",
  rv_park: "#8a6a3b",
  landmark: "#e5602f",
  ecological_observation: "#5aa88f",
  branch: "#b07a2a",
};

const TYPE_EMOJI: Record<string, string> = {
  spawn_aniimo: "🐾",
  spawn_weather: "🌧️",
  spawn_time: "🌙",
  chest: "🧰",
  gathering: "🌿",
  boss: "👹",
  egg: "🥚",
  teleporter: "🌀",
  sanctum: "⛩️",
  puzzle: "🧩",
  rv_park: "🚐",
  landmark: "📍",
  ecological_observation: "🔭",
  branch: "🌸",
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function MapPlanner() {
  const { t } = useI18n();
  const typeLabels = t.maps.markerTypeLabels as Record<string, string>;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const LRef = useRef<typeof LType | null>(null);
  const layerRef = useRef<LType.LayerGroup | null>(null);

  const [ready, setReady] = useState(false);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [visible, setVisible] = useState<Set<string>>(new Set(MARKER_TYPES));
  const [addMode, setAddMode] = useState(false);
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState({ type: "spawn_aniimo", name: "", notes: "" });
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Keep latest addMode available inside the Leaflet click handler.
  const addModeRef = useRef(addMode);
  useEffect(() => {
    addModeRef.current = addMode;
  }, [addMode]);

  // Init map once.
  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !containerRef.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(containerRef.current, {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        worldCopyJump: true,
      });
      const osm = L.tileLayer(OSM_URL, { maxZoom: 19, attribution: OSM_ATTR }).addTo(map);
      const topo = L.tileLayer(TOPO_URL, { maxZoom: 17, attribution: TOPO_ATTR });
      L.control.layers({ [t.maps.baseOsm]: osm, [t.maps.baseTopo]: topo }, undefined, { position: "topright" }).addTo(map);
      L.control.scale({ imperial: false }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      map.on("click", (e: LType.LeafletMouseEvent) => {
        if (!addModeRef.current) return;
        setDraft({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
      mapRef.current = map;
      setReady(true);
      setMarkers(await getAllMarkers());
    })();
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Map is initialized once on mount; locale labels are read at init time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render markers whenever data / filters change.
  useEffect(() => {
    const L = LRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !layer) return;
    layer.clearLayers();
    for (const m of markers) {
      if (!visible.has(m.type)) continue;
      const color = TYPE_COLOR[m.type] ?? "#2f7d54";
      const icon = L.divIcon({
        className: "",
        html: `<span style="display:grid;place-items:center;width:26px;height:26px;border-radius:999px;background:${color};color:#fff;font-size:14px;box-shadow:0 1px 4px rgba(0,0,0,.4);border:2px solid #fff">${TYPE_EMOJI[m.type] ?? "📍"}</span>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const label = typeLabels[m.type] ?? m.type;
      L.marker([m.lat, m.lng], { icon })
        .addTo(layer)
        .bindPopup(
          `<strong>${escapeHtml(m.name || label)}</strong><br/><span style="color:#666">${escapeHtml(label)}</span>${
            m.notes ? `<br/>${escapeHtml(m.notes)}` : ""
          }`,
        );
    }
  }, [markers, visible, ready, typeLabels]);

  const saveDraft = useCallback(async () => {
    if (!draft) return;
    const marker: MapMarker = {
      id: crypto.randomUUID(),
      type: form.type,
      name: form.name.trim(),
      notes: form.notes.trim() || undefined,
      lat: draft.lat,
      lng: draft.lng,
      createdAt: Date.now(),
    };
    await putMarker(marker);
    setMarkers((prev) => [...prev, marker]);
    setDraft(null);
    setForm({ type: form.type, name: "", notes: "" });
    setAddMode(false);
  }, [draft, form]);

  const removeMarker = useCallback(async (id: string) => {
    await deleteMarker(id);
    setMarkers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const panTo = useCallback((m: MapMarker) => {
    mapRef.current?.setView([m.lat, m.lng], 1);
  }, []);

  const toggleType = useCallback((type: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(markers, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aniimo-markers.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [markers]);

  const importJson = useCallback(async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) return;
      const clean: MapMarker[] = parsed
        .filter((m) => m && typeof m.lat === "number" && typeof m.lng === "number")
        .map((m) => ({
          id: typeof m.id === "string" ? m.id : crypto.randomUUID(),
          type: MARKER_TYPES.includes(m.type) ? m.type : "landmark",
          name: typeof m.name === "string" ? m.name : "",
          notes: typeof m.notes === "string" ? m.notes : undefined,
          lat: m.lat,
          lng: m.lng,
          createdAt: typeof m.createdAt === "number" ? m.createdAt : Date.now(),
        }));
      await bulkPutMarkers(clean);
      setMarkers(await getAllMarkers());
    } catch {
      /* ignore malformed files */
    }
  }, []);

  const clearAll = useCallback(async () => {
    if (!window.confirm(t.maps.clearConfirm)) return;
    await clearMarkers();
    setMarkers([]);
  }, [t.maps.clearConfirm]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setAddMode((v) => !v);
            setDraft(null);
          }}
          className={`btn ${addMode ? "btn-primary" : "btn-ghost"}`}
        >
          <span aria-hidden>➕</span>
          {addMode ? t.maps.addMarkerOn : t.maps.addMarker}
        </button>
        <button type="button" onClick={exportJson} className="btn btn-ghost">
          {t.maps.exportJson}
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost">
          {t.maps.importJson}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importJson(f);
            e.target.value = "";
          }}
        />
        <button type="button" onClick={clearAll} className="btn btn-ghost">
          {t.maps.clearAll}
        </button>
        <span className="ml-auto text-sm text-[var(--muted)]">
          {t.maps.myMarkers}: {markers.length}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div
          className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)]"
          style={{ height: 520 }}
        >
          <div
            ref={containerRef}
            style={{ height: "100%", width: "100%", cursor: addMode ? "crosshair" : "grab", background: "var(--paper-2)" }}
          />
        </div>

        <aside className="space-y-4">
          {draft ? (
            <div className="wiki-card p-4">
              <p className="font-display text-lg">{t.maps.addMarker}</p>
              <label className="mt-2 block text-sm">
                {t.maps.markerType}
                <select
                  className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  {MARKER_TYPES.map((tp) => (
                    <option key={tp} value={tp}>
                      {typeLabels[tp] ?? tp}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-2 block text-sm">
                {t.maps.markerName}
                <input
                  className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label className="mt-2 block text-sm">
                {t.maps.markerNotes}
                <input
                  className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </label>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={saveDraft} className="btn btn-primary flex-1">
                  {t.maps.save}
                </button>
                <button type="button" onClick={() => setDraft(null)} className="btn btn-ghost">
                  {t.maps.cancel}
                </button>
              </div>
            </div>
          ) : null}

          <div className="wiki-card p-4">
            <p className="font-display text-sm">{t.maps.layers}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {MARKER_TYPES.map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => toggleType(tp)}
                  className="chip"
                  style={{
                    background: visible.has(tp) ? TYPE_COLOR[tp] : "var(--paper-2)",
                    color: visible.has(tp) ? "#fff" : "var(--muted)",
                    border: "1px solid var(--line)",
                  }}
                  aria-pressed={visible.has(tp)}
                >
                  {TYPE_EMOJI[tp]} {typeLabels[tp] ?? tp}
                </button>
              ))}
            </div>
          </div>

          <div className="wiki-card p-4">
            <p className="font-display text-sm">{t.maps.myMarkers}</p>
            {markers.length === 0 ? (
              <p className="mt-2 text-xs leading-6 text-[var(--muted)]">{t.maps.noMarkers}</p>
            ) : (
              <ul className="mt-2 max-h-64 space-y-1 overflow-auto">
                {markers.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 border-b border-[var(--line)] py-1.5 text-sm">
                    <button type="button" onClick={() => panTo(m)} className="min-w-0 flex-1 truncate text-left" title={t.maps.panTo}>
                      <span aria-hidden>{TYPE_EMOJI[m.type]}</span> {m.name || (typeLabels[m.type] ?? m.type)}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMarker(m.id)}
                      className="text-xs text-[var(--fire)] hover:underline"
                    >
                      {t.maps.delete}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
