import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const Register = () => {
  const { sendRegistrationOTP, register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
    role: 'SALES',
  });
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

    if (!form.email) {
      setError('Email is required to send OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await sendRegistrationOTP(form.email);
      setSuccessMsg(res.data?.message || 'OTP sent successfully!');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        otp: form.otp,
        role: form.role,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
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
            <UserPlus className="w-10 h-10" strokeWidth={2.25} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-2">
            {step === 1 ? 'Step 1: Enter details & send OTP' : 'Step 2: Verify OTP & register'}
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

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="label-field">Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Your full name"
              />
            </div>
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
            <div>
              <label className="label-field">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                className="input-field"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="label-field">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Re-enter password"
              />
            </div>
            <div>
              <label className="label-field">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="input-field"
              >
                <option value="SALES">Sales</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5"
            >
              {loading ? renderLoader('Sending OTP...') : 'Send Verification OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="p-3 bg-primary-50 rounded-lg text-sm text-primary-700">
              OTP sent to: <strong>{form.email}</strong>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="ml-2 underline hover:text-primary-800"
              >
                Change email
              </button>
            </div>
            <div>
              <label className="label-field">Enter 6-digit OTP</label>
              <input
                type="text"
                name="otp"
                value={form.otp}
                onChange={handleChange}
                required
                maxLength={6}
                className="input-field text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-success w-full py-2.5"
            >
              {loading ? renderLoader('Verifying...') : 'Verify & Create Account'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-gray-100 text-sm text-center">
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
