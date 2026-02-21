import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LayoutDashboard, Code2, Trophy, BarChart3, Zap, User } from 'lucide-react';
import { toggleSidebar } from '@store/uiSlice';

const navItems = [
  { to: '/dashboard',   label: 'Dashboard',   Icon: LayoutDashboard },
  { to: '/problems',    label: 'Problems',     Icon: Code2           },
  { to: '/contests',    label: 'Contests',     Icon: Trophy          },
  { to: '/leaderboard', label: 'Leaderboard',  Icon: BarChart3       },
  { to: '/submissions', label: 'Submissions',  Icon: Zap             },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((s) => s.ui);
  const { user } = useSelector((s) => s.auth);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      <aside className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] z-30
        bg-white dark:bg-[#1E293B] border-r border-[#CBD5E1] dark:border-[#334155]
        transition-all duration-300 flex flex-col overflow-hidden
        ${sidebarOpen ? 'w-56 translate-x-0' : 'w-0 -translate-x-full lg:w-14 lg:translate-x-0'}`}
      >
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
          <ul className="space-y-1">
            {navItems.map(({ to, label, Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
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

          <div className="border-t border-[#CBD5E1] dark:border-[#334155] my-4" />

          {/* Profile link */}
          {user && (
            <NavLink
              to={`/profile/${user.username}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                ${isActive
                  ? 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0] hover:bg-[#F1F5F9] dark:hover:bg-[#334155]'
                }`
              }
            >
              <User className="w-4.5 h-4.5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">Profile</span>}
            </NavLink>
          )}
        </nav>

        {sidebarOpen && (
          <div className="p-3 border-t border-[#CBD5E1] dark:border-[#334155]">
            <p className="text-[#94A3B8] dark:text-[#64748B] text-[10px] text-center tracking-widest font-mono">v1.0.0</p>
          </div>
        )}
      </aside>
    </>
  );
}

