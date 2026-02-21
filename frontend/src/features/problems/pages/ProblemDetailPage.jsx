import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { problemsService } from '../services/problemsService';
import { submissionsService } from '@features/submissions/services/submissionsService';
import { DifficultyBadge, StatusBadge } from '@shared/components/ui/Badge';
import { PageLoader, Spinner } from '@shared/components/ui/Spinner';
import { LANGUAGES } from '@shared/utils/constants';
import { formatExecTime, formatMemory, timeAgo } from '@shared/utils/formatters';
import {
  CodeBracketIcon,
  ClockIcon,
  CpuChipIcon,
  PlayIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_CODE = {
  python: '# Write your solution here\n\ndef solution():\n    pass\n',
  cpp: '// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // your code\n    return 0;\n}\n',
  java: '// Write your solution here\nimport java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // your code\n    }\n}\n',
  javascript: '// Write your solution here\n\nfunction solution() {\n    // your code\n}\n',
};

export default function ProblemDetailPage() {
  const { slug } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const [runOutput, setRunOutput] = useState(null);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [stdin, setStdin] = useState('');
  const [activeConsoleTab, setActiveConsoleTab] = useState('input');

  useEffect(() => {
    problemsService.getProblem(slug)
      .then((p) => {
        setProblem(p);
        // Pre-fill stdin with the first sample test case input
        const firstSample = p?.sample_test_cases?.[0];
        if (firstSample?.input_data) {
          setStdin(firstSample.input_data);
        }
      })
      .catch(() => toast.error('Problem not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang] || '');
    setRunOutput(null);
  };

  const handleRun = async () => {
    if (!code.trim()) return toast.error('Write some code first!');
    setRunning(true);
    setActiveConsoleTab('output');
    setRunOutput(null);
    try {
      const result = await problemsService.runCode({ language, code, stdin });
      setRunOutput(result);
      // If code needs stdin but none was provided, guide the user
      if (result.stderr && result.stderr.includes('EOFError') && !stdin.trim()) {
        setActiveConsoleTab('input');
        toast('Your code reads from stdin — use the Stdin tab or "Load into Run" on a sample, then Run again.', {
          icon: '💡',
          duration: 5000,
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to run code');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) return toast.error('Write some code first!');
    setSubmitting(true);
    try {
      const sub = await submissionsService.submit({
        problem: problem.id,
        language,
        code,
      });
      toast.success('Submitted! Judging...');
      setLatestResult(sub);
      // Poll for result
      pollStatus(sub.id);
      setMySubmissions((prev) => [sub, ...prev]);
      setActiveTab('result');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.detail || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const pollStatus = async (subId) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      try {
        const updated = await submissionsService.getSubmission(subId);
        setLatestResult(updated);
        if (updated.status !== 'pending' && updated.status !== 'running') {
          clearInterval(interval);
          if (updated.status === 'accepted') {
            toast.success('✅ Accepted!', { duration: 4000 });
          } else {
            toast.error(`❌ ${updated.status.replace('_', ' ')}`);
          }
        }
      } catch {}
      if (++attempts > 20) clearInterval(interval);
    }, 2000);
  };

  if (loading) return <PageLoader />;
  if (!problem) return (
    <div className="text-center py-20 text-text-muted">
      Problem not found. <Link to="/problems" className="text-brand-blue">Back to problems</Link>
    </div>
  );

  return (
    <div className="max-w-full h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-4 animate-fade-in">
      {/* ── Left Panel: Problem Description ─────────────── */}
      <div className="lg:w-[45%] bg-bg-card border border-border-primary rounded-xl flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center border-b border-border-primary px-4">
          {['description', 'submissions', 'result'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 text-sm font-mono capitalize border-b-2 transition-colors -mb-px
                ${activeTab === tab
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'description' && (
            <ProblemDescription problem={problem} onLoadSample={(input) => { setStdin(input); setActiveConsoleTab('input'); }} />
          )}
          {activeTab === 'submissions' && (
            <SubmissionsTab submissions={mySubmissions} />
          )}
          {activeTab === 'result' && latestResult && (
            <ResultTab result={latestResult} />
          )}
        </div>
      </div>

      {/* ── Right Panel: Code Editor ─────────────────────── */}
      <div className="lg:flex-1 bg-bg-card border border-border-primary rounded-xl flex flex-col overflow-hidden">
        {/* Editor toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-primary">
          <div className="flex items-center gap-2">
            <CodeBracketIcon className="w-4 h-4 text-text-muted" />
            {/* Language selector */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
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
            <button
              onClick={() => setCode(DEFAULT_CODE[language] || '')}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-md transition-colors"
              title="Reset code"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
            {/* Run button */}
            <button
              onClick={handleRun}
              disabled={running || submitting}
              className="flex items-center gap-1.5 bg-bg-tertiary hover:bg-bg-hover disabled:opacity-60 text-green-400 border border-green-800 hover:border-green-600 text-sm font-mono px-3 py-1.5 rounded-lg transition-colors"
              title="Run code with custom input"
            >
              {running ? (
                <><Spinner size="sm" /> Running...</>
              ) : (
                <><PlayIcon className="w-3.5 h-3.5" /> Run</>
              )}
            </button>
            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={submitting || running}
              className="flex items-center gap-1.5 bg-brand-blue hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-mono px-4 py-1.5 rounded-lg transition-colors"
            >
              {submitting ? (
                <><Spinner size="sm" /> Submitting...</>
              ) : (
                <><PaperAirplaneIcon className="w-3.5 h-3.5" /> Submit</>
              )}
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 overflow-hidden min-h-0">
          <Editor
            height="100%"
            language={LANGUAGES.find((l) => l.value === language)?.monacoLang || 'python'}
            value={code}
            onChange={(val) => setCode(val || '')}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
              minimap: { enabled: false },
              lineNumbers: 'on',
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              padding: { top: 12, bottom: 12 },
              renderLineHighlight: 'line',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              tabSize: 4,
            }}
          />
        </div>

        {/* ── Console Panel ─────────────────────────────── */}
        <div className="h-44 flex-shrink-0 border-t border-border-primary flex flex-col">
          {/* Console tab bar */}
          <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-border-primary flex-shrink-0 bg-bg-primary">
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
                {tab === 'output' && runOutput && (
                  <span className={`ml-1.5 w-1.5 h-1.5 rounded-full inline-block ${
                    runOutput.exit_code === 0 ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                )}
              </button>
            ))}
            {running && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-brand-blue font-mono">
                <Spinner size="sm" /> executing…
              </span>
            )}
            {runOutput && !running && (
              <span className="ml-auto text-xs text-text-muted font-mono">
                {runOutput.execution_time_ms}ms · exit {runOutput.exit_code}
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
                  placeholder={`Provide input your code reads via input() / scanf / readline…\nExample: 3 5`}
                  className="flex-1 w-full bg-transparent text-text-primary font-mono text-xs resize-none focus:outline-none placeholder-text-muted"
                  spellCheck={false}
                />
                <p className="text-[10px] text-text-muted font-mono flex-shrink-0">
                  Each line = one input() call. E.g. <code className="bg-bg-hover px-1 rounded">3 5</code> for <code className="bg-bg-hover px-1 rounded">a, b = map(int, input().split())</code>
                </p>
              </div>
            ) : (
              <div className="font-mono text-xs space-y-1">
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
                          <div className="mt-2 px-2 py-1.5 rounded bg-yellow-900/30 border border-yellow-700/40 text-yellow-300 text-[10px] font-mono">
                            💡 Your code calls <code>input()</code> but stdin is empty. Click the <strong>Stdin</strong> tab and type your input (or use <strong>Load into Run</strong> on a sample in the Description tab), then click Run again.
                          </div>
                        )}
                      </>
                    ) : null}
                    {!runOutput.stdout && !runOutput.stderr && (
                      <span className="text-text-muted">(no output)</span>
                    )}
                  </>
                ) : (
                  <span className="text-text-muted">Click Run to see output here.</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ProblemDescription({ problem, onLoadSample }) {
  return (
    <div className="space-y-5">
      {/* Title + meta */}
      <div>
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <h1 className="text-text-primary text-lg font-bold">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        <div className="flex items-center gap-4 text-xs text-text-muted font-mono">
          <span className="flex items-center gap-1.5">
            <ClockIcon className="w-3.5 h-3.5" />
            {problem.time_limit_ms}ms
          </span>
          <span className="flex items-center gap-1.5">
            <CpuChipIcon className="w-3.5 h-3.5" />
            {problem.memory_limit_mb}MB
          </span>
          {problem.category && (
            <span className="bg-bg-tertiary border border-border-primary rounded-full px-2 py-0.5">
              {problem.category.name}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div
        className="prose prose-sm prose-invert max-w-none text-text-secondary leading-relaxed"
        dangerouslySetInnerHTML={{ __html: problem.description }}
      />

      {/* Input / Output format */}
      {problem.input_format && (
        <div>
          <h3 className="text-text-primary font-semibold text-sm mb-2">Input Format</h3>
          <p className="text-text-secondary text-sm font-mono bg-bg-primary p-3 rounded-lg border border-border-secondary whitespace-pre-wrap">
            {problem.input_format}
          </p>
        </div>
      )}
      {problem.output_format && (
        <div>
          <h3 className="text-text-primary font-semibold text-sm mb-2">Output Format</h3>
          <p className="text-text-secondary text-sm font-mono bg-bg-primary p-3 rounded-lg border border-border-secondary whitespace-pre-wrap">
            {problem.output_format}
          </p>
        </div>
      )}

      {/* Constraints */}
      {problem.constraints && (
        <div>
          <h3 className="text-text-primary font-semibold text-sm mb-2">Constraints</h3>
          <p className="text-text-secondary text-sm font-mono bg-bg-primary p-3 rounded-lg border border-border-secondary whitespace-pre-wrap">
            {problem.constraints}
          </p>
        </div>
      )}

      {/* Sample test cases */}
      {problem.sample_test_cases?.map((tc, i) => (
        <div key={tc.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-text-primary font-semibold text-sm">Example {i + 1}</h3>
            {onLoadSample && (
              <button
                onClick={() => onLoadSample(tc.input_data)}
                className="text-[10px] font-mono text-brand-blue hover:text-blue-400 border border-brand-blue/40 hover:border-blue-400 px-2 py-0.5 rounded transition-colors"
                title="Load this input into the Run stdin panel"
              >
                Load into Run
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-text-muted text-xs font-mono mb-1 uppercase">Input</p>
              <pre className="bg-bg-primary border border-border-secondary rounded-lg p-3 text-text-secondary text-xs font-mono overflow-auto">{tc.input_data}</pre>
            </div>
            <div>
              <p className="text-text-muted text-xs font-mono mb-1 uppercase">Output</p>
              <pre className="bg-bg-primary border border-border-secondary rounded-lg p-3 text-text-secondary text-xs font-mono overflow-auto">{tc.expected_output}</pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultTab({ result }) {
  const isAccepted = result.status === 'accepted';
  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-5 border ${isAccepted ? 'bg-green-900/10 border-difficulty-easy' : 'bg-red-900/10 border-difficulty-hard'}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{isAccepted ? '✅' : '❌'}</span>
          <div>
            <StatusBadge status={result.status} />
            <p className="text-text-muted text-xs font-mono mt-1">
              {result.test_cases_passed}/{result.total_test_cases} test cases passed
            </p>
          </div>
        </div>

        {(result.status === 'pending' || result.status === 'running') && (
          <div className="flex items-center gap-2 text-brand-blue text-sm font-mono">
            <Spinner size="sm" /> Judging your code…
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-bg-primary rounded-lg p-3">
            <p className="text-text-muted text-xs font-mono">Runtime</p>
            <p className="text-text-primary font-mono text-sm font-semibold mt-1">
              {formatExecTime(result.execution_time_ms)}
            </p>
          </div>
          <div className="bg-bg-primary rounded-lg p-3">
            <p className="text-text-muted text-xs font-mono">Memory</p>
            <p className="text-text-primary font-mono text-sm font-semibold mt-1">
              {formatMemory(result.memory_used_kb)}
            </p>
          </div>
        </div>

        {result.error_output && (
          <div className="mt-3">
            <p className="text-text-muted text-xs font-mono mb-1 uppercase">Error Output</p>
            <pre className="bg-bg-primary border border-border-secondary rounded-lg p-3 text-red-400 text-xs font-mono overflow-auto max-h-40">
              {result.error_output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function SubmissionsTab({ submissions }) {
  if (submissions.length === 0) {
    return (
      <p className="text-text-muted text-sm text-center py-10 font-mono">
        No submissions yet for this problem.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {submissions.map((sub) => (
        <div key={sub.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-bg-tertiary border border-border-secondary">
          <div className="flex items-center gap-3">
            <StatusBadge status={sub.status} />
            <span className="text-text-muted text-xs font-mono">{sub.language}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted font-mono">
            <span>{formatExecTime(sub.execution_time_ms)}</span>
            <span>{timeAgo(sub.submitted_at)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
