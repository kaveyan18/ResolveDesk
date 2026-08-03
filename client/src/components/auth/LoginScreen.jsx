import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function LoginScreen() {
  const { login } = useAuth();

  // Mode: 'login' | 'forgot' | 'reset'
  const [mode, setMode] = useState('login');

  // Form Fields State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Helper to sanitize raw technical errors into user-friendly copy
  const formatUserFriendlyError = (err, fallback) => {
    const rawMsg = err?.message || '';
    if (
      rawMsg.toLowerCase().includes('route') ||
      rawMsg.toLowerCase().includes('not found') ||
      rawMsg.toLowerCase().includes('failed to fetch') ||
      rawMsg.toLowerCase().includes('networkerror')
    ) {
      return 'Unable to reach ResolveDesk server. Please check your connection or try again shortly.';
    }
    if (rawMsg.toLowerCase().includes('internal server error')) {
      return 'Service temporarily unavailable. Please try again in a few minutes.';
    }
    return rawMsg || fallback;
  };

  // 1. Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage(formatUserFriendlyError(err, 'Invalid credentials. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Forgot Password Submit
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await api.forgotPassword(email.trim());

      if (res.status === 'success') {
        setSuccessMessage(res.message);
        setMode('reset');
      } else {
        setErrorMessage(res.message || 'Failed to send OTP.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setErrorMessage(formatUserFriendlyError(err, 'Failed to request password reset OTP.'));
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await api.resetPassword(email.trim(), otp.trim(), newPassword);

      if (res.status === 'success') {
        setSuccessMessage('Password reset successfully! You can now log in with your new password.');
        setPassword(newPassword);
        setMode('login');
      } else {
        setErrorMessage(res.message || 'Failed to reset password.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setErrorMessage(formatUserFriendlyError(err, 'Failed to reset password. Please check your OTP.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-surface-bg font-sans text-ink">
      {/* LEFT BRAND PANEL */}
      <div
        className="hidden lg:flex flex-col justify-between p-14 text-white relative overflow-hidden"
        style={{
          backgroundColor: '#12172B',
          backgroundImage:
            'radial-gradient(circle at 15% 20%, rgba(42,79,209,.35), transparent 45%), radial-gradient(circle at 85% 80%, rgba(124,92,214,.28), transparent 45%)',
        }}
      >
        {/* Brand Mark */}
        <div className="flex items-center gap-2.5 z-10">
          <div className="w-2.5 h-2.5 rounded bg-brand shadow-[0_0_0_4px_rgba(42,79,209,0.25)]" />
          <span className="font-display font-bold text-xl tracking-tight">ResolveDesk</span>
        </div>

        {/* Center Content */}
        <div className="max-w-md my-auto z-10 space-y-6">
          <h1 className="text-4xl font-display font-bold leading-snug">
            Campus issues, tracked from report to resolved.
          </h1>
          <p className="text-sidebar-text text-base leading-relaxed">
            One place for students, technicians, department heads and admins to raise, route and close out complaints — without a single email thread.
          </p>

          {/* Signature Vertical Thread Timeline Preview */}
          <div className="pt-6 space-y-0 relative">
            {/* Thread item 1 */}
            <div className="flex gap-3.5 items-start relative pb-6">
              <div className="absolute left-[5px] top-4 bottom-0 w-px bg-white/15" />
              <div className="w-2.5 h-2.5 rounded-full bg-status-success mt-1 flex-shrink-0 shadow-[0_0_0_4px_rgba(31,157,108,0.18)]" />
              <div className="text-xs">
                <b className="block font-semibold text-white text-sm">Complaint submitted</b>
                <span className="text-sidebar-text text-xs">Hostel Block C · Electrical</span>
              </div>
            </div>

            {/* Thread item 2 */}
            <div className="flex gap-3.5 items-start relative pb-6">
              <div className="absolute left-[5px] top-4 bottom-0 w-px bg-white/15" />
              <div className="w-2.5 h-2.5 rounded-full bg-status-success mt-1 flex-shrink-0 shadow-[0_0_0_4px_rgba(31,157,108,0.18)]" />
              <div className="text-xs">
                <b className="block font-semibold text-white text-sm">Technician assigned</b>
                <span className="text-sidebar-text text-xs">Auto-routed in 4 min</span>
              </div>
            </div>

            {/* Thread item 3 */}
            <div className="flex gap-3.5 items-start relative">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-custom mt-1 flex-shrink-0 shadow-[0_0_0_4px_rgba(137,146,166,0.18)]" />
              <div className="text-xs">
                <b className="block font-semibold text-sidebar-text text-sm">In progress</b>
                <span className="text-sidebar-text text-xs">ETA today, 5:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-sidebar-text z-10">
          © {new Date().getFullYear()} ResolveDesk · Smart Campus Issue Tracking
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="flex items-center justify-center p-6 sm:p-12 md:p-16">
        <div className="w-full max-w-md space-y-6">
          {/* Header Mobile Brand */}
          <div className="flex items-center gap-2 lg:hidden mb-2">
            <div className="w-2.5 h-2.5 rounded bg-brand shadow-[0_0_0_4px_rgba(42,79,209,0.25)]" />
            <span className="font-display font-bold text-lg tracking-tight text-ink">ResolveDesk</span>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-status-success flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {mode === 'login' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-display text-ink">Welcome back</h2>
                <p className="text-sm text-ink-muted mt-1">Sign in to your ResolveDesk account.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    College Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@kct.ac.in"
                    className="w-full px-3.5 py-2.5 border border-surface-border rounded-lg bg-white text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 border border-surface-border rounded-lg bg-white text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition cursor-pointer p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-ink-muted">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-surface-border text-brand focus:ring-brand"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setSuccessMessage('');
                      setMode('forgot');
                    }}
                    className="text-brand font-semibold hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-brand text-white font-semibold rounded-lg text-sm hover:bg-brand-dark transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log in'}
                </button>
              </form>
            </div>
          )}

          {/* 2. FORGOT PASSWORD MODE */}
          {mode === 'forgot' && (
            <div>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setSuccessMessage('');
                  setMode('login');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink mb-4 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to login
              </button>

              <h2 className="text-2xl font-bold font-display text-ink">Reset password</h2>
              <p className="text-sm text-ink-muted mt-1">
                Enter your college email to receive a 6-digit OTP code.
              </p>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 mt-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    College Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@kct.ac.in"
                    className="w-full px-3.5 py-2.5 border border-surface-border rounded-lg bg-white text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-brand text-white font-semibold rounded-lg text-sm hover:bg-brand-dark transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset OTP'}
                </button>
              </form>
            </div>
          )}

          {/* 3. RESET PASSWORD MODE */}
          {mode === 'reset' && (
            <div>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setSuccessMessage('');
                  setMode('login');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink mb-4 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to login
              </button>

              <h2 className="text-2xl font-bold font-display text-ink">Enter Reset OTP</h2>
              <p className="text-sm text-ink-muted mt-1">
                Enter the 6-digit OTP sent to <span className="font-semibold text-ink">{email}</span>.
              </p>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4 mt-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.trim())}
                    placeholder="123456"
                    className="w-full px-3.5 py-2.5 border border-surface-border rounded-lg bg-white font-mono text-base tracking-widest text-center focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2.5 pr-10 border border-surface-border rounded-lg bg-white text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition cursor-pointer p-1"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-brand text-white font-semibold rounded-lg text-sm hover:bg-brand-dark transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm New Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
