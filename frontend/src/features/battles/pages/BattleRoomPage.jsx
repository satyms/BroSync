/**
 * BattleRoomPage  (/battles/:battleId)
 * ======================================
 * Real-time 1v1 coding battle room.
 *
 * Layout:
 *   ┌─────────────────────────────────┬───────────────┐
 *   │  Problem tabs + statement       │  Scoreboard   │
 *   │  Monaco editor                  │  Timer        │
 *   │  [stdin | output] console panel │  Battle info  │
 *   └─────────────────────────────────┴───────────────┘
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import axiosInstance from '@api/axiosInstance';
import { API_ROUTES, LANGUAGES, DIFFICULTY } from '@shared/utils/constants';
import { problemsService } from '@features/problems/services/problemsService';
import { useBattleSocket } from '../hooks/useBattleSocket';
import BattleScoreboard from '../components/BattleScoreboard';
import BattleResultModal from '../components/BattleResultModal';
import { PageLoader, Spinner } from '@shared/components/ui/Spinner';
import {
  PlayIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';

/* ── Default starter code by language ──────────────────── */
const STARTER = {
  python: `def solution():\n    pass\n`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n`,
  java: `public class Solution {\n    public static void main(String[] args) {\n    }\n}\n`,
  javascript: `function solution() {\n}\n`,
};

export default function BattleRoomPage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  // ── Battle WS state ──────────────────────────────────
  const { battleState, scores, timeLeft, submissionResult, battleEnded, submitCode, requestEnd } =
    useBattleSocket(battleId);

  // ── 10-second preparation countdown (before battle active) ──
  const [countdown, setCountdown] = useState(null);    // null | 10..0
  const prevStatusRef = useRef(null);

  // ── Problem selection (must be before timer effects that depend on it) ─
  const [selectedProblemIdx, setSelectedProblemIdx] = useState(0);
  const [problemDetail, setProblemDetail] = useState(null);
  const [loadingProblem, setLoadingProblem] = useState(false);

  // ── Per-question timer ─────────────────────────
  const Q_TIMER_SECONDS = 30;
  const [qTimeLeft, setQTimeLeft]       = useState(Q_TIMER_SECONDS);
  const [qTimerActive, setQTimerActive] = useState(false);
  const qTimerRef = useRef(null);

  useEffect(() => {
    const status = battleState?.status;
    if (status === 'active' && prevStatusRef.current !== 'active') {
      // Always show 10-second prep countdown for both challenger and acceptor
      setCountdown(10);
    }
    prevStatusRef.current = status;
  }, [battleState?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Start question timer once the prep countdown finishes (countdown hits 0)
  useEffect(() => {
    if (countdown === 0 && battleState?.status === 'active') {
      setQTimeLeft(Q_TIMER_SECONDS);
      setQTimerActive(true);
    }
  }, [countdown]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fallback: if battle is already 'active' and no countdown is running, start timer
  useEffect(() => {
    if (
      battleState?.status === 'active' &&
      !battleEnded &&
      countdown === null &&
      !qTimerActive
    ) {
      setQTimeLeft(Q_TIMER_SECONDS);
      setQTimerActive(true);
    }
  }, [battleState?.status, countdown]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset question timer whenever the active problem changes
  useEffect(() => {
    if (!qTimerActive) return;
    setQTimeLeft(Q_TIMER_SECONDS);
  }, [selectedProblemIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tick the question timer every second
  useEffect(() => {
    if (!qTimerActive || battleEnded) return;
    if (qTimeLeft <= 0) {
      // Time up on this question
      const problems = battleState?.problems ?? [];
      if (selectedProblemIdx < problems.length - 1) {
        // Advance to next question
        setSelectedProblemIdx((i) => i + 1);
      } else {
        // Last question exhausted — end the battle
        setQTimerActive(false);
        requestEnd();
      }
      return;
    }
    qTimerRef.current = setTimeout(() => setQTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(qTimerRef.current);
  }, [qTimeLeft, qTimerActive, battleEnded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop question timer when battle ends
  useEffect(() => {
    if (battleEnded) {
      setQTimerActive(false);
      clearTimeout(qTimerRef.current);
    }
  }, [battleEnded]);

  // ── Editor ───────────────────────────────────────────
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(STARTER.python);

  const [submitting, setSubmitting] = useState(false);

  // ── Terminal / Console ───────────────────────────────
  const [stdin, setStdin] = useState('');
  const [runOutput, setRunOutput] = useState(null); // { stdout, stderr, exit_code, execution_time_ms }
  const [running, setRunning] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState('input');

  // ── Load problem detail when selection changes ────────
  const problems = battleState?.problems ?? [];
  const selectedProblem = problems[selectedProblemIdx];

  const loadProblemDetail = useCallback(async (slug) => {
    if (!slug) return;
    setLoadingProblem(true);
    setProblemDetail(null);
    try {
      const res = await axiosInstance.get(API_ROUTES.PROBLEM_DETAIL(slug));
      setProblemDetail(res.data?.data ?? res.data);
    } catch {
      setProblemDetail(null);
    } finally {
      setLoadingProblem(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProblem?.slug) loadProblemDetail(selectedProblem.slug);
  }, [selectedProblem?.slug, loadProblemDetail]);

  // Reset editor + console on language change
  useEffect(() => {
    setCode(STARTER[language] ?? '');
    setRunOutput(null);
  }, [language]);

  // Reset console when switching problem
  useEffect(() => {
    setRunOutput(null);
    setStdin('');
    setActiveConsoleTab('input');
  }, [selectedProblemIdx]);

  // Toast on submission result + stop question timer on accept
  useEffect(() => {
    if (!submissionResult) return;
    if (submissionResult.status === 'accepted') {
      toast.success(`✅ Accepted! +${submissionResult.points_earned ?? 0} pts`);
      // Accepted — advance to next question automatically
      const problems = battleState?.problems ?? [];
      if (selectedProblemIdx < problems.length - 1) {
        setSelectedProblemIdx((i) => i + 1);
      } else {
        // All problems solved — backend will auto-end; stop local timer
        setQTimerActive(false);
      }
    } else {
      toast(`❌ ${submissionResult.status ?? 'Wrong Answer'}`, { icon: '⚠️' });
    }
  }, [submissionResult]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Run code (custom stdin, no scoring) ──────────────
  const handleRun = async () => {
    if (!code.trim()) return toast.error('Write some code first!');
    setRunning(true);
    setActiveConsoleTab('output');
    setRunOutput(null);
    try {
      const result = await problemsService.runCode({ language, code, stdin });
      setRunOutput(result);
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to run code');
    } finally {
      setRunning(false);
    }
  };

  // ── Handle submit ─────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedProblem?.id || !code.trim()) return;
    setSubmitting(true);
    try {
      await submitCode(selectedProblem.id, code, language);
    } finally {
      // submitting false is set after WS response via toast effect
      setTimeout(() => setSubmitting(false), 1000);
    }
  };

  // ── Rematch: navigate back to lobby ──────────────────
  const handleRematch = () => navigate('/battles');

  // ── Loading state (before WS connects & battle_state arrives) ──
  if (!battleState) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <PageLoader />
        <p className="text-text-muted text-sm font-mono">Connecting to battle room…</p>
      </div>
    );
  }

  // ── Waiting for opponent to connect ──────────────────
  if (battleState.status === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6 animate-fade-in">
        <div className="text-5xl animate-pulse">⚔️</div>
        <div className="text-center">
          <h2 className="text-text-primary text-xl font-bold">Waiting for opponent…</h2>
          <p className="text-text-muted text-sm mt-1">Battle will start once both players connect.</p>
        </div>
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── 10-second preparation countdown overlay ────────
  if (countdown !== null && countdown > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6 animate-fade-in">
        <div className="text-6xl font-black text-brand-blue tabular-nums" style={{ minWidth: '3ch', textAlign: 'center' }}>
          {countdown}
        </div>
        <div className="text-center">
          <h2 className="text-text-primary text-2xl font-bold">Get Ready!</h2>
          <p className="text-text-muted text-sm mt-1">Battle starts in {countdown} second{countdown !== 1 ? 's' : ''}…</p>
        </div>
        <div className="flex gap-3">
          {(battleState?.participants || []).map((p) => (
            <div key={p.username} className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-border-primary rounded-lg">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-blue to-accent-purple flex items-center justify-center text-white text-xs font-bold">
                {p.username?.[0]?.toUpperCase()}
              </div>
              <span className="text-text-primary text-sm font-semibold">{p.username}</span>
            </div>
          ))}
        </div>
        <p className="text-text-muted text-xs font-mono">{(battleState?.problems || []).length} problems · First solve +10 pts · Second +5 pts</p>
      </div>
    );
  }

  const diffMeta = DIFFICULTY[selectedProblem?.difficulty] ?? {};

  return (
    <div className="flex gap-4 h-[calc(100vh-5rem)] animate-fade-in overflow-hidden">
      {/* ── Result modal overlay ── */}
      {battleEnded && (
        <BattleResultModal endEvent={battleEnded} onRematch={handleRematch} />
      )}

      {/* ══ LEFT COLUMN ════════════════════════════════════ */}
      <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-hidden">

        {/* Problem tabs + per-question countdown ring */}
        <div className="flex items-center gap-2 bg-bg-card border border-border-primary rounded-xl p-2 shrink-0">
          {/* Tabs (scrollable) */}
          <div className="flex gap-1 overflow-x-auto flex-1">
            {problems.map((p, i) => {
              const diff = DIFFICULTY[p.difficulty] ?? {};
              const solved = battleState?.my_solved_ids?.includes(p.id);
              return (
                <button
                  key={p.id ?? i}
                  onClick={() => setSelectedProblemIdx(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
                    ${selectedProblemIdx === i
                      ? 'bg-brand-blue/20 text-brand-blue border border-brand-blue/40'
                      : 'text-text-secondary hover:bg-bg-hover border border-transparent'}`}
                >
                  {solved && <span className="text-green-400">✓</span>}
                  <span>P{i + 1}</span>
                  {diff.label && (
                    <span className={`${diff.color} text-[9px]`}>{diff.label}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Per-question countdown ring */}
          {(qTimerActive || countdown === 0) && !battleEnded && (() => {
            const radius = 18;
            const circ   = 2 * Math.PI * radius;
            const pct    = qTimeLeft / Q_TIMER_SECONDS;
            const offset = circ * (1 - pct);
            const color  = qTimeLeft > 5 ? '#22c55e' : qTimeLeft > 2 ? '#f59e0b' : '#ef4444';
            return (
              <div className="relative flex items-center justify-center shrink-0" style={{ width: 44, height: 44 }}>
                <svg width="44" height="44" className="-rotate-90">
                  <circle cx="22" cy="22" r={radius} fill="none" stroke="#374151" strokeWidth="3" />
                  <circle
                    cx="22" cy="22" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
                  />
                </svg>
                <span
                  className="absolute text-[11px] font-bold"
                  style={{ color }}
                >
                  {qTimeLeft}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Problem statement */}
        <div className="bg-bg-card border border-border-primary rounded-xl p-4 max-h-52 overflow-y-auto shrink-0">
          {loadingProblem ? (
            <div className="flex justify-center py-4"><PageLoader /></div>
          ) : problemDetail ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-text-primary font-semibold text-sm">{problemDetail.title}</h2>
                {problemDetail.difficulty && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${diffMeta.bg ?? ''} ${diffMeta.border ?? ''} ${diffMeta.color ?? ''}`}>
                    {diffMeta.label ?? problemDetail.difficulty}
                  </span>
                )}
              </div>
              <div
                className="text-text-secondary text-xs leading-relaxed prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: problemDetail.description ?? problemDetail.statement ?? '' }}
              />
              {/* Sample test cases with Load into Run */}
              {problemDetail.sample_test_cases?.map((tc, i) => (
                <div key={tc.id ?? i} className="mt-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-[10px] font-mono uppercase">Example {i + 1}</span>
                    <button
                      onClick={() => { setStdin(tc.input_data); setActiveConsoleTab('input'); }}
                      className="text-[10px] font-mono text-brand-blue hover:text-blue-400 border border-brand-blue/40 hover:border-blue-400 px-2 py-0.5 rounded transition-colors"
                    >
                      Load into Run
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-text-muted text-[10px] font-mono mb-1">Input</p>
                      <pre className="bg-bg-primary border border-border-secondary rounded p-2 text-text-secondary text-[10px] font-mono overflow-auto">{tc.input_data}</pre>
                    </div>
                    <div>
                      <p className="text-text-muted text-[10px] font-mono mb-1">Output</p>
                      <pre className="bg-bg-primary border border-border-secondary rounded p-2 text-text-secondary text-[10px] font-mono overflow-auto">{tc.expected_output}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : selectedProblem ? (
            <p className="text-text-muted text-sm">{selectedProblem.title ?? `Problem ${selectedProblemIdx + 1}`}</p>
          ) : (
            <p className="text-text-muted text-sm text-center">Select a problem to view its statement.</p>
          )}
        </div>

        {/* ── Editor + Console panel ─── */}
        <div className="flex-1 min-h-0 bg-bg-card border border-border-primary rounded-xl flex flex-col overflow-hidden">

          {/* Editor toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border-primary shrink-0">
            <div className="flex items-center gap-2">
              <CodeBracketIcon className="w-4 h-4 text-text-muted" />
              {/* Language selector */}
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-bg-primary border border-border-primary text-text-primary text-xs font-mono rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:border-brand-blue appearance-none cursor-pointer"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Last submit status */}
              {submissionResult && (
                <span className={`text-[10px] font-mono ${submissionResult.status === 'accepted' ? 'text-green-400' : 'text-red-400'}`}>
                  {submissionResult.status}{submissionResult.points_earned != null ? ` +${submissionResult.points_earned}pts` : ''}
                </span>
              )}
              {/* Reset */}
              <button
                onClick={() => { setCode(STARTER[language] ?? ''); setRunOutput(null); }}
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-md transition-colors"
                title="Reset code"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>
              {/* Run */}
              <button
                onClick={handleRun}
                disabled={running || submitting || battleEnded}
                className="flex items-center gap-1.5 bg-bg-tertiary hover:bg-bg-hover disabled:opacity-50 text-green-400 border border-green-800 hover:border-green-600 text-xs font-mono px-3 py-1.5 rounded-lg transition-colors"
                title="Run with custom stdin (no scoring)"
              >
                {running ? <><Spinner size="sm" /> Running…</> : <><PlayIcon className="w-3.5 h-3.5" /> Run</>}
              </button>
              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || running || !selectedProblem || battleEnded}
                className="flex items-center gap-1.5 bg-brand-blue hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
              >
                {submitting ? <><Spinner size="sm" /> Submitting…</> : '⚔️ Submit'}
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden min-h-0">
            <Editor
              height="100%"
              language={LANGUAGES.find((l) => l.value === language)?.monacoLang ?? 'python'}
              value={code}
              onChange={(v) => setCode(v ?? '')}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                automaticLayout: true,
                padding: { top: 8, bottom: 8 },
                tabSize: 4,
              }}
            />
          </div>

          {/* ── Console / Terminal Panel ───────────────────── */}
          <div className="h-44 shrink-0 border-t border-border-primary flex flex-col">
            {/* Console tab bar */}
            <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-border-primary shrink-0 bg-bg-primary">
              {['input', 'output'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveConsoleTab(tab)}
                  className={`px-3 py-1 text-xs font-mono rounded-md transition-colors capitalize ${
                    activeConsoleTab === tab
                      ? 'bg-bg-hover text-text-primary'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {tab === 'input' ? 'stdin' : 'output'}
                  {tab === 'output' && runOutput && !running && (
                    <span className={`ml-1.5 w-1.5 h-1.5 rounded-full inline-block ${
                      runOutput.exit_code === 0 ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                  )}
                </button>
              ))}
              {/* Stats aligned right */}
              {running && (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-brand-blue font-mono">
                  <Spinner size="sm" /> executing…
                </span>
              )}
              {runOutput && !running && (
                <span className="ml-auto text-xs text-text-muted font-mono">
                  {runOutput.execution_time_ms != null ? `${runOutput.execution_time_ms}ms` : ''}
                  {' · '}exit {runOutput.exit_code}
                </span>
              )}
            </div>

            {/* Console content */}
            <div className="flex-1 overflow-auto p-3 bg-bg-primary">
              {activeConsoleTab === 'input' ? (
                <div className="flex flex-col h-full gap-1">
                  <textarea
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    placeholder={`Paste stdin here (each line = one input() call).\nExample: 3 5`}
                    className="flex-1 w-full bg-transparent text-text-primary font-mono text-xs resize-none focus:outline-none placeholder-text-muted"
                    spellCheck={false}
                  />
                  <p className="text-[10px] text-text-muted font-mono shrink-0">
                    Hit <kbd className="bg-bg-hover px-1 rounded">Run</kbd> after providing input to see output.
                  </p>
                </div>
              ) : (
                <div className="font-mono text-xs space-y-1 h-full">
                  {running ? (
                    <span className="text-text-muted animate-pulse">Running your code…</span>
                  ) : runOutput ? (
                    <>
                      {runOutput.stdout ? (
                        <pre className="text-green-300 whitespace-pre-wrap">{runOutput.stdout}</pre>
                      ) : null}
                      {runOutput.stderr ? (
                        <>
                          <pre className="text-red-400 whitespace-pre-wrap">{runOutput.stderr}</pre>
                          {runOutput.stderr.includes('EOFError') && (
                            <div className="mt-2 px-2 py-1.5 rounded bg-yellow-900/30 border border-yellow-700/40 text-yellow-300 text-[10px]">
                              💡 Your code reads from stdin but no input was provided. Switch to the <strong>stdin</strong> tab, enter input, then Run again.
                            </div>
                          )}
                        </>
                      ) : null}
                      {!runOutput.stdout && !runOutput.stderr && (
                        <span className="text-text-muted">(no output)</span>
                      )}
                    </>
                  ) : (
                    <span className="text-text-muted">Click <span className="text-green-400 font-semibold">Run</span> to see output here.</span>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* ── End Console Panel ───────────────────────── */}

        </div>
      </div>

      {/* ══ RIGHT COLUMN ═══════════════════════════════ */}
      <div className="w-64 shrink-0 flex flex-col gap-4">
        <BattleScoreboard scores={scores} />

        {/* ── Per-question timer (large, right panel) ── */}
        {!battleEnded && (() => {
          const radius = 36;
          const circ   = 2 * Math.PI * radius;
          const pct    = qTimeLeft / Q_TIMER_SECONDS;
          const offset = circ * (1 - pct);
          const color  = qTimeLeft > 10 ? '#22c55e' : qTimeLeft > 5 ? '#f59e0b' : '#ef4444';
          return (
            <div className="bg-bg-card border border-border-primary rounded-xl p-4 flex flex-col items-center gap-2">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider w-full">Time Left</p>
              <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
                <svg width="88" height="88" className="-rotate-90">
                  <circle cx="44" cy="44" r={radius} fill="none" stroke="#1e293b" strokeWidth="5" />
                  <circle
                    cx="44" cy="44" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={qTimerActive ? offset : 0}
                    style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black tabular-nums" style={{ color }}>
                    {qTimerActive ? qTimeLeft : '—'}
                  </span>
                  <span className="text-[9px] text-text-muted font-mono">sec</span>
                </div>
              </div>
              <p className="text-[10px] text-text-muted font-mono">
                {qTimerActive
                  ? `Q${selectedProblemIdx + 1} of ${problems.length}`
                  : countdown !== null && countdown > 0
                    ? `Starting in ${countdown}s…`
                    : 'Waiting…'}
              </p>
            </div>
          );
        })()}

        {/* Battle meta */}
        <div className="bg-bg-card border border-border-primary rounded-xl p-4 space-y-2 text-xs font-mono text-text-muted">
          <p className="font-semibold text-text-secondary text-[11px] uppercase tracking-wider">Battle Info</p>
          <div className="flex justify-between">
            <span>Status</span>
            <span className="text-text-primary">{battleState.status ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span>Problems</span>
            <span className="text-text-primary">{problems.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Difficulty</span>
            <span className="text-text-primary capitalize">{battleState.difficulty ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span>Scoring</span>
            <span className="text-text-primary">1st +10 · 2nd +5</span>
          </div>
        </div>
      </div>
    </div>
  );
}
