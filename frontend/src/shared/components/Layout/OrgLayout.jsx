import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Trophy,
  Code2,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toggleSidebar } from '@store/uiSlice';
import Navbar from '@shared/components/Layout/Navbar';

const navItems = [
  { to: '/organizer/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/organizer/contests',  label: 'Contests',  Icon: Trophy          },
  { to: '/organizer/problems',  label: 'Problems',  Icon: Code2           },
];

function OrgSidebar() {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((s) => s.ui);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      <aside
        className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] z-30
          bg-white dark:bg-[#1E293B] border-r border-[#CBD5E1] dark:border-[#334155]
          transition-all duration-300 flex flex-col overflow-hidden
          ${sidebarOpen ? 'w-56 translate-x-0' : 'w-0 -translate-x-full lg:w-14 lg:translate-x-0'}`}
      >
        {/* Organizer badge */}
        {sidebarOpen && (
          <div className="px-3 pt-4 pb-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                Organizer Panel
              </span>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
          <ul className="space-y-1">
            {navItems.map(({ to, label, Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0] hover:bg-[#F1F5F9] dark:hover:bg-[#334155]'
                    }`
                  }
                >
                  <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="text-sm font-medium whitespace-nowrap">{label}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="hidden lg:flex justify-end p-2 border-t border-[#CBD5E1] dark:border-[#334155]">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-blue-500 hover:bg-blue-500/10 transition-all"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}

export default function OrgLayout({ children }) {
  const { sidebarOpen } = useSelector((s) => s.ui);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] transition-colors duration-300">
      <Navbar />
      <OrgSidebar />
      <main className={`transition-all duration-300 pt-14 ${sidebarOpen ? 'lg:ml-56' : 'lg:ml-14'}`}>
        <div className="p-4 lg:p-6 min-h-[calc(100vh-3.5rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}
