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
  const [activeTab, setActiveTab] = useState('description'); // description | submissions
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [submitting, setSubmitting] = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const [mySubmissions, setMySubmissions] = useState([]);

  useEffect(() => {
    problemsService.getProblem(slug)
      .then(setProblem)
      .catch(() => toast.error('Problem not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang] || '');
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
      toast.error(err.response?.data?.detail || 'Submission failed');
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
            <ProblemDescription problem={problem} />
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
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 bg-brand-blue hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-mono px-4 py-1.5 rounded-lg transition-colors"
            >
              {submitting ? (
                <><Spinner size="sm" /> Submitting...</>
              ) : (
                <><PlayIcon className="w-4 h-4" /> Submit</>
              )}
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 overflow-hidden">
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
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ProblemDescription({ problem }) {
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
      {problem.test_cases?.filter((tc) => tc.is_sample).map((tc, i) => (
        <div key={tc.id} className="space-y-2">
          <h3 className="text-text-primary font-semibold text-sm">Example {i + 1}</h3>
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
