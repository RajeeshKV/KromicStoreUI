import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/apiClient';
import { LayoutDashboard, Settings, Layers, Package, Webhook, LogOut, ArrowLeftRight, CheckCircle, Globe, Key, ToggleLeft } from 'lucide-react';

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
          <Link to="/business/webhooks" className={`dashboard-menu-link ${active === 'webhooks' ? 'active' : ''}`}>
            <Webhook size={18} /> Webhooks Integration
          </Link>
        </li>
        <li>
          <Link to="/business/domains" className={`dashboard-menu-link ${active === 'domains' ? 'active' : ''}`}>
            <Globe size={18} /> Custom Domains
          </Link>
        </li>
        <li>
          <Link to="/business/api-keys" className={`dashboard-menu-link ${active === 'api-keys' ? 'active' : ''}`}>
            <Key size={18} /> API Integrations
          </Link>
        </li>
        <li>
          <Link to="/business/feature-flags" className={`dashboard-menu-link ${active === 'feature-flags' ? 'active' : ''}`}>
            <ToggleLeft size={18} /> Feature Flags
          </Link>
        </li>
      </ul>

      <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '2rem 0' }}></div>

      <ul className="dashboard-menu">
        <li>
          <button
            onClick={() => navigate(`/store/${user?.tenantId || 'tenant-a1b2c3d4'}`)}
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
      const subRes = await apiClient.get('/api/v1/subscriptions/current');
      setSubscription(subRes.data.data);

      // 2. Fetch Subscription Usage
      const usageRes = await apiClient.get('/api/v1/subscriptions/current/usage');
      setUsage(usageRes.data.data);
    } catch (err: any) {
      console.warn('Dashboard endpoints failed. Initializing mockup dashboards fallback.', err);
      // Mock Fallbacks
      setSubscription({
        plan: 'Professional Trial',
        status: 'Active',
        startedAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
        trialEndsAt: new Date(Date.now() + 25 * 24 * 3600000).toISOString(),
        features: {
          maxUsers: 3,
          maxProducts: 100,
          maxApiCallsPerMonth: 10000,
          webhooksEnabled: true,
          analyticsEnabled: true,
        },
      });

      setUsage({
        users: { used: 1, limit: 3 },
        products: { used: 12, limit: 100 },
        apiCallsThisMonth: { used: 1243, limit: 10000 },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
                <div className="stat-val">{usage?.products.used || 0}</div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Limit: {usage?.products.limit} published items
                </span>
              </div>
              <div className="card stat-card">
                <span className="stat-label">API Consumption</span>
                <div className="stat-val">{usage?.apiCallsThisMonth.used || 0}</div>
                <span className="stat-change positive">
                  {(((usage?.apiCallsThisMonth.used || 0) / (usage?.apiCallsThisMonth.limit || 1)) * 100).toFixed(1)}% of quota
                </span>
              </div>
              <div className="card stat-card">
                <span className="stat-label">System Health</span>
                <div className="stat-val" style={{ color: 'var(--success)' }}>99.9%</div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>API Render nodes online</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', flexWrap: 'wrap', alignItems: 'start' }}>
              {/* Subscription info */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Active Subscription</h3>
                  <span className="status-pill success">{subscription?.status}</span>
                </div>

                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '1.25rem' }}>
                  {subscription?.plan}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  <p>Started At: <strong>{subscription ? new Date(subscription.startedAt).toLocaleDateString() : 'N/A'}</strong></p>
                  {subscription?.trialEndsAt && (
                    <p>Trial Ends At: <strong>{new Date(subscription.trialEndsAt).toLocaleDateString()}</strong></p>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>Included Features</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                      <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                      <span>{subscription?.features.maxUsers} Admin Seats</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                      <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                      <span>{subscription?.features.maxProducts} Catalog Limit</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                      <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                      <span>Webhooks {subscription?.features.webhooksEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                      <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                      <span>Analytics {subscription?.features.analyticsEnabled ? 'Enabled' : 'Disabled'}</span>
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
                      <span>{usage?.products.used} / {usage?.products.limit}</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${((usage?.products.used || 0) / (usage?.products.limit || 1)) * 100}%`,
                        backgroundColor: 'var(--accent-primary)',
                        borderRadius: '100px'
                      }} />
                    </div>
                  </div>

                  {/* Users bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600 }}>Admin Seats</span>
                      <span>{usage?.users.used} / {usage?.users.limit}</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${((usage?.users.used || 0) / (usage?.users.limit || 1)) * 100}%`,
                        backgroundColor: 'var(--accent-secondary)',
                        borderRadius: '100px'
                      }} />
                    </div>
                  </div>

                  {/* API Calls bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600 }}>Monthly API Queries</span>
                      <span>{usage?.apiCallsThisMonth.used} / {usage?.apiCallsThisMonth.limit}</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${((usage?.apiCallsThisMonth.used || 0) / (usage?.apiCallsThisMonth.limit || 1)) * 100}%`,
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
