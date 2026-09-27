import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import api, { apiResponse, apiError } from '../api/apiClient';
import { CloseButton } from './Customers.jsx';

const Dispatches = () => {
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/dispatches');
      setDispatches(apiResponse(res).data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
        <h1 className="text-2xl font-bold text-gray-900">Dispatches</h1>
        <p className="text-gray-500 mt-1">Outbound shipments and order deliveries</p>
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
                <th className="table-header">Dispatch #</th>
                <th className="table-header">Sales Order</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Date</th>
                <th className="table-header">Vehicle</th>
                <th className="table-header">Driver</th>
                <th className="table-header">Created By</th>
                <th className="table-header">Order Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dispatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    No dispatches yet. Confirm and dispatch a sales order.
                  </td>
                </tr>
              ) : (
                dispatches.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <button
                        onClick={() => setSelected(d)}
                        className="font-mono font-medium text-primary-600 hover:text-primary-800"
                      >
                        {d.dispatch_number}
                      </button>
                    </td>
                    <td className="table-cell font-mono text-xs">{d.order_number}</td>
                    <td className="table-cell">{d.company_name}</td>
                    <td className="table-cell text-xs">
                      {new Date(d.dispatch_date).toLocaleDateString()}
                    </td>
                    <td className="table-cell font-mono text-sm">
                      {d.vehicle_number || '-'}
                    </td>
                    <td className="table-cell">{d.driver_name || '-'}</td>
                    <td className="table-cell text-xs text-gray-600">{d.created_by_name}</td>
                    <td className="table-cell">
                      <span
                        className={`badge ${
                          d.order_status === 'DISPATCHED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-cyan-100 text-cyan-700'
                        }`}
                      >
                        {d.order_status}
                      </span>
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
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold">{selected.dispatch_number}</h2>
                <p className="text-sm text-gray-500">
                  {selected.order_number} • {selected.company_name}
                </p>
              </div>
              <CloseButton onClick={() => setSelected(null)} />
            </div>

            {(selected.vehicle_number || selected.driver_name) && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg grid grid-cols-2 gap-3 text-sm">
                {selected.vehicle_number && (
                  <div>
                    <span className="text-gray-500">Vehicle: </span>
                    <span className="font-mono font-medium">{selected.vehicle_number}</span>
                  </div>
                )}
                {selected.driver_name && (
                  <div>
                    <span className="text-gray-500">Driver: </span>
                    <span className="font-medium">{selected.driver_name}</span>
                  </div>
                )}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="table-header">Product</th>
                    <th className="table-header text-right">Unit Price</th>
                    <th className="table-header text-right">Order Qty</th>
                    <th className="table-header text-right text-emerald-700">
                      Dispatched
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(selected.items || []).map((it) => (
                    <tr key={it.id}>
                      <td className="table-cell">
                        <p className="font-medium">{it.product_name}</p>
                        <p className="text-xs text-gray-500 font-mono">{it.product_code}</p>
                      </td>
                      <td className="table-cell text-right">
                        ₹{Number(it.unit_price).toLocaleString()}
                      </td>
                      <td className="table-cell text-right">{it.order_quantity}</td>
                      <td className="table-cell text-right font-semibold text-emerald-700">
                        {it.quantity}
                      </td>
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

export default Dispatches;
