import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';
import { setUser } from '@features/auth/authSlice';
import {
  Building2, GraduationCap, Briefcase, Users, Globe,
  Code2, ArrowRight, CheckCircle, MapPin, Link as LinkIcon,
} from 'lucide-react';

const ORG_TYPES = [
  { value: 'college',    label: 'College',    icon: GraduationCap, color: 'text-blue-500',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30'   },
  { value: 'university', label: 'University', icon: Building2,     color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { value: 'company',    label: 'Company',    icon: Briefcase,     color: 'text-amber-500',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30'  },
  { value: 'community',  label: 'Community',  icon: Users,         color: 'text-green-500',  bg: 'bg-green-500/10',  border: 'border-green-500/30'  },
  { value: 'other',      label: 'Other',      icon: Globe,         color: 'text-cyan-500',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30'   },
];

const inputCls =
  'w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] ' +
  'rounded-xl px-4 py-3 text-[#0F172A] dark:text-[#E2E8F0] text-sm placeholder-[#94A3B8] ' +
  'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200';

export default function OrgSetupPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    org_name: '',
    org_type: 'college',
    description: '',
    website: '',
    logo_url: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.org_name.trim()) return toast.error('Organization name is required.');
    setLoading(true);
    try {
      const res = await axiosInstance.post(API_ROUTES.ORG_SETUP, form);
      toast.success('Welcome aboard as an Organizer!');
      // Update user role in Redux store
      dispatch(setUser({ ...user, role: 'organizer' }));
      navigate('/organizer/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Setup failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center px-4 py-12">
      {/* Background blobs */}
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[#0F172A] dark:text-[#E2E8F0]">
              Code<span className="text-blue-500">Arena</span>
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-[#0F172A] dark:text-[#E2E8F0] mb-2">
            Become an Organizer
          </h1>
          <p className="text-[#475569] dark:text-[#94A3B8]">
            Set up your organization profile to start hosting contests.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-8 shadow-sm space-y-6"
        >
          {/* Org Type Selector */}
          <div>
            <label className="block text-sm font-medium text-[#475569] dark:text-[#94A3B8] mb-3">
              Organization Type
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ORG_TYPES.map(({ value, label, icon: Icon, color, bg, border }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, org_type: value }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 ${
                    form.org_type === value
                      ? `${bg} ${border} ${color}`
                      : 'border-[#CBD5E1] dark:border-[#334155] text-[#64748B] hover:border-blue-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Org Name */}
          <div>
            <label className="block text-sm font-medium text-[#475569] dark:text-[#94A3B8] mb-1.5">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.org_name}
              onChange={set('org_name')}
              placeholder="e.g. MIT, Google, HackerCrew"
              className={inputCls}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#475569] dark:text-[#94A3B8] mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Brief description of your organization..."
              rows={3}
              className={inputCls + ' resize-none'}
            />
          </div>

          {/* Website + Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#475569] dark:text-[#94A3B8] mb-1.5 flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5" /> Website
              </label>
              <input
                type="url"
                value={form.website}
                onChange={set('website')}
                placeholder="https://..."
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#475569] dark:text-[#94A3B8] mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={set('location')}
                placeholder="City, Country"
                className={inputCls}
              />
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-[#475569] dark:text-[#94A3B8] mb-1.5">
              Logo URL (optional)
            </label>
            <input
              type="url"
              value={form.logo_url}
              onChange={set('logo_url')}
              placeholder="https://your-org.com/logo.png"
              className={inputCls}
            />
          </div>

          {/* What you get */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-500 mb-2 uppercase tracking-wide">
              As an organizer you can:
            </p>
            <ul className="space-y-1.5">
              {[
                'Create and manage coding contests',
                'Build a private problem bank',
                'View and export participant data',
                'Generate unique contest join codes',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-[#475569] dark:text-[#94A3B8]">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Create Organizer Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
