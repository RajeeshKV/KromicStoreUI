import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/apiClient';
import { LayoutDashboard, Settings, Layers, Package, LogOut, ArrowLeftRight, CheckCircle, Globe, ShoppingBag, CreditCard } from 'lucide-react';

interface Subscription {
  plan: string;
  status: string;
  startedAt: string;
  trialEndsAt?: string;
  features: {
    maxUsers: number;
    maxProducts: number;
    maxApiCallsPerMonth: number;
    webhooksEnabled: boolean;
    analyticsEnabled: boolean;
  };
}

interface Usage {
  users: { used: number; limit: number };
  products: { used: number; limit: number };
  apiCallsThisMonth: { used: number; limit: number };
}

export const AdminSidebar: React.FC<{ active: string }> = ({ active }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleViewStorefront = async () => {
    try {
      if (user?.tenantId) {
        const res = await apiClient.get(`/api/v1/tenants/${user.tenantId}`);
        if (res.data && (res.data.subdomain || res.data.data?.subdomain)) {
          const sub = res.data.subdomain || res.data.data.subdomain;
          window.open(`https://${sub}.kromic.in`, '_blank');
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to resolve subdomain from backend:', e);
    }
    window.open(`https://store.kromic.in/store/${user?.tenantId || ''}`, '_blank');
  };

  return (
    <aside className="dashboard-sidebar">
      <div style={{ marginBottom: '2.5rem', paddingLeft: '1rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>Business Admin</h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email: {user?.email}</span>
      </div>

      <ul className="dashboard-menu">
        <li>
          <Link to="/business" className={`dashboard-menu-link ${active === 'overview' ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> Overview
          </Link>
        </li>
        <li>
          <Link to="/business/orders" className={`dashboard-menu-link ${active === 'orders' ? 'active' : ''}`}>
            <ShoppingBag size={18} /> Orders Fulfillment
          </Link>
        </li>
        <li>
          <Link to="/business/config" className={`dashboard-menu-link ${active === 'config' ? 'active' : ''}`}>
            <Settings size={18} /> Settings & Setup
          </Link>
        </li>
        <li>
          <Link to="/business/categories" className={`dashboard-menu-link ${active === 'categories' ? 'active' : ''}`}>
            <Layers size={18} /> Categories
          </Link>
        </li>
        <li>
          <Link to="/business/products" className={`dashboard-menu-link ${active === 'products' ? 'active' : ''}`}>
            <Package size={18} /> Products Catalog
          </Link>
        </li>
        <li>
          <Link to="/business/domains" className={`dashboard-menu-link ${active === 'domains' ? 'active' : ''}`}>
            <Globe size={18} /> Store Address (Domain)
          </Link>
        </li>
        <li>
          <Link to="/business/subscription" className={`dashboard-menu-link ${active === 'subscription' ? 'active' : ''}`}>
            <CreditCard size={18} /> Subscription & Billing
          </Link>
        </li>
      </ul>

      <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '2rem 0' }}></div>

      <ul className="dashboard-menu">
        <li>
          <button
            onClick={handleViewStorefront}
            className="dashboard-menu-link"
            style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
          >
            <ArrowLeftRight size={18} /> View Storefront
          </button>
        </li>
        <li>
          <button
            onClick={handleLogout}
            className="dashboard-menu-link"
            style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', color: 'var(--danger)' }}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </li>
      </ul>
    </aside>
  );
};

const Dashboard: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Subscription Details
      try {
        const subRes = await apiClient.get('/api/v1/subscriptions/current');
        setSubscription(subRes.data.data || subRes.data || null);
      } catch (subErr) {
        console.error('Failed to retrieve subscription details:', subErr);
        setSubscription(null);
      }

      // 2. Fetch Subscription Usage
      try {
        const usageRes = await apiClient.get('/api/v1/subscriptions/current/usage');
        setUsage(usageRes.data.data || usageRes.data || null);
      } catch (usageErr) {
        console.error('Failed to retrieve subscription usage details:', usageErr);
        setUsage(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const isOnline = subscription !== null || usage !== null;

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="overview" />

      <main className="dashboard-content">
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem' }}>Overview Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back to your administration console.</p>
        </div>

        {loading ? (
          <div className="loading-container card">
            <div className="spinner"></div>
            <p>Loading overview metrics...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Quick Metrics */}
            <div className="stats-grid">
              <div className="card stat-card">
                <span className="stat-label">Store Products</span>
                <div className="stat-val">{usage?.products.used !== undefined ? usage.products.used : '__'}</div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Limit: {usage?.products.limit !== undefined ? usage.products.limit : '__'} published items
                </span>
              </div>
              <div className="card stat-card">
                <span className="stat-label">API Consumption</span>
                <div className="stat-val">{usage?.apiCallsThisMonth.used !== undefined ? usage.apiCallsThisMonth.used : '__'}</div>
                <span className="stat-change positive">
                  {usage ? `${(((usage.apiCallsThisMonth.used || 0) / (usage.apiCallsThisMonth.limit || 1)) * 100).toFixed(1)}% of quota` : '__% of quota'}
                </span>
              </div>
              <div className="card stat-card">
                <span className="stat-label">Server Status</span>
                <div className="stat-val" style={{ color: isOnline ? 'var(--success)' : 'var(--danger)' }}>
                  {isOnline ? 'Online' : 'Offline'}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {isOnline ? 'Connected to Kromic Store API' : 'Disconnected from Kromic Store API'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', flexWrap: 'wrap', alignItems: 'start' }}>
              {/* Subscription info */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Active Subscription</h3>
                  <span className="status-pill success">{subscription?.status || '__'}</span>
                </div>

                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '1.25rem' }}>
                  {subscription?.plan || '__'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  <p>Started At: <strong>{subscription?.startedAt ? new Date(subscription.startedAt).toLocaleDateString() : '__'}</strong></p>
                  <p>Trial Ends At: <strong>{subscription?.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : '__'}</strong></p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>Included Features</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                      <CheckCircle size={16} style={{ color: isOnline ? 'var(--success)' : 'var(--text-muted)' }} />
                      <span>{subscription?.features.maxUsers !== undefined ? subscription.features.maxUsers : '__'} Admin Seats</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                      <CheckCircle size={16} style={{ color: isOnline ? 'var(--success)' : 'var(--text-muted)' }} />
                      <span>{subscription?.features.maxProducts !== undefined ? subscription.features.maxProducts : '__'} Catalog Limit</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                      <CheckCircle size={16} style={{ color: isOnline ? 'var(--success)' : 'var(--text-muted)' }} />
                      <span>Webhooks {subscription ? (subscription.features.webhooksEnabled ? 'Enabled' : 'Disabled') : '__'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                      <CheckCircle size={16} style={{ color: isOnline ? 'var(--success)' : 'var(--text-muted)' }} />
                      <span>Analytics {subscription ? (subscription.features.analyticsEnabled ? 'Enabled' : 'Disabled') : '__'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage quotas indicators */}
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.5rem' }}>Resource Quota Usage</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Products bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600 }}>Products List Limit</span>
                      <span>{usage?.products.used !== undefined ? usage.products.used : '__'} / {usage?.products.limit !== undefined ? usage.products.limit : '__'}</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${usage ? ((usage.products.used || 0) / (usage.products.limit || 1)) * 100 : 0}%`,
                        backgroundColor: 'var(--accent-primary)',
                        borderRadius: '100px'
                      }} />
                    </div>
                  </div>

                  {/* Users bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600 }}>Admin Seats</span>
                      <span>{usage?.users.used !== undefined ? usage.users.used : '__'} / {usage?.users.limit !== undefined ? usage.users.limit : '__'}</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${usage ? ((usage.users.used || 0) / (usage.users.limit || 1)) * 100 : 0}%`,
                        backgroundColor: 'var(--accent-secondary)',
                        borderRadius: '100px'
                      }} />
                    </div>
                  </div>

                  {/* API Calls bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600 }}>Monthly API Queries</span>
                      <span>{usage?.apiCallsThisMonth.used !== undefined ? usage.apiCallsThisMonth.used : '__'} / {usage?.apiCallsThisMonth.limit !== undefined ? usage.apiCallsThisMonth.limit : '__'}</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${usage ? ((usage.apiCallsThisMonth.used || 0) / (usage.apiCallsThisMonth.limit || 1)) * 100 : 0}%`,
                        backgroundColor: 'var(--warning)',
                        borderRadius: '100px'
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
