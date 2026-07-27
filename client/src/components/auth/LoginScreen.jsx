import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginScreen() {
  const { login, forgotPassword, resetPassword } = useAuth();

  // Mode: 'login' | 'forgot' | 'reset'
  const [mode, setMode] = useState('login');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot / Reset Password State
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpHint, setOtpHint] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle Login Submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Request OTP
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      setSuccessMessage('OTP sent! Check your inbox or see the dev code below.');
      if (res.otp) {
        setOtpHint(res.otp);
      }
      setMode('reset');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send OTP. Please check email address.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password with OTP
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await resetPassword(email, otp, newPassword);
      setSuccessMessage('Password reset successfully! You can now log in.');
      setMode('login');
      setPassword('');
      setOtp('');
      setNewPassword('');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset password. Invalid or expired OTP.');
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

        {/* Footer info */}
        <div className="text-xs text-sidebar-text z-10">
          © 2026 ResolveDesk · Campus Operations Platform
        </div>
      </div>

      {/* RIGHT FORM WRAP */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>{successMessage}</p>
                {otpHint && (
                  <p className="font-mono font-semibold bg-emerald-100 px-2 py-0.5 rounded text-emerald-900 inline-block">
                    DEV OTP Code: {otpHint}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {mode === 'login' && (
            <div>
              <div className="space-y-1 mb-7">
                <h2 className="text-2xl font-bold font-display text-ink">Welcome back</h2>
                <p className="text-sm text-ink-muted">Sign in to your ResolveDesk account.</p>
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
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border border-surface-border rounded-lg bg-white text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition"
                  />
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
                    className="text-brand font-semibold hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-brand text-white font-semibold rounded-lg text-sm hover:bg-brand-dark transition flex items-center justify-center gap-2 shadow-sm"
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
                className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink mb-4 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Log in
              </button>

              <div className="space-y-1 mb-6">
                <h2 className="text-2xl font-bold font-display text-ink">Reset Password</h2>
                <p className="text-sm text-ink-muted">
                  Enter your registered email to receive a 6-digit verification code.
                </p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-4">
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
                  className="w-full py-2.5 px-4 bg-brand text-white font-semibold rounded-lg text-sm hover:bg-brand-dark transition flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Verification OTP'}
                </button>
              </form>
            </div>
          )}

          {/* 3. RESET PASSWORD WITH OTP MODE */}
          {mode === 'reset' && (
            <div>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setSuccessMessage('');
                  setMode('login');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink mb-4 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Log in
              </button>

              <div className="space-y-1 mb-6">
                <h2 className="text-2xl font-bold font-display text-ink">Enter OTP & New Password</h2>
                <p className="text-sm text-ink-muted">
                  Check your email for the 6-digit code sent to <b className="text-ink">{email}</b>.
                </p>
              </div>

              <form onSubmit={handleResetSubmit} className="space-y-4">
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
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 border border-surface-border rounded-lg bg-white text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-brand text-white font-semibold rounded-lg text-sm hover:bg-brand-dark transition flex items-center justify-center gap-2 shadow-sm"
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
