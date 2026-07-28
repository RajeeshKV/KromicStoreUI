import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './Dashboard';
import apiClient from '../../api/apiClient';
import { Truck, CreditCard, Palette, Settings, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuditLog {
  id: string;
  configKey: string;
  oldValue: string;
  newValue: string;
  changedAt: string;
}

const Config: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadConfigs = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Fetch audit logs
      const logRes = await apiClient.get('/api/v1/config/audit-logs');
      setAuditLogs(logRes.data.data || logRes.data || []);
    } catch (err: any) {
      console.error('Config audit-logs fetch failed:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to retrieve configuration logs from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="config" />

      <main className="dashboard-content">
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', marginBottom: '0.5rem' }}>Advanced Settings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '600px' }}>Access advanced configuration panels for payments, shipping, themes, and storefront management.</p>
        </div>

        {errorMsg && (
          <div className="card" style={{ borderLeft: '4px solid var(--error-color)', padding: '1rem', marginBottom: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
            <p style={{ color: 'var(--error-color)', fontWeight: 600, margin: 0 }}>{errorMsg}</p>
          </div>
        )}

        {loading ? (
          <div className="loading-container card">
            <Loader2 className="spinner" size={32} />
            <p style={{ marginTop: '1rem' }}>Fetching configuration...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
            
            {/* Main: Advanced Settings Cards */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Configuration Panels</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <Link to="/business/settings" style={{ textDecoration: 'none' }}>
                  <div className="card hover-card" style={{ padding: '1.75rem', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    <Settings size={28} style={{ color: '#10b981', marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Storefront Configuration</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', flexGrow: 1, lineHeight: 1.5 }}>Manage store name, logo, contact details, currencies, content sections, and social links.</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#10b981', fontWeight: 600, marginTop: '1rem' }}>
                      Configure <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>

                <Link to="/business/theme" style={{ textDecoration: 'none' }}>
                  <div className="card hover-card" style={{ padding: '1.75rem', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    <Palette size={28} style={{ color: '#ec4899', marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Theme Editor</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', flexGrow: 1, lineHeight: 1.5 }}>Customize colors, fonts, spacing, and visual design with live storefront preview.</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#ec4899', fontWeight: 600, marginTop: '1rem' }}>
                      Design <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>

                <Link to="/business/payments" style={{ textDecoration: 'none' }}>
                  <div className="card hover-card" style={{ padding: '1.75rem', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    <CreditCard size={28} style={{ color: 'var(--accent-color)', marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Payment Gateway</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', flexGrow: 1, lineHeight: 1.5 }}>Configure Razorpay API credentials for accepting customer payments securely.</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: 600, marginTop: '1rem' }}>
                      Configure <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>

                <Link to="/business/couriers" style={{ textDecoration: 'none' }}>
                  <div className="card hover-card" style={{ padding: '1.75rem', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    <Truck size={28} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Couriers & Shipping</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', flexGrow: 1, lineHeight: 1.5 }}>Configure third-party delivery partners and package tracking URL templates.</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600, marginTop: '1rem' }}>
                      Configure <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Sidebar: Audit Logs */}
            <div className="card" style={{ padding: '1.75rem', height: 'fit-content' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Recent Changes</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Configuration change history and audit trail.</p>

              {auditLogs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>No changes recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto' }}>
                  {auditLogs.slice(0, 10).map((log, idx) => (
                    <div key={log.id} style={{ paddingBottom: '0.75rem', borderBottom: idx < 9 ? '1px solid var(--border-color)' : 'none' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.25rem 0' }}>
                        {new Date(log.changedAt).toLocaleString()}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                        <strong>{log.configKey}</strong> updated
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Config;
