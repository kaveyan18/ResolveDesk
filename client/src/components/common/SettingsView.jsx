import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsView() {
  const { user, login } = useAuth();

  // Profile Form State
  const [fullName, setFullName] = useState(user?.name || '');
  const [phoneInfo, setPhoneInfo] = useState(user?.phone || '21CS0142');
  const [email] = useState(user?.email || '');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preference Toggles State
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [darkTheme, setDarkTheme] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  // Feedback State
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setPhoneInfo(user.phone || '21CS0142');
    }
  }, [user]);

  // Dark Theme Toggle Effect
  const handleDarkThemeToggle = () => {
    const nextTheme = !darkTheme;
    setDarkTheme(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('resolvedesk_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('resolvedesk_theme', 'light');
    }
  };

  // Save Changes Submission Handler
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // 1. Update Profile (Name & Phone)
      if (fullName !== user?.name || phoneInfo !== user?.phone) {
        const profileRes = await api.updateProfile({
          name: fullName,
          phone: phoneInfo,
        });

        if (profileRes.status === 'success' && profileRes.user) {
          const token = localStorage.getItem('resolvedesk_token');
          if (token) {
            login(profileRes.user, token);
          }
        }
      }

      // 2. Change Password if filled
      if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword) {
          throw new Error('Please provide your current password to change password.');
        }
        if (newPassword !== confirmPassword) {
          throw new Error('New password and confirm password do not match.');
        }
        if (newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters long.');
        }

        await api.changePassword({
          currentPassword,
          newPassword,
        });

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      setSuccessMsg('Settings saved successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      setErrorMsg(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* PAGE HEADER */}
      <div className="border-b border-surface-border pb-4">
        <h1 className="text-2xl font-bold font-display text-ink">Settings</h1>
        <p className="text-sm text-ink-muted mt-0.5">Manage your profile and preferences.</p>
      </div>

      {/* FEEDBACK BANNERS */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-status-success flex-shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* 2-COLUMN GRID (PROFILE/PASSWORD LEFT, PREFERENCES RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT CARD PANEL: PROFILE & PASSWORD */}
        <form
          onSubmit={handleSaveChanges}
          className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-6"
        >
          {/* PROFILE SECTION */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold font-display text-ink border-b border-surface-border pb-3">
              Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 border border-surface-border rounded-xl text-xs bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand transition"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  {user?.role === 'Student' ? 'Roll Number' : 'Phone / Info'}
                </label>
                <input
                  type="text"
                  value={phoneInfo}
                  onChange={(e) => setPhoneInfo(e.target.value)}
                  placeholder="e.g. 21CS0142"
                  className="w-full p-2.5 border border-surface-border rounded-xl text-xs bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand transition"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  College Email
                </label>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={email}
                  className="w-full p-2.5 border border-surface-border rounded-xl text-xs bg-slate-100 text-slate-500 font-mono cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* PASSWORD SECTION */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold font-display text-ink border-b border-surface-border pb-3">
              Password
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 border border-surface-border rounded-xl text-xs bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand transition font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 border border-surface-border rounded-xl text-xs bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand transition font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 border border-surface-border rounded-xl text-xs bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand transition font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* RIGHT CARD PANEL: PREFERENCES */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-6">
          <h3 className="text-sm font-bold font-display text-ink border-b border-surface-border pb-3">
            Preferences
          </h3>

          <div className="space-y-4 divide-y divide-surface-border">
            {/* Email Notifications */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-xs font-bold text-ink">Email notifications</p>
                <p className="text-[11px] text-ink-muted mt-0.5">Get emailed on status changes</p>
              </div>
              <button
                type="button"
                onClick={() => setEmailNotifs(!emailNotifs)}
                className={`relative inline-flex h-[22px] w-[38px] flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                  emailNotifs ? 'bg-brand' : 'bg-slate-200 border border-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-[2px] ${
                    emailNotifs ? 'ml-[18px]' : 'ml-[2px]'
                  }`}
                />
              </button>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-xs font-bold text-ink">Push notifications</p>
                <p className="text-[11px] text-ink-muted mt-0.5">Browser alerts for updates</p>
              </div>
              <button
                type="button"
                onClick={() => setPushNotifs(!pushNotifs)}
                className={`relative inline-flex h-[22px] w-[38px] flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                  pushNotifs ? 'bg-brand' : 'bg-slate-200 border border-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-[2px] ${
                    pushNotifs ? 'ml-[18px]' : 'ml-[2px]'
                  }`}
                />
              </button>
            </div>

            {/* Dark Theme */}
            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-xs font-bold text-ink">Dark theme</p>
                <p className="text-[11px] text-ink-muted mt-0.5">Switch to a dark interface</p>
              </div>
              <button
                type="button"
                onClick={handleDarkThemeToggle}
                className={`relative inline-flex h-[22px] w-[38px] flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                  darkTheme ? 'bg-brand' : 'bg-slate-200 border border-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-[2px] ${
                    darkTheme ? 'ml-[18px]' : 'ml-[2px]'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
