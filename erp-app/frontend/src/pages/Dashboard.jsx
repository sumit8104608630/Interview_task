import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Package,
  ClipboardList,
  FileText,
  Receipt,
  CheckCircle2,
  Truck,
  IndianRupee,
  AlertTriangle,
  RefreshCw,
  PartyPopper,
  Loader2,
  Hash,
  Box,
  Database,
} from 'lucide-react';
import api, { apiResponse, apiError } from '../api/apiClient';
import {
  LOW_STOCK_THRESHOLD,
  safeNumber,
  computeAvailable,
  stockBadgeClass,
  stockStatusText,
} from '../utils/stock';

const DEFAULT_STATS = {
  totalCustomers: 0,
  totalProducts: 0,
  pendingEnquiries: 0,
  pendingQuotations: 0,
  pendingOrders: 0,
  confirmedOrders: 0,
  totalDispatches: 0,
  totalInventoryValue: 0,
  lowStockThreshold: LOW_STOCK_THRESHOLD,
  lowStockItems: [],
  randomProducts: [],
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        const data = apiResponse(res);
        setStats({ ...DEFAULT_STATS, ...(data?.data || {}) });
      } catch (err) {
        setError(apiError(err));
        setStats(DEFAULT_STATS);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const s = stats || DEFAULT_STATS;
  const lowStockThreshold = safeNumber(s.lowStockThreshold, LOW_STOCK_THRESHOLD);

  const lowStockItems = useMemo(
    () => (Array.isArray(s.lowStockItems) ? s.lowStockItems : []),
    [s.lowStockItems]
  );
  const randomProducts = useMemo(
    () => (Array.isArray(s.randomProducts) ? s.randomProducts : []),
    [s.randomProducts]
  );

  const statCards = [
    { label: 'Total Customers', value: s.totalCustomers, Icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Products', value: s.totalProducts, Icon: Package, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Pending Enquiries', value: s.pendingEnquiries, Icon: ClipboardList, color: 'from-amber-500 to-amber-600' },
    { label: 'Pending Quotations', value: s.pendingQuotations, Icon: FileText, color: 'from-purple-500 to-purple-600' },
    { label: 'Pending Orders', value: s.pendingOrders, Icon: Receipt, color: 'from-rose-500 to-rose-600' },
    { label: 'Confirmed Orders', value: s.confirmedOrders, Icon: CheckCircle2, color: 'from-cyan-500 to-cyan-600' },
    { label: 'Total Dispatches', value: s.totalDispatches, Icon: Truck, color: 'from-indigo-500 to-indigo-600' },
    {
      label: 'Inventory Value',
      value: `₹${Number(s.totalInventoryValue || 0).toLocaleString()}`,
      Icon: IndianRupee,
      color: 'from-teal-500 to-teal-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 border-b-2 border-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your business operations</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map(({ label, value, Icon, color }, i) => (
          <div key={i} className="card p-5 overflow-hidden relative">
            <div
              className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-8 translate-x-8`}
            ></div>
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${color} text-white shadow-sm`}>
                  <Icon className="w-6 h-6" strokeWidth={2} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Low Stock Items
            </h3>
            <span className="badge bg-amber-100 text-amber-700">
              {lowStockItems.length} items
            </span>
          </div>
          {lowStockItems.length === 0 ? (
            <p className="text-gray-400 text-center py-8 flex items-center justify-center gap-2">
              <PartyPopper className="w-5 h-5" />
              No low stock items
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Product</th>
                    <th className="table-header text-right">Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lowStockItems.map((item) => (
                    <tr key={item.product_id}>
                      <td className="table-cell">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-gray-500">{item.product_code}</p>
                      </td>
                      <td className="table-cell text-right">
                        <span
                          className={`badge ${
                            Number(item.available_qty || 0) <= 0
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {item.available_qty} units
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-gray-700" />
            Workflow Status
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Enquiries → New', count: s.pendingEnquiries || 0, status: 'bg-amber-500' },
              { label: 'Quotations → Draft/Sent', count: s.pendingQuotations || 0, status: 'bg-purple-500' },
              { label: 'Orders → Pending', count: s.pendingOrders || 0, status: 'bg-rose-500' },
              { label: 'Orders → Confirmed', count: s.confirmedOrders || 0, status: 'bg-cyan-500' },
              { label: 'Dispatches', count: s.totalDispatches || 0, status: 'bg-emerald-500' },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <span className="text-gray-700">{item.label}</span>
                  <span className="font-semibold text-gray-900">{item.count}</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.status} rounded-full transition-all`}
                    style={{
                      width: `${Math.min(100, ((item.count || 0) * 10))}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-500" />
            Products
          </h3>
          <span className="badge bg-indigo-100 text-indigo-700">
            {randomProducts.length} items
          </span>
        </div>
        {randomProducts.length === 0 ? (
          <p className="text-gray-400 text-center py-8 flex items-center justify-center gap-2">
            <Box className="w-5 h-5" />
            No products available
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {randomProducts.map((p) => {
              const physical = safeNumber(p.physical_qty);
              const reserved = safeNumber(p.reserved_qty);
              const damaged  = safeNumber(p.damaged_qty);
              const available = computeAvailable({
                ...p,
                physical_qty: physical,
                reserved_qty: reserved,
                damaged_qty: damaged,
              }, { clampNegative: false });
              const productName = p.product_name ?? p.name ?? '—';
              const productPrice = safeNumber(p.base_price ?? p.price ?? 0);
              const stockBadge = stockBadgeClass(available, lowStockThreshold);
              return (
                <div
                  key={p.id ?? `${p.product_code}-${Math.random()}`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className={`badge ${stockBadge}`}>
                      {stockStatusText(available, lowStockThreshold)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 truncate" title={productName}>
                    {productName}
                  </h4>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Hash className="w-3.5 h-3.5" />
                      <span className="truncate">{p.product_code ?? ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Database className="w-3.5 h-3.5" />
                      <span>{available} units available</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{productPrice.toLocaleString()}
                    </span>
                    {p.category && (
                      <span className="text-xs text-gray-500 truncate max-w-[50%]">
                        {p.category}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
