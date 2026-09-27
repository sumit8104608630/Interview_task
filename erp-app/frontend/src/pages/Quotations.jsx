import React, { useState, useEffect } from 'react';
import { Plus, Loader2, ArrowRight, Trash2 } from 'lucide-react';
import api, { apiResponse, apiError } from '../api/apiClient';
import { useAuth } from '../auth/AuthContext';
import { useNotification } from '../components/NotificationContext.jsx';
import { statusBadge, CloseButton } from './Customers.jsx';
import { useNavigate } from 'react-router-dom';

const Quotations = () => {
  const { isAdmin, isSales } = useAuth();
  const { notify, confirm } = useNotification();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    enquiry_id: '',
    customer_id: '',
    valid_until: '',
    items: [{ product_id: '', quantity: 1, unit_price: 0, discount_pct: 0, gst_pct: 18 }],
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    try {
      const [q, e, c, p] = await Promise.all([
        api.get('/quotations'),
        api.get('/enquiries'),
        api.get('/customers'),
        api.get('/products'),
      ]);
      setQuotations(apiResponse(q).data);
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

  const calcLineTotal = (item) => {
    const base = Number(item.quantity || 0) * Number(item.unit_price || 0);
    const disc = (base * Number(item.discount_pct || 0)) / 100;
    const tax = base - disc;
    const gst = (tax * Number(item.gst_pct || 0)) / 100;
    return tax + gst;
  };

  const grandTotal = form.items.reduce((s, it) => s + calcLineTotal(it), 0);

  const addItem = () =>
    setForm({
      ...form,
      items: [
        ...form.items,
        { product_id: '', quantity: 1, unit_price: 0, discount_pct: 0, gst_pct: 18 },
      ],
    });
  const removeItem = (idx) => {
    if (form.items.length === 1) return;
    const items = [...form.items];
    items.splice(idx, 1);
    setForm({ ...form, items });
  };
  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    if (['quantity', 'unit_price', 'discount_pct', 'gst_pct'].includes(field)) {
      items[idx][field] = Number(value);
    } else {
      items[idx][field] = value;
      if (field === 'product_id') {
        const p = products.find((pr) => pr.id === Number(value));
        if (p) items[idx].unit_price = Number(p.base_price);
      }
    }
    setForm({ ...form, items });
  };

  const openCreate = () => {
    setForm({
      enquiry_id: enquiries[0]?.id || '',
      customer_id: enquiries[0]?.customer_id || customers[0]?.id || '',
      valid_until: '',
      items: [
        {
          product_id: products[0]?.id || '',
          quantity: 1,
          unit_price: Number(products[0]?.base_price || 0),
          discount_pct: 0,
          gst_pct: 18,
        },
      ],
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/quotations', {
        enquiry_id: Number(form.enquiry_id),
        customer_id: Number(form.customer_id),
        valid_until: form.valid_until || undefined,
        items: form.items.map((i) => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          discount_pct: Number(i.discount_pct),
          gst_pct: Number(i.gst_pct),
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
      await api.patch(`/quotations/${id}/status`, { status });
      load();
    } catch (err) {
      notify.error('Status Update Failed', apiError(err));
    }
  };

  const convertQuotation = async (id) => {
    const ok = await confirm('Convert this ACCEPTED quotation to a Sales Order?', {
      title: 'Convert Quotation',
      confirmText: 'Convert',
    });
    if (!ok) return;
    try {
      await api.post(`/quotations/${id}/convert`);
      notify.success('Sales Order Created', 'The quotation has been converted successfully.');
      navigate('/sales-orders');
    } catch (err) {
      notify.error('Conversion Failed', apiError(err));
    }
  };

  const openView = async (quotationId) => {
    try {
      const res = await api.get(`/quotations/${quotationId}`);
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
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-500 mt-1">Price quotations with discounts and GST</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Quotation
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
                <th className="table-header">Quotation #</th>
                <th className="table-header">Enquiry</th>
                <th className="table-header">Customer</th>
                <th className="table-header text-right">Grand Total</th>
                <th className="table-header">Valid Until</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    No quotations found
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <button
                        onClick={() => openView(q.id)}
                        className="font-mono font-medium text-primary-600 hover:text-primary-800"
                      >
                        {q.quotation_number}
                      </button>
                    </td>
                    <td className="table-cell font-mono text-xs">{q.enquiry_number}</td>
                    <td className="table-cell">{q.company_name}</td>
                    <td className="table-cell text-right font-semibold">
                      ₹{Number(q.grand_total).toLocaleString()}
                    </td>
                    <td className="table-cell text-xs">
                      {q.valid_until ? new Date(q.valid_until).toLocaleDateString() : '-'}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${statusBadge(q.status)}`}>{q.status}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-wrap gap-2">
                        {q.status === 'DRAFT' && (
                          <button
                            onClick={() => updateStatus(q.id, 'SENT')}
                            className="btn-primary text-xs py-1 px-2"
                          >
                            Send
                          </button>
                        )}
                        {q.status === 'SENT' && (
                          <>
                            <button
                              onClick={() => updateStatus(q.id, 'ACCEPTED')}
                              className="btn-success text-xs py-1 px-2"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => updateStatus(q.id, 'REJECTED')}
                              className="btn-danger text-xs py-1 px-2"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {q.status === 'ACCEPTED' && isAdmin && (
                          <button
                            onClick={() => convertQuotation(q.id)}
                            className="btn-warning text-xs py-1 px-2 text-white flex items-center gap-1"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            Convert to SO
                          </button>
                        )}
                      </div>
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
          <div className="card w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold">Create Quotation</h2>
              <CloseButton onClick={() => setShowModal(false)} />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label-field">Enquiry *</label>
                  <select
                    className="input-field"
                    value={form.enquiry_id}
                    onChange={(e) => {
                      const enq = enquiries.find((x) => x.id === Number(e.target.value));
                      setForm({
                        ...form,
                        enquiry_id: e.target.value,
                        customer_id: enq?.customer_id || form.customer_id,
                      });
                    }}
                    required
                  >
                    <option value="">Select Enquiry</option>
                    {enquiries.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.enquiry_number} - {e.company_name}
                      </option>
                    ))}
                  </select>
                </div>
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
                  <label className="label-field">Valid Until</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.valid_until}
                    onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label-field mb-0">Line Items *</label>
                  <button type="button" onClick={addItem} className="btn-secondary text-xs py-1 px-3 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600 px-1">
                    <div className="col-span-4">Product</div>
                    <div className="col-span-1 text-right">Qty</div>
                    <div className="col-span-2 text-right">Unit (₹)</div>
                    <div className="col-span-1 text-right">Disc%</div>
                    <div className="col-span-1 text-right">GST%</div>
                    <div className="col-span-2 text-right">Line Total</div>
                    <div className="col-span-1"></div>
                  </div>
                  {form.items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <select
                          className="input-field text-sm py-1.5"
                          value={it.product_id}
                          onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.product_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="number"
                        min={1}
                        className="col-span-1 input-field text-sm py-1.5 text-right"
                        value={it.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="col-span-2 input-field text-sm py-1.5 text-right"
                        value={it.unit_price}
                        onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        className="col-span-1 input-field text-sm py-1.5 text-right"
                        value={it.discount_pct}
                        onChange={(e) => updateItem(idx, 'discount_pct', e.target.value)}
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="col-span-1 input-field text-sm py-1.5 text-right"
                        value={it.gst_pct}
                        onChange={(e) => updateItem(idx, 'gst_pct', e.target.value)}
                      />
                      <div className="col-span-2 text-right font-semibold pr-2">
                        ₹{calcLineTotal(it).toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={form.items.length === 1}
                        className="col-span-1 btn-secondary py-1.5 text-sm disabled:opacity-30 flex items-center justify-center gap-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                  <div className="text-right w-64">
                    <div className="flex justify-between py-1 text-lg font-bold">
                      <span>Grand Total:</span>
                      <span className="text-primary-700">₹{grandTotal.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500">Backend recalculates on save</p>
                  </div>
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
                    'Create Quotation'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold">{selected.quotation_number}</h2>
                <p className="text-sm text-gray-500">{selected.company_name}</p>
              </div>
              <CloseButton onClick={() => setSelected(null)} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="table-header">Product</th>
                    <th className="table-header text-right">Qty</th>
                    <th className="table-header text-right">Unit</th>
                    <th className="table-header text-right">Disc%</th>
                    <th className="table-header text-right">GST%</th>
                    <th className="table-header text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(selected.items || []).map((it) => (
                    <tr key={it.id}>
                      <td className="table-cell">{it.product_name}</td>
                      <td className="table-cell text-right">{it.quantity}</td>
                      <td className="table-cell text-right">₹{Number(it.unit_price).toFixed(2)}</td>
                      <td className="table-cell text-right">{it.discount_pct}%</td>
                      <td className="table-cell text-right">{it.gst_pct}%</td>
                      <td className="table-cell text-right font-medium">
                        ₹{Number(it.line_amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="py-3 text-right font-bold text-gray-900">
                      Grand Total:
                    </td>
                    <td className="py-3 text-right text-xl font-bold text-primary-700">
                      ₹{Number(selected.grand_total).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotations;
