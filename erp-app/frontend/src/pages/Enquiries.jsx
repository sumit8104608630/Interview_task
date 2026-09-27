import React, { useState, useEffect } from 'react';
import { Plus, Loader2, X, Trash2 } from 'lucide-react';
import api, { apiResponse, apiError } from '../api/apiClient';
import { useAuth } from '../auth/AuthContext';
import { useNotification } from '../components/NotificationContext.jsx';
import { statusBadge, CloseButton } from './Customers.jsx';

const Enquiries = () => {
  const { isAdmin, isSales, user } = useAuth();
  const { notify } = useNotification();
  const [enquiries, setEnquiries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    customer_id: '',
    required_date: '',
    notes: '',
    items: [{ product_id: '', quantity: 1 }],
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    try {
      const [e, c, p] = await Promise.all([
        api.get('/enquiries'),
        api.get('/customers'),
        api.get('/products'),
      ]);
      setEnquiries(apiResponse(e).data);
      setCustomers(apiResponse(c).data);
      setProducts(apiResponse(p).data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { product_id: '', quantity: 1 }] });
  };
  const removeItem = (idx) => {
    if (form.items.length === 1) return;
    const items = [...form.items];
    items.splice(idx, 1);
    setForm({ ...form, items });
  };
  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx][field] = value;
    setForm({ ...form, items });
  };

  const openCreate = () => {
    setForm({
      customer_id: customers[0]?.id || '',
      required_date: '',
      notes: '',
      items: [{ product_id: products[0]?.id || '', quantity: 1 }],
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/enquiries', {
        customer_id: Number(form.customer_id),
        required_date: form.required_date || undefined,
        notes: form.notes,
        items: form.items.map((i) => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
        })),
      });
      setShowModal(false);
      load();
    } catch (err) {
      setFormError(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/enquiries/${id}/status`, { status });
      load();
    } catch (err) {
      notify.error('Status Update Failed', apiError(err));
    }
  };

  const openViewItems = async (enquiryId) => {
    try {
      const res = await api.get(`/enquiries/${enquiryId}`);
      setSelected(apiResponse(res).data);
    } catch (err) {
      notify.error('Load Failed', apiError(err));
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
          <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
          <p className="text-gray-500 mt-1">Customer enquiries and product requirements</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Enquiry
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
                <th className="table-header">Enquiry #</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Date</th>
                <th className="table-header">Required</th>
                <th className="table-header">Items</th>
                <th className="table-header">Status</th>
                <th className="table-header">Created By</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    No enquiries found
                  </td>
                </tr>
              ) : (
                enquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono font-medium">
                      {enq.enquiry_number}
                    </td>
                    <td className="table-cell">
                      <p className="font-medium">{enq.company_name}</p>
                      <p className="text-xs text-gray-500">{enq.contact_person}</p>
                    </td>
                    <td className="table-cell text-xs">
                      {new Date(enq.enquiry_date).toLocaleDateString()}
                    </td>
                    <td className="table-cell text-xs text-gray-600">
                      {enq.required_date
                        ? new Date(enq.required_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => openViewItems(enq.id)}
                        className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                      >
                        View Items
                      </button>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${statusBadge(enq.status)}`}>{enq.status}</span>
                    </td>
                    <td className="table-cell text-xs text-gray-600">
                      {enq.created_by_name}
                    </td>
                    <td className="table-cell">
                      {enq.status === 'NEW' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(enq.id, 'QUOTED')}
                            className="btn-primary text-xs py-1 px-2"
                          >
                            Mark Quoted
                          </button>
                          <button
                            onClick={() => updateStatus(enq.id, 'LOST')}
                            className="btn-danger text-xs py-1 px-2"
                          >
                            Lost
                          </button>
                        </div>
                      )}
                      {enq.status === 'QUOTED' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(enq.id, 'WON')}
                            className="btn-success text-xs py-1 px-2"
                          >
                            Won
                          </button>
                          <button
                            onClick={() => updateStatus(enq.id, 'LOST')}
                            className="btn-danger text-xs py-1 px-2"
                          >
                            Lost
                          </button>
                        </div>
                      )}
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
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold">Create New Enquiry</h2>
              <CloseButton onClick={() => setShowModal(false)} />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Customer *</label>
                  <select
                    className="input-field"
                    value={form.customer_id}
                    onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-field">Required Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.required_date}
                    onChange={(e) => setForm({ ...form, required_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label-field">Notes</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label-field mb-0">Items *</label>
                  <button type="button" onClick={addItem} className="btn-secondary text-xs py-1 px-3 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-7">
                        <select
                          className="input-field"
                          value={item.product_id}
                          onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                          required
                        >
                          <option value="">Select Product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.product_code} - {p.product_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min={1}
                          placeholder="Qty"
                          className="input-field"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          disabled={form.items.length === 1}
                          className="btn-secondary w-full py-2 text-sm disabled:opacity-30 flex items-center justify-center gap-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
                    'Create Enquiry'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">{selected.enquiry_number}</h2>
                <p className="text-sm text-gray-500">{selected.company_name}</p>
              </div>
              <CloseButton onClick={() => setSelected(null)} />
            </div>
            {selected.notes && (
              <p className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {selected.notes}
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="table-header">Product</th>
                    <th className="table-header text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(selected.items || []).map((it) => (
                    <tr key={it.id}>
                      <td className="table-cell">
                        <p className="font-medium">{it.product_name}</p>
                        <p className="text-xs text-gray-500 font-mono">{it.product_code}</p>
                      </td>
                      <td className="table-cell text-right font-medium">{it.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enquiries;
