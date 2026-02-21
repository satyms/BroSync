import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useProblems } from '../hooks/useProblems';
import { DifficultyBadge } from '@shared/components/ui/Badge';
import { Spinner } from '@shared/components/ui/Spinner';
import { formatRate, formatNumber } from '@shared/utils/formatters';
import EmptyState from '@shared/components/ui/EmptyState';

const DIFFICULTY_OPTIONS = ['', 'easy', 'medium', 'hard'];
const DIFFICULTY_LABELS = { '': 'All', easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export default function ProblemsPage() {
  const {
    problems, loading, count, page, setPage,
    search, difficulty, category, categories,
    setFilter,
  } = useProblems();
  const [showFilters, setShowFilters] = useState(false);

  const totalPages = Math.ceil(count / 20);

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-text-primary text-xl font-bold">Problems</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {formatNumber(count)} problems available
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary border border-border-primary hover:border-brand-blue rounded-lg px-3 py-2 transition-colors font-mono"
        >
          <FunnelIcon className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* ── Search + Filters ─────────────────────────────── */}
      <div className="bg-bg-card border border-border-primary rounded-xl p-4 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search problems by title..."
            defaultValue={search}
            className="w-full bg-bg-primary border border-border-primary rounded-lg pl-9 pr-4 py-2.5 text-sm text-text-primary font-mono placeholder-text-muted focus:outline-none focus:border-brand-blue transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Enter') setFilter('search', e.target.value.trim());
            }}
            onChange={(e) => {
              if (!e.target.value) setFilter('search', '');
            }}
          />
        </div>

        {/* Filter chips */}
        {showFilters && (
          <div className="flex flex-wrap gap-4 pt-1 border-t border-border-secondary">
            {/* Difficulty */}
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-xs font-mono">DIFFICULTY</span>
              <div className="flex gap-1">
                {DIFFICULTY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setFilter('difficulty', d)}
                    className={`text-xs font-mono px-3 py-1 rounded-full border transition-colors
                      ${difficulty === d
                        ? 'bg-brand-blue text-white border-brand-blue'
                        : 'text-text-secondary border-border-primary hover:border-brand-blue hover:text-text-primary'
                      }`}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-text-muted text-xs font-mono">CATEGORY</span>
                <select
                  value={category}
                  onChange={(e) => setFilter('category', e.target.value)}
                  className="bg-bg-primary border border-border-primary text-text-primary text-xs font-mono rounded-lg px-2 py-1 focus:outline-none focus:border-brand-blue"
                >
                  <option value="">All</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="bg-bg-card border border-border-primary rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border-primary text-text-muted text-xs font-mono tracking-wider uppercase">
          <div className="col-span-1">#</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-2">Difficulty</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2 text-right">Acceptance</div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="md" />
          </div>
        ) : problems.length === 0 ? (
          <EmptyState
            title="No problems found"
            description="Try adjusting your filters or search query."
          />
        ) : (
          <div className="divide-y divide-border-secondary">
            {problems.map((problem, idx) => (
              <ProblemRow
                key={problem.id}
                problem={problem}
                index={(page - 1) * 20 + idx + 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm font-mono text-text-secondary border border-border-primary hover:border-brand-blue hover:text-text-primary rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span className="text-text-muted text-sm font-mono px-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm font-mono text-text-secondary border border-border-primary hover:border-brand-blue hover:text-text-primary rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Row component ──────────────────────────────────────────────────────────
function ProblemRow({ problem, index }) {
  return (
    <div className="grid grid-cols-12 gap-4 px-5 py-3.5 hover:bg-bg-hover transition-colors group">
      <div className="col-span-1 text-text-muted text-sm font-mono self-center">{index}</div>
      <div className="col-span-5 self-center flex items-center gap-2">
        {problem.solved_by_user && (
          <CheckCircleIcon className="w-4 h-4 text-difficulty-easy flex-shrink-0" />
        )}
        <Link
          to={`/problems/${problem.slug}`}
          className="text-text-primary hover:text-brand-blue text-sm font-medium transition-colors line-clamp-1"
        >
          {problem.title}
        </Link>
      </div>
      <div className="col-span-2 self-center">
        <DifficultyBadge difficulty={problem.difficulty} />
      </div>
      <div className="col-span-2 self-center text-text-muted text-sm truncate">
        {problem.category?.name || '—'}
      </div>
      <div className="col-span-2 self-center text-right">
        <span className="text-text-secondary text-sm font-mono">
          {formatRate(problem.acceptance_rate)}
        </span>
      </div>
    </div>
  );
}
