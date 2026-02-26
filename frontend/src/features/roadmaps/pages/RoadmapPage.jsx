/**
 * RoadmapPage — Interactive dependency-graph roadmap viewer.
 *
 * Select a roadmap (DSA, Python, Web Dev) → see an NeetCode-style
 * dependency tree. Click any node to cycle: not-started → in-progress → completed.
 * Progress is stored in localStorage per roadmap type.
 * "Learn" button on each node opens a W3Schools-powered modal.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '@api/axiosInstance';

// ── Layout constants ─────────────────────────────────────────────────────────
const LEVEL_HEIGHT = 140; // vertical gap between rows (px)
const NODE_W       = 172; // node box width  (px)
const NODE_H       = 80;  // node box height (px) — taller to fit Learn button
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
  // Synthetic style for node-locked state (parent not yet completed)
  node_locked: {
    box:  'border-slate-700/60 bg-slate-900/80',
    text: 'text-slate-600',
    edge: '#1e293b',
    dot:  null,
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
function Arrow({ x1, y1, x2, y2, color, opacity }) {
  const midY   = (y1 + y2) / 2;
  const d      = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  const ax1    = x2 - ARROW_HEAD * 0.6;
  const ax2    = x2 + ARROW_HEAD * 0.6;
  const ay     = y2 - ARROW_HEAD;
  const alpha  = opacity ?? 0.55;

  return (
    <g>
      <path d={d} stroke={color} strokeWidth={1.6} fill="none" opacity={alpha}
        strokeDasharray={opacity !== undefined ? '4 3' : undefined} />
      <polygon points={`${x2},${y2} ${ax1},${ay} ${ax2},${ay}`} fill={color} opacity={alpha} />
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

  // ── Learn modal state ──────────────────────────────────────────────────────
  const [learnModal, setLearnModal] = useState({
    open:           false,
    node:           null,   // the roadmap node being learned
    activeTopic:    '',     // currently selected topic string
    content:        null,   // scraped content payload from backend
    contentLoading: false,
    contentError:   null,
  });

  // ── Topic completion progress: nodeId → string[] of done topic names ────────
  // Topics are sequential — you must mark each one complete before the next unlocks.
  const [topicProgress, setTopicProgress] = useState({});
  const topicProgressRef = useRef({});
  topicProgressRef.current = topicProgress; // always-fresh ref (no stale closures)

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
        // Load per-topic completion progress for this roadmap type
        const savedProgress = JSON.parse(localStorage.getItem(`brosync_topic_progress_${type}`) || '{}');
        setTopicProgress(savedProgress);
      })
      .catch(() => setError('Could not load roadmap — make sure the backend server is running.'))
      .finally(() => setLoading(false));
  }, [type]);

  // Click node → cycle status & persist
  // Blocked from advancing to 'completed' until all topics in the node are learned.
  const cycleNode = useCallback((nodeId) => {
    setNodeStatus(prev => {
      const cur  = prev[nodeId] || 'not_started';
      let   next = CYCLE[cur];

      // Guard: can't mark completed if the node has unfinished lessons
      if (next === 'completed') {
        const node      = roadmap?.nodes?.find(n => n.id === nodeId);
        const hasTopics = node?.topics?.length > 0;
        if (hasTopics) {
          const doneProg = topicProgressRef.current[nodeId] || [];
          const allDone  = node.topics.every(t => doneProg.includes(t));
          if (!allDone) return prev; // silently block
        }
      }

      const updated = { ...prev, [nodeId]: next };
      localStorage.setItem(`brosync_roadmap_${type}`, JSON.stringify(updated));
      return updated;
    });
  }, [type, roadmap]);

  // ── Learn modal helpers ────────────────────────────────────────────────────
  const fetchTopicContent = useCallback(async (topic) => {
    setLearnModal(prev => ({ ...prev, activeTopic: topic, contentLoading: true, contentError: null, content: null }));
    try {
      const res = await axiosInstance.get(`/problems/learn/?topic=${encodeURIComponent(topic)}`);
      const data = res.data?.data ?? res.data;
      setLearnModal(prev => ({ ...prev, content: data, contentLoading: false }));
    } catch (err) {
      setLearnModal(prev => ({
        ...prev,
        contentLoading: false,
        contentError: 'Failed to load content. Please try again.',
      }));
    }
  }, []);

  const openLearn = useCallback((node, e) => {
    e.stopPropagation();
    const firstTopic = node.topics?.[0] ?? '';
    setLearnModal({ open: true, node, activeTopic: firstTopic, content: null, contentLoading: false, contentError: null });
    if (firstTopic) {
      // Kick off first topic fetch immediately
      setLearnModal(prev => ({ ...prev, contentLoading: true }));
      axiosInstance
        .get(`/problems/learn/?topic=${encodeURIComponent(firstTopic)}`)
        .then(res => {
          const data = res.data?.data ?? res.data;
          setLearnModal(prev => ({ ...prev, content: data, contentLoading: false }));
        })
        .catch(() => {
          setLearnModal(prev => ({ ...prev, contentLoading: false, contentError: 'Failed to load content.' }));
        });
    }
  }, []);

  const closeLearn = useCallback(() => {
    setLearnModal({ open: false, node: null, activeTopic: '', content: null, contentLoading: false, contentError: null });
  }, []);

  // Close learn modal on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeLearn(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeLearn]);

  // ── Mark a topic as complete & auto-advance ────────────────────────────────
  const markTopicComplete = useCallback((nodeId, topic, nodeTopics) => {
    const existing = topicProgressRef.current[nodeId] || [];
    if (existing.includes(topic)) return; // already done

    const newList = [...existing, topic];
    const updated = { ...topicProgressRef.current, [nodeId]: newList };

    // Persist
    localStorage.setItem(`brosync_topic_progress_${type}`, JSON.stringify(updated));
    setTopicProgress(updated);

    // Auto-promote node from not_started → in_progress when first topics done
    if (nodeTopics && newList.length === nodeTopics.length) {
      setNodeStatus(prevNode => {
        if ((prevNode[nodeId] || 'not_started') === 'not_started') {
          const updatedNodes = { ...prevNode, [nodeId]: 'in_progress' };
          localStorage.setItem(`brosync_roadmap_${type}`, JSON.stringify(updatedNodes));
          return updatedNodes;
        }
        return prevNode;
      });
    }

    // Auto-advance to the next topic in sequence
    if (nodeTopics) {
      const idx       = nodeTopics.indexOf(topic);
      const nextTopic = nodeTopics[idx + 1];
      if (nextTopic && !newList.includes(nextTopic)) {
        setLearnModal(prev => ({ ...prev, activeTopic: nextTopic, contentLoading: true, contentError: null, content: null }));
        axiosInstance
          .get(`/problems/learn/?topic=${encodeURIComponent(nextTopic)}`)
          .then(res => {
            const data = res.data?.data ?? res.data;
            setLearnModal(prev => ({ ...prev, content: data, contentLoading: false }));
          })
          .catch(() => {
            setLearnModal(prev => ({ ...prev, contentLoading: false, contentError: 'Failed to load content.' }));
          });
      }
    }
  }, [type]);

  // ── Computed layout ────────────────────────────────────────────────────────
  const nodes    = roadmap?.nodes ?? [];
  const { positions, maxLevel } = nodes.length
    ? layoutNodes(nodes, containerW)
    : { positions: {}, maxLevel: 0 };

  const svgHeight = (maxLevel + 1) * LEVEL_HEIGHT + NODE_H + 20;

  // Build reverse-edge map: childId → [parentId, ...]
  // A node is locked only while ALL its parents are still 'not_started'.
  // As soon as any parent becomes 'in_progress' or 'completed', children unlock.
  const parentMap = {}; // childId → parentId[]
  for (const n of nodes) {
    for (const childId of (n.children || [])) {
      (parentMap[childId] = parentMap[childId] || []).push(n.id);
    }
  }
  const isNodeLocked = (nodeId) => {
    const parents = parentMap[nodeId] || [];
    if (parents.length === 0) return false; // root node — always open
    // Locked only if ALL parents are still not_started (unlocks as soon as any parent is in_progress or completed)
    return parents.every(pid => (nodeStatus[pid] || 'not_started') === 'not_started');
  };

  const edges = nodes.flatMap(node => {
    const from = positions[node.id];
    if (!from) return [];
    return (node.children || []).flatMap(childId => {
      const to = positions[childId];
      if (!to) return [];
      const locked  = isNodeLocked(childId);
      const childSt = locked ? 'node_locked' : (nodeStatus[childId] || 'not_started');
      return [{
        x1: from.cx,
        y1: from.cy + NODE_H / 2,
        x2: to.cx,
        y2: to.cy - NODE_H / 2,
        color:   STATUS[childSt]?.edge ?? '#475569',
        locked,
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
            { label: 'Not Started', cls: 'bg-slate-600'   },
            { label: 'In Progress', cls: 'bg-amber-500'   },
            { label: 'Completed',   cls: 'bg-emerald-500' },
            { label: 'Locked',      cls: 'bg-slate-800 border border-slate-700', icon: '🔒' },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5">
              {l.icon
                ? <span className="text-[11px]">{l.icon}</span>
                : <span className={`w-2.5 h-2.5 rounded-full ${l.cls}`} />}
              {l.label}
            </span>
          ))}
          <span className="ml-2 italic">· Start a node to unlock its children</span>
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
                  <Arrow key={i} {...e} opacity={e.locked ? 0.2 : undefined} />
                ))}
              </svg>

              {/* Node boxes */}
              {nodes.map(node => {
                const pos       = positions[node.id];
                if (!pos) return null;
                const locked    = isNodeLocked(node.id);   // parent(s) not yet completed
                const status    = nodeStatus[node.id] || 'not_started';
                const colors    = locked ? STATUS.node_locked : STATUS[status];
                const hasTopics = node.topics?.length > 0;

                const doneCount     = hasTopics ? (topicProgress[node.id] || []).length : 0;
                const totalCount    = hasTopics ? node.topics.length : 0;
                const allTopicsDone = hasTopics && doneCount === totalCount;

                // Which parent node labels are blocking this one?
                const blockingParents = locked
                  ? (parentMap[node.id] || [])
                      .filter(pid => (nodeStatus[pid] || 'not_started') === 'not_started')
                      .map(pid => nodes.find(n => n.id === pid)?.label)
                      .filter(Boolean)
                  : [];

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
                      rounded-xl border-2 px-3 py-2 z-10
                      flex flex-col justify-between items-center text-center
                      transition-all duration-200 select-none
                      ${locked
                        ? 'cursor-not-allowed opacity-50'
                        : 'cursor-pointer hover:scale-105 hover:z-20 hover:shadow-xl hover:shadow-black/40'
                      }
                      ${colors.box}
                    `}
                    onClick={() => !locked && cycleNode(node.id)}
                    onMouseEnter={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({ node, x: rect.left, y: rect.bottom + 6, locked, blockingParents });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {/* Label row */}
                    <div className="flex items-center gap-1 justify-center">
                      {locked
                        ? <span className="text-slate-600 text-[12px]">🔒</span>
                        : colors.dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
                      }
                      <span className={`text-[11px] font-bold leading-tight ${colors.text}`}>
                        {node.label}
                      </span>
                    </div>

                    {/* Topic progress micro-badge */}
                    {hasTopics && (
                      <span className={`text-[9px] font-semibold ${
                        locked            ? 'text-slate-600'
                        : allTopicsDone   ? 'text-emerald-400'
                        : doneCount > 0   ? 'text-amber-400'
                        :                   'text-amber-500/70'
                      }`}>
                        {locked
                          ? 'Start prerequisite first'
                          : allTopicsDone
                            ? '✓ All learned'
                            : `🔒 ${doneCount}/${totalCount} learned`}
                      </span>
                    )}

                    {/* Learn button — disabled when node is locked */}
                    {hasTopics && (
                      <button
                        disabled={locked}
                        onClick={(e) => !locked && openLearn(node, e)}
                        className={`
                          w-full py-0.5 rounded-lg text-[10px] font-semibold
                          transition-colors duration-150 border
                          ${locked
                            ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
                            : allTopicsDone
                              ? 'bg-emerald-600/80 hover:bg-emerald-500 text-white border-emerald-500/50'
                              : 'bg-blue-600/80 hover:bg-blue-500 text-white border-blue-500/50'
                          }
                        `}
                      >
                        {locked ? '🔒 Locked' : allTopicsDone ? '✅ Review' : '📖 Learn'}
                      </button>
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
          className="fixed z-[9999] bg-slate-800 border border-slate-600 rounded-xl p-3 shadow-2xl max-w-[300px] pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="text-white font-semibold text-sm mb-1 flex items-center gap-1.5">
            {tooltip.locked && <span>🔒</span>}
            {tooltip.node.label}
          </p>
          {tooltip.locked && tooltip.blockingParents?.length > 0 && (
            <p className="text-amber-400 text-xs mb-2 leading-relaxed">
              Start <strong>{tooltip.blockingParents.join(', ')}</strong> first to unlock this node.
            </p>
          )}
          {!tooltip.locked && tooltip.node.description && (
            <p className="text-slate-400 text-xs mb-2 leading-relaxed">{tooltip.node.description}</p>
          )}
          {!tooltip.locked && tooltip.node.topics?.length > 0 && (
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

      {/* ── Learn modal ──────────────────────────────────────────── */}
      {learnModal.open && (
        <LearnModal
          modal={learnModal}
          onClose={closeLearn}
          onSelectTopic={fetchTopicContent}
          topicProgress={topicProgress[learnModal.node?.id] || []}
          onMarkComplete={markTopicComplete}
        />
      )}
    </div>
  );
}

// ── LearnModal ────────────────────────────────────────────────────────────────
function LearnModal({ modal, onClose, onSelectTopic, topicProgress, onMarkComplete }) {
  const { node, activeTopic, content, contentLoading, contentError } = modal;
  const topics = node.topics || [];

  // Derive locked / done state for each topic
  const isTopicDone     = (t)   => topicProgress.includes(t);
  const isTopicUnlocked = (idx) => idx === 0 || isTopicDone(topics[idx - 1]);
  const isCurrentDone   = isTopicDone(activeTopic);
  const activeIdx       = topics.indexOf(activeTopic);
  const hasNext         = activeIdx >= 0 && activeIdx < topics.length - 1;
  const allDone         = topics.length > 0 && topics.every(t => isTopicDone(t));

  const handleMarkComplete = () => onMarkComplete(node.id, activeTopic, topics);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Dialog */}
      <div
        className="relative bg-[#0F172A] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Modal header ────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg tracking-tight">{node.label}</h2>
            {node.description && (
              <p className="text-slate-400 text-xs mt-0.5">{node.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Overall topic progress pill */}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              allDone
                ? 'bg-emerald-900/40 border-emerald-600/50 text-emerald-300'
                : 'bg-slate-800 border-slate-600 text-slate-400'
            }`}>
              {allDone ? '🎉 All done!' : `${topicProgress.length} / ${topics.length} topics`}
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors text-xl leading-none px-2"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Modal body: sidebar + content ───────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar — locked/unlocked topic list */}
          <aside className="w-56 shrink-0 border-r border-slate-800 bg-slate-900/40 overflow-y-auto py-3 px-2 space-y-1">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider px-2 mb-2">Topics</p>
            {topics.map((topic, idx) => {
              const done     = isTopicDone(topic);
              const unlocked = isTopicUnlocked(idx);
              const active   = activeTopic === topic;

              return (
                <button
                  key={topic}
                  disabled={!unlocked}
                  onClick={() => unlocked && onSelectTopic(topic)}
                  title={!unlocked ? `Finish "${topics[idx - 1]}" first to unlock this topic` : ''}
                  className={`
                    w-full text-left px-2.5 py-2 rounded-lg text-sm font-medium
                    transition-all duration-150 flex items-center gap-2
                    ${
                      !unlocked           ? 'text-slate-600 cursor-not-allowed opacity-60'
                      : active && done    ? 'bg-emerald-700/60 text-white shadow border border-emerald-600/40'
                      : active           ? 'bg-blue-600 text-white shadow'
                      : done             ? 'text-emerald-300 hover:bg-slate-800'
                      :                    'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <span className="shrink-0 text-[13px] w-4 text-center">
                    {done ? '✅' : unlocked ? '○' : '🔒'}
                  </span>
                  <span className="flex-1 leading-tight">{topic}</span>
                </button>
              );
            })}
          </aside>

          {/* Content panel */}
          <main className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Loading */}
            {contentLoading && (
              <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Error */}
            {contentError && !contentLoading && (
              <div className="bg-red-900/30 border border-red-700/60 text-red-300 rounded-xl px-4 py-3 text-sm">
                {contentError}
              </div>
            )}

            {/* Not found */}
            {content?.not_found && !contentLoading && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-sm gap-3">
                <span className="text-4xl">📭</span>
                <p>No learning content mapped for <strong className="text-slate-300">"{activeTopic}"</strong> yet.</p>
                {content.url && (
                  <a href={content.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs">
                    Search W3Schools →
                  </a>
                )}
                {/* Still allow marking not-found topics complete so they don't block progress */}
                {!isCurrentDone && (
                  <button
                    onClick={handleMarkComplete}
                    className="mt-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 transition-colors"
                  >
                    ✓ Mark as Done & Continue
                  </button>
                )}
              </div>
            )}

            {/* ── Idle state ── */}
            {!content && !contentLoading && !contentError && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-sm gap-2">
                <span className="text-4xl">👈</span>
                <p>Select a topic from the sidebar to start learning.</p>
              </div>
            )}

            {/* ── Content sections ── */}
            {content && !content.not_found && !contentLoading && (
              <>
                {/* Already-completed banner */}
                {isCurrentDone && (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold bg-emerald-900/20 border border-emerald-700/40 rounded-xl px-4 py-2.5">
                    ✅ You've completed this topic.
                    {hasNext && (
                      <button
                        onClick={() => onSelectTopic(topics[activeIdx + 1])}
                        className="ml-auto text-xs bg-emerald-700/60 hover:bg-emerald-600/60 px-2.5 py-1 rounded-lg border border-emerald-600/40 font-semibold transition-colors"
                      >
                        Next: {topics[activeIdx + 1]} →
                      </button>
                    )}
                  </div>
                )}

                {/* All topics done — can now complete node on roadmap */}
                {allDone && !isCurrentDone && (
                  <div className="flex items-center gap-2 text-emerald-300 text-sm bg-emerald-900/30 border border-emerald-700/50 rounded-xl px-4 py-3">
                    🎉 <span>All topics in <strong>{node.label}</strong> are complete! Go back to the roadmap and mark this node as <strong>Completed</strong>.</span>
                  </div>
                )}

                {/* Topic title + source link */}
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-xl font-bold text-white">{content.title}</h3>
                  {content.url && (
                    <a href={content.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 hover:underline shrink-0">
                      View on W3Schools ↗
                    </a>
                  )}
                </div>

                {content.sections?.length === 0 && (
                  <p className="text-slate-500 text-sm">No structured content could be extracted. Visit W3Schools directly.</p>
                )}

                {content.sections?.map((section, si) => (
                  <div key={si} className="space-y-3">
                    {section.heading && section.heading !== 'Overview' && (
                      <h4 className="text-blue-400 font-bold text-base border-b border-slate-800 pb-1">
                        {section.heading}
                      </h4>
                    )}
                    {section.items?.map((item, ii) => {
                      if (item.type === 'subheading') return (
                        <h5 key={ii} className="text-slate-200 font-semibold text-sm mt-2">{item.content}</h5>
                      );
                      if (item.type === 'text') return (
                        <p key={ii} className="text-slate-300 text-sm leading-relaxed">{item.content}</p>
                      );
                      if (item.type === 'code') return (
                        <pre key={ii} className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-emerald-300 text-xs font-mono overflow-x-auto leading-relaxed">
                          {item.content}
                        </pre>
                      );
                      return null;
                    })}
                  </div>
                ))}

                {/* ── Mark as Complete button — only shown when not yet done ── */}
                {!isCurrentDone && (
                  <div className="sticky bottom-0 pt-6 pb-2">
                    <div className="h-8 -mt-8 bg-gradient-to-t from-[#0F172A] to-transparent pointer-events-none" />
                    <button
                      onClick={handleMarkComplete}
                      className="
                        w-full py-3.5 rounded-xl font-bold text-sm
                        bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98]
                        text-white transition-all duration-200
                        shadow-lg shadow-emerald-900/40 border border-emerald-500/50
                      "
                    >
                      {hasNext
                        ? `✓ Mark Complete & Next: ${topics[activeIdx + 1]} →`
                        : allDone
                          ? '✓ Mark Complete'
                          : '✓ Mark as Complete'
                      }
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
