import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import api, { apiResponse, apiError } from '../api/apiClient';
import { useAuth } from '../auth/AuthContext';
import { useNotification } from '../components/NotificationContext.jsx';
import { statusBadge, CloseButton } from './Customers.jsx';

const SalesOrders = () => {
  const { isAdmin } = useAuth();
  const { notify, confirm } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [dispatchModal, setDispatchModal] = useState(null);
  const [dispatchForm, setDispatchForm] = useState({
    vehicle_number: '',
    driver_name: '',
    items: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/sales-orders');
      setOrders(apiResponse(res).data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const confirmOrder = async (id) => {
    const ok = await confirm('Confirm this sales order? This will reserve inventory.', {
      confirmText: 'Confirm Order',
    });
    if (!ok) return;
    try {
      await api.post(`/sales-orders/${id}/confirm`);
      notify.success('Order Confirmed', 'Inventory has been reserved successfully.');
      load();
    } catch (err) {
      notify.error('Confirmation Failed', apiError(err));
    }
  };

  const cancelOrder = async (id) => {
    const ok = await confirm('Cancel this confirmed order? Reserved inventory will be released.', {
      title: 'Cancel Order',
      confirmText: 'Cancel Order',
    });
    if (!ok) return;
    try {
      await api.post(`/sales-orders/${id}/cancel`);
      notify.success('Order Cancelled', 'Reservation has been released.');
      load();
    } catch (err) {
      notify.error('Cancellation Failed', apiError(err));
    }
  };

  const openDispatch = async (orderId) => {
    try {
      const safeParamId = Number(orderId);
      const res = await api.get(`/sales-orders/${safeParamId}`);
      const order = apiResponse(res).data;
      const authoritativeId = Number(order && order.id ? order.id : safeParamId);
      setDispatchModal({ ...order, id: authoritativeId });
      setDispatchForm({
        vehicle_number: '',
        driver_name: '',
        items: (order.items || []).map((it) => ({
          sales_order_item_id: Number(it.id ?? it.sales_order_item_id),
          product_id: Number(it.product_id),
          quantity: Math.max(0, Number(it.reserved_qty || 0) - Number(it.dispatched_qty || 0)),
          maxQty: Math.max(0, Number(it.reserved_qty || 0) - Number(it.dispatched_qty || 0)),
          product_name: it.product_name,
          reserved_qty: Number(it.reserved_qty || 0),
          dispatched_qty: Number(it.dispatched_qty || 0),
        })),
      });
      setFormError('');
    } catch (err) {
      notify.error('Load Failed', apiError(err));
    }
  };

  const openView = async (orderId) => {
    try {
      const res = await api.get(`/sales-orders/${orderId}`);
      setSelected(apiResponse(res).data);
    } catch (err) {
      notify.error('Load Failed', apiError(err));
    }
  };

  const updateDispatchItem = (idx, qty) => {
    const items = [...dispatchForm.items];
    const max = items[idx].maxQty;
    items[idx].quantity = Math.min(max, Math.max(0, Number(qty) || 0));
    setDispatchForm({ ...dispatchForm, items });
  };

  const submitDispatch = async (e) => {
    e.preventDefault();
    setFormError('');
    const toDispatch = dispatchForm.items.filter((i) => i.quantity > 0);
    if (toDispatch.length === 0) {
      setFormError('At least one item with quantity > 0 is required');
      return;
    }
    setSubmitting(true);
    try {
      const safeOrderId = Number(dispatchModal && dispatchModal.id);
      await api.post(`/sales-orders/${safeOrderId}/dispatch`, {
        sales_order_id: safeOrderId,
        vehicle_number: dispatchForm.vehicle_number,
        driver_name: dispatchForm.driver_name,
        items: toDispatch.map((i) => ({
          sales_order_item_id: Number(i.sales_order_item_id),
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
        })),
      });
      setDispatchModal(null);
      notify.success('Dispatch Created', 'The dispatch has been recorded successfully.');
      load();
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
        <p className="text-gray-500 mt-1">Track orders, confirmations, and dispatches</p>
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
                <th className="table-header">Order #</th>
                <th className="table-header">Quotation</th>
                <th className="table-header">Customer</th>
                <th className="table-header text-right">Total</th>
                <th className="table-header">Status</th>
                <th className="table-header">Confirmed By</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    No sales orders yet. Convert a quotation to create one.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <button
                        onClick={() => openView(o.id)}
                        className="font-mono font-medium text-primary-600 hover:text-primary-800"
                      >
                        {o.order_number}
                      </button>
                    </td>
                    <td className="table-cell font-mono text-xs">{o.quotation_number}</td>
                    <td className="table-cell">{o.company_name}</td>
                    <td className="table-cell text-right font-semibold">
                      ₹{Number(o.total_amount).toLocaleString()}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${statusBadge(o.status)}`}>{o.status}</span>
                    </td>
                    <td className="table-cell text-xs text-gray-600">
                      {o.confirmed_by_name || '-'}
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-wrap gap-2">
                        {isAdmin && o.status === 'PENDING' && (
                          <button
                            onClick={() => confirmOrder(o.id)}
                            className="btn-success text-xs py-1 px-2"
                          >
                            Confirm
                          </button>
                        )}
                        {isAdmin && o.status === 'CONFIRMED' && (
                          <>
                            <button
                              onClick={() => openDispatch(o.id)}
                              className="btn-primary text-xs py-1 px-2"
                            >
                              Dispatch
                            </button>
                            <button
                              onClick={() => cancelOrder(o.id)}
                              className="btn-danger text-xs py-1 px-2"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {(o.status === 'CONFIRMED' || o.status === 'DISPATCHED') && (
                          <button
                            onClick={() => openView(o.id)}
                            className="btn-secondary text-xs py-1 px-2"
                          >
                            View
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold">{selected.order_number}</h2>
                <div className="flex gap-3 items-center mt-1 text-sm text-gray-500">
                  <span>{selected.company_name}</span>
                  <span className={`badge ${statusBadge(selected.status)}`}>
                    {selected.status}
                  </span>
                </div>
              </div>
              <CloseButton onClick={() => setSelected(null)} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="table-header">Product</th>
                    <th className="table-header text-right">Qty</th>
                    <th className="table-header text-right">Reserved</th>
                    <th className="table-header text-right">Dispatched</th>
                    <th className="table-header text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(selected.items || []).map((it) => (
                    <tr key={it.id}>
                      <td className="table-cell">
                        <p className="font-medium">{it.product_name}</p>
                        <p className="text-xs text-gray-500 font-mono">{it.product_code}</p>
                      </td>
                      <td className="table-cell text-right">{it.quantity}</td>
                      <td className="table-cell text-right text-amber-600 font-medium">
                        {it.reserved_qty}
                      </td>
                      <td className="table-cell text-right text-emerald-600 font-medium">
                        {it.dispatched_qty}
                      </td>
                      <td className="table-cell text-right font-medium">
                        ₹{(it.quantity * it.unit_price).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="py-3 text-right font-bold text-gray-900">
                      Total:
                    </td>
                    <td className="py-3 text-right text-xl font-bold text-primary-700">
                      ₹{Number(selected.total_amount).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {dispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold">Create Dispatch</h2>
                <p className="text-sm text-gray-500">
                  {dispatchModal.order_number} — {dispatchModal.company_name}
                </p>
              </div>
              <CloseButton onClick={() => setDispatchModal(null)} />
            </div>
            <form onSubmit={submitDispatch} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Vehicle Number</label>
                  <input
                    className="input-field"
                    value={dispatchForm.vehicle_number}
                    onChange={(e) =>
                      setDispatchForm({ ...dispatchForm, vehicle_number: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label-field">Driver Name</label>
                  <input
                    className="input-field"
                    value={dispatchForm.driver_name}
                    onChange={(e) =>
                      setDispatchForm({ ...dispatchForm, driver_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="label-field">Dispatch Quantities</label>
                <div className="space-y-2 mt-2">
                  {dispatchForm.items.map((it, idx) => (
                    <div
                      key={it.sales_order_item_id}
                      className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{it.product_name}</span>
                        <span className="text-xs text-gray-500">
                          Remaining: {it.reserved_qty - it.dispatched_qty} / {it.reserved_qty}
                        </span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={it.maxQty}
                        className="input-field"
                        value={it.quantity}
                        onChange={(e) => updateDispatchItem(idx, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDispatchModal(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-success flex items-center justify-center gap-2 min-w-[180px]">
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Dispatch'
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

export default SalesOrders;
