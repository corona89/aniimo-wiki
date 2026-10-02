"use client";

import * as d3 from "d3";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import type { GraphSnapshot, GraphSnapshotNode } from "@/lib/knowledge/retrieve";

/** Mutable simulation node — only ever touched inside the d3 effect, never during render. */
type SimNode = GraphSnapshotNode &
  d3.SimulationNodeDatum & {
    degree: number;
    r: number;
    visible: boolean;
    labelOn: boolean;
    ax?: number;
    ay?: number;
  };

type Link = { source: SimNode | string; target: SimNode | string; type: string };

const TYPE_COLOR: Record<string, string> = {
  Creature: "#34d399",
  Element: "#fbbf24",
  Region: "#38bdf8",
  Continent: "#fb923c",
  Game: "#f472b6",
  Item: "#2dd4bf",
  EggType: "#f0abfc",
  Weapon: "#f87171",
  CommunityPost: "#a78bfa",
  Source: "#71717f",
};

const EDGE_COLOR: Record<string, string> = {
  HAS_ELEMENT: "#fbbf24",
  PART_OF: "#38bdf8",
  FOUND_IN: "#34d399",
  CITES: "#3a3a45",
  MENTIONS: "#a78bfa",
  USES_ITEM: "#2dd4bf",
};

const EDGE_WIDTH: Record<string, number> = { CITES: 0.5, MENTIONS: 0.8 };
const DEFAULT_EDGE_WIDTH = 1.4;
const CORE_EDGE_DISTANCE = 55;
const CITES_EDGE_DISTANCE = 90;
const LABELLED = new Set(["Element", "Continent", "Game", "Region", "Creature", "Item", "EggType"]);
/** Source nodes stay hidden until toggled on — CITES edges are pure citation noise. */
const DEFAULT_OFF = new Set(["Source"]);
const NODE_TYPES = [
  "Creature",
  "Element",
  "Region",
  "Continent",
  "Game",
  "Item",
  "EggType",
  "Weapon",
  "CommunityPost",
  "Source",
] as const;

function nodeRadius(type: string, degree: number): number {
  if (type === "CommunityPost") return 4;
  if (type === "Source") return 3.5;
  const base = type === "Element" || type === "Continent" || type === "Game" ? 8 : 5;
  return base + Math.sqrt(degree) * 1.7;
}

/** Depth-2 category key — the owner taxonomy groups nodes at game.<x> / meta. */
function categoryAnchorKey(category: string): string {
  return category.split(".").slice(0, 2).join(".");
}

/** Sector key: like categoryAnchorKey but all meta plumbing shares one sector. */
function sectorKey(category: string): string {
  return category.startsWith("meta") ? "meta" : categoryAnchorKey(category);
}

function nameOf(n: GraphSnapshotNode, locale: "ko" | "en"): string {
  return (locale === "en" ? n.name.en ?? n.name.ko : n.name.ko ?? n.name.en) ?? n.id;
}

export function GraphViewer({ graph }: { graph: GraphSnapshot }) {
  const { t, locale } = useI18n();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [labelsOn, setLabelsOn] = useState(true);
  const [frozen, setFrozen] = useState(false);
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(
    () => new Set(NODE_TYPES.filter((type) => !DEFAULT_OFF.has(type))),
  );
  const [visibleCategories, setVisibleCategories] = useState<Set<string> | null>(null); // null = all on
  const [query, setQuery] = useState("");

  // --- pure render-side data (never mutated) ---
  const degreeMap = useMemo(() => {
    const degree = new Map<string, number>();
    for (const e of graph.edges) {
      degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
      degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
    }
    return degree;
  }, [graph]);

  const byId = useMemo(
    () =>
      new Map(
        graph.nodes.map((n) => [
          n.id,
          { node: n, degree: degreeMap.get(n.id) ?? 0 },
        ]),
      ),
    [graph, degreeMap],
  );

  const adjacency = useMemo(() => {
    const adj: Record<string, string[]> = {};
    for (const e of graph.edges) {
      (adj[e.from] = adj[e.from] ?? []).push(e.to);
      (adj[e.to] = adj[e.to] ?? []).push(e.from);
    }
    return adj;
  }, [graph]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const n of graph.nodes) c[n.type] = (c[n.type] ?? 0) + 1;
    return c;
  }, [graph]);

  const stats = useMemo(() => {
    const vis = new Set(
      graph.nodes.filter(
        (n) =>
          visibleTypes.has(n.type) &&
          (visibleCategories === null || visibleCategories.has(sectorKey(n.category))),
      ).map((n) => n.id),
    );
    const edges = graph.edges.filter((e) => vis.has(e.from) && vis.has(e.to)).length;
    return { nodes: vis.size, edges };
  }, [graph, visibleTypes, visibleCategories]);

  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const n of graph.nodes) {
      const key = sectorKey(n.category);
      c[key] = (c[key] ?? 0) + 1;
    }
    return c;
  }, [graph]);

  const categoryLabel = useCallback(
    (key: string): string => {
      const map: Record<string, string> = {
        "game.region": t.graph.typeRegion,
        "game.creature": t.graph.typeCreature,
        "game.quest": t.graph.catQuest,
        "game.event": t.graph.catEvent,
        "game.story": t.graph.catStory,
        "game.party": t.graph.catParty,
        "game.element": t.graph.typeElement,
        "game.item": t.graph.typeItem,
        "game.weapon": t.graph.typeWeapon,
        "game.egg": t.graph.typeEgg,
        meta: t.graph.catMeta,
      };
      return map[key] ?? key;
    },
    [t],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as GraphSnapshotNode[];
    return graph.nodes
      .filter(
        (n) =>
          n.name.ko?.toLowerCase().includes(q) ||
          n.name.en?.toLowerCase().includes(q) ||
          n.id.toLowerCase().includes(q),
      )
      .slice(0, 9);
  }, [query, graph]);

  const selected = selectedId ? byId.get(selectedId) : undefined;

  const typeLabel = (type: string): string => {
    const map: Record<string, string> = {
      Creature: t.graph.typeCreature,
      Element: t.graph.typeElement,
      Region: t.graph.typeRegion,
      Continent: t.graph.typeContinent,
      Game: t.graph.typeGame,
      Item: t.graph.typeItem,
      EggType: t.graph.typeEgg,
      Weapon: t.graph.typeWeapon,
      CommunityPost: t.graph.typeCommunityPost,
      Source: t.graph.typeSource,
    };
    return map[type] ?? type;
  };

  // --- d3 handle bag + latest-state ref (written only inside effects/handlers) ---
  type Bag = {
    sim: d3.Simulation<SimNode, undefined>;
    nodeSel: d3.Selection<SVGCircleElement, SimNode, SVGGElement, unknown>;
    labelSel: d3.Selection<SVGTextElement, SimNode, SVGGElement, unknown>;
    edgeSel: d3.Selection<SVGLineElement, Link, SVGGElement, unknown>;
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
    simNodes: SimNode[];
    width: number;
    height: number;
  };
  const bagRef = useRef<Bag | null>(null);
  const stateRef = useRef({ labelsOn, frozen, selectedId, locale });
  useEffect(() => {
    stateRef.current = { labelsOn, frozen, selectedId, locale };
  });
  /** Last known node positions — lets rebuilds (filter toggles) keep the layout. */
  const posRef = useRef(new Map<string, { x: number; y: number }>());

  const applyVisibility = useCallback((bag: Bag) => {
    const { labelsOn: lo } = stateRef.current;
    bag.nodeSel.attr("display", (d) => (d.visible ? null : "none"));
    bag.labelSel.attr("display", (d) => (d.visible && lo && d.labelOn ? null : "none"));
    bag.edgeSel.attr("display", (d) => {
      const s = d.source as SimNode;
      const tgt = d.target as SimNode;
      return s.visible && tgt.visible ? null : "none";
    });
  }, []);

  const applySelectionRing = useCallback((bag: Bag) => {
    const selId = stateRef.current.selectedId;
    bag.nodeSel
      .attr("stroke", (n) =>
        selId && selId === n.id ? "#ffffff" : n.confidence === "confirmed" ? "#f4f4f8" : TYPE_COLOR[n.type] ?? "#71717f",
      )
      .attr("stroke-width", (n) => (selId && selId === n.id ? 2.6 : n.confidence === "confirmed" ? 1.2 : 0.8))
      .attr("stroke-dasharray", (n) => {
        if (selId && selId === n.id) return null;
        if (n.confidence === "community") return "2 2";
        if (n.confidence === "marketing") return "4 2";
        return null;
      });
  }, []);

  // --- canvas build/teardown ---
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || graph.nodes.length === 0) return;
    const rect = wrap.getBoundingClientRect();
    const width = Math.max(rect.width, 320);
    const height = Math.max(rect.height, 360);

    // Category sectors: the owner taxonomy IS the visual structure — one ring
    // sector per depth-2 category (지역·애니모·퀘스트·…), labeled on canvas.
    // Creatures (auto depth-3 game.creature.<element>) get sub-anchors inside
    // the 애니모 sector so element families stay readable.
    const SECTOR_R = 620;
    const SUB_R = 170;
    const sectors = [...new Set(graph.nodes.map((n) => sectorKey(n.category)))];
    const anchors: Record<string, { x: number; y: number }> = {};
    const ringSectors = sectors.filter((s) => s !== "game"); // the game root sits at the center
    ringSectors.forEach((sector, i) => {
      const angle = (i / Math.max(ringSectors.length, 1)) * Math.PI * 2;
      anchors[sector] = { x: Math.cos(angle) * SECTOR_R, y: Math.sin(angle) * SECTOR_R };
    });
    if (sectors.includes("game")) anchors.game = { x: 0, y: 0 };
    const creatureChildren = [
      ...new Set(
        graph.nodes
          .filter((n) => n.type === "Creature" && n.category.split(".").length >= 3)
          .map((n) => n.category),
      ),
    ];
    const parent = anchors["game.creature"] ?? { x: 0, y: -SECTOR_R };
    creatureChildren.forEach((cat, i) => {
      const angle = (i / Math.max(creatureChildren.length, 1)) * Math.PI * 2;
      anchors[cat] = { x: parent.x + Math.cos(angle) * SUB_R, y: parent.y + Math.sin(angle) * SUB_R };
    });

    // Anchor per node: creatures use their depth-3 category, everything else
    // its sector. Posts pull hardest, creatures softly (edges dominate).
    const anchorOf = (n: GraphSnapshotNode): { x: number; y: number } | undefined =>
      n.type === "Creature" && anchors[n.category] ? anchors[n.category] : anchors[sectorKey(n.category)];
    const anchorStrength = (n: GraphSnapshotNode): number =>
      n.type === "CommunityPost" ? 0.012 : n.type === "Creature" ? 0.005 : 0.004;

    const simNodes: SimNode[] = graph.nodes.map((n, i) => {
      const anchor = anchorOf(n);
      const deg = degreeMap.get(n.id) ?? 0;
      const ang = (i % 97) * 2.399963;
      const rad = anchor ? 0 : Math.sqrt(i + 0.5) * 22;
      const prev = posRef.current.get(n.id);
      return {
        ...n,
        degree: deg,
        r: nodeRadius(n.type, deg),
        visible:
          visibleTypes.has(n.type) &&
          (visibleCategories === null || visibleCategories.has(sectorKey(n.category))),
        labelOn: LABELLED.has(n.type),
        ax: anchor?.x,
        ay: anchor?.y,
        x: prev?.x ?? (anchor ? anchor.x : Math.cos(ang) * rad) + width / 2,
        y: prev?.y ?? (anchor ? anchor.y : Math.sin(ang) * rad) + height / 2,
      };
    });
    const simLinks: Link[] = graph.edges.map((e) => ({ source: e.from, target: e.to, type: e.type }));

    // Pull every node toward its category sector anchor.
    const clusterForce: d3.Force<SimNode, undefined> = () => {
      for (const n of simNodes) {
        if (n.ax == null || n.ay == null) continue;
        const k = anchorStrength(n);
        n.vx = (n.vx ?? 0) + (n.ax - (n.x ?? 0) + width / 2) * k;
        n.vy = (n.vy ?? 0) + (n.ay - (n.y ?? 0) + height / 2) * k;
      }
    };
    const sim = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, Link>(simLinks)
          .id((d) => d.id)
          .distance((l) => (l.type === "CITES" ? CITES_EDGE_DISTANCE : CORE_EDGE_DISTANCE))
          .strength((l) => (l.type === "CITES" ? 0.08 : 0.45)),
      )
      .force("charge", d3.forceManyBody<SimNode>().strength((d) => (d.type === "CommunityPost" ? -18 : -120)))
      .force("center", d3.forceCenter<SimNode>(width / 2, height / 2).strength(0.05))
      .force("collide", d3.forceCollide<SimNode>().radius((d) => d.r + 3))
      .force("cluster", clusterForce)
      .alphaDecay(0.022);

    const svg = d3
      .select(wrap)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "width:100%;height:100%;display:block;cursor:grab") as unknown as d3.Selection<
      SVGSVGElement,
      unknown,
      null,
      undefined
    >;
    const gRoot = svg.append("g");
    // Category sector labels sit behind everything — the taxonomy is the map.
    const gCatLabels = gRoot.append("g");
    for (const [key, a] of Object.entries(anchors)) {
      if (key === "game") continue; // root node at center, no label needed
      if (key.split(".").length >= 3) continue; // depth-3 sub-anchors stay unlabeled
      if (categoryCounts[key] == null) continue;
      gCatLabels
        .append("text")
        .attr("x", a.x + width / 2)
        .attr("y", a.y + height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "rgba(232,232,238,0.12)")
        .attr("font-size", 26)
        .attr("font-weight", 700)
        .attr("style", "pointer-events:none;user-select:none")
        .text(categoryLabel(key));
    }
    const gEdges = gRoot.append("g");
    const gNodes = gRoot.append("g");
    const gLabels = gRoot.append("g");

    const edgeSel = gEdges
      .selectAll<SVGLineElement, Link>("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", (d) => EDGE_COLOR[d.type] ?? EDGE_COLOR.CITES)
      .attr("stroke-width", (d) => EDGE_WIDTH[d.type] ?? DEFAULT_EDGE_WIDTH)
      .attr("stroke-opacity", 0.5);

    const nodeSel = gNodes
      .selectAll<SVGCircleElement, SimNode>("circle")
      .data(simNodes)
      .join("circle")
      .attr("r", (d) => d.r)
      .attr("fill", (d) => TYPE_COLOR[d.type] ?? "#71717f")
      .attr("stroke-width", 1.2)
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGCircleElement, SimNode>()
          .on("start", (event, d) => {
            if (!event.active) sim.alphaTarget(0.25).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    const labelSel = gLabels
      .selectAll<SVGTextElement, SimNode>("text")
      .data(simNodes)
      .join("text")
      .attr("fill", "#c9c9d4")
      .attr("font-size", 10.5)
      .attr("paint-order", "stroke")
      .attr("stroke", "#101014")
      .attr("stroke-width", 3)
      .attr("stroke-linejoin", "round")
      .attr("style", "pointer-events:none;user-select:none")
      .text((d) => nameOf(d, locale));

    let kCur = 1;
    const updateLabelOpacity = () => {
      const { labelsOn: lo } = stateRef.current;
      labelSel.attr("opacity", (d) => {
        if (!d.visible || !lo || !d.labelOn) return 0;
        if (d.type === "Creature" && kCur < 0.75) return 0;
        return 0.92;
      });
    };

    const setFocus = (d: SimNode | null) => {
      if (!d) {
        nodeSel.attr("opacity", 1);
        edgeSel.attr("stroke-opacity", 0.5);
        updateLabelOpacity();
        return;
      }
      const near = new Set<string>([d.id, ...(adjacency[d.id] ?? [])]);
      nodeSel.attr("opacity", (n) => (n.visible ? (near.has(n.id) ? 1 : 0.12) : 0));
      labelSel.attr("opacity", (n) => (n.visible && near.has(n.id) ? 1 : 0));
      edgeSel.attr("stroke-opacity", (l) => {
        const s = l.source as SimNode;
        const tgt = l.target as SimNode;
        return s.visible && tgt.visible && (s.id === d.id || tgt.id === d.id) ? 0.9 : 0.04;
      });
    };

    nodeSel
      .on("mouseenter", (_event, d) => setFocus(d))
      .on("mouseleave", () => setFocus(null))
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedId(d.id);
      });

    sim.on("tick", () => {
      edgeSel
        .attr("x1", (l) => (l.source as SimNode).x ?? 0)
        .attr("y1", (l) => (l.source as SimNode).y ?? 0)
        .attr("x2", (l) => (l.target as SimNode).x ?? 0)
        .attr("y2", (l) => (l.target as SimNode).y ?? 0);
      nodeSel.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
      labelSel.attr("x", (d) => (d.x ?? 0) + d.r + 4).attr("y", (d) => (d.y ?? 0) + 3.5);
    });

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 8])
      .on("zoom", (event) => {
        gRoot.attr("transform", event.transform.toString());
        kCur = event.transform.k;
        updateLabelOpacity();
      });
    svg.call(zoom);

    const onResize = () => {
      const r = wrap.getBoundingClientRect();
      const w = Math.max(r.width, 320);
      const h = Math.max(r.height, 360);
      svg.attr("viewBox", `0 0 ${w} ${h}`);
      sim.force("center", d3.forceCenter<SimNode>(w / 2, h / 2).strength(0.05));
      if (bagRef.current) {
        bagRef.current.width = w;
        bagRef.current.height = h;
      }
    };
    window.addEventListener("resize", onResize);

    const pos = posRef.current;
    const stateAtBuild = stateRef.current;
    bagRef.current = { sim, nodeSel, labelSel, edgeSel, svg, zoom, simNodes, width, height };
    applyVisibility(bagRef.current);
    applySelectionRing(bagRef.current);
    updateLabelOpacity();
    if (stateAtBuild.frozen) sim.stop();

    return () => {
      window.removeEventListener("resize", onResize);
      for (const n of simNodes) pos.set(n.id, { x: n.x ?? 0, y: n.y ?? 0 });
      sim.stop();
      svg.remove();
      bagRef.current = null;
    };
    // graph/locale identity drives rebuilds; adjacency is derived from graph.
  }, [graph, locale, degreeMap, adjacency, visibleTypes, visibleCategories, categoryCounts, categoryLabel, applySelectionRing, applyVisibility]);

  useEffect(() => {
    const bag = bagRef.current;
    if (bag) applySelectionRing(bag);
  }, [selectedId, applySelectionRing]);

  useEffect(() => {
    const bag = bagRef.current;
    if (!bag) return;
    if (frozen) bag.sim.stop();
    else bag.sim.alpha(0.3).restart();
  }, [frozen]);

  useEffect(() => {
    const bag = bagRef.current;
    if (bag) applyVisibility(bag);
  }, [labelsOn, applyVisibility]);

  const jump = useCallback(
    (id: string) => {
      const bag = bagRef.current;
      if (!bag) return;
      const node = graph.nodes.find((n) => n.id === id);
      if (!node) return;
      if (!visibleTypes.has(node.type)) {
        setVisibleTypes((prev) => new Set(prev).add(node.type));
      }
      const sector = sectorKey(node.category);
      if (visibleCategories !== null && !visibleCategories.has(sector)) {
        setVisibleCategories((prev) => new Set(prev ?? [sector]).add(sector));
      }
      const sim = bag.simNodes.find((n) => n.id === id);
      const x = sim?.x ?? bag.width / 2;
      const y = sim?.y ?? bag.height / 2;
      const transform = d3.zoomIdentity.translate(bag.width / 2, bag.height / 2).scale(1.6).translate(-x, -y);
      bag.svg.transition().duration(600).call(bag.zoom.transform, transform);
      setSelectedId(id);
      setQuery("");
    },
    [graph, visibleTypes, visibleCategories],
  );

  const toggleType = (type: string) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const toggleCategory = (key: string) => {
    setVisibleCategories((prev) => {
      const base = prev ?? new Set(Object.keys(categoryCounts));
      const next = new Set(base);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const resetView = useCallback(() => {
    const bag = bagRef.current;
    if (bag) bag.svg.transition().duration(600).call(bag.zoom.transform, d3.zoomIdentity);
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (event.key === "r" || event.key === "R") resetView();
      if (event.key === "l" || event.key === "L") setLabelsOn((v) => !v);
      if (event.key === " ") {
        event.preventDefault();
        setFrozen((v) => !v);
      }
      if (event.key === "Escape") setSelectedId(null);
    },
    [resetView],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  if (graph.nodes.length === 0) {
    return (
      <p className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 text-sm text-[var(--ink-soft)]">
        {t.graph.empty}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium tabular-nums text-[var(--ink-soft)]">
          {t.graph.nodes} {stats.nodes.toLocaleString()} · {t.graph.edges} {stats.edges.toLocaleString()}{" "}
          <span className="text-[var(--muted)]">
            ({t.graph.total} {graph.nodes.length.toLocaleString()} / {graph.edges.length.toLocaleString()})
          </span>
        </span>
        <div className="relative ml-auto w-56">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.graph.searchPlaceholder}
            aria-label={t.graph.searchPlaceholder}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-1.5 text-sm outline-none focus:border-[var(--moss)]"
          />
          {matches.length > 0 && (
            <div className="absolute top-full right-0 z-20 mt-1 w-full overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--card)] shadow-lg">
              {matches.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => jump(m.id)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--moss-soft)]"
                >
                  <span className="truncate">{nameOf(m, locale)}</span>
                  <span className="shrink-0 text-xs text-[var(--muted)]">{typeLabel(m.type)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setLabelsOn((v) => !v)}
          className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-sm text-[var(--ink-soft)] hover:bg-[var(--moss-soft)]"
        >
          {t.graph.labels}
        </button>
        <button
          type="button"
          onClick={() => setFrozen((v) => !v)}
          className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-sm text-[var(--ink-soft)] hover:bg-[var(--moss-soft)]"
        >
          {frozen ? t.graph.resume : t.graph.freeze}
        </button>
        <button
          type="button"
          onClick={resetView}
          className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-sm text-[var(--ink-soft)] hover:bg-[var(--moss-soft)]"
        >
          {t.graph.reset}
        </button>
      </div>

      {/* type filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {NODE_TYPES.filter((type) => counts[type]).map((type) => {
          const on = visibleTypes.has(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              aria-pressed={on}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                on
                  ? "border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
                  : "border-[var(--line)] bg-transparent text-[var(--muted)] opacity-60"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: on ? TYPE_COLOR[type] : "var(--muted)" }}
              />
              {typeLabel(type)}
              <span className="tabular-nums text-[var(--muted)]">{counts[type]}</span>
            </button>
          );
        })}
      </div>

      {/* category filter chips — the owner taxonomy (game.<x> sectors) */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold text-[var(--muted)]">{t.graph.categoryFilter}</span>
        {Object.keys(categoryCounts)
          .filter((key) => key !== "game")
          .sort((a, b) => categoryCounts[b] - categoryCounts[a])
          .map((key) => {
            const on = visibleCategories === null || visibleCategories.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleCategory(key)}
                aria-pressed={on}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                  on
                    ? "border-[var(--moss)] bg-[var(--moss-soft)] text-[var(--moss-deep)]"
                    : "border-[var(--line)] bg-transparent text-[var(--muted)] opacity-60"
                }`}
              >
                {categoryLabel(key)}
                <span className="tabular-nums text-[var(--muted)]">{categoryCounts[key]}</span>
              </button>
            );
          })}
      </div>

      {/* canvas + side panel */}
      <div className="relative flex gap-3">
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-[var(--line)] bg-[#101014]">
          <p className="pointer-events-none absolute top-3 left-3 z-10 text-xs text-[#5d5d6a]">{t.graph.hint}</p>
          <div ref={wrapRef} className="h-[min(72vh,720px)] min-h-[420px] w-full" role="img" aria-label={t.graph.title} />
          <div className="pointer-events-none absolute bottom-3 left-3 z-10 space-y-0.5 rounded-xl border border-[#2a2a33] bg-[#17171dd9] px-3 py-2 text-[11px] leading-relaxed text-[#9b9ba7]">
            <div>
              <span
                className="mr-1.5 inline-block h-[3px] w-3.5 rounded align-middle"
                style={{ background: EDGE_COLOR.HAS_ELEMENT }}
              />
              {t.graph.edgeHasElement}
            </div>
            <div>
              <span
                className="mr-1.5 inline-block h-[3px] w-3.5 rounded align-middle"
                style={{ background: EDGE_COLOR.PART_OF }}
              />
              {t.graph.edgePartOf}
            </div>
            <div>
              <span
                className="mr-1.5 inline-block h-[3px] w-3.5 rounded align-middle"
                style={{ background: EDGE_COLOR.FOUND_IN }}
              />
              {t.graph.edgeFoundIn}
            </div>
            <div>
              <span
                className="mr-1.5 inline-block h-[3px] w-3.5 rounded align-middle"
                style={{ background: EDGE_COLOR.CITES }}
              />
              {t.graph.edgeCites}
            </div>
            <div>
              <span
                className="mr-1.5 inline-block h-[3px] w-3.5 rounded align-middle"
                style={{ background: EDGE_COLOR.MENTIONS }}
              />
              {t.graph.edgeMentions}
            </div>
            <div>
              <span
                className="mr-1.5 inline-block h-[3px] w-3.5 rounded align-middle"
                style={{ background: EDGE_COLOR.USES_ITEM }}
              />
              {t.graph.edgeUsesItem}
            </div>
          </div>
        </div>

        {selected && (
          <aside className="hidden w-72 shrink-0 self-start rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 lg:block">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-bold leading-snug">
                {nameOf(selected.node, locale)}
                {selected.node.name.ko && selected.node.name.en && selected.node.name.ko !== selected.node.name.en && (
                  <span className="block text-xs font-normal text-[var(--muted)]">{selected.node.name.en}</span>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-lg border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--ink)]"
              >
                {t.graph.close}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2 py-0.5 text-xs"
                style={{ color: TYPE_COLOR[selected.node.type] ?? "var(--muted)" }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: TYPE_COLOR[selected.node.type] }} />
                {typeLabel(selected.node.type)}
              </span>
              <ConfidenceChip value={selected.node.confidence} compact />
              {selected.node.category && (
                <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--muted)]">
                  {selected.node.category}
                </span>
              )}
              <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--muted)]">
                {t.graph.connections} {selected.degree}
              </span>
            </div>

            {selected.node.type === "CommunityPost" && typeof selected.node.props.excerpt === "string" && (
              <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
                {selected.node.props.excerpt.slice(0, 400)}
              </p>
            )}

            {selected.node.type === "CommunityPost" && (
              <dl className="mt-3 space-y-1 text-xs">
                {typeof selected.node.props.url === "string" && selected.node.props.url && (
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 text-[var(--muted)]">{t.graph.url}</dt>
                    <dd className="min-w-0 break-all">
                      <a
                        href={selected.node.props.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--moss-deep)] underline"
                      >
                        {selected.node.props.url.slice(0, 70)}
                      </a>
                    </dd>
                  </div>
                )}
                {typeof selected.node.props.postedAt === "string" && (
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 text-[var(--muted)]">{t.graph.postedAt}</dt>
                    <dd>{selected.node.props.postedAt}</dd>
                  </div>
                )}
                {typeof selected.node.props.ingestedAt === "string" && (
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 text-[var(--muted)]">{t.graph.ingestedAt}</dt>
                    <dd>{selected.node.props.ingestedAt}</dd>
                  </div>
                )}
                {selected.node.props.jevConfidence != null && (
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 text-[var(--muted)]">{t.graph.jevConfidence}</dt>
                    <dd>{String(selected.node.props.jevConfidence)}</dd>
                  </div>
                )}
              </dl>
            )}

            {selected.node.type !== "CommunityPost" && (
              <dl className="mt-3 space-y-1 text-xs">
                {Object.entries(selected.node.props)
                  .filter(
                    ([key, value]) =>
                      key !== "excerpt" &&
                      key !== "url" &&
                      value != null &&
                      value !== "" &&
                      !(Array.isArray(value) && value.length === 0),
                  )
                  .slice(0, 14)
                  .map(([key, value]) => (
                    <div key={key} className="flex gap-2 border-b border-[var(--line)] pb-1">
                      <dt className="w-20 shrink-0 truncate text-[var(--muted)]">{key}</dt>
                      <dd className="min-w-0 break-words">
                        {typeof value === "object" ? JSON.stringify(value).slice(0, 120) : String(value).slice(0, 120)}
                      </dd>
                    </div>
                  ))}
              </dl>
            )}

            {selected.node.sources.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold text-[var(--muted)]">
                  {t.graph.citedSources} {selected.node.sources.length}
                </h4>
                <ul className="mt-1 space-y-1 text-xs">
                  {selected.node.sources.slice(0, 6).map((sid) => {
                    const src = byId.get(sid);
                    if (!src) return null;
                    const url = typeof src.node.props.url === "string" ? src.node.props.url : null;
                    return (
                      <li key={sid} className="truncate">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--moss-deep)] underline"
                          >
                            {src.node.name.en ?? src.node.name.ko ?? sid}
                          </a>
                        ) : (
                          (src.node.name.en ?? src.node.name.ko ?? sid)
                        )}
                      </li>
                    );
                  })}
                </ul>
                {selected.node.sources.length > 6 && (
                  <p className="mt-1 text-xs text-[var(--muted)]">… +{selected.node.sources.length - 6}</p>
                )}
              </div>
            )}

            {(adjacency[selected.node.id] ?? []).length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold text-[var(--muted)]">{t.graph.connections}</h4>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(adjacency[selected.node.id] ?? [])
                    .slice(0, 12)
                    .map((nid) => byId.get(nid))
                    .filter((n): n is { node: GraphSnapshotNode; degree: number } => Boolean(n))
                    .map((n) => (
                      <button
                        key={n.node.id}
                        type="button"
                        onClick={() => jump(n.node.id)}
                        className="max-w-full truncate rounded-full border border-[var(--line)] px-2 py-0.5 text-xs hover:bg-[var(--moss-soft)]"
                      >
                        {nameOf(n.node, locale)}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
