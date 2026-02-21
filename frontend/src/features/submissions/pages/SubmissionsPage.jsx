import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { submissionsService } from '../services/submissionsService';
import { StatusBadge, DifficultyBadge } from '@shared/components/ui/Badge';
import { PageLoader } from '@shared/components/ui/Spinner';
import { formatExecTime, formatMemory, timeAgo } from '@shared/utils/formatters';
import EmptyState from '@shared/components/ui/EmptyState';
import { BoltIcon } from '@heroicons/react/24/outline';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  useEffect(() => {
    submissionsService.getMySubmissions({ page, page_size: 20 })
      .then((data) => {
        setSubmissions(data.results || data || []);
        setCount(data.count || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-text-primary text-xl font-bold">My Submissions</h1>
        <p className="text-text-secondary text-sm mt-0.5">{count} total submissions</p>
      </div>

      {/* Table */}
      <div className="bg-bg-card border border-border-primary rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-border-primary text-text-muted text-xs font-mono uppercase tracking-wider">
          <div className="col-span-1">Status</div>
          <div className="col-span-4">Problem</div>
          <div className="col-span-2">Language</div>
          <div className="col-span-2">Runtime</div>
          <div className="col-span-2">Memory</div>
          <div className="col-span-1">Time</div>
        </div>

        {submissions.length === 0 ? (
          <EmptyState
            icon={BoltIcon}
            title="No submissions yet"
            description="Submit a solution to see it here."
            action={<Link to="/problems" className="text-brand-blue text-sm hover:underline">Browse Problems</Link>}
          />
        ) : (
          <div className="divide-y divide-border-secondary">
            {submissions.map((sub) => (
              <div key={sub.id} className="grid grid-cols-12 gap-3 px-5 py-3.5 hover:bg-bg-hover transition-colors">
                <div className="col-span-1 self-center"><StatusBadge status={sub.status} /></div>
                <div className="col-span-4 self-center">
                  <Link
                    to={`/problems/${sub.problem?.slug}`}
                    className="text-text-primary hover:text-brand-blue text-sm transition-colors line-clamp-1"
                  >
                    {sub.problem?.title || 'Unknown'}
                  </Link>
                  {sub.problem?.difficulty && (
                    <div className="mt-0.5">
                      <DifficultyBadge difficulty={sub.problem.difficulty} />
                    </div>
                  )}
                </div>
                <div className="col-span-2 self-center text-text-muted text-xs font-mono uppercase">{sub.language}</div>
                <div className="col-span-2 self-center text-text-secondary text-sm font-mono">{formatExecTime(sub.execution_time_ms)}</div>
                <div className="col-span-2 self-center text-text-secondary text-sm font-mono">{formatMemory(sub.memory_used_kb)}</div>
                <div className="col-span-1 self-center text-text-muted text-xs font-mono">{timeAgo(sub.submitted_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {Math.ceil(count / 20) > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm font-mono text-text-secondary border border-border-primary hover:border-brand-blue hover:text-text-primary rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span className="text-text-muted text-sm font-mono">{page} / {Math.ceil(count / 20)}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(count / 20)}
            className="px-3 py-1.5 text-sm font-mono text-text-secondary border border-border-primary hover:border-brand-blue hover:text-text-primary rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
