import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '@features/auth/authSlice';
import toast from 'react-hot-toast';
import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';

export default function SettingsPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dispatch(updateProfile(profileForm));
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    setChangingPass(true);
    try {
      await axiosInstance.post(API_ROUTES.CHANGE_PASSWORD, {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <h1 className="text-text-primary text-xl font-bold">Settings</h1>

      {/* ── Profile Settings ─────────────────────────────── */}
      <div className="bg-bg-card border border-border-primary rounded-xl p-6">
        <h2 className="text-text-primary font-semibold mb-5">Profile Information</h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-secondary mb-1.5 font-mono">FIRST NAME</label>
              <input
                type="text"
                className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-brand-blue transition-colors"
                value={profileForm.first_name}
                onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5 font-mono">LAST NAME</label>
              <input
                type="text"
                className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-brand-blue transition-colors"
                value={profileForm.last_name}
                onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1.5 font-mono">BIO</label>
            <textarea
              rows={3}
              maxLength={500}
              className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-brand-blue transition-colors resize-none"
              placeholder="Tell the world about yourself..."
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
            />
            <p className="text-text-muted text-xs mt-1 text-right">{profileForm.bio.length}/500</p>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1.5 font-mono">AVATAR URL</label>
            <input
              type="url"
              className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-brand-blue transition-colors font-mono"
              placeholder="https://..."
              value={profileForm.avatar_url}
              onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-blue hover:bg-blue-500 disabled:opacity-60 text-white font-mono text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* ── Password Change ───────────────────────────────── */}
      <div className="bg-bg-card border border-border-primary rounded-xl p-6">
        <h2 className="text-text-primary font-semibold mb-5">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { key: 'old_password', label: 'CURRENT PASSWORD' },
            { key: 'new_password', label: 'NEW PASSWORD' },
            { key: 'confirm_password', label: 'CONFIRM NEW PASSWORD' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs text-text-secondary mb-1.5 font-mono">{label}</label>
              <input
                type="password"
                required
                minLength={key === 'old_password' ? 1 : 8}
                className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-brand-blue transition-colors"
                value={passwordForm[key]}
                onChange={(e) => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={changingPass}
            className="bg-bg-hover hover:bg-bg-tertiary text-text-primary border border-border-primary text-sm font-mono px-5 py-2.5 rounded-lg transition-colors"
          >
            {changingPass ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* ── Account Info ─────────────────────────────────── */}
      <div className="bg-bg-card border border-border-primary rounded-xl p-6">
        <h2 className="text-text-primary font-semibold mb-4">Account Info</h2>
        <div className="space-y-3 text-sm">
          <Row label="Username" value={`@${user?.username}`} mono />
          <Row label="Email" value={user?.email} />
          <Row label="Role" value={user?.role} mono />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-secondary last:border-0">
      <span className="text-text-muted text-xs font-mono">{label}</span>
      <span className={`text-text-secondary text-sm ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
