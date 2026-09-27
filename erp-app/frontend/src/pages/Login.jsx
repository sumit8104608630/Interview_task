import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50 p-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg mb-3">
            <Building2 className="w-10 h-10" strokeWidth={2.25} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PERN ERP System</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="label-field">Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="admin@example.com"
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
              className="input-field"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 space-y-2 text-sm text-center">
          <div>
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Create new account
            </Link>
          </div>
          <div>
            <Link
              to="/forgot-password"
              className="text-gray-500 hover:text-gray-700"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-xs text-gray-500">
          <p className="font-semibold mb-1 text-gray-600">Demo Credentials:</p>
          <p>ADMIN: admin@example.com / password123</p>
          <p>SALES: sales@example.com / password123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
