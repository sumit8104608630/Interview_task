import React, { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import api, { apiResponse, apiError } from '../api/apiClient';
import { useAuth } from '../auth/AuthContext';
import {
  LOW_STOCK_THRESHOLD,
  safeNumber,
  computeAvailable,
  stockBadgeClass,
} from '../utils/stock';

const Inventory = () => {
  const { isAdmin } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [lowStockThreshold, setLowStockThreshold] = useState(LOW_STOCK_THRESHOLD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ physical_qty: '', damaged_qty: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/inventory');
      const rows = Array.isArray(apiResponse(res).data) ? apiResponse(res).data : [];
      setInventory(rows);
      try {
        const ds = await api.get('/dashboard/stats');
        const threshold = Number(
          (apiResponse(ds)?.data || {}).lowStockThreshold
        );
        if (Number.isFinite(threshold) && threshold >= 0) {
          setLowStockThreshold(threshold);
        }
      } catch {
        // ignore; fallback to shared constant
      }
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (item) => {
    setEditing(item.product_id);
    setEditForm({
      physical_qty: item.physical_qty,
      damaged_qty: item.damaged_qty,
    });
    setFormError('');
  };

  const saveEdit = async () => {
    setFormError('');
    setSubmitting(true);
    try {
      await api.patch(`/inventory/product/${editing}`, editForm);
      setEditing(null);
      load();
    } catch (err) {
      setFormError(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const totals = useMemo(() => {
    const reduce = (key) => inventory.reduce((s, i) => s + safeNumber(i?.[key], 0), 0);
    const physical = reduce('physical_qty');
    const reserved = reduce('reserved_qty');
    const damaged  = reduce('damaged_qty');
    const available = inventory.reduce(
      (s, i) => s + computeAvailable(i, { clampNegative: false }),
      0
    );
    return {
      skus: inventory.length,
      physical: physical >= 0 ? physical : 0,
      reserved: reserved >= 0 ? reserved : 0,
      available: available >= 0 ? available : 0,
    };
  }, [inventory]);

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
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-500 mt-1">
          Track physical, reserved, damaged and available stock
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total SKUs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {totals.skus.toLocaleString()}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Physical Units</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {totals.physical.toLocaleString()}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Reserved</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {totals.reserved.toLocaleString()}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Available</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {totals.available.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header">Product</th>
                <th className="table-header text-right">Physical</th>
                <th className="table-header text-right">Reserved</th>
                <th className="table-header text-right">Damaged</th>
                <th className="table-header text-right">Available</th>
                {isAdmin && <th className="table-header">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventory.map((i) => {
                const isEditing = editing === i.product_id;
                const physical = safeNumber(i.physical_qty);
                const reserved = safeNumber(i.reserved_qty);
                const damaged  = safeNumber(i.damaged_qty);
                const available = computeAvailable({ ...i, physical_qty: physical, reserved_qty: reserved, damaged_qty: damaged }, { clampNegative: false });
                return (
                  <tr key={i.product_id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <p className="font-medium text-gray-900">{i.product_name ?? '—'}</p>
                      <p className="text-xs text-gray-500 font-mono">{i.product_code ?? ''}</p>
                    </td>
                    <td className="table-cell text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          className="input-field w-24 ml-auto text-right"
                          value={editForm.physical_qty}
                          onChange={(e) =>
                            setEditForm({ ...editForm, physical_qty: Number(e.target.value) })
                          }
                        />
                      ) : (
                        <span className="font-medium">{physical}</span>
                      )}
                    </td>
                    <td className="table-cell text-right text-amber-600">{reserved}</td>
                    <td className="table-cell text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          className="input-field w-24 ml-auto text-right"
                          value={editForm.damaged_qty}
                          onChange={(e) =>
                            setEditForm({ ...editForm, damaged_qty: Number(e.target.value) })
                          }
                        />
                      ) : (
                        <span className="text-red-600">{damaged}</span>
                      )}
                    </td>
                    <td className="table-cell text-right">
                      <span className={`badge ${stockBadgeClass(available, lowStockThreshold)}`}>
                        {available}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="table-cell">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              disabled={submitting}
                              className="btn-success text-xs py-1 px-3 flex items-center justify-center gap-1 min-w-[64px]"
                            >
                              {submitting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                'Save'
                              )}
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              className="btn-secondary text-xs py-1 px-3"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(i)}
                            className="btn-primary text-xs py-1 px-3"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {formError && (
          <div className="p-4 border-t border-gray-100">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
              {formError}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;

