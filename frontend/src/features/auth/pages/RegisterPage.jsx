import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Code2, CheckCircle, Sun, Moon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '@store/uiSlice';
import { useAuth } from '../hooks/useAuth';

export default function RegisterPage() {
  const { register, loading, error, user } = useAuth();
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.ui.theme);
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirm_password: '',
    first_name: '', last_name: '',
  });
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    if (form.password !== form.confirm_password) {
      setValidationError('Passwords do not match.');
      return;
    }
    const { confirm_password, ...rest } = form;
    const payload = { ...rest, password_confirm: confirm_password };
    const ok = await register(payload);
    if (ok) setRegistered(true);
  };

  const displayError = validationError || (typeof error === 'string' ? error : null);

  const inputCls = 'w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] rounded-xl px-3.5 py-2.5 text-[#0F172A] dark:text-[#E2E8F0] text-sm placeholder-[#94A3B8] focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200';
  const labelCls = 'block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1.5 uppercase tracking-wide';

  if (registered) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center px-4 transition-colors duration-300">
          <div className="w-full max-w-md text-center">
            <div className="bg-white dark:bg-[#1E293B] border border-green-500/30 rounded-2xl p-10 shadow-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/15 rounded-2xl mb-5">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-[#0F172A] dark:text-[#E2E8F0] mb-2">Account Created!</h2>
              <p className="text-[#475569] dark:text-[#94A3B8] text-sm mb-1">
                Welcome, <span className="text-blue-500 font-semibold">{user?.username || form.username}</span>!
              </p>
              <p className="text-[#64748B] dark:text-[#64748B] text-xs mb-8">
                Your CodeArena account is ready. Start solving problems now.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 text-sm"
                >
                  Sign in to your account
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full border border-[#CBD5E1] dark:border-[#334155] text-[#475569] dark:text-[#94A3B8] hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 py-3 rounded-xl transition-all duration-200 text-sm"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center px-4 py-8 transition-colors duration-300 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/8 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/8 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Theme toggle */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-lg border border-[#CBD5E1] dark:border-[#334155] text-[#475569] dark:text-[#94A3B8] hover:border-blue-500 hover:text-blue-500 transition-all duration-200 bg-white dark:bg-[#1E293B]"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="relative w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-7">
            <Link to="/" className="inline-flex items-center gap-2.5 group mb-4">
              <div className="w-10 h-10 bg-blue-600 group-hover:bg-blue-500 rounded-xl flex items-center justify-center transition-colors duration-300">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#0F172A] dark:text-[#E2E8F0]">
                Code<span className="text-blue-500">Arena</span>
              </span>
            </Link>
            <h2 className="text-2xl font-bold text-[#0F172A] dark:text-[#E2E8F0] mb-1">Create your account</h2>
            <p className="text-[#475569] dark:text-[#94A3B8] text-sm">Join 120,000+ developers today</p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-7 shadow-xl dark:shadow-blue-500/5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {displayError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-500 dark:text-red-400 text-sm">
                  {displayError}
                </div>
              )}
              {error && typeof error === 'object' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-500 dark:text-red-400 text-sm space-y-1">
                  {Object.entries(error).map(([k, v]) => (
                    <p key={k}><span className="font-semibold capitalize">{k}:</span> {Array.isArray(v) ? v.join(', ') : v}</p>
                  ))}
                </div>
              )}

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>First Name</label>
                  <input type="text" placeholder="John" className={inputCls}
                    value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Last Name</label>
                  <input type="text" placeholder="Doe" className={inputCls}
                    value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className={labelCls}>Username</label>
                <input type="text" required placeholder="cool_coder_42" className={inputCls}
                  value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>

              {/* Email */}
              <div>
                <label className={labelCls}>Email address</label>
                <input type="email" required placeholder="you@example.com" className={inputCls}
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>

              {/* Password */}
              <div>
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} required minLength={8}
                    placeholder="Min 8 characters"
                    className={`${inputCls} pr-11`}
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#475569] dark:hover:text-[#94A3B8] transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className={labelCls}>Confirm Password</label>
                <input type="password" required placeholder="••••••••" className={inputCls}
                  value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 text-sm mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-[#475569] dark:text-[#94A3B8]">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
    </div>
  );
}
