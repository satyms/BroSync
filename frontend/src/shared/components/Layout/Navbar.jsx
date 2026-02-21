import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, Search, Menu, ChevronDown,
  User, Settings, LogOut, Code2, Sun, Moon,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '@features/auth/authSlice';
import { toggleSidebar, toggleTheme } from '@store/uiSlice';
import NotificationPanel from '@features/notifications/components/NotificationPanel';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { unreadCount } = useSelector((s) => s.notifications);
  const theme = useSelector((s) => s.ui.theme);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/problems?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    dispatch(logoutUser()).then(() => navigate('/login'));
  };

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.username?.[0]?.toUpperCase()
    : 'U';

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-xl border-b border-[#CBD5E1] dark:border-[#334155] transition-colors duration-300">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">

        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0] hover:bg-[#E2E8F0]/60 dark:hover:bg-[#334155] rounded-lg transition-all duration-200 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 group-hover:bg-blue-500 rounded-lg flex items-center justify-center transition-colors duration-300">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:block text-sm font-bold text-[#0F172A] dark:text-[#E2E8F0]">
              Code<span className="text-blue-500">Arena</span>
            </span>
          </Link>
        </div>

        {/* Center: Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] dark:text-[#64748B]" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F1F5F9] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] rounded-xl pl-9 pr-4 py-2 text-sm text-[#0F172A] dark:text-[#E2E8F0] placeholder-[#94A3B8] focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
            />
          </div>
        </form>

        {/* Right: Theme + Notifications + Avatar */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <button
            onClick={() => dispatch(toggleTheme())}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0] hover:bg-[#E2E8F0]/60 dark:hover:bg-[#334155] transition-all duration-200"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0] hover:bg-[#E2E8F0]/60 dark:hover:bg-[#334155] transition-all duration-200"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-blue-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-1.5">
                <NotificationPanel onClose={() => setNotifOpen(false)} />
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-[#E2E8F0]/60 dark:hover:bg-[#334155] transition-all duration-200"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full rounded-lg object-cover" />
                ) : initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[#0F172A] dark:text-[#E2E8F0] text-xs font-semibold leading-tight">{user?.username || 'User'}</p>
                <p className="text-[#64748B] dark:text-[#64748B] text-[10px]">Rating {user?.rating || 0}</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl shadow-xl dark:shadow-black/30 py-1.5 z-50 animate-fade-in">
                <Link
                  to={`/profile/${user?.username}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-all duration-150"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-all duration-150"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <div className="border-t border-[#CBD5E1] dark:border-[#334155] my-1" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 w-full text-left transition-all duration-150"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

