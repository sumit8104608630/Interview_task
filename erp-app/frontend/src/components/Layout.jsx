import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Warehouse,
  ClipboardList,
  FileText,
  Receipt,
  Truck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const Layout = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard, roles: ['ADMIN', 'SALES'] },
    { path: '/customers', label: 'Customers', Icon: Users, roles: ['ADMIN', 'SALES'] },
    { path: '/products', label: 'Products', Icon: Package, roles: ['ADMIN', 'SALES'] },
    { path: '/inventory', label: 'Inventory', Icon: Warehouse, roles: ['ADMIN'] },
    { path: '/enquiries', label: 'Enquiries', Icon: ClipboardList, roles: ['ADMIN', 'SALES'] },
    { path: '/quotations', label: 'Quotations', Icon: FileText, roles: ['ADMIN', 'SALES'] },
    { path: '/sales-orders', label: 'Sales Orders', Icon: Receipt, roles: ['ADMIN'] },
    { path: '/dispatches', label: 'Dispatches', Icon: Truck, roles: ['ADMIN'] },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-sm">
                <Building2 className="w-6 h-6" strokeWidth={2.25} />
              </div>
              <h1 className="text-lg font-bold text-primary-700">PERN ERP</h1>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems
            .filter((item) => item.roles.includes(user?.role))
            .map(({ path, label, Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                {sidebarOpen && <span>{label}</span>}
              </NavLink>
            ))}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <div className={`flex items-center gap-3 p-2 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {isAdmin ? 'Administrator' : 'Sales'}
                </p>
              </div>
            )}
          </div>
          {sidebarOpen ? (
            <button
              onClick={handleLogout}
              className="w-full mt-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          ) : null}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            <h2 className="text-sm text-gray-500">Welcome back,</h2>
            <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`badge ${
                isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {user?.role}
            </span>
            <button
              onClick={handleLogout}
              className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
