import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';
import {
  Plus, Trophy, Users, Edit3, Trash2, Eye, Key,
  Globe, Lock, Clock, PlayCircle, CheckCircle, FileText,
  Copy, MoreVertical, RefreshCw,
} from 'lucide-react';

const STATUS_CONFIG = {
  draft:    { label: 'Draft',    classes: 'bg-slate-500/10 text-[#64748B] border-slate-500/20' },
  upcoming: { label: 'Upcoming', classes: 'bg-blue-500/10 text-blue-500 border-blue-500/20'   },
  active:   { label: 'Live',     classes: 'bg-green-500/10 text-green-500 border-green-500/20' },
  ended:    { label: 'Ended',    classes: 'bg-slate-400/10 text-[#94A3B8] border-slate-400/20' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

function VisibilityBadge({ visibility }) {
  return visibility === 'private' ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
      <Lock className="w-2.5 h-2.5" /> Private
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
      <Globe className="w-2.5 h-2.5" /> Public
    </span>
  );
}

export default function OrgContestsPage() {
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  const fetchContests = () => {
    setLoading(true);
    axiosInstance
      .get(API_ROUTES.ORG_CONTESTS)
      .then((r) => setContests(r.data?.data?.results || r.data?.results || []))
      .catch(() => toast.error('Failed to load contests.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContests();
  }, []);

  const handleDelete = async (contest) => {
    if (!window.confirm(`Delete "${contest.title}"? This cannot be undone.`)) return;
    setDeleting(contest.id);
    try {
      await axiosInstance.delete(API_ROUTES.ORG_CONTEST_DETAIL(contest.id));
      toast.success('Contest deleted.');
      setContests((prev) => prev.filter((c) => c.id !== contest.id));
    } catch {
      toast.error('Failed to delete contest.');
    } finally {
      setDeleting(null);
    }
  };

  const handleGenerateCode = async (contest) => {
    try {
      const res = await axiosInstance.post(API_ROUTES.ORG_CONTEST_GENERATE_CODE(contest.id));
      const code = res.data?.data?.join_code;
      toast.success(`New join code: ${code}`);
      fetchContests();
    } catch {
      toast.error('Failed to generate code.');
    }
    setOpenMenu(null);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Join code copied!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-[#E2E8F0]">Contests</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {contests.length} contest{contests.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchContests}
            className="w-9 h-9 flex items-center justify-center border border-[#CBD5E1] dark:border-[#334155] rounded-xl text-[#64748B] hover:text-blue-500 hover:border-blue-500 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/organizer/contests/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" />
            New Contest
          </Link>
        </div>
      </div>

      {/* ── Contest Table ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-[#F1F5F9] dark:bg-[#0F172A] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="font-semibold text-[#0F172A] dark:text-[#E2E8F0] mb-2">No contests yet</h3>
            <p className="text-sm text-[#64748B] mb-4">Create your first contest to get started.</p>
            <Link
              to="/organizer/contests/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" /> Create Contest
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-[#64748B] border-b border-[#E2E8F0] dark:border-[#334155]">
                  <th className="px-6 py-4 text-left font-medium">Contest</th>
                  <th className="px-4 py-4 text-left font-medium">Status</th>
                  <th className="px-4 py-4 text-left font-medium">Visibility</th>
                  <th className="px-4 py-4 text-right font-medium">Problems</th>
                  <th className="px-4 py-4 text-right font-medium">Participants</th>
                  <th className="px-4 py-4 text-left font-medium">Start Time</th>
                  <th className="px-4 py-4 text-left font-medium">Join Code</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contests.map((contest) => (
                  <tr
                    key={contest.id}
                    className="border-b border-[#E2E8F0]/50 dark:border-[#334155]/50 last:border-0 hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#0F172A] dark:text-[#E2E8F0] text-sm">
                        {contest.title}
                      </p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {contest.duration_minutes} min
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={contest.status} />
                    </td>
                    <td className="px-4 py-4">
                      <VisibilityBadge visibility={contest.visibility} />
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-[#475569] dark:text-[#94A3B8]">
                      {contest.problem_count}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-[#475569] dark:text-[#94A3B8]">
                      {contest.participant_count}
                    </td>
                    <td className="px-4 py-4 text-xs text-[#475569] dark:text-[#94A3B8]">
                      {new Date(contest.start_time).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-4">
                      {contest.join_code ? (
                        <button
                          onClick={() => copyCode(contest.join_code)}
                          className="flex items-center gap-1.5 text-xs font-mono text-blue-500 hover:text-blue-400 transition-colors"
                        >
                          <Key className="w-3 h-3" />
                          {contest.join_code}
                          <Copy className="w-3 h-3 opacity-50" />
                        </button>
                      ) : (
                        <span className="text-xs text-[#CBD5E1] dark:text-[#334155]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/organizer/contests/${contest.id}/participants`}
                          title="View Participants"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#64748B] hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                        >
                          <Users className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/organizer/contests/${contest.id}/problems`}
                          title="Manage Problems"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#64748B] hover:text-purple-500 hover:bg-purple-500/10 transition-all"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/organizer/contests/${contest.id}/edit`}
                          title="Edit Contest"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#64748B] hover:text-amber-500 hover:bg-amber-500/10 transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleGenerateCode(contest)}
                          title="Regenerate Join Code"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#64748B] hover:text-green-500 hover:bg-green-500/10 transition-all"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contest)}
                          disabled={deleting === contest.id}
                          title="Delete Contest"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#64748B] hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-40"
                        >
                          {deleting === contest.id ? (
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
