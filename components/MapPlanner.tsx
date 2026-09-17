"use client";

import "leaflet/dist/leaflet.css";
import type * as LType from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { regionDisplayName, regions } from "@/lib/research";
import {
  type MapMarker,
  bulkPutMarkers,
  clearMarkers,
  deleteMarker,
  getAllMarkers,
  putMarker,
} from "@/lib/markersDb";

const IMG = "/art/idyll-map.jpg";
const IMG_W = 1280;
const IMG_H = 720;
const MAP_ATTR = '에이델 / Idyll · fan-made illustration | <a href="https://leafletjs.com">Leaflet</a>';

const VIEW_KEY = "aniimo-map-view";

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

// Approximate landmark placements on OUR fan-made Idyll art (lat = y from bottom,
// lng = x). These are decorative navigation aids, NOT official coordinates; the
// coordinate data files stay empty per the wiki's no-invent-coordinates rule.
const REGION_PINS: { id: string; lat: number; lng: number }[] = [
  { id: "blitzwood", lat: 576, lng: 230 },
  { id: "sea-of-flowers", lat: 300, lng: 345 },
  { id: "forest-of-falling-stars", lat: 235, lng: 620 },
  { id: "russet-highlands", lat: 375, lng: 950 },
  { id: "mistwoods", lat: 450, lng: 585 },
  { id: "nimbus-fields", lat: 565, lng: 560 },
  { id: "tideblossom-coast", lat: 175, lng: 1055 },
  { id: "astra", lat: 610, lng: 1030 },
];

const CATEGORIES: { id: "spawn" | "collect" | "combat" | "travel" | "world"; types: string[] }[] = [
  { id: "spawn", types: ["spawn_aniimo", "spawn_weather", "spawn_time"] },
  { id: "collect", types: ["chest", "gathering", "egg"] },
  { id: "combat", types: ["boss"] },
  { id: "travel", types: ["teleporter", "rv_park"] },
  { id: "world", types: ["sanctum", "puzzle", "landmark", "ecological_observation", "branch"] },
];

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
  const { t, locale } = useI18n();
  const typeLabels = t.maps.markerTypeLabels as Record<string, string>;
  const catLabels = t.maps.categories as Record<string, string>;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const LRef = useRef<typeof LType | null>(null);
  const layerRef = useRef<LType.LayerGroup | null>(null);
  const regionLayerRef = useRef<LType.LayerGroup | null>(null);
  const [showRegions, setShowRegions] = useState(true);

  const [ready, setReady] = useState(false);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [visible, setVisible] = useState<Set<string>>(new Set(MARKER_TYPES));
  const [addMode, setAddMode] = useState(false);
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState({ type: "spawn_aniimo", name: "", notes: "" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hideFound, setHideFound] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const addModeRef = useRef(addMode);
  useEffect(() => {
    addModeRef.current = addMode;
  }, [addMode]);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !containerRef.current || mapRef.current) return;
      LRef.current = L;
      const bounds: LType.LatLngBoundsExpression = [
        [0, 0],
        [IMG_H, IMG_W],
      ];
      const map = L.map(containerRef.current, {
        crs: L.CRS.Simple,
        minZoom: -2,
        maxZoom: 2,
        zoomSnap: 0.25,
      });
      map.attributionControl.setPrefix(MAP_ATTR);
      L.imageOverlay(IMG, bounds).addTo(map);
      map.fitBounds(bounds);
      map.setMaxBounds(L.latLngBounds([-120, -240], [IMG_H + 120, IMG_W + 240]));
      regionLayerRef.current = L.layerGroup().addTo(map);
      layerRef.current = L.layerGroup().addTo(map);

      try {
        const saved = JSON.parse(localStorage.getItem(VIEW_KEY) || "null");
        if (saved && typeof saved.lat === "number") map.setView([saved.lat, saved.lng], saved.zoom);
      } catch {
        /* ignore */
      }
      const saveView = () => {
        const c = map.getCenter();
        localStorage.setItem(VIEW_KEY, JSON.stringify({ lat: c.lat, lng: c.lng, zoom: map.getZoom() }));
      };
      map.on("moveend", saveView);
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
  }, []);

  // Re-render markers on data / filter / selection change.
  useEffect(() => {
    const L = LRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !layer) return;
    layer.clearLayers();
    for (const m of markers) {
      if (!visible.has(m.type)) continue;
      if (hideFound && m.found) continue;
      const color = TYPE_COLOR[m.type] ?? "#2f7d54";
      const selected = m.id === selectedId;
      const html = `<span style="position:relative;display:grid;place-items:center;width:26px;height:26px;border-radius:999px;background:${color};color:#fff;font-size:14px;box-shadow:0 1px 4px rgba(0,0,0,.4);border:2px solid ${selected ? "#14231b" : "#fff"};opacity:${m.found ? 0.5 : 1}">${TYPE_EMOJI[m.type] ?? "📍"}${m.found ? '<span style="position:absolute;right:-4px;top:-4px;background:#1b6b3a;color:#fff;border-radius:999px;width:14px;height:14px;font-size:9px;display:grid;place-items:center;border:1px solid #fff">✓</span>' : ""}</span>`;
      const icon = L.divIcon({ className: "", html, iconSize: [26, 26], iconAnchor: [13, 13] });
      const label = typeLabels[m.type] ?? m.type;
      const marker = L.marker([m.lat, m.lng], { icon, opacity: 1 }).addTo(layer);
      marker.bindPopup(
        `<strong>${escapeHtml(m.name || label)}</strong><br/><span style="color:#666">${escapeHtml(label)}</span>${
          m.notes ? `<br/>${escapeHtml(m.notes)}` : ""
        }${m.found ? `<br/><span style="color:#1b6b3a">✓ ${escapeHtml(t.maps.found)}</span>` : ""}`,
      );
      marker.on("click", () => {
        setSelectedId(m.id);
        setEditing(false);
      });
    }
  }, [markers, visible, hideFound, selectedId, ready, typeLabels, t.maps.found]);

  // Render region labels (decorative navigation on the fan map).
  useEffect(() => {
    const L = LRef.current;
    const layer = regionLayerRef.current;
    if (!ready || !L || !layer) return;
    layer.clearLayers();
    if (!showRegions) return;
    for (const pin of REGION_PINS) {
      const region = regions.find((r) => r.id === pin.id);
      if (!region) continue;
      const name = regionDisplayName(region, locale);
      const icon = L.divIcon({
        className: "",
        html: `<span style="white-space:nowrap;padding:2px 8px;border-radius:999px;background:rgba(20,35,27,.62);color:#fff;font-size:11px;font-weight:600;text-shadow:0 1px 2px rgba(0,0,0,.5)">${escapeHtml(name)}</span>`,
        iconSize: [10, 10],
        iconAnchor: [0, 0],
      });
      L.marker([pin.lat, pin.lng], { icon, interactive: true, keyboard: false })
        .addTo(layer)
        .on("click", () => mapRef.current?.setView([pin.lat, pin.lng], 0.5));
    }
  }, [showRegions, ready, locale]);

  const counts = useMemo(() => {
    const byType: Record<string, { total: number; found: number }> = {};
    for (const tp of MARKER_TYPES) byType[tp] = { total: 0, found: 0 };
    for (const m of markers) {
      const c = byType[m.type];
      if (!c) continue;
      c.total += 1;
      if (m.found) c.found += 1;
    }
    const total = markers.length;
    const found = markers.filter((m) => m.found).length;
    return { byType, total, found };
  }, [markers]);

  const selected = markers.find((m) => m.id === selectedId) ?? null;

  const listFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return markers.filter((m) => {
      if (!visible.has(m.type)) return false;
      if (hideFound && m.found) return false;
      if (!q) return true;
      return `${m.name} ${typeLabels[m.type] ?? m.type} ${m.notes ?? ""}`.toLowerCase().includes(q);
    });
  }, [markers, search, visible, hideFound, typeLabels]);

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
      found: false,
    };
    await putMarker(marker);
    setMarkers((prev) => [...prev, marker]);
    setDraft(null);
    setForm({ type: form.type, name: "", notes: "" });
    setAddMode(false);
    setSelectedId(marker.id);
  }, [draft, form]);

  const updateMarker = useCallback(async (updated: MapMarker) => {
    await putMarker(updated);
    setMarkers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }, []);

  const toggleFound = useCallback(
    (m: MapMarker) => updateMarker({ ...m, found: !m.found }),
    [updateMarker],
  );

  const removeMarker = useCallback(
    async (id: string) => {
      await deleteMarker(id);
      setMarkers((prev) => prev.filter((m) => m.id !== id));
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [],
  );

  const panTo = useCallback((m: MapMarker) => {
    mapRef.current?.setView([m.lat, m.lng], Math.max(mapRef.current.getZoom(), 6));
    setSelectedId(m.id);
  }, []);

  const toggleType = useCallback((type: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const toggleCategory = useCallback((types: string[]) => {
    setVisible((prev) => {
      const next = new Set(prev);
      const allOn = types.every((tp) => next.has(tp));
      for (const tp of types) {
        if (allOn) next.delete(tp);
        else next.add(tp);
      }
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
          found: Boolean(m.found),
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
    setSelectedId(null);
  }, [t.maps.clearConfirm]);

  const toggleFullscreen = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const onFs = () => setTimeout(() => mapRef.current?.invalidateSize(), 200);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

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
        <label className="flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1.5 text-sm">
          <input type="checkbox" checked={hideFound} onChange={(e) => setHideFound(e.target.checked)} />
          {t.maps.hideFound}
        </label>
        <select
          className="rounded-full border border-[var(--line)] bg-[var(--paper-2)] px-3 py-1.5 text-sm"
          defaultValue=""
          onChange={(e) => {
            const pin = REGION_PINS.find((r) => r.id === e.target.value);
            if (pin) mapRef.current?.setView([pin.lat, pin.lng], 0.5);
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            {t.maps.jumpToRegion}
          </option>
          {REGION_PINS.map((pin) => {
            const region = regions.find((r) => r.id === pin.id);
            return (
              <option key={pin.id} value={pin.id}>
                {region ? regionDisplayName(region, locale) : pin.id}
              </option>
            );
          })}
        </select>
        <label className="flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1.5 text-sm">
          <input type="checkbox" checked={showRegions} onChange={(e) => setShowRegions(e.target.checked)} />
          {t.maps.showRegionLabels}
        </label>
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
        <button type="button" onClick={toggleFullscreen} className="btn btn-ghost">
          <span aria-hidden>⛶</span> {t.maps.fullscreen}
        </button>
        <span className="ml-auto text-sm text-[var(--muted)]">
          {t.maps.progress}: {counts.found} / {counts.total}
        </span>
      </div>

      <div ref={wrapperRef} className="grid gap-4 bg-[var(--paper)] lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)]" style={{ height: 560 }}>
          <div
            ref={containerRef}
            style={{ height: "100%", width: "100%", cursor: addMode ? "crosshair" : "grab", background: "var(--paper-2)" }}
          />
        </div>

        <aside className="space-y-4 overflow-auto" style={{ maxHeight: 560 }}>
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

          {selected ? (
            <div className="wiki-card p-4">
              <p className="font-display text-sm">{t.maps.details}</p>
              {editing ? (
                <div className="mt-2 space-y-2">
                  <select
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2 text-sm"
                    value={selected.type}
                    onChange={(e) => updateMarker({ ...selected, type: e.target.value })}
                  >
                    {MARKER_TYPES.map((tp) => (
                      <option key={tp} value={tp}>
                        {typeLabels[tp] ?? tp}
                      </option>
                    ))}
                  </select>
                  <input
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2 text-sm"
                    value={selected.name}
                    placeholder={t.maps.markerName}
                    onChange={(e) => updateMarker({ ...selected, name: e.target.value })}
                  />
                  <input
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2 text-sm"
                    value={selected.notes ?? ""}
                    placeholder={t.maps.markerNotes}
                    onChange={(e) => updateMarker({ ...selected, notes: e.target.value || undefined })}
                  />
                  <button type="button" className="btn btn-primary w-full" onClick={() => setEditing(false)}>
                    {t.maps.save}
                  </button>
                </div>
              ) : (
                <>
                  <p className="mt-2 flex items-center gap-2 font-medium">
                    <span aria-hidden>{TYPE_EMOJI[selected.type]}</span>
                    {selected.name || (typeLabels[selected.type] ?? selected.type)}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{typeLabels[selected.type] ?? selected.type}</p>
                  {selected.notes ? <p className="mt-1 text-sm text-[var(--ink-soft)]">{selected.notes}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleFound(selected)}
                      className={`chip ${selected.found ? "chip-confirmed" : "chip-unknown"}`}
                    >
                      {selected.found ? `✓ ${t.maps.found}` : t.maps.markFound}
                    </button>
                    <button type="button" onClick={() => panTo(selected)} className="chip chip-community">
                      {t.maps.panTo}
                    </button>
                    <button type="button" onClick={() => setEditing(true)} className="chip chip-marketing">
                      {t.maps.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMarker(selected.id)}
                      className="chip"
                      style={{ background: "var(--fire)", color: "#fff" }}
                    >
                      {t.maps.delete}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="wiki-card p-4 text-xs leading-6 text-[var(--muted)]">{t.maps.selectMarkerHint}</div>
          )}

          <div className="wiki-card p-4">
            <p className="font-display text-sm">{t.maps.layers}</p>
            <div className="mt-2 space-y-3">
              {CATEGORIES.map((cat) => {
                const catTotal = cat.types.reduce((n, tp) => n + counts.byType[tp].total, 0);
                const catFound = cat.types.reduce((n, tp) => n + counts.byType[tp].found, 0);
                return (
                  <div key={cat.id}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat.types)}
                      className="flex w-full items-center justify-between text-left text-xs font-semibold text-[var(--ink-soft)]"
                    >
                      <span>{catLabels[cat.id]}</span>
                      <span className="text-[var(--muted)]">
                        {catFound}/{catTotal}
                      </span>
                    </button>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {cat.types.map((tp) => (
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
                          {TYPE_EMOJI[tp]} {typeLabels[tp] ?? tp} ({counts.byType[tp].total})
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="wiki-card p-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm">{t.maps.myMarkers}</p>
              <span className="text-xs text-[var(--muted)]">{listFiltered.length}</span>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.maps.searchMarkers}
              className="mt-2 w-full rounded-full border border-[var(--line)] bg-[var(--paper-2)] px-3 py-1.5 text-sm"
            />
            {listFiltered.length === 0 ? (
              <p className="mt-2 text-xs leading-6 text-[var(--muted)]">{t.maps.noMarkers}</p>
            ) : (
              <ul className="mt-2 max-h-56 space-y-1 overflow-auto">
                {listFiltered.map((m) => (
                  <li
                    key={m.id}
                    className={`flex items-center justify-between gap-2 rounded-lg px-1.5 py-1.5 text-sm ${
                      m.id === selectedId ? "bg-[var(--moss-soft)]" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => panTo(m)}
                      className={`min-w-0 flex-1 truncate text-left ${m.found ? "text-[var(--muted)] line-through" : ""}`}
                    >
                      <span aria-hidden>{TYPE_EMOJI[m.type]}</span> {m.name || (typeLabels[m.type] ?? m.type)}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFound(m)}
                      title={t.maps.markFound}
                      className={`text-xs ${m.found ? "text-[var(--moss)]" : "text-[var(--muted)]"}`}
                    >
                      ✓
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
