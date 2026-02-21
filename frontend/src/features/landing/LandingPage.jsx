import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '@store/uiSlice';
import {
  Code2, Sun, Moon, Trophy, Zap, Users, BarChart3,
  Clock, CheckCircle2, Terminal, Globe, Shield,
  ChevronRight, Star, Github, Twitter, Linkedin,
  Play, ArrowRight, Flame, Target, BookOpen, MessageSquare,
  Medal, Calendar, Timer,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className="group relative bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:scale-105 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm dark:shadow-none hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-3xl font-bold text-[#0F172A] dark:text-[#E2E8F0] mb-1">{value}</p>
      <p className="text-sm text-[#475569] dark:text-[#94A3B8]">{label}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color, glowColor }) {
  return (
    <div className={`group relative bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl p-7 transition-all duration-300 hover:scale-105 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 overflow-hidden`}>
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${glowColor} blur-3xl`} />
      <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="relative text-lg font-semibold text-[#0F172A] dark:text-[#E2E8F0] mb-2">{title}</h3>
      <p className="relative text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">{description}</p>
    </div>
  );
}

function ContestCard({ title, status, startTime, duration, participants, difficulty }) {
  const statusConfig = {
    live:     { label: 'LIVE',     classes: 'bg-green-500/15 text-green-400 border border-green-500/30' },
    upcoming: { label: 'UPCOMING', classes: 'bg-amber-500/15 text-amber-400 border border-amber-500/30'  },
    finished: { label: 'ENDED',   classes: 'bg-slate-500/15 text-slate-400 border border-slate-500/30'  },
  };
  const cfg = statusConfig[status] || statusConfig.upcoming;

  return (
    <div className="group bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-3">
          <h3 className="font-semibold text-[#0F172A] dark:text-[#E2E8F0] mb-1 leading-tight">{title}</h3>
          <span className="text-xs text-[#475569] dark:text-[#94A3B8]">{difficulty}</span>
        </div>
        <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.classes}`}>
          {cfg.label}
        </span>
      </div>

      <div className="space-y-2.5 mb-5">
        <div className="flex items-center gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
          <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>{startTime}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
          <Timer className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <span>{duration}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
          <Users className="w-3.5 h-3.5 text-green-500 shrink-0" />
          <span>{participants} participants</span>
        </div>
      </div>

      <button
        className={`w-full text-sm font-semibold py-2.5 rounded-lg transition-all duration-300 ${
          status === 'live'
            ? 'bg-green-500 hover:bg-green-400 text-white'
            : status === 'upcoming'
            ? 'bg-blue-600 hover:bg-blue-500 text-white'
            : 'bg-[#E2E8F0] dark:bg-[#334155] text-[#475569] dark:text-[#94A3B8] cursor-default'
        }`}
      >
        {status === 'live' ? '⚡ Join Now' : status === 'upcoming' ? 'Register' : 'View Results'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Landing Page
// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.ui.theme);
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const stats = [
    { icon: Users,    value: '120K+', label: 'Active Coders',      color: 'bg-blue-500/15 text-blue-500'   },
    { icon: Code2,    value: '2,400+', label: 'Coding Problems',   color: 'bg-purple-500/15 text-purple-500' },
    { icon: Trophy,   value: '850+',  label: 'Contests Held',      color: 'bg-amber-500/15 text-amber-500'  },
    { icon: BarChart3, value: '98%',  label: 'Satisfaction Rate',  color: 'bg-green-500/15 text-green-500'   },
  ];

  const features = [
    {
      icon: Terminal,
      title: 'Real-Time Code Execution',
      description: 'Run code in 10+ languages instantly with our sandboxed execution engine. Sub-second feedback on every submission.',
      color: 'bg-blue-500/15 text-blue-500',
      glowColor: 'bg-blue-500/5',
    },
    {
      icon: Trophy,
      title: 'Live Competitive Contests',
      description: 'Participate in rated rounds, hackathons, and weekly challenges. Climb the global leaderboard and earn badges.',
      color: 'bg-purple-500/15 text-purple-500',
      glowColor: 'bg-purple-500/5',
    },
    {
      icon: Target,
      title: 'Structured Learning Paths',
      description: 'Curated problem sets by topic and difficulty — from arrays to dynamic programming — guided by expert solutions.',
      color: 'bg-green-500/15 text-green-500',
      glowColor: 'bg-green-500/5',
    },
    {
      icon: BarChart3,
      title: 'Deep Analytics Dashboard',
      description: 'Track submission history, rating trends, acceptance rates, and identify your weak points with visual reports.',
      color: 'bg-amber-500/15 text-amber-500',
      glowColor: 'bg-amber-500/5',
    },
    {
      icon: Users,
      title: 'Active Developer Community',
      description: 'Discuss solutions, share approaches, and collaborate on editorial explanations with thousands of developers.',
      color: 'bg-red-500/15 text-red-500',
      glowColor: 'bg-red-500/5',
    },
    {
      icon: Shield,
      title: 'Anti-Cheat & Fair Play',
      description: 'Plagiarism detection, randomized test cases, and monitored sessions ensure every contest is fair and credible.',
      color: 'bg-cyan-500/15 text-cyan-500',
      glowColor: 'bg-cyan-500/5',
    },
  ];

  const contests = [
    {
      title: 'CodeArena Weekly Round #47',
      status: 'live',
      startTime: 'Feb 21, 2026 · 18:00 UTC',
      duration: '2 hours',
      participants: '3,241',
      difficulty: 'Div. 1 + 2',
    },
    {
      title: 'Dynamic Programming Sprint',
      status: 'upcoming',
      startTime: 'Feb 24, 2026 · 14:00 UTC',
      duration: '3 hours',
      participants: '1,805',
      difficulty: 'All Levels',
    },
    {
      title: 'Graph Theory Invitational',
      status: 'finished',
      startTime: 'Feb 18, 2026 · 10:00 UTC',
      duration: '2.5 hours',
      participants: '2,644',
      difficulty: 'Advanced',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#E2E8F0] transition-colors duration-300">

        {/* ── Navbar ─────────────────────────────────────────────────────── */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-b border-[#CBD5E1] dark:border-[#334155] shadow-sm'
            : 'bg-transparent'
        }`}>
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors duration-300">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-[#0F172A] dark:text-[#E2E8F0]">
                Code<span className="text-blue-500">Arena</span>
              </span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {['Problems', 'Contests', 'Leaderboard', 'Discuss'].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  className="px-4 py-2 text-sm text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0] hover:bg-[#E2E8F0]/60 dark:hover:bg-[#1E293B] rounded-lg transition-all duration-200"
                >
                  {item}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hidden sm:block px-4 py-2 text-sm text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0] hover:bg-[#E2E8F0]/60 dark:hover:bg-[#1E293B] rounded-lg transition-all duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25"
              >
                Register
              </Link>
              <button
                onClick={() => dispatch(toggleTheme())}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#CBD5E1] dark:border-[#334155] text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0] hover:border-blue-500 dark:hover:border-blue-500 hover:bg-[#E2E8F0]/60 dark:hover:bg-[#1E293B] transition-all duration-200"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </nav>

        {/* ── Hero Section ───────────────────────────────────────────────── */}
        <section className="relative pt-28 pb-20 px-6 overflow-hidden">
          {/* Background blobs */}
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-500/10 dark:bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 w-96 h-48 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-500 font-medium mb-6">
                <Flame className="w-3.5 h-3.5" />
                <span>3,241 coders solving right now</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-[#0F172A] dark:text-[#E2E8F0] mb-6">
                Master Coding.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                  Compete in Real-Time.
                </span>
              </h1>

              <p className="text-lg text-[#475569] dark:text-[#94A3B8] leading-relaxed mb-8 max-w-lg">
                Sharpen your algorithms, tackle curated problems, and crush real-time contests — all in one platform built for developers who mean business.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-white text-sm font-bold rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-green-500/30 hover:-translate-y-0.5"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Start Coding Free
                </Link>
                <Link
                  to="/contests"
                  className="flex items-center gap-2 px-6 py-3 border border-blue-500 text-blue-500 hover:bg-blue-500/10 text-sm font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  View Contests
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Mini stats */}
              <div className="flex items-center gap-6 pt-2">
                <div className="flex -space-x-2">
                  {['#3B82F6','#8B5CF6','#22C55E','#F59E0B'].map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#F8FAFC] dark:border-[#0F172A] flex items-center justify-center text-xs font-bold text-white" style={{ background: c }}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-0.5">Loved by 120,000+ developers</p>
                </div>
              </div>
            </div>

            {/* Right — Mock Editor Card */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 rounded-3xl blur-2xl dark:opacity-100 opacity-40" />
              <div className="relative bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl overflow-hidden shadow-2xl dark:shadow-blue-500/10">
                {/* Editor header */}
                <div className="bg-[#F1F5F9] dark:bg-[#0F172A] border-b border-[#CBD5E1] dark:border-[#334155] px-4 py-3 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs text-[#64748B] dark:text-[#64748B] font-mono">two-sum.py</span>
                  <div className="flex items-center gap-2 text-xs text-[#64748B]">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span>Python 3</span>
                  </div>
                </div>

                {/* Problem info */}
                <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#334155]">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0]">1. Two Sum</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-500 border border-green-500/30">Easy</span>
                    <span className="text-[10px] text-[#64748B] dark:text-[#64748B]">Acceptance: 49.1%</span>
                  </div>
                </div>

                {/* Code block */}
                <div className="px-5 py-4 font-mono text-xs leading-6 bg-[#F8FAFC] dark:bg-[#0B1120]">
                  <div className="text-[#94A3B8] dark:text-[#4B5563] select-none grid grid-cols-[1.5rem,1fr] gap-x-3">
                    {[
                      ['1', <><span className="text-purple-500">class</span> <span className="text-blue-400">Solution</span><span className="text-[#94A3B8]">:</span></>],
                      ['2', <><span className="pl-4 text-blue-400">def</span> <span className="text-green-400">twoSum</span><span className="text-[#94A3B8]">(self, nums, target):</span></>],
                      ['3', <><span className="pl-8 text-blue-400">seen</span> <span className="text-[#94A3B8]">=</span> <span className="text-amber-400">{'{}'}</span></>],
                      ['4', <><span className="pl-8 text-purple-500">for</span> <span className="text-[#E2E8F0]"> i, n </span><span className="text-purple-500">in</span> <span className="text-blue-400">enumerate</span><span className="text-[#94A3B8]">(nums):</span></>],
                      ['5', <><span className="pl-12 text-blue-400">comp</span> <span className="text-[#94A3B8]">= target -</span> <span className="text-blue-400">n</span></>],
                      ['6', <><span className="pl-12 text-purple-500">if</span> <span className="text-blue-400"> comp </span><span className="text-purple-500">in</span><span className="text-blue-400"> seen</span><span className="text-[#94A3B8]">:</span></>],
                      ['7', <><span className="pl-16 text-purple-500">return</span> <span className="text-[#94A3B8]">[seen[comp], i]</span></>],
                      ['8', <><span className="pl-12 text-blue-400">seen</span><span className="text-[#94A3B8]">[n] = i</span></>],
                    ].map(([ln, code]) => (
                      <><span key={`ln-${ln}`} className="text-right text-[#4B5563]">{ln}</span><span key={`code-${ln}`}>{code}</span></>
                    ))}
                  </div>
                </div>

                {/* Result rows */}
                <div className="px-5 py-4 border-t border-[#E2E8F0] dark:border-[#334155] space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span className="text-green-500 font-semibold">All 57 test cases passed</span>
                  </div>
                  <div className="flex items-center gap-6 text-[11px] text-[#475569] dark:text-[#94A3B8]">
                    <span>Runtime: <span className="text-blue-400 font-mono font-semibold">56ms</span> (beats 92%)</span>
                    <span>Memory: <span className="text-purple-400 font-mono font-semibold">17.4MB</span> (beats 78%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Section ───────────────────────────────────────────────── */}
        <section className="py-20 px-6 bg-[#E2E8F0]/40 dark:bg-[#1E293B]/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#0F172A] dark:text-[#E2E8F0] mb-3">
                Trusted by the World's Best Coders
              </h2>
              <p className="text-[#475569] dark:text-[#94A3B8]">
                Join a growing community that takes competitive programming seriously.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {stats.map((s) => <StatCard key={s.label} {...s} />)}
            </div>
          </div>
        </section>

        {/* ── Features Section ────────────────────────────────────────────── */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold text-blue-500 uppercase tracking-widest mb-3">Why CodeArena?</span>
              <h2 className="text-4xl font-bold text-[#0F172A] dark:text-[#E2E8F0] mb-4">
                Everything a Competitive Programmer Needs
              </h2>
              <p className="text-[#475569] dark:text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
                From blazing fast execution to in-depth analytics — CodeArena has every tool to take your skills to the next level.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => <FeatureCard key={f.title} {...f} />)}
            </div>
          </div>
        </section>

        {/* ── Contests Section ─────────────────────────────────────────────── */}
        <section className="py-20 px-6 bg-[#E2E8F0]/40 dark:bg-[#1E293B]/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="inline-block text-xs font-bold text-purple-500 uppercase tracking-widest mb-3">Contests</span>
                <h2 className="text-4xl font-bold text-[#0F172A] dark:text-[#E2E8F0] mb-2">
                  Upcoming &amp; Live Contests
                </h2>
                <p className="text-[#475569] dark:text-[#94A3B8]">
                  Compete, rank up, and get recognized — weekly contests every round.
                </p>
              </div>
              <Link
                to="/contests"
                className="hidden md:flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-400 font-semibold transition-colors duration-200"
              >
                View All Contests
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contests.map((c) => <ContestCard key={c.title} {...c} />)}
            </div>
          </div>
        </section>

        {/* ── CTA Section ──────────────────────────────────────────────────── */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-600 dark:to-purple-700 rounded-2xl p-10 text-center overflow-hidden shadow-2xl shadow-blue-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white/15 backdrop-blur rounded-2xl mb-5">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">
                  Ready to Level Up?
                </h2>
                <p className="text-blue-100 mb-8 leading-relaxed">
                  Join 120,000+ developers. Get early access to new problems, contest alerts, and editorial breakdowns — straight to your inbox.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-blue-200 text-sm focus:outline-none focus:border-white/60 transition-colors duration-200"
                  />
                  <button className="px-6 py-3 bg-white text-blue-600 font-bold text-sm rounded-xl hover:bg-blue-50 transition-all duration-300 hover:shadow-lg whitespace-nowrap">
                    Get Early Access
                  </button>
                </div>
                <p className="text-xs text-blue-200/70 mt-3">No spam. Unsubscribe anytime.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="border-t border-[#CBD5E1] dark:border-[#334155] py-14 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              {/* Brand */}
              <div className="col-span-2 md:col-span-1">
                <Link to="/" className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Code2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-[#0F172A] dark:text-[#E2E8F0]">
                    Code<span className="text-blue-500">Arena</span>
                  </span>
                </Link>
                <p className="text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed mb-5">
                  The premier competitive programming platform for developers who want to grow, compete, and get hired.
                </p>
                <div className="flex gap-3">
                  {[Github, Twitter, Linkedin].map((Icon, i) => (
                    <a key={i} href="#" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#CBD5E1] dark:border-[#334155] text-[#475569] dark:text-[#94A3B8] hover:border-blue-500 hover:text-blue-500 transition-all duration-200">
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Platform */}
              <div>
                <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0] mb-4">Platform</h4>
                <ul className="space-y-3">
                  {['Problems', 'Contests', 'Leaderboard', 'Discuss', 'Study Plans'].map((l) => (
                    <li key={l}>
                      <Link to={`/${l.toLowerCase().replace(' ', '-')}`} className="text-sm text-[#475569] dark:text-[#94A3B8] hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200">
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0] mb-4">Company</h4>
                <ul className="space-y-3">
                  {['About', 'Careers', 'Blog', 'Press', 'Contact'].map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-[#475569] dark:text-[#94A3B8] hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Stats */}
              <div>
                <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0] mb-4">By the Numbers</h4>
                <ul className="space-y-3">
                  {[
                    { icon: Users,  text: '120K+ active users' },
                    { icon: Code2,  text: '2,400+ problems' },
                    { icon: Trophy, text: '850+ contests' },
                    { icon: Globe,  text: '180+ countries' },
                  ].map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-2 text-sm text-[#475569] dark:text-[#94A3B8]">
                      <Icon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-[#CBD5E1] dark:border-[#334155] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-[#64748B]">© 2026 CodeArena. All rights reserved.</p>
              <div className="flex gap-5">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((l) => (
                  <a key={l} href="#" className="text-xs text-[#64748B] hover:text-blue-500 transition-colors duration-200">
                    {l}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>

    </div>
  );
}
