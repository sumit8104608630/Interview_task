import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Customers from './pages/Customers.jsx';
import Products from './pages/Products.jsx';
import Inventory from './pages/Inventory.jsx';
import Enquiries from './pages/Enquiries.jsx';
import Quotations from './pages/Quotations.jsx';
import SalesOrders from './pages/SalesOrders.jsx';
import Dispatches from './pages/Dispatches.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="products" element={<Products />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="quotations" element={<Quotations />} />
        <Route path="sales-orders" element={<SalesOrders />} />
        <Route path="dispatches" element={<Dispatches />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
