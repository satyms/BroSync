import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';
import {
  Plus, Code2, Edit3, Trash2, CheckCircle, XCircle,
  RefreshCw, Search, Filter,
} from 'lucide-react';

const DIFF_CONFIG = {
  easy:   { label: 'Easy',   classes: 'bg-green-500/10 text-green-500 border border-green-500/20' },
  medium: { label: 'Medium', classes: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' },
  hard:   { label: 'Hard',   classes: 'bg-red-500/10   text-red-500   border border-red-500/20'   },
};

export default function OrgProblemsPage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all'); // all | easy | medium | hard

  const fetchProblems = () => {
    setLoading(true);
    axiosInstance
      .get(API_ROUTES.ORG_PROBLEMS)
      .then((r) => setProblems(r.data?.data?.results || r.data?.results || []))
      .catch(() => toast.error('Failed to load problems.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProblems(); }, []);

  const handleDelete = async (problem) => {
    if (!window.confirm(`Delete "${problem.title}"? This cannot be undone.`)) return;
    setDeleting(problem.id);
    try {
      await axiosInstance.delete(API_ROUTES.ORG_PROBLEM_DETAIL(problem.id));
      toast.success('Problem deleted.');
      setProblems((prev) => prev.filter((p) => p.id !== problem.id));
    } catch {
      toast.error('Failed to delete problem.');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = problems.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.difficulty === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-[#E2E8F0]">Problem Bank</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {problems.length} problem{problems.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchProblems}
            className="w-9 h-9 flex items-center justify-center border border-[#CBD5E1] dark:border-[#334155] rounded-xl text-[#64748B] hover:text-blue-500 hover:border-blue-500 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/organizer/problems/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" /> New Problem
          </Link>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl text-sm text-[#0F172A] dark:text-[#E2E8F0] placeholder-[#94A3B8] focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'easy', 'medium', 'hard'].map((f) => {
            const active = filter === f;
            const colors = {
              all: 'bg-blue-500/10 text-blue-500 border-blue-500/40',
              easy: 'bg-green-500/10 text-green-500 border-green-500/40',
              medium: 'bg-amber-500/10 text-amber-500 border-amber-500/40',
              hard: 'bg-red-500/10 text-red-500 border-red-500/40',
            };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold capitalize transition-all duration-200 ${
                  active
                    ? colors[f]
                    : 'border-[#CBD5E1] dark:border-[#334155] text-[#64748B] hover:border-blue-400'
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Problem Table ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-[#F1F5F9] dark:bg-[#0F172A] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Code2 className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="font-semibold text-[#0F172A] dark:text-[#E2E8F0] mb-2">
              {search || filter !== 'all' ? 'No matching problems' : 'No problems yet'}
            </h3>
            <p className="text-sm text-[#64748B] mb-4">
              {search || filter !== 'all'
                ? 'Try a different search or filter.'
                : 'Build your problem bank to use in contests.'}
            </p>
            {!search && filter === 'all' && (
              <Link
                to="/organizer/problems/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" /> Create Problem
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-[#64748B] border-b border-[#E2E8F0] dark:border-[#334155]">
                  <th className="px-6 py-4 text-left font-medium">#</th>
                  <th className="px-4 py-4 text-left font-medium">Title</th>
                  <th className="px-4 py-4 text-left font-medium">Difficulty</th>
                  <th className="px-4 py-4 text-left font-medium">Category</th>
                  <th className="px-4 py-4 text-right font-medium">Submissions</th>
                  <th className="px-4 py-4 text-right font-medium">Acceptance</th>
                  <th className="px-4 py-4 text-center font-medium">Published</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((problem, i) => {
                  const diff = DIFF_CONFIG[problem.difficulty] || DIFF_CONFIG.easy;
                  return (
                    <tr
                      key={problem.id}
                      className="border-b border-[#E2E8F0]/50 dark:border-[#334155]/50 last:border-0 hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]/40 transition-colors"
                    >
                      <td className="px-6 py-3.5 text-xs text-[#64748B] font-mono">{i + 1}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-sm text-[#0F172A] dark:text-[#E2E8F0]">
                          {problem.title}
                        </p>
                        <p className="text-[10px] text-[#64748B] mt-0.5 font-mono">
                          {problem.time_limit_ms}ms · {problem.memory_limit_mb}MB
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diff.classes}`}>
                          {diff.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#475569] dark:text-[#94A3B8]">
                        {problem.category_name || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm text-[#475569] dark:text-[#94A3B8]">
                        {problem.total_submissions}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm">
                        <span
                          className={
                            problem.acceptance_rate >= 50 ? 'text-green-500' : 'text-amber-500'
                          }
                        >
                          {problem.acceptance_rate?.toFixed(1) ?? '0.0'}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {problem.is_published ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#CBD5E1] dark:text-[#334155] mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/organizer/problems/${problem.id}/edit`}
                            title="Edit Problem"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#64748B] hover:text-amber-500 hover:bg-amber-500/10 transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(problem)}
                            disabled={deleting === problem.id}
                            title="Delete Problem"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#64748B] hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-40"
                          >
                            {deleting === problem.id ? (
                              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
