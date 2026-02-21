import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Code2, Sun, Moon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '@store/uiSlice';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.ui.theme);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    login(form);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center px-4 transition-colors duration-300 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/8 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/8 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Theme toggle */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-lg border border-[#CBD5E1] dark:border-[#334155] text-[#475569] dark:text-[#94A3B8] hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-500 transition-all duration-200 bg-white dark:bg-[#1E293B]"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="relative w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 group mb-4">
              <div className="w-10 h-10 bg-blue-600 group-hover:bg-blue-500 rounded-xl flex items-center justify-center transition-colors duration-300">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#0F172A] dark:text-[#E2E8F0]">
                Code<span className="text-blue-500">Arena</span>
              </span>
            </Link>
            <h2 className="text-2xl font-bold text-[#0F172A] dark:text-[#E2E8F0] mb-1">Welcome back</h2>
            <p className="text-[#475569] dark:text-[#94A3B8] text-sm">Sign in to continue coding</p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-8 shadow-xl dark:shadow-blue-500/5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 text-red-500 dark:text-red-400 text-sm">
                  {typeof error === 'string' ? error : 'Invalid credentials. Please try again.'}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#0F172A] dark:text-[#E2E8F0] mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] rounded-xl px-4 py-3 text-[#0F172A] dark:text-[#E2E8F0] text-sm placeholder-[#94A3B8] focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[#0F172A] dark:text-[#E2E8F0]">Password</label>
                  <a href="#" className="text-xs text-blue-500 hover:text-blue-400 transition-colors">Forgot password?</a>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] rounded-xl px-4 py-3 pr-12 text-[#0F172A] dark:text-[#E2E8F0] text-sm placeholder-[#94A3B8] focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#475569] dark:hover:text-[#94A3B8] transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 text-sm mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#475569] dark:text-[#94A3B8]">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
  );
}
