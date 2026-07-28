import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import { extractSubdomain } from './utils/subdomain';

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
import Domains from './pages/TenantAdmin/Domains';
import ApiKeys from './pages/TenantAdmin/ApiKeys';
import FeatureFlags from './pages/TenantAdmin/FeatureFlags';
import Couriers from './pages/TenantAdmin/Couriers';
import PaymentSettings from './pages/TenantAdmin/PaymentSettings';
import Theme from './pages/TenantAdmin/Theme';
import StorefrontSettings from './pages/TenantAdmin/StorefrontSettings';
import Orders from './pages/TenantAdmin/Orders';
import Subscription from './pages/TenantAdmin/Subscription';
import Customers from './pages/TenantAdmin/Customers';
import Team from './pages/TenantAdmin/Team';
import PreviewStorefront from './pages/TenantAdmin/PreviewStorefront';

// Super Admin
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import SuperAdminThemes from './pages/SuperAdmin/Themes';

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
  const subdomain = extractSubdomain();
  const isStorefront = subdomain || location.pathname.startsWith('/store');

  // Hide the standard SaaS navbar when viewing dashboards or storefront
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/business') || isStorefront) {
    return null;
  }

  const scrollToSection = (selector: string) => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="main-navbar">
      <div className="nav-container">
        <Link to="/" className="brand-logo">
          <img src="/logo.png" alt="KromicStore" onError={(e) => {
            // Fallback if logo fails to load
            e.currentTarget.style.display = 'none';
          }} />
          <span>Kromic Store</span>
        </Link>

        {/* Middle Navigation Menu */}
        <ul className="nav-links">
          <li className="nav-link" onClick={() => scrollToSection('.hero-section')}>Features</li>
          <li className="nav-link" onClick={() => scrollToSection('.pricing-section')}>Pricing</li>
          <li className="nav-link" onClick={() => scrollToSection('.about-section')}>About Us</li>
          <li className="nav-link" onClick={() => scrollToSection('.contact-section')}>Contact Us</li>
        </ul>

        <div className="nav-actions">
          <ThemeToggle />

          {user ? (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Hello, <strong>{user.firstName || user.email.split('@')[0]}</strong>
              </span>
              {user.roles.includes('SuperUser') ? (
                <Link to="/admin" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
                  <Shield size={14} /> Operations
                </Link>
              ) : user.roles.includes('TenantAdmin') ? (
                <Link to="/business" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
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
      </div>
    </nav>
  );
};

// Dynamic Cart Provider to scope items correctly by the current store parameter
const CartWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { storeTenantId } = useParams<{ storeTenantId: string }>();
  const { tenantId } = useAuth();
  return <CartProvider tenantId={storeTenantId || tenantId || null}>{children}</CartProvider>;
};

const RootRouteResolver: React.FC = () => {
  const subdomain = extractSubdomain();

  if (subdomain) {
    return (
      <CartWrapper>
        <Routes>
          <Route path="/" element={<Storefront />} />
          <Route path="/product/:productId" element={<ProductDetails />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
        </Routes>
      </CartWrapper>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<SaaSLanding />} />
      <Route path="/login" element={<SaaSLanding />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <HeaderNavbar />
          <Routes>

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

            {/* Business Admin Routes */}
            <Route
              path="/business"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/config"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <Config />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/couriers"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <Couriers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/payments"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <PaymentSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/theme"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <Theme />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/settings"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <StorefrontSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/orders"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/categories"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <Categories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/products"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/webhooks"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <Webhooks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/domains"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <Domains />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/api-keys"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <ApiKeys />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/feature-flags"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <FeatureFlags />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/subscription"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <Subscription />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/customers"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <Customers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/team"
              element={
                <ProtectedRoute allowedRoles={['TenantAdmin']}>
                  <Team />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['SuperUser']}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/themes"
              element={
                <ProtectedRoute allowedRoles={['SuperUser']}>
                  <SuperAdminThemes />
                </ProtectedRoute>
              }
            />
            <Route path="/preview-storefront" element={<PreviewStorefront />} />
            {/* General Pages & Subdomain Storefront resolver */}
            <Route path="/*" element={<RootRouteResolver />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
