import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import api, { apiResponse, apiError } from '../api/apiClient';
import { useAuth } from '../auth/AuthContext';

const statusBadge = (status) => {
  const map = {
    NEW: 'bg-blue-100 text-blue-700',
    QUOTED: 'bg-purple-100 text-purple-700',
    WON: 'bg-green-100 text-green-700',
    LOST: 'bg-gray-100 text-gray-600',
    DRAFT: 'bg-gray-100 text-gray-700',
    SENT: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-cyan-100 text-cyan-700',
    DISPATCHED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

const CloseButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
    aria-label="Close"
  >
    <X className="w-5 h-5" />
  </button>
);

const Customers = () => {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    contact_person: '',
    mobile: '',
    email: '',
    city: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(apiResponse(res).data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const openModal = () => {
    setForm({ company_name: '', contact_person: '', mobile: '', email: '', city: '' });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/customers', form);
      setShowModal(false);
      loadCustomers();
    } catch (err) {
      setFormError(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 border-b-2 border-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">Manage your customer database</p>
        </div>
        <button onClick={openModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Customer
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header">Company</th>
                <th className="table-header">Contact Person</th>
                <th className="table-header">Mobile</th>
                <th className="table-header">Email</th>
                <th className="table-header">City</th>
                <th className="table-header">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No customers yet. Create your first one!
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <p className="font-medium text-gray-900">{c.company_name}</p>
                    </td>
                    <td className="table-cell">{c.contact_person}</td>
                    <td className="table-cell">{c.mobile}</td>
                    <td className="table-cell text-gray-600">{c.email || '-'}</td>
                    <td className="table-cell">{c.city || '-'}</td>
                    <td className="table-cell text-gray-500 text-xs">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold">Create Customer</h2>
              <CloseButton onClick={() => setShowModal(false)} />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
                  {formError}
                </div>
              )}
              <div>
                <label className="label-field">Company Name *</label>
                <input
                  className="input-field"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Contact Person *</label>
                  <input
                    className="input-field"
                    value={form.contact_person}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label-field">Mobile *</label>
                  <input
                    className="input-field"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label-field">Email</label>
                <input
                  type="email"
                  className="input-field"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label-field">City</label>
                <input
                  className="input-field"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex items-center justify-center gap-2 min-w-[160px]">
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Customer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export { statusBadge, CloseButton };
export default Customers;
