/**
 * RoadmapPage — Interactive dependency-graph roadmap viewer.
 *
 * Select a roadmap (DSA, Python, Web Dev) → see an NeetCode-style
 * dependency tree. Click any node to cycle: not-started → in-progress → completed.
 * Progress is stored in localStorage per roadmap type.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '@api/axiosInstance';

// ── Layout constants ─────────────────────────────────────────────────────────
const LEVEL_HEIGHT = 140; // vertical gap between rows (px)
const NODE_W       = 168; // node box width  (px)
const NODE_H       = 60;  // node box height (px)
const ARROW_HEAD   = 8;   // arrowhead size  (px)

// ── Status colour map ────────────────────────────────────────────────────────
const STATUS = {
  not_started: {
    box:  'border-slate-600 bg-slate-800/70',
    text: 'text-slate-300',
    edge: '#475569',
    dot:  null,
  },
  in_progress: {
    box:  'border-amber-500 bg-amber-500/15',
    text: 'text-amber-300',
    edge: '#F59E0B',
    dot:  'bg-amber-400',
  },
  completed: {
    box:  'border-emerald-500 bg-emerald-500/15',
    text: 'text-emerald-300',
    edge: '#10B981',
    dot:  'bg-emerald-400',
  },
};

const CYCLE = { not_started: 'in_progress', in_progress: 'completed', completed: 'not_started' };

// ── Roadmap selector options ─────────────────────────────────────────────────
const ROADMAP_OPTIONS = [
  { value: 'dsa',    label: 'DSA / CS'      },
  { value: 'python', label: 'Python'         },
  { value: 'webdev', label: 'Full Stack Web' },
];

// ── Layout: position each node in 2-D space ──────────────────────────────────
function layoutNodes(nodes, containerWidth) {
  const byLevel = {};
  let maxLevel = 0;
  for (const n of nodes) {
    (byLevel[n.level] = byLevel[n.level] || []).push(n);
    if (n.level > maxLevel) maxLevel = n.level;
  }

  const positions = {};
  for (let lvl = 0; lvl <= maxLevel; lvl++) {
    const row = (byLevel[lvl] || []).slice().sort((a, b) => a.order - b.order);
    const count = row.length;
    const step  = containerWidth / (count + 1);
    row.forEach((node, i) => {
      positions[node.id] = {
        cx: step * (i + 1),
        cy: lvl * LEVEL_HEIGHT + LEVEL_HEIGHT / 2 + NODE_H / 2,
      };
    });
  }
  return { positions, maxLevel };
}

// ── SVG arrow ────────────────────────────────────────────────────────────────
function Arrow({ x1, y1, x2, y2, color }) {
  const midY = (y1 + y2) / 2;
  const d    = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  const ang  = Math.atan2(y2 - midY, x2 - x2); // vertical at tip → 90°
  // Fixed arrowhead for vertical end segment
  const ax1  = x2 - ARROW_HEAD * 0.6;
  const ax2  = x2 + ARROW_HEAD * 0.6;
  const ay   = y2 - ARROW_HEAD;

  return (
    <g>
      <path d={d} stroke={color} strokeWidth={1.6} fill="none" opacity={0.55} />
      <polygon
        points={`${x2},${y2} ${ax1},${ay} ${ax2},${ay}`}
        fill={color}
        opacity={0.65}
      />
    </g>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 w-16 shrink-0">{value}/{max} done</span>
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden min-w-[120px]">
        <div
          className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RoadmapPage() {
  const [type,       setType]       = useState('dsa');
  const [roadmap,    setRoadmap]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [nodeStatus, setNodeStatus] = useState({});    // id → not_started | in_progress | completed
  const [tooltip,    setTooltip]    = useState(null);  // { node, x, y }

  const containerRef                = useRef(null);
  const [containerW, setContainerW] = useState(900);

  // Observe container width for responsive layout
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w > 0) setContainerW(w);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Fetch roadmap data
  useEffect(() => {
    setLoading(true);
    setError(null);
    setRoadmap(null);
    axiosInstance
      .get(`/problems/roadmaps/?type=${type}`)
      .then(res => {
        const data = res.data?.data || res.data;
        setRoadmap(data);
        const saved = JSON.parse(localStorage.getItem(`brosync_roadmap_${type}`) || '{}');
        setNodeStatus(saved);
      })
      .catch(() => setError('Could not load roadmap — make sure the backend server is running.'))
      .finally(() => setLoading(false));
  }, [type]);

  // Click node → cycle status & persist
  const cycleNode = useCallback((nodeId) => {
    setNodeStatus(prev => {
      const cur     = prev[nodeId] || 'not_started';
      const next    = CYCLE[cur];
      const updated = { ...prev, [nodeId]: next };
      localStorage.setItem(`brosync_roadmap_${type}`, JSON.stringify(updated));
      return updated;
    });
  }, [type]);

  // ── Computed layout ────────────────────────────────────────────────────────
  const nodes    = roadmap?.nodes ?? [];
  const { positions, maxLevel } = nodes.length
    ? layoutNodes(nodes, containerW)
    : { positions: {}, maxLevel: 0 };

  const svgHeight = (maxLevel + 1) * LEVEL_HEIGHT + NODE_H + 20;

  const edges = nodes.flatMap(node => {
    const from = positions[node.id];
    if (!from) return [];
    return (node.children || []).flatMap(childId => {
      const to = positions[childId];
      if (!to) return [];
      const childSt = nodeStatus[childId] || 'not_started';
      return [{
        x1: from.cx,
        y1: from.cy + NODE_H / 2,
        x2: to.cx,
        y2: to.cy - NODE_H / 2,
        color: STATUS[childSt]?.edge ?? '#475569',
      }];
    });
  });

  const completedCount  = nodes.filter(n => (nodeStatus[n.id] || 'not_started') === 'completed').length;
  const inProgressCount = nodes.filter(n => (nodeStatus[n.id] || 'not_started') === 'in_progress').length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-0.5">Learning Roadmaps</h1>
          <p className="text-slate-400 text-sm">
            Visual dependency graphs — click any node to track your progress.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* ── Controls row ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Roadmap selector tabs */}
          <div className="flex bg-slate-800 rounded-xl border border-slate-700 overflow-hidden p-1 gap-1">
            {ROADMAP_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-150 ${
                  type === opt.value
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Progress summary */}
          {nodes.length > 0 && (
            <div className="ml-auto min-w-[260px]">
              <ProgressBar value={completedCount} max={nodes.length} />
            </div>
          )}
        </div>

        {/* ── Legend ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500">
          <span className="font-semibold text-slate-400 uppercase tracking-wider">Legend:</span>
          {[
            { label: 'Not Started', cls: 'bg-slate-600' },
            { label: 'In Progress', cls: 'bg-amber-500'  },
            { label: 'Completed',   cls: 'bg-emerald-500'},
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${l.cls}`} />
              {l.label}
            </span>
          ))}
          <span className="ml-2 italic">· Click node to cycle status</span>
          {inProgressCount > 0 && (
            <span className="ml-auto text-amber-400 font-semibold">
              {inProgressCount} in progress
            </span>
          )}
        </div>

        {/* ── Error state ──────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-900/30 border border-red-700/60 text-red-300 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* ── Loading spinner ──────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center h-72">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Roadmap title ────────────────────────────────────────── */}
        {roadmap && !loading && (
          <div>
            <h2 className="text-lg font-bold text-blue-400">{roadmap.title}</h2>
            <p className="text-slate-500 text-sm mt-0.5">{roadmap.description}</p>
          </div>
        )}

        {/* ── Tree canvas ──────────────────────────────────────────── */}
        {roadmap && !loading && (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
            <div
              ref={containerRef}
              className="relative min-w-[700px]"
              style={{ height: svgHeight }}
            >
              {/* SVG edge layer */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width={containerW}
                height={svgHeight}
              >
                {edges.map((e, i) => (
                  <Arrow key={i} {...e} />
                ))}
              </svg>

              {/* Node boxes */}
              {nodes.map(node => {
                const pos    = positions[node.id];
                if (!pos) return null;
                const status = nodeStatus[node.id] || 'not_started';
                const colors = STATUS[status];

                return (
                  <div
                    key={node.id}
                    style={{
                      position: 'absolute',
                      left: pos.cx - NODE_W / 2,
                      top:  pos.cy - NODE_H / 2,
                      width:  NODE_W,
                      height: NODE_H,
                    }}
                    className={`
                      rounded-xl border-2 px-3 py-2 cursor-pointer z-10
                      flex flex-col justify-center items-center text-center
                      transition-all duration-200 select-none
                      hover:scale-105 hover:z-20 hover:shadow-xl hover:shadow-black/40
                      ${colors.box}
                    `}
                    onClick={() => cycleNode(node.id)}
                    onMouseEnter={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({ node, x: rect.left, y: rect.bottom + 6 });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <span className={`text-xs font-bold leading-tight ${colors.text}`}>
                      {node.label}
                    </span>
                    {colors.dot && (
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────── */}
        {!roadmap && !loading && !error && (
          <div className="flex items-center justify-center h-64 text-slate-600 text-sm">
            Select a roadmap above to get started.
          </div>
        )}
      </div>

      {/* ── Tooltip (fixed overlay, no portal needed) ────────────── */}
      {tooltip && (
        <div
          className="fixed z-[9999] bg-slate-800 border border-slate-600 rounded-xl p-3 shadow-2xl max-w-[280px] pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="text-white font-semibold text-sm mb-1">{tooltip.node.label}</p>
          {tooltip.node.description && (
            <p className="text-slate-400 text-xs mb-2 leading-relaxed">{tooltip.node.description}</p>
          )}
          {tooltip.node.topics?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tooltip.node.topics.map(t => (
                <span
                  key={t}
                  className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-md font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
