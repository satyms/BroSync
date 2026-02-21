import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';
import { PageLoader } from '@shared/components/ui/Spinner';
import {
  Trophy, Users, Code2, BarChart3, TrendingUp,
  CheckCircle, XCircle, Clock, Plus, ArrowRight, Zap,
} from 'lucide-react';

// ── Simple bar chart component ─────────────────────────────────────────────
function BarChart({ data, labelKey, valueKey, color = 'bg-blue-500', max }) {
  const peak = max || Math.max(...data.map((d) => d[valueKey] || 0), 1);
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-[#64748B] w-28 truncate shrink-0">{item[labelKey]}</span>
          <div className="flex-1 h-6 bg-[#E2E8F0] dark:bg-[#0F172A] rounded-full overflow-hidden">
            <div
              className={`h-full ${color} rounded-full transition-all duration-700 flex items-center justify-end pr-2`}
              style={{ width: `${Math.max(4, (item[valueKey] / peak) * 100)}%` }}
            >
              <span className="text-[10px] font-bold text-white">{item[valueKey]}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, border, glow }) {
  return (
    <div className={`bg-white dark:bg-[#1E293B] border ${border} ${glow} rounded-2xl p-5 shadow-sm`}>
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-[#0F172A] dark:text-[#E2E8F0] font-mono">{value}</p>
      <p className="text-xs text-[#64748B] mt-0.5">{label}</p>
      {sub && <p className="text-xs text-green-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function OrgDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get(API_ROUTES.ORG_DASHBOARD)
      .then((r) => setStats(r.data?.data || r.data))
      .catch(() => toast.error('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!stats)
    return (
      <div className="text-center py-20 text-[#64748B]">
        Could not load dashboard data.
      </div>
    );

  const difficultyData = Object.entries(stats.difficulty_distribution || {}).map(
    ([key, val]) => ({ label: key.charAt(0).toUpperCase() + key.slice(1), count: val })
  );
  const difficultyColors = { easy: 'bg-green-500', medium: 'bg-amber-500', hard: 'bg-red-500' };

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-[#E2E8F0]">
            Organizer Dashboard
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">Manage your contests, problems and participants.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/organizer/contests/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" />
            New Contest
          </Link>
          <Link
            to="/organizer/problems/new"
            className="flex items-center gap-2 px-4 py-2 border border-[#CBD5E1] dark:border-[#334155] text-[#475569] dark:text-[#94A3B8] hover:border-blue-500 hover:text-blue-500 text-sm font-semibold rounded-xl transition-all duration-200"
          >
            <Code2 className="w-4 h-4" />
            New Problem
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Trophy}
          label="Total Contests"
          value={stats.total_contests}
          sub={stats.active_contests > 0 ? `${stats.active_contests} live now` : null}
          color="bg-blue-500/15 text-blue-500"
          border="border-blue-500/20"
          glow="bg-blue-500/3"
        />
        <StatCard
          icon={Users}
          label="Total Participants"
          value={stats.total_participants}
          color="bg-green-500/15 text-green-500"
          border="border-green-500/20"
          glow="bg-green-500/3"
        />
        <StatCard
          icon={Code2}
          label="Problems Created"
          value={stats.total_problems}
          sub={`${stats.published_problems} published`}
          color="bg-purple-500/15 text-purple-500"
          border="border-purple-500/20"
          glow="bg-purple-500/3"
        />
        <StatCard
          icon={BarChart3}
          label="Upcoming Contests"
          value={stats.upcoming_contests}
          color="bg-amber-500/15 text-amber-500"
          border="border-amber-500/20"
          glow="bg-amber-500/3"
        />
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Participation Growth */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0]">
              Participation by Contest
            </h2>
          </div>
          {stats.participation_growth?.length > 0 ? (
            <BarChart
              data={stats.participation_growth}
              labelKey="title"
              valueKey="count"
              color="bg-blue-500"
            />
          ) : (
            <p className="text-sm text-[#64748B] py-6 text-center">No contest data yet.</p>
          )}
        </div>

        {/* Difficulty Distribution */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Code2 className="w-4 h-4 text-purple-500" />
            <h2 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0]">
              Problem Difficulty Breakdown
            </h2>
          </div>
          {difficultyData.length > 0 ? (
            <div className="space-y-4">
              {difficultyData.map(({ label, count }) => {
                const total = difficultyData.reduce((s, d) => s + d.count, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const color = difficultyColors[label.toLowerCase()] || 'bg-blue-500';
                const textColor =
                  label.toLowerCase() === 'easy'
                    ? 'text-green-500'
                    : label.toLowerCase() === 'medium'
                    ? 'text-amber-500'
                    : 'text-red-500';
                return (
                  <div key={label}>
                    <div className="flex justify-between mb-1.5">
                      <span className={`text-xs font-semibold ${textColor}`}>{label}</span>
                      <span className="text-xs text-[#64748B]">{count} · {pct}%</span>
                    </div>
                    <div className="h-2 bg-[#E2E8F0] dark:bg-[#0F172A] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#64748B] py-6 text-center">No problems created yet.</p>
          )}
        </div>
      </div>

      {/* ── Contest Performance ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0]">
              Recent Contest Performance
            </h2>
          </div>
          <Link
            to="/organizer/contests"
            className="text-xs text-blue-500 hover:text-blue-400 font-medium transition-colors"
          >
            View all →
          </Link>
        </div>

        {stats.contest_performance?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-[#64748B] border-b border-[#E2E8F0] dark:border-[#334155]">
                  <th className="pb-3 text-left font-medium">Contest</th>
                  <th className="pb-3 text-right font-medium">Total Submissions</th>
                  <th className="pb-3 text-right font-medium">Accepted</th>
                  <th className="pb-3 text-right font-medium">Acceptance Rate</th>
                </tr>
              </thead>
              <tbody>
                {stats.contest_performance.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#E2E8F0]/50 dark:border-[#334155]/50 last:border-0 hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]/50 transition-colors"
                  >
                    <td className="py-3 font-medium text-[#0F172A] dark:text-[#E2E8F0]">
                      {row.title}
                    </td>
                    <td className="py-3 text-right text-[#475569] dark:text-[#94A3B8]">
                      {row.total_submissions}
                    </td>
                    <td className="py-3 text-right text-green-500 font-medium">
                      {row.accepted}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`font-semibold ${
                          row.acceptance_rate >= 50 ? 'text-green-500' : 'text-amber-500'
                        }`}
                      >
                        {row.acceptance_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="w-10 h-10 text-[#CBD5E1] dark:text-[#334155] mx-auto mb-3" />
            <p className="text-sm text-[#64748B]">
              No contests yet.{' '}
              <Link to="/organizer/contests/new" className="text-blue-500 hover:text-blue-400">
                Create your first contest
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* ── Quick Links ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/organizer/contests',    icon: Trophy,   label: 'Manage Contests',   color: 'text-blue-500',   bg: 'bg-blue-500/10'   },
          { to: '/organizer/problems',    icon: Code2,    label: 'Problem Bank',       color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { to: '/organizer/profile',     icon: BarChart3, label: 'Org Profile',       color: 'text-green-500',  bg: 'bg-green-500/10'  },
        ].map(({ to, icon: Icon, label, color, bg }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl hover:border-blue-500 transition-all duration-200 group"
          >
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <span className="text-sm font-medium text-[#0F172A] dark:text-[#E2E8F0] group-hover:text-blue-500 transition-colors">
              {label}
            </span>
            <ArrowRight className="w-4 h-4 text-[#CBD5E1] dark:text-[#334155] ml-auto group-hover:text-blue-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
