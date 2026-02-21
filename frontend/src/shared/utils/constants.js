// ============================================================
// App-wide constants
// ============================================================

export const APP_NAME = 'BroSync';
export const APP_TAGLINE = 'Code. Compete. Conquer.';

// ── API Endpoints ─────────────────────────────────────────
export const API_ROUTES = {
  // Auth
  LOGIN: '/auth/login/',
  REGISTER: '/auth/register/',
  LOGOUT: '/auth/logout/',
  REFRESH: '/auth/token/refresh/',
  PROFILE: '/auth/profile/',
  PROFILE_UPDATE: '/auth/profile/update/',
  CHANGE_PASSWORD: '/auth/password/change/',

  // Problems
  PROBLEMS: '/problems/',
  PROBLEM_DETAIL: (slug) => `/problems/${slug}/`,
  CATEGORIES: '/problems/categories/',
  RUN_CODE: '/problems/run/',
  PROBLEM_SOLVERS: (slug) => `/problems/${slug}/solvers/`,

  // Submissions
  SUBMISSIONS: '/submissions/',
  SUBMISSION_DETAIL: (id) => `/submissions/${id}/`,
  MY_SUBMISSIONS: '/submissions/me/',
  ALL_SUBMISSIONS: '/submissions/all/',

  // Contests
  CONTESTS: '/contests/',
  CONTEST_DETAIL: (slug) => `/contests/${slug}/`,
  CONTEST_JOIN: (slug) => `/contests/${slug}/join/`,
  CONTEST_LEADERBOARD: (slug) => `/contests/${slug}/leaderboard/`,

  // Leaderboard
  GLOBAL_LEADERBOARD: '/leaderboard/',

  // Organizer
  ORG_SETUP: '/organizer/setup/',
  ORG_PROFILE: '/organizer/profile/',
  ORG_DASHBOARD: '/organizer/dashboard/',
  ORG_CONTESTS: '/organizer/contests/',
  ORG_CONTEST_DETAIL: (id) => `/organizer/contests/${id}/`,
  ORG_CONTEST_PROBLEMS: (id) => `/organizer/contests/${id}/problems/`,
  ORG_CONTEST_REMOVE_PROBLEM: (cid, pid) => `/organizer/contests/${cid}/problems/${pid}/`,
  ORG_CONTEST_GENERATE_CODE: (id) => `/organizer/contests/${id}/generate-code/`,
  ORG_PARTICIPANTS: (id) => `/organizer/contests/${id}/participants/`,
  ORG_DISQUALIFY: (cid, pid) => `/organizer/contests/${cid}/participants/${pid}/disqualify/`,
  ORG_PROBLEMS: '/organizer/problems/',
  ORG_PROBLEM_DETAIL: (id) => `/organizer/problems/${id}/`,
  ORG_PROBLEM_TEST_CASES: (id) => `/organizer/problems/${id}/test-cases/`,
  ORG_TEST_CASE_DETAIL: (id) => `/organizer/test-cases/${id}/`,
  ORG_CATEGORIES: '/organizer/categories/',

  // Notifications
  NOTIFICATIONS: '/notifications/',
  NOTIFICATION_READ: (id) => `/notifications/${id}/read/`,
  NOTIFICATIONS_READ_ALL: '/notifications/read-all/',
};

// ── WebSocket Endpoints ───────────────────────────────────
export const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost/ws';
export const WS_ROUTES = {
  LEADERBOARD: (contestId) => `${WS_BASE}/leaderboard/${contestId}/`,
  NOTIFICATIONS: (userId) => `${WS_BASE}/notifications/${userId}/`,
};

// ── Difficulty Config ─────────────────────────────────────
export const DIFFICULTY = {
  easy: { label: 'Easy', color: 'text-difficulty-easy', bg: 'bg-green-900/30', border: 'border-difficulty-easy' },
  medium: { label: 'Medium', color: 'text-difficulty-medium', bg: 'bg-yellow-900/30', border: 'border-difficulty-medium' },
  hard: { label: 'Hard', color: 'text-difficulty-hard', bg: 'bg-red-900/30', border: 'border-difficulty-hard' },
};

// ── Submission Status Config ──────────────────────────────
export const SUBMISSION_STATUS = {
  pending: { label: 'Pending', color: 'text-text-secondary' },
  running: { label: 'Running', color: 'text-brand-blue' },
  accepted: { label: 'Accepted', color: 'text-status-accepted' },
  wrong_answer: { label: 'Wrong Answer', color: 'text-status-wrong_answer' },
  time_limit: { label: 'TLE', color: 'text-status-time_limit' },
  memory_limit: { label: 'MLE', color: 'text-orange-400' },
  runtime_error: { label: 'Runtime Error', color: 'text-status-runtime_error' },
  compilation_error: { label: 'Compile Error', color: 'text-status-compilation_error' },
  internal_error: { label: 'Internal Error', color: 'text-red-500' },
};

// ── Language Config ───────────────────────────────────────
export const LANGUAGES = [
  { value: 'python', label: 'Python 3', monacoLang: 'python' },
  { value: 'cpp', label: 'C++ 17', monacoLang: 'cpp' },
  { value: 'java', label: 'Java 17', monacoLang: 'java' },
  { value: 'javascript', label: 'JavaScript', monacoLang: 'javascript' },
];

// ── Contest Status Config ─────────────────────────────────
export const CONTEST_STATUS = {
  draft: { label: 'Draft', color: 'text-text-secondary' },
  upcoming: { label: 'Upcoming', color: 'text-brand-blue' },
  active: { label: 'Live', color: 'text-status-accepted' },
  ended: { label: 'Ended', color: 'text-text-muted' },
};

// ── Pagination ────────────────────────────────────────────
export const PAGE_SIZE = 20;
