import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import SaaSLanding from './pages/SaaSLanding';
import Storefront from './pages/Storefront';
import ProductDetails from './pages/ProductDetails';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';

// Tenant Admin
import Dashboard from './pages/TenantAdmin/Dashboard';
import Config from './pages/TenantAdmin/Config';
import Categories from './pages/TenantAdmin/Categories';
import Products from './pages/TenantAdmin/Products';
import Webhooks from './pages/TenantAdmin/Webhooks';

// Super Admin
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';

import { Sun, Moon, Shield } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Default to dark theme for maximum premium aesthetics
    const initialTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle dark/light theme">
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

const HeaderNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Hide the standard SaaS navbar when viewing dashboards (Admin / SuperAdmin)
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/super-admin')) {
    return null;
  }

  return (
    <nav className="main-navbar">
      <Link to="/" className="brand-logo">
        <img src="/logo.png" alt="KromicStore" onError={(e) => {
          // Fallback if logo fails to load
          e.currentTarget.style.display = 'none';
        }} />
        <span>KromicStore</span>
      </Link>

      <div className="nav-actions">
        <ThemeToggle />

        {user ? (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Hello, <strong>{user.firstName || user.email.split('@')[0]}</strong>
            </span>
            {user.roles.includes('SuperUser') ? (
              <Link to="/super-admin" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
                <Shield size={14} /> Operations
              </Link>
            ) : user.roles.includes('TenantAdmin') ? (
              <Link to="/admin" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
                Console
              </Link>
            ) : null}
            <button className="btn btn-secondary" onClick={logout} style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
              Sign Out
            </button>
          </div>
        ) : (
          <Link to="/" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
            Login Console
          </Link>
        )}
      </div>
    </nav>
  );
};

// Dynamic Cart Provider to scope items correctly by the current store parameter
const CartWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { storeTenantId } = useParams<{ storeTenantId: string }>();
  return <CartProvider tenantId={storeTenantId || null}>{children}</CartProvider>;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <HeaderNavbar />
          <Routes>
            {/* General Pages */}
            <Route path="/" element={<SaaSLanding />} />
            <Route path="/login" element={<SaaSLanding />} />

            {/* Scoped Customer Storefront routes */}
            <Route
              path="/store/:storeTenantId/*"
              element={
                <CartWrapper>
                  <Routes>
                    <Route path="/" element={<Storefront />} />
                    <Route path="/product/:productId" element={<ProductDetails />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
                  </Routes>
                </CartWrapper>
              }
            />

            {/* Tenant Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/config"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <Config />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <Categories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/webhooks"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <Webhooks />
                </ProtectedRoute>
              }
            />

            {/* Platform SuperUser Dashboard */}
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute allowedRoles={['SuperUser']}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
