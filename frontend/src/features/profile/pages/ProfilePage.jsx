import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';
import { DifficultyBadge, StatusBadge } from '@shared/components/ui/Badge';
import { PageLoader } from '@shared/components/ui/Spinner';
import { formatDate, formatNumber, timeAgo } from '@shared/utils/formatters';
import ActivityMatrix from '@features/dashboard/components/ActivityMatrix';
import StatsDonut from '@features/dashboard/components/StatsDonut';
import { useSelector } from 'react-redux';
import { CalendarDaysIcon, ChatBubbleLeftIcon, TrophyIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { username } = useParams();
  const currentUser = useSelector((s) => s.auth.user);
  const [profile, setProfile] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    setLoading(true);
    // Fetch profile by username - fallback to own profile
    const request = isOwnProfile
      ? axiosInstance.get(API_ROUTES.PROFILE)
      : axiosInstance.get(`/auth/users/?username=${username}`);

    request
      .then((r) => {
        const user = r.data?.results?.[0] || r.data;
        setProfile(user);
        // Fetch their recent submissions
        return axiosInstance.get(API_ROUTES.SUBMISSIONS + `?user=${user.id}&limit=10`);
      })
      .then((r) => setSubmissions(r.data.results || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
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
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-bg-tertiary border border-border-secondary rounded-xl p-4">
              <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
              <p className="text-text-muted text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Activity Matrix ───────────────────────────────── */}
      <div className="bg-bg-card border border-border-primary rounded-2xl p-6">
        <h2 className="text-text-secondary font-mono text-xs tracking-widest mb-4 uppercase">Activity</h2>
        <ActivityMatrix />
      </div>

      {/* ── Recent Submissions ────────────────────────────── */}
      <div className="bg-bg-card border border-border-primary rounded-2xl p-6">
        <h2 className="text-text-secondary font-mono text-xs tracking-widest mb-4 uppercase">Recent Submissions</h2>
        {submissions.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8 font-mono">No submissions yet.</p>
        ) : (
          <div className="space-y-2">
            {submissions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-bg-hover transition-colors">
                <div className="flex items-center gap-3">
                  <StatusBadge status={sub.status} />
                  <Link to={`/problems/${sub.problem?.slug}`} className="text-text-primary text-sm hover:text-brand-blue transition-colors">
                    {sub.problem?.title || 'Unknown'}
                  </Link>
                  {sub.problem?.difficulty && <DifficultyBadge difficulty={sub.problem.difficulty} />}
                </div>
                <span className="text-text-muted text-xs font-mono">{timeAgo(sub.submitted_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
