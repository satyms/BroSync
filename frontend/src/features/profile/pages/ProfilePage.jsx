import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';
import { battlesService } from '@features/battles/services/battlesService';
import { DifficultyBadge, StatusBadge } from '@shared/components/ui/Badge';
import { PageLoader } from '@shared/components/ui/Spinner';
import { formatDate, formatNumber, timeAgo } from '@shared/utils/formatters';
import ActivityMatrix from '@features/dashboard/components/ActivityMatrix';
import StatsDonut from '@features/dashboard/components/StatsDonut';
import BadgesShowcase from '../components/BadgesShowcase';
import { useSelector } from 'react-redux';
import { CalendarDaysIcon, ChatBubbleLeftIcon, TrophyIcon, BoltIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { username } = useParams();
  const currentUser = useSelector((s) => s.auth.user);
  const [profile, setProfile] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [battleHistory, setBattleHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState({});
  const [activityLoading, setActivityLoading] = useState(true);

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    setLoading(true);
    setActivityLoading(true);

    // For own profile use /auth/profile/, for others use /auth/users/<username>/profile/
    const profileRequest = isOwnProfile
      ? axiosInstance.get(API_ROUTES.PROFILE)
      : axiosInstance.get(`/auth/users/${username}/profile/`);

    profileRequest
      .then((r) => {
        const user = r.data?.data || r.data;
        setProfile(user);

        // Fetch recent submissions — own = /submissions/me/, others = /submissions/all/?username=
        const subsUrl = isOwnProfile
          ? `${API_ROUTES.MY_SUBMISSIONS}?limit=10`
          : `${API_ROUTES.ALL_SUBMISSIONS}?username=${username}&limit=10`;
        return axiosInstance.get(subsUrl);
      })
      .then((r) => {
        const payload = r.data?.data || r.data;
        setSubmissions(payload?.results || payload || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch battle history (own profile only)
    if (isOwnProfile) {
      battlesService.getBattleHistory()
        .then((data) => setBattleHistory(data))
        .catch(() => {});
    }
  }, [username, isOwnProfile]);

  if (loading) return <PageLoader />;
  if (!profile) return <div className="text-center py-20 text-text-muted">Profile not found.</div>;

  const totalSolved = profile.problems_solved || 0;
  const easy = Math.round(totalSolved * 0.44);
  const medium = Math.round(totalSolved * 0.44);
  const hard = totalSolved - easy - medium;

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
      {/* ── Profile Header ────────────────────────────────── */}
      <div className="bg-bg-card border border-border-primary rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-blue to-accent-purple flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              : (profile.first_name?.[0] || profile.username?.[0] || '?').toUpperCase()
            }
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-text-primary text-xl font-bold">
                  {profile.first_name || profile.last_name
                    ? `${profile.first_name} ${profile.last_name}`.trim()
                    : profile.username}
                </h1>
                <p className="text-brand-blue font-mono text-sm">@{profile.username}</p>
              </div>
              {isOwnProfile && (
                <Link
                  to="/settings"
                  className="text-xs text-text-secondary hover:text-brand-blue border border-border-primary hover:border-brand-blue rounded-lg px-3 py-1.5 font-mono transition-colors"
                >
                  Edit Profile
                </Link>
              )}
            </div>

            {profile.bio && (
              <p className="text-text-secondary text-sm mt-2 max-w-lg">{profile.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-text-muted font-mono">
              <span className="flex items-center gap-1.5">
                <CalendarDaysIcon className="w-3.5 h-3.5" />
                Joined {formatDate(profile.date_joined)}
              </span>
              {profile.rating > 0 && (
                <span className="text-brand-blue font-semibold">⚡ Rating: {formatNumber(profile.rating)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-6 flex items-center justify-center">
          <StatsDonut easy={easy} medium={medium} hard={hard} total={totalSolved} />
        </div>

        {/* Quick stats */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-6 grid grid-cols-2 gap-4">
          {[
            { label: 'Problems Solved', value: formatNumber(profile.problems_solved || 0), color: 'text-brand-blue' },
            { label: 'Contests', value: formatNumber(profile.contests_participated || 0), color: 'text-brand-orange' },
            { label: 'Rating', value: formatNumber(profile.rating || 0), color: 'text-accent-purple' },
            { label: 'Level', value: `${Math.floor((profile.rating || 0) / 100)}`, color: 'text-difficulty-easy' },
            { label: 'Battles Fought', value: formatNumber(profile.battles_played || 0), color: 'text-red-400' },
            { label: 'Battles Won', value: formatNumber(profile.battles_won || 0), color: 'text-green-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-bg-tertiary border border-border-secondary rounded-xl p-4">
              <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
              <p className="text-text-muted text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Badges ──────────────────────────────────── */}
      <div className="bg-bg-card border border-border-primary rounded-2xl p-6">
        <BadgesShowcase
          profile={profile}
          activityData={activityData}
          submissions={submissions}
        />
      </div>

      {/* ── Activity Matrix ───────────────────────────────── */}
      <div className="bg-bg-card border border-border-primary rounded-2xl p-6">
        <h2 className="text-text-secondary font-mono text-xs tracking-widest mb-4 uppercase">Activity — Last 12 Months</h2>
        <ActivityMatrix data={activityData} loading={activityLoading} />
      </div>

      {/* Battle History */}
      {isOwnProfile && (
        <div className="bg-bg-card border border-border-primary rounded-2xl p-6">
          <h2 className="text-text-secondary font-mono text-xs tracking-widest mb-4 uppercase flex items-center gap-2">
            <BoltIcon className="w-3.5 h-3.5" />
            Battle History
          </h2>
          {battleHistory.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-8 font-mono">No battles yet. Go challenge someone! ⚔️</p>
          ) : (
            <div className="space-y-2">
              {battleHistory.map((b) => {
                const resultColor =
                  b.result === 'win'  ? 'text-green-400 border-green-800 bg-green-900/20' :
                  b.result === 'loss' ? 'text-red-400 border-red-800 bg-red-900/20' :
                                        'text-yellow-400 border-yellow-800 bg-yellow-900/20';
                const resultLabel =
                  b.result === 'win' ? '⚡ Win' : b.result === 'loss' ? '❌ Loss' : '🤝 Draw';
                return (
                  <div key={b.battle_id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-bg-tertiary border border-border-secondary hover:border-border-primary transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-md border ${resultColor}`}>
                        {resultLabel}
                      </span>
                      <div>
                        <p className="text-text-primary text-sm font-medium">
                          vs <span className="text-brand-blue">@{b.opponent}</span>
                        </p>
                        <p className="text-text-muted text-xs font-mono">
                          {b.difficulty} · {b.my_solved} solved · {b.my_score} pts
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-text-primary text-sm font-mono font-semibold">
                        <span className={b.my_score >= b.opponent_score ? 'text-green-400' : 'text-red-400'}>{b.my_score}</span>
                        {' – '}
                        <span className={b.opponent_score > b.my_score ? 'text-green-400' : 'text-text-muted'}>{b.opponent_score}</span>
                      </p>
                      <p className="text-text-muted text-[10px] font-mono">
                        {b.ended_at ? timeAgo(b.ended_at) : '—'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recent Submissions */}
      <div className="bg-bg-card border border-border-primary rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-text-secondary font-mono text-xs tracking-widest uppercase">Recent Submissions</h2>
          {isOwnProfile && (
            <Link to="/submissions" className="text-xs text-brand-blue hover:text-blue-400 font-medium transition-colors">
              View all →
            </Link>
          )}
        </div>
        {submissions.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8 font-mono">No submissions yet.</p>
        ) : (
          <div className="space-y-1">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-bg-hover transition-colors duration-150"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StatusBadge status={sub.status} />
                  <Link
                    to={`/problems/${sub.problem_slug}`}
                    className="text-text-primary text-sm hover:text-brand-blue transition-colors truncate font-medium"
                  >
                    {sub.problem_title || 'Unknown Problem'}
                  </Link>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted font-mono flex-shrink-0">
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
