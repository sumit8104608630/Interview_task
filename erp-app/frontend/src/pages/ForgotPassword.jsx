import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const ForgotPassword = () => {
  const { sendForgotPasswordOTP, resetPassword } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', otp: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await sendForgotPasswordOTP(form.email);
      setSuccessMsg(res.data?.message || 'OTP sent to your email');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(form.email, form.otp, form.newPassword);
      setSuccessMsg('Password reset successfully! You can now log in.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const renderLoader = (label) => (
    <span className="flex items-center justify-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      {label}
    </span>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50 p-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg mb-3">
            <KeyRound className="w-10 h-10" strokeWidth={2.25} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-500 mt-2">
            {step === 1
              ? 'Enter your email to receive OTP'
              : step === 2
              ? 'Verify OTP and set new password'
              : 'All done!'}
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-5 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {successMsg}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="label-field">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? renderLoader('Sending OTP...') : 'Send Reset OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="label-field">6-digit OTP</label>
              <input
                type="text"
                name="otp"
                value={form.otp}
                onChange={handleChange}
                required
                maxLength={6}
                className="input-field text-center text-xl tracking-widest font-mono"
                placeholder="000000"
              />
            </div>
            <div>
              <label className="label-field">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-success w-full py-2.5">
              {loading ? renderLoader('Resetting...') : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" strokeWidth={1.75} />
            </div>
            <p className="text-gray-700">Password reset successful!</p>
            <Link to="/login" className="btn-primary inline-block w-full py-2.5">
              Go to Login
            </Link>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-100 text-sm text-center">
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
