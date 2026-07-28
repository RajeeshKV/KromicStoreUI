import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './Dashboard';
import apiClient from '../../api/apiClient';
import ImageUpload from '../../components/ImageUpload';
import { Save, Truck, CreditCard, Palette, Settings, ArrowRight, Loader2 } from 'lucide-react';
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

  // Variable states
  const [storeName, setStoreName] = useState('');
  const [storeLogo, setStoreLogo] = useState('');
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadConfigs = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.get('/api/v1/config');
      const data = res.data.data || res.data || {};
      
      setStoreName(data['store:name'] || '');
      setStoreLogo(data['store:logo'] || '');

      // Fetch logs
      const logRes = await apiClient.get('/api/v1/config/audit-logs');
      setAuditLogs(logRes.data.data || logRes.data || []);
    } catch (err: any) {
      console.error('Config endpoints failed:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to retrieve configuration settings from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const handleSaveConfig = async (key: string, value: string) => {
    setSaveLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const headers: any = {};
      if (key === 'store:name') {
        headers['Idempotency-Key'] = generateUUID();
      }
      await apiClient.put(`/api/v1/config/${key}`, { value }, { headers });
      
      setSuccessMsg(`Setting '${key}' saved successfully.`);
      loadConfigs();
    } catch (err: any) {
      console.error('API Config put failed:', err);
      setErrorMsg(err.response?.data?.message || err.response?.data?.error || err.message || `Failed to save setting '${key}' on server.`);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="config" />

      <main className="dashboard-content">
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem' }}>Configurations</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage store variables, brand assets, and quick-links to advanced settings panels.</p>
        </div>

        {successMsg && (
          <div className="status-pill success" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="status-pill danger" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="loading-container card">
            <Loader2 className="spinner" size={32} />
            <p style={{ marginTop: '1rem' }}>Fetching store configuration profiles...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
            
            {/* Left side: Config list forms */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Store Name setting */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem' }}>Store Name</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Configure the primary branding title displayed across your public shop portals.</p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <input
                      type="text"
                      className="form-input"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSaveConfig('store:name', storeName)}
                    disabled={saveLoading}
                  >
                    <Save size={16} /> Save
                  </button>
                </div>
              </div>

              {/* Store Logo setting (with ImageUpload integration) */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem' }}>Store Logo</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Configure your storefront branding logo. Changes save automatically when upload completes.
                </p>
                
                <ImageUpload 
                  value={storeLogo} 
                  onChange={(url) => handleSaveConfig('store:logo', url)} 
                  label=""
                  folder="branding_logo"
                />
              </div>

              {/* Navigation Cards Deck for Advanced settings */}
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Advanced Customizations</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <Link to="/business/couriers" style={{ textDecoration: 'none' }}>
                    <div className="card hover-card" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                      <Truck size={24} style={{ color: 'var(--primary-color)', marginBottom: '0.75rem' }} />
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Couriers</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexGrow: 1 }}>Configure third-party delivery and package tracking URL templates.</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 600, marginTop: '0.75rem' }}>
                        Configure <ArrowRight size={12} />
                      </div>
                    </div>
                  </Link>

                  <Link to="/business/payments" style={{ textDecoration: 'none' }}>
                    <div className="card hover-card" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                      <CreditCard size={24} style={{ color: 'var(--accent-color)', marginBottom: '0.75rem' }} />
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Payment Gateway</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexGrow: 1 }}>Set up your merchant Razorpay API credential settings.</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 600, marginTop: '0.75rem' }}>
                        Configure <ArrowRight size={12} />
                      </div>
                    </div>
                  </Link>

                  <Link to="/business/theme" style={{ textDecoration: 'none' }}>
                    <div className="card hover-card" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                      <Palette size={24} style={{ color: '#ec4899', marginBottom: '0.75rem' }} />
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Themes Editor</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexGrow: 1 }}>Build and modify custom visual styles with live catalog previews.</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#ec4899', fontWeight: 600, marginTop: '0.75rem' }}>
                        Design <ArrowRight size={12} />
                      </div>
                    </div>
                  </Link>

                  <Link to="/business/settings" style={{ textDecoration: 'none' }}>
                    <div className="card hover-card" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                      <Settings size={24} style={{ color: '#10b981', marginBottom: '0.75rem' }} />
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Storefront Details</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexGrow: 1 }}>Manage address coordinates, social links, currency options, and navigations.</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginTop: '0.75rem' }}>
                        Manage <ArrowRight size={12} />
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

            </div>

            {/* Right side: Audit logs list */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1rem' }}>Audit Logs</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Review chronological record of configuration adjustments.</p>

              {auditLogs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No log audits available yet.</p>
              ) : (
                <div className="timeline-list">
                  {auditLogs.map((log) => (
                    <div className="timeline-event completed" key={log.id}>
                      <div className="timeline-time">
                        {new Date(log.changedAt).toLocaleString()}
                      </div>
                      <div className="timeline-desc" style={{ fontSize: '0.85rem' }}>
                        Updated <strong>{log.configKey}</strong>:<br />
                        <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{String(log.oldValue)}</span>
                        {' '}&rarr;{' '}
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>{String(log.newValue)}</span>
                      </div>
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
