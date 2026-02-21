import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';
import { PageLoader } from '@shared/components/ui/Spinner';
import { formatNumber, timeAgo } from '@shared/utils/formatters';
import { StatusBadge } from '@shared/components/ui/Badge';
import ActivityMatrix from '../components/ActivityMatrix';
import StatsDonut from '../components/StatsDonut';
import { Code2, Trophy, BarChart3, Star } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useSelector((s) => s.auth);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(API_ROUTES.MY_SUBMISSIONS + '?limit=8')
      .then((r) => setSubmissions(r.data?.results || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return <PageLoader />;

  const level = Math.floor((user.rating || 0) / 100);
  const xp = user.rating || 0;

  const totalSolved = user.problems_solved || 0;
  const easy = Math.round(totalSolved * 0.44);
  const medium = Math.round(totalSolved * 0.44);
  const hard = totalSolved - easy - medium;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">

      {/* ── Hero Stats Card ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-6 lg:p-8 shadow-sm dark:shadow-none">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Donut */}
          <div className="flex-shrink-0">
            <StatsDonut easy={easy} medium={medium} hard={hard} total={totalSolved} />
          </div>

          {/* Right stats */}
          <div className="flex-1 w-full space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[#0F172A] dark:text-[#E2E8F0] text-xl font-bold">
                  {user.full_name || user.username}
                </h1>
                <p className="text-blue-500 font-mono text-sm">@{user.username}</p>
              </div>
              <Link
                to={`/profile/${user.username}`}
                className="text-xs text-[#475569] dark:text-[#94A3B8] hover:text-blue-500 border border-[#CBD5E1] dark:border-[#334155] hover:border-blue-500 rounded-lg px-3 py-1.5 transition-all duration-200"
              >
                View Profile
              </Link>
            </div>

            {/* Difficulty bars */}
            <div className="space-y-3">
              <DifficultyBar label="Easy"   solved={easy}   total={680}  barColor="bg-green-500" textColor="text-green-500" />
              <DifficultyBar label="Medium" solved={medium} total={1350} barColor="bg-amber-500" textColor="text-amber-500" />
              <DifficultyBar label="Hard"   solved={hard}   total={420}  barColor="bg-red-500"   textColor="text-red-500"   />
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <StatCard
                icon={<BarChart3 className="w-4 h-4 text-[#64748B]" />}
                label="Global Ranking"
                value={`#${formatNumber(Math.max(1, 50000 - xp))}`}
                sub={`Top ${Math.max(1, Math.round((1 - xp / 50000) * 100))}%`}
              />
              <StatCard
                icon={<Star className="w-4 h-4 text-[#64748B]" />}
                label="Tactical XP"
                value={formatNumber(xp)}
                sub={`Level ${level}`}
                valueClass="text-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Stats Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStatCard
          icon={<Code2 className="w-5 h-5 text-blue-500" />}
          label="Problems Solved"
          value={user.problems_solved || 0}
          accent="text-blue-500"
          border="border-blue-500/20"
          glow="bg-blue-500/5"
        />
        <MiniStatCard
          icon={<Trophy className="w-5 h-5 text-amber-500" />}
          label="Contests"
          value={user.contests_participated || 0}
          accent="text-amber-500"
          border="border-amber-500/20"
          glow="bg-amber-500/5"
        />
        <MiniStatCard
          icon={<BarChart3 className="w-5 h-5 text-purple-500" />}
          label="Rating"
          value={user.rating || 0}
          accent="text-purple-500"
          border="border-purple-500/20"
          glow="bg-purple-500/5"
        />
        <MiniStatCard
          icon={<Star className="w-5 h-5 text-green-500" />}
          label="Level"
          value={level}
          accent="text-green-500"
          border="border-green-500/20"
          glow="bg-green-500/5"
        />
      </div>

      {/* ── Activity Matrix ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-6 shadow-sm dark:shadow-none">
        <h2 className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] tracking-widest uppercase mb-4">
          Activity — Last 12 Months
        </h2>
        <ActivityMatrix />
      </div>

      {/* ── Recent Submissions ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-6 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] tracking-widest uppercase">
            Recent Submissions
          </h2>
          <Link to="/submissions" className="text-xs text-blue-500 hover:text-blue-400 font-medium transition-colors">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-[#F1F5F9] dark:bg-[#0F172A] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <p className="text-[#64748B] text-sm text-center py-8">
            No submissions yet.{' '}
            <Link to="/problems" className="text-blue-500 hover:text-blue-400">
              Solve a problem!
            </Link>
          </p>
        ) : (
          <div className="space-y-1">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[#E2E8F0]/60 dark:hover:bg-[#334155]/40 transition-colors duration-150"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StatusBadge status={sub.status} />
                  <Link
                    to={`/problems/${sub.problem?.slug}`}
                    className="text-[#0F172A] dark:text-[#E2E8F0] text-sm hover:text-blue-500 transition-colors truncate font-medium"
                  >
                    {sub.problem?.title || 'Unknown Problem'}
                  </Link>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#64748B] font-mono flex-shrink-0">
                  <span className="hidden sm:inline">{sub.language}</span>
                  <span>{timeAgo(sub.submitted_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function DifficultyBar({ label, solved, total, barColor, textColor }) {
  const pct = total > 0 ? Math.min(100, (solved / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[#64748B] text-xs w-14">{label}</span>
      <div className="flex-1 h-1.5 bg-[#E2E8F0] dark:bg-[#0F172A] rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs w-20 text-right">
        <span className={`${textColor} font-bold`}>{solved}</span>
        <span className="text-[#64748B]"> / {total}</span>
      </span>
    </div>
  );
}

function StatCard({ icon, label, value, sub, valueClass = 'text-[#0F172A] dark:text-[#E2E8F0]' }) {
  return (
    <div className="bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl p-4 border border-[#CBD5E1]/70 dark:border-[#334155]/70">
      <div className="flex items-center gap-2 text-[#64748B] text-xs mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <p className={`text-2xl font-bold font-mono ${valueClass}`}>{value}</p>
      {sub && <p className="text-[#64748B] text-xs mt-1">{sub}</p>}
    </div>
  );
}

function MiniStatCard({ icon, label, value, accent, border, glow }) {
  return (
    <div className={`rounded-xl border ${border} ${glow} p-4 bg-white dark:bg-[#1E293B] shadow-sm dark:shadow-none transition-all duration-300 hover:scale-105`}>
      <div className="mb-3">{icon}</div>
      <p className={`text-2xl font-bold font-mono ${accent}`}>{formatNumber(value)}</p>
      <p className="text-[#64748B] text-xs mt-1">{label}</p>
    </div>
  );
}
