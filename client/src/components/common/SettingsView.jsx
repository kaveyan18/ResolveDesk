import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Building2,
  ShieldCheck,
  Briefcase,
  Award,
} from 'lucide-react';

export default function SettingsView() {
  const { user, setUser, logout } = useAuth();

  // Profile Form State
  const [fullName, setFullName] = useState(user?.name || '');
  const [phoneInfo, setPhoneInfo] = useState(user?.phone || '21CS0142');
  const [email] = useState(user?.email || '');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preference Toggles State
  const [emailNotifs, setEmailNotifs] = useState(
    user?.emailNotificationsEnabled !== false
  );
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
      setEmailNotifs(user.emailNotificationsEnabled !== false);
    }
  }, [user]);

  // Format user role for display
  const getRoleLabel = (role) => {
    switch (role) {
      case 'DepartmentHead':
        return 'Department Head';
      case 'Technician':
        return 'Technician / Staff';
      case 'Admin':
        return 'System Administrator';
      case 'Student':
        return 'Student';
      default:
        return role || 'User';
    }
  };

  // Format full position title
  const getPositionTitle = () => {
    const deptName = user?.department?.name || '';
    if (user?.role === 'DepartmentHead') {
      return deptName ? `${deptName} Head` : 'Department Head';
    }
    if (user?.role === 'Technician') {
      return deptName ? `${deptName} Technician` : 'Technician';
    }
    if (user?.role === 'Admin') {
      return 'System Administrator';
    }
    return 'Campus Student';
  };



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
      // 1. Update Profile (Name, Phone & Notification Preferences)
      const profileRes = await api.updateProfile({
        name: fullName,
        phone: phoneInfo,
        emailNotificationsEnabled: emailNotifs,
      });

      if (profileRes.status === 'success' && profileRes.user) {
        setUser(profileRes.user);
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

            {/* POSITION & ROLE CARD HEADER */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface-bg border border-surface-border">
              <div className="w-12 h-12 rounded-xl bg-brand text-white font-display font-bold text-base flex items-center justify-center shadow-md flex-shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'RD'}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-ink truncate">{user?.name}</span>
                  <span className="px-2 py-0.5 rounded-md bg-brand-soft text-brand text-[10px] font-bold font-mono uppercase tracking-wide">
                    {getPositionTitle()}
                  </span>
                </div>
                <p className="text-xs text-ink-muted flex items-center gap-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                  <span className="truncate">
                    {user?.department?.name
                      ? `${user.department.name} Department (${user.department.code || 'DEPT'})`
                      : user?.role === 'Student'
                      ? 'Campus Student'
                      : user?.role === 'Admin'
                      ? 'Central Administration'
                      : 'General Department'}
                  </span>
                </p>
              </div>
            </div>

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

              {/* SYSTEM ROLE (READ-ONLY) */}
              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  Role / Position
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={getRoleLabel(user?.role)}
                    className="w-full p-2.5 pl-8 border border-surface-border rounded-xl text-xs bg-slate-100 text-slate-700 font-semibold cursor-not-allowed"
                  />
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>

              {/* DEPARTMENT (READ-ONLY) */}
              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  Department
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={user?.department?.name || (user?.role === 'Admin' ? 'All Departments' : 'Campus / General')}
                    className="w-full p-2.5 pl-8 border border-surface-border rounded-xl text-xs bg-slate-100 text-slate-700 font-semibold cursor-not-allowed"
                  />
                  <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
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

              {/* SKILLS & SPECIALTIES BADGES */}
              {user?.skills && user.skills.length > 0 && (
                <div className="sm:col-span-2 space-y-1.5 pt-1">
                  <label className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                    Skills & Specialties
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {user.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-purple-soft text-purple text-xs font-semibold flex items-center gap-1 border border-purple-200"
                      >
                        <Award className="w-3 h-3 text-purple" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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

        {/* Session & Logout Section (Mobile & Desktop) */}
        <div className="bg-white border border-surface-border rounded-2xl p-5 shadow-subtle">
          <h2 className="text-sm font-bold text-ink mb-1">Session & Account</h2>
          <p className="text-xs text-ink-muted mb-4">Log out of your ResolveDesk account on this device.</p>
          <button
            type="button"
            onClick={logout}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-status-danger/10 text-status-danger hover:bg-status-danger hover:text-white font-semibold text-xs transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
