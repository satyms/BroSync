import { useMemo, useState } from 'react';

/**
 * Badge definition schema:
 *  id         – unique key
 *  icon       – emoji
 *  name       – display name
 *  desc       – what it represents
 *  tier       – 'bronze' | 'silver' | 'gold' | 'diamond' | 'special'
 *  check(s)   – fn(stats) → boolean  (earned?)
 *  progress(s)– fn(stats) → { value, max } for progress bar
 */
const BADGE_DEFS = [
  // ── Solver track ──────────────────────────────────────────────────
  {
    id: 'first_blood',
    icon: '🩸',
    name: 'First Blood',
    desc: 'Solved your very first problem',
    tier: 'bronze',
    check: (s) => s.solved >= 1,
    progress: (s) => ({ value: Math.min(s.solved, 1), max: 1 }),
  },
  {
    id: 'problem_solver',
    icon: '⚡',
    name: 'Problem Solver',
    desc: 'Solved 10 problems',
    tier: 'bronze',
    check: (s) => s.solved >= 10,
    progress: (s) => ({ value: Math.min(s.solved, 10), max: 10 }),
  },
  {
    id: 'grinder',
    icon: '🔩',
    name: 'Grinder',
    desc: 'Solved 50 problems',
    tier: 'silver',
    check: (s) => s.solved >= 50,
    progress: (s) => ({ value: Math.min(s.solved, 50), max: 50 }),
  },
  {
    id: 'century',
    icon: '💯',
    name: 'Century',
    desc: 'Solved 100 problems',
    tier: 'gold',
    check: (s) => s.solved >= 100,
    progress: (s) => ({ value: Math.min(s.solved, 100), max: 100 }),
  },
  {
    id: 'legend',
    icon: '👑',
    name: 'Legend',
    desc: 'Solved 500 problems',
    tier: 'diamond',
    check: (s) => s.solved >= 500,
    progress: (s) => ({ value: Math.min(s.solved, 500), max: 500 }),
  },

  // ── Contest track ─────────────────────────────────────────────────
  {
    id: 'rookie',
    icon: '🎯',
    name: 'Rookie',
    desc: 'Joined your first contest',
    tier: 'bronze',
    check: (s) => s.contests >= 1,
    progress: (s) => ({ value: Math.min(s.contests, 1), max: 1 }),
  },
  {
    id: 'contender',
    icon: '🏅',
    name: 'Contender',
    desc: 'Competed in 5 contests',
    tier: 'silver',
    check: (s) => s.contests >= 5,
    progress: (s) => ({ value: Math.min(s.contests, 5), max: 5 }),
  },
  {
    id: 'champion',
    icon: '🏆',
    name: 'Champion',
    desc: 'Competed in 25 contests',
    tier: 'gold',
    check: (s) => s.contests >= 25,
    progress: (s) => ({ value: Math.min(s.contests, 25), max: 25 }),
  },

  // ── Rating track ───────────────────────────────────────────────────
  {
    id: 'rated',
    icon: '📊',
    name: 'Rated',
    desc: 'Earned a rating above 0',
    tier: 'bronze',
    check: (s) => s.rating > 0,
    progress: (s) => ({ value: Math.min(s.rating, 1), max: 1 }),
  },
  {
    id: 'silver_coder',
    icon: '🥈',
    name: 'Silver Coder',
    desc: 'Reached rating 500',
    tier: 'silver',
    check: (s) => s.rating >= 500,
    progress: (s) => ({ value: Math.min(s.rating, 500), max: 500 }),
  },
  {
    id: 'gold_coder',
    icon: '🥇',
    name: 'Gold Coder',
    desc: 'Reached rating 1000',
    tier: 'gold',
    check: (s) => s.rating >= 1000,
    progress: (s) => ({ value: Math.min(s.rating, 1000), max: 1000 }),
  },
  {
    id: 'elite',
    icon: '💎',
    name: 'Elite',
    desc: 'Reached rating 2000',
    tier: 'diamond',
    check: (s) => s.rating >= 2000,
    progress: (s) => ({ value: Math.min(s.rating, 2000), max: 2000 }),
  },

  // ── Streak track ──────────────────────────────────────────────────
  {
    id: 'week_warrior',
    icon: '🔥',
    name: 'Week Warrior',
    desc: '7-day submission streak',
    tier: 'bronze',
    check: (s) => s.streak >= 7,
    progress: (s) => ({ value: Math.min(s.streak, 7), max: 7 }),
  },
  {
    id: 'month_machine',
    icon: '🌋',
    name: 'Month Machine',
    desc: '30-day submission streak',
    tier: 'gold',
    check: (s) => s.streak >= 30,
    progress: (s) => ({ value: Math.min(s.streak, 30), max: 30 }),
  },
  {
    id: 'unstoppable',
    icon: '⚔️',
    name: 'Unstoppable',
    desc: '100-day submission streak',
    tier: 'diamond',
    check: (s) => s.streak >= 100,
    progress: (s) => ({ value: Math.min(s.streak, 100), max: 100 }),
  },

  // ── Activity track ────────────────────────────────────────────────
  {
    id: 'regular',
    icon: '📅',
    name: 'Regular',
    desc: 'Active on 30 different days',
    tier: 'bronze',
    check: (s) => s.activeDays >= 30,
    progress: (s) => ({ value: Math.min(s.activeDays, 30), max: 30 }),
  },
  {
    id: 'dedicated',
    icon: '🎖️',
    name: 'Dedicated',
    desc: 'Active on 100 different days',
    tier: 'silver',
    check: (s) => s.activeDays >= 100,
    progress: (s) => ({ value: Math.min(s.activeDays, 100), max: 100 }),
  },
  {
    id: 'veteran',
    icon: '🦅',
    name: 'Veteran',
    desc: 'Active on 200 different days',
    tier: 'gold',
    check: (s) => s.activeDays >= 200,
    progress: (s) => ({ value: Math.min(s.activeDays, 200), max: 200 }),
  },

  // ── Special ───────────────────────────────────────────────────────
  {
    id: 'polyglot',
    icon: '🌐',
    name: 'Polyglot',
    desc: 'Submitted in 3+ languages',
    tier: 'special',
    check: (s) => s.languages >= 3,
    progress: (s) => ({ value: Math.min(s.languages, 3), max: 3 }),
  },
  {
    id: 'all_rounder',
    icon: '🎪',
    name: 'All-Rounder',
    desc: 'Solved problems AND competed in contests AND earned rating',
    tier: 'special',
    check: (s) => s.solved >= 10 && s.contests >= 1 && s.rating > 0,
    progress: (s) => ({
      value: (s.solved >= 10 ? 1 : 0) + (s.contests >= 1 ? 1 : 0) + (s.rating > 0 ? 1 : 0),
      max: 3,
    }),
  },
];

// Tier visual config
const TIER = {
  bronze: {
    ring: 'ring-amber-700/60',
    glow: 'shadow-amber-700/20',
    bg: 'from-amber-950/80 to-amber-900/40',
    label: 'bg-amber-800/60 text-amber-300',
    bar: 'bg-amber-500',
    text: 'text-amber-400',
  },
  silver: {
    ring: 'ring-slate-400/60',
    glow: 'shadow-slate-400/20',
    bg: 'from-slate-800/80 to-slate-700/40',
    label: 'bg-slate-600/60 text-slate-200',
    bar: 'bg-slate-300',
    text: 'text-slate-300',
  },
  gold: {
    ring: 'ring-yellow-400/70',
    glow: 'shadow-yellow-400/30',
    bg: 'from-yellow-950/80 to-yellow-900/40',
    label: 'bg-yellow-700/60 text-yellow-200',
    bar: 'bg-yellow-400',
    text: 'text-yellow-400',
  },
  diamond: {
    ring: 'ring-cyan-400/70',
    glow: 'shadow-cyan-400/30',
    bg: 'from-cyan-950/80 to-cyan-900/40',
    label: 'bg-cyan-700/60 text-cyan-200',
    bar: 'bg-cyan-400',
    text: 'text-cyan-400',
  },
  special: {
    ring: 'ring-fuchsia-500/70',
    glow: 'shadow-fuchsia-500/30',
    bg: 'from-fuchsia-950/80 to-purple-900/40',
    label: 'bg-fuchsia-700/60 text-fuchsia-200',
    bar: 'bg-fuchsia-400',
    text: 'text-fuchsia-400',
  },
};

function computeStats({ profile, activityData, submissions }) {
  const activeDays = Object.values(activityData).filter((v) => v > 0).length;

  // current consecutive streak
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (activityData[key] > 0) streak++;
    else break;
  }

  // unique languages from recent submissions
  const languages = new Set(submissions.map((s) => s.language).filter(Boolean)).size;

  return {
    solved: profile.problems_solved || 0,
    contests: profile.contests_participated || 0,
    rating: profile.rating || 0,
    activeDays,
    streak,
    languages,
  };
}

function BadgeCard({ def, earned, progress }) {
  const [hovered, setHovered] = useState(false);
  const t = TIER[def.tier];
  const pct = Math.round((progress.value / progress.max) * 100);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card */}
      <div
        className={`
          relative rounded-2xl p-4 flex flex-col items-center gap-2 text-center border transition-all duration-300 select-none cursor-default
          ${earned
            ? `bg-gradient-to-b ${t.bg} ring-2 ${t.ring} shadow-lg ${t.glow}`
            : 'bg-[#0F172A] border-[#1E293B] opacity-40 grayscale'}
        `}
      >
        {/* Earned glow pulse */}
        {earned && (
          <div className={`absolute inset-0 rounded-2xl ring-2 ${t.ring} animate-pulse pointer-events-none opacity-30`} />
        )}

        {/* Icon */}
        <div className="text-3xl leading-none mt-1">{def.icon}</div>

        {/* Name */}
        <p className={`text-xs font-bold leading-tight ${earned ? 'text-white' : 'text-[#475569]'}`}>
          {def.name}
        </p>

        {/* Tier pill */}
        <span className={`text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${earned ? t.label : 'bg-[#1E293B] text-[#334155]'}`}>
          {def.tier}
        </span>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full bg-[#1E293B] overflow-hidden mt-1">
          <div
            className={`h-full rounded-full transition-all duration-700 ${earned ? t.bar : 'bg-[#334155]'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Lock icon for unearned */}
        {!earned && (
          <div className="absolute top-2 right-2 text-[#334155] text-xs">🔒</div>
        )}
      </div>

      {/* Tooltip */}
      {hovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-44 pointer-events-none">
          <div className="bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2.5 shadow-2xl">
            <p className="text-white text-xs font-semibold mb-0.5">{def.name}</p>
            <p className="text-[#94A3B8] text-[11px] leading-snug mb-2">{def.desc}</p>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className={earned ? t.text : 'text-[#64748B]'}>
                {progress.value} / {progress.max}
              </span>
              <span className={earned ? t.text : 'text-[#64748B]'}>
                {earned ? '✓ Earned' : `${pct}%`}
              </span>
            </div>
          </div>
          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-[#0F172A] border-r border-b border-[#334155] rotate-45 -mt-1" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function BadgesShowcase({ profile, activityData, submissions }) {
  const stats = useMemo(
    () => computeStats({ profile, activityData, submissions }),
    [profile, activityData, submissions],
  );

  const badges = useMemo(
    () => BADGE_DEFS.map((def) => ({
      def,
      earned: def.check(stats),
      progress: def.progress(stats),
    })),
    [stats],
  );

  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-secondary font-mono text-xs tracking-widest uppercase">
          Badges
        </h2>
        <span className="text-xs font-mono text-[#64748B]">
          <span className="text-white font-semibold">{earned.length}</span>
          <span className="text-[#475569]"> / {badges.length} earned</span>
        </span>
      </div>

      {/* Earned */}
      {earned.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] text-[#64748B] uppercase tracking-widest font-mono mb-3">Earned</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {earned.map(({ def, earned: e, progress }) => (
              <BadgeCard key={def.id} def={def} earned={e} progress={progress} />
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <p className="text-[10px] text-[#64748B] uppercase tracking-widest font-mono mb-3">Locked</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {locked.map(({ def, earned: e, progress }) => (
              <BadgeCard key={def.id} def={def} earned={e} progress={progress} />
            ))}
          </div>
        </div>
      )}

      {earned.length === 0 && locked.length === 0 && (
        <p className="text-text-muted text-sm text-center py-8 font-mono">No badges yet. Start solving!</p>
      )}
    </div>
  );
}
