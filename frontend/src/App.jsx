import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { Suspense, useEffect } from 'react';
import store from './store';
import AppInitializer from './AppInitializer';
import MainLayout from '@shared/components/Layout/MainLayout';
import OrgLayout from '@shared/components/Layout/OrgLayout';
import ProtectedRoute from '@shared/components/ProtectedRoute';
import OrgProtectedRoute from '@shared/components/OrgProtectedRoute';
import { PageLoader } from '@shared/components/ui/Spinner';

// ── Pages ─────────────────────────────────────────────────────────────────────
import LandingPage from '@features/landing/LandingPage';
import LoginPage from '@features/auth/pages/LoginPage';
import RegisterPage from '@features/auth/pages/RegisterPage';
import DashboardPage from '@features/dashboard/pages/DashboardPage';
import ProblemsPage from '@features/problems/pages/ProblemsPage';
import ProblemDetailPage from '@features/problems/pages/ProblemDetailPage';
import SubmissionsPage from '@features/submissions/pages/SubmissionsPage';
import ContestsPage from '@features/contests/pages/ContestsPage';
import ContestDetailPage from '@features/contests/pages/ContestDetailPage';
import LeaderboardPage from '@features/leaderboard/pages/LeaderboardPage';
import ProfilePage from '@features/profile/pages/ProfilePage';
import BattleLobbyPage from '@features/battles/pages/BattleLobbyPage';
import BattleRoomPage from '@features/battles/pages/BattleRoomPage';
import BattleRequestToast from '@features/notifications/components/BattleRequestToast';
import SettingsPage from '@features/profile/pages/SettingsPage';
import RoadmapPage from '@features/roadmaps/pages/RoadmapPage';

// ── Organizer Pages ───────────────────────────────────────────────────────────
import OrgSetupPage from '@features/organizer/pages/OrgSetupPage';
import OrgDashboardPage from '@features/organizer/pages/OrgDashboardPage';
import OrgContestsPage from '@features/organizer/pages/OrgContestsPage';
import ContestFormPage from '@features/organizer/pages/ContestFormPage';
import ContestParticipantsPage from '@features/organizer/pages/ContestParticipantsPage';
import OrgProblemsPage from '@features/organizer/pages/OrgProblemsPage';
import ProblemFormPage from '@features/organizer/pages/ProblemFormPage';

// ── Layout wrapper for authenticated routes ───────────────────────────────────
function AuthenticatedLayout({ children }) {
  return (
    <ProtectedRoute>
      <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
  );
}

// ── Layout wrapper for organizer routes ────────────────────────────────────────
function OrgAuthLayout({ children }) {
  return (
    <OrgProtectedRoute>
      <OrgLayout>{children}</OrgLayout>
    </OrgProtectedRoute>
  );
}

function ThemedApp() {
  const theme = useSelector((s) => s.ui.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <AppInitializer />
      <BattleRequestToast />
      <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public ─────────────────────────── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ── Authenticated ───────────────────── */}
            <Route path="/dashboard" element={<AuthenticatedLayout><DashboardPage /></AuthenticatedLayout>} />
            <Route path="/problems" element={<AuthenticatedLayout><ProblemsPage /></AuthenticatedLayout>} />
            <Route path="/problems/:slug" element={<AuthenticatedLayout><ProblemDetailPage /></AuthenticatedLayout>} />
            <Route path="/contests/:contestSlug/problems/:slug" element={<AuthenticatedLayout><ProblemDetailPage /></AuthenticatedLayout>} />
            <Route path="/submissions" element={<AuthenticatedLayout><SubmissionsPage /></AuthenticatedLayout>} />
            <Route path="/contests" element={<AuthenticatedLayout><ContestsPage /></AuthenticatedLayout>} />
            <Route path="/contests/:slug" element={<AuthenticatedLayout><ContestDetailPage /></AuthenticatedLayout>} />
            <Route path="/leaderboard" element={<AuthenticatedLayout><LeaderboardPage /></AuthenticatedLayout>} />
            <Route path="/battles" element={<AuthenticatedLayout><BattleLobbyPage /></AuthenticatedLayout>} />
            <Route path="/battles/:battleId" element={<AuthenticatedLayout><BattleRoomPage /></AuthenticatedLayout>} />
            <Route path="/profile/:username" element={<AuthenticatedLayout><ProfilePage /></AuthenticatedLayout>} />
            <Route path="/settings" element={<AuthenticatedLayout><SettingsPage /></AuthenticatedLayout>} />
            <Route path="/roadmaps" element={<AuthenticatedLayout><RoadmapPage /></AuthenticatedLayout>} />

            {/* ── Organizer (public setup + protected panel) ── */}
            <Route path="/organizer/setup" element={<ProtectedRoute><OrgSetupPage /></ProtectedRoute>} />
            <Route path="/organizer/dashboard" element={<OrgAuthLayout><OrgDashboardPage /></OrgAuthLayout>} />
            <Route path="/organizer/contests" element={<OrgAuthLayout><OrgContestsPage /></OrgAuthLayout>} />
            <Route path="/organizer/contests/new" element={<OrgAuthLayout><ContestFormPage /></OrgAuthLayout>} />
            <Route path="/organizer/contests/:id/edit" element={<OrgAuthLayout><ContestFormPage /></OrgAuthLayout>} />
            <Route path="/organizer/contests/:contestId/participants" element={<OrgAuthLayout><ContestParticipantsPage /></OrgAuthLayout>} />
            <Route path="/organizer/problems" element={<OrgAuthLayout><OrgProblemsPage /></OrgAuthLayout>} />
            <Route path="/organizer/problems/new" element={<OrgAuthLayout><ProblemFormPage /></OrgAuthLayout>} />
            <Route path="/organizer/problems/:id/edit" element={<OrgAuthLayout><ProblemFormPage /></OrgAuthLayout>} />

            {/* ── Redirects ───────────────────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>

        {/* ── Toast notifications ─────────────────── */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1E293B',
              color: '#E2E8F0',
              border: '1px solid #334155',
              fontFamily: '"Inter", system-ui, sans-serif',
              fontSize: '13px',
              borderRadius: '12px',
            },
            success: {
              iconTheme: { primary: '#22C55E', secondary: '#1E293B' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#1E293B' },
            },
          }}
        />
      </BrowserRouter>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemedApp />
    </Provider>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex flex-col items-center justify-center gap-4">
      <div className="text-7xl font-bold text-blue-500">404</div>
      <p className="text-[#475569] dark:text-[#94A3B8] text-lg">Page not found</p>
      <a href="/" className="text-blue-500 hover:text-blue-400 text-sm font-semibold transition-colors">
        ← Back to Home
      </a>
    </div>
  );
}
