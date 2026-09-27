import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import api, { apiResponse, apiError } from '../api/apiClient';
import { useAuth } from '../auth/AuthContext';
import { CloseButton } from './Customers.jsx';
import {
  LOW_STOCK_THRESHOLD,
  safeNumber,
  computeAvailable,
  stockBadgeClass,
} from '../utils/stock';

const DEFAULT_THRESHOLD = LOW_STOCK_THRESHOLD;

const Products = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [lowStockThreshold, setLowStockThreshold] = useState(DEFAULT_THRESHOLD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    product_code: '',
    product_name: '',
    category: '',
    unit: 'piece',
    base_price: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    try {
      const [prodRes, dashRes] = await Promise.allSettled([
        api.get('/products'),
        api.get('/dashboard/stats'),
      ]);
      if (prodRes.status === 'fulfilled') {
        setProducts(Array.isArray(apiResponse(prodRes.value).data) ? apiResponse(prodRes.value).data : []);
      } else {
        setError(apiError(prodRes.reason));
      }
      if (dashRes.status === 'fulfilled') {
        const threshold = Number(
          (apiResponse(dashRes.value)?.data || {}).lowStockThreshold
        );
        if (Number.isFinite(threshold) && threshold >= 0) {
          setLowStockThreshold(threshold);
        }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/products', form);
      setShowModal(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Product catalog and inventory status</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setForm({ product_code: '', product_name: '', category: '', unit: 'piece', base_price: '' });
              setFormError('');
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Product
          </button>
        )}
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
                <th className="table-header">Code</th>
                <th className="table-header">Product Name</th>
                <th className="table-header">Category</th>
                <th className="table-header">Unit</th>
                <th className="table-header text-right">Base Price</th>
                <th className="table-header text-right">Available</th>
                <th className="table-header text-right">Physical</th>
                <th className="table-header text-right">Reserved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const physical = safeNumber(p.physical_qty);
                  const reserved = safeNumber(p.reserved_qty);
                  const damaged  = safeNumber(p.damaged_qty);
                  const avl      = computeAvailable({
                    ...p,
                    physical_qty: physical,
                    reserved_qty: reserved,
                    damaged_qty: damaged,
                  }, { clampNegative: false });
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {p.product_code}
                        </span>
                      </td>
                      <td className="table-cell font-medium text-gray-900">{p.product_name}</td>
                      <td className="table-cell text-gray-600">{p.category || '-'}</td>
                      <td className="table-cell">{p.unit}</td>
                      <td className="table-cell text-right font-medium">₹{safeNumber(p.base_price).toLocaleString()}</td>
                      <td className="table-cell text-right">
                        <span className={`badge ${stockBadgeClass(avl, lowStockThreshold)}`}>
                          {avl}
                        </span>
                      </td>
                      <td className="table-cell text-right text-gray-600">{physical}</td>
                      <td className="table-cell text-right text-gray-600">{reserved}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold">Create Product</h2>
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
                  <label className="label-field">Product Code *</label>
                  <input
                    className="input-field"
                    value={form.product_code}
                    onChange={(e) => setForm({ ...form, product_code: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label-field">Unit *</label>
                  <select
                    className="input-field"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  >
                    <option value="piece">piece</option>
                    <option value="box">box</option>
                    <option value="set">set</option>
                    <option value="kg">kg</option>
                    <option value="meter">meter</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label-field">Product Name *</label>
                <input
                  className="input-field"
                  value={form.product_name}
                  onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Category</label>
                  <input
                    className="input-field"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-field">Base Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-field"
                    value={form.base_price}
                    onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                    required
                  />
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
                    'Create Product'
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

export default Products;
