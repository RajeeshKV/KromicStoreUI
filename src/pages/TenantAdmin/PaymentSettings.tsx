import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { Save, Trash2, AlertCircle, Loader2, Key, ToggleLeft, ToggleRight } from 'lucide-react';
import { AdminSidebar } from './Dashboard';

interface RazorpayConfig {
  id?: string;
  razorpayKeyIdMasked?: string;
  isActive: boolean;
  paymentProvider?: string;
  createdAt?: string;
  updatedAt?: string;
  lastValidatedAt?: string;
}

const PaymentSettings: React.FC = () => {
  const [config, setConfig] = useState<RazorpayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState(''); // Masked on read
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Constants
  const MASK_PLACEHOLDER = '••••••••••••••••••••';

  useEffect(() => {
    loadRazorpayConfig();
  }, []);

  const loadRazorpayConfig = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/payments/configuration');
      if (res.data) {
        const payload = res.data.data || res.data;
        setConfig(payload);
        // Use masked key from backend or show placeholder
        setKeyId(payload.razorpayKeyIdMasked || '');
        setKeySecret(MASK_PLACEHOLDER); // Always mask on load for security
        setWebhookSecret('');
        setIsActive(payload.isActive !== false);
      }
    } catch (err: any) {
      console.error('Failed to load Razorpay config:', err);
      setErrorMsg('Failed to retrieve payment gateway configuration from server.');
      setConfig(null);
      setKeyId('');
      setKeySecret('');
      setWebhookSecret('');
      setIsActive(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyId.trim()) {
      setErrorMsg('Key ID is required.');
      return;
    }
    if (!keySecret.trim()) {
      setErrorMsg('Key Secret is required.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload: any = {
      razorpayKeyId: keyId,
      razorpayKeySecret: keySecret !== MASK_PLACEHOLDER ? keySecret : undefined,
      razorpayWebhookSecret: webhookSecret || undefined
    };

    // Remove undefined values to avoid overwriting with nulls
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    try {
      const res = await apiClient.post('/api/v1/payments/configuration', payload);
      const updated = res.data.data || res.data || payload;
      setConfig(updated);
      setKeySecret(MASK_PLACEHOLDER); // Reset to mask
      setSuccessMsg('Razorpay settings saved successfully!');
    } catch (err: any) {
      console.error('Failed to save Razorpay config:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save configuration on server.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!config) return;
    try {
      const nextActive = !isActive;
      // Use PATCH endpoint for status update - correct HTTP method
      await apiClient.patch('/api/v1/payments/configuration/status', {
        isActive: nextActive
      });
      setIsActive(nextActive);
      if (config) {
        const updated = { ...config, isActive: nextActive };
        setConfig(updated);
      }
      setSuccessMsg(`Razorpay is now ${nextActive ? 'Active' : 'Inactive'}`);
    } catch (err: any) {
      console.error('Failed to patch status:', err);
      setErrorMsg('Failed to update Razorpay status.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove Razorpay settings?')) return;
    setDeleting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiClient.delete('/api/v1/payments/configuration');
      setConfig(null);
      setKeyId('');
      setKeySecret('');
      setWebhookSecret('');
      setIsActive(true);
      setSuccessMsg('Razorpay configuration removed.');
    } catch (err: any) {
      console.error('Failed to delete config', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to remove configuration from server.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="config" />
      <main className="dashboard-content">
        <div className="content-wrapper">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem' }}>Razorpay Integration</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Configure your Razorpay Merchant Payment Gateway API credentials to accept payments on your storefront.</p>
      </div>

      {successMsg && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-color)', padding: '1rem', marginBottom: '1.5rem', color: 'var(--accent-color)' }}>
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <Loader2 className="spinner" size={32} />
          <p style={{ marginTop: '1rem' }}>Querying payment gateway settings...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* Settings Form */}
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={18} /> Credentials Settings
            </h2>
            <form onSubmit={handleSave}>
              {errorMsg && <p style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>{errorMsg}</p>}
              
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Razorpay Key ID *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={keyId} 
                  onChange={(e) => setKeyId(e.target.value)} 
                  placeholder="e.g. rzp_test_xxxxxxxxxxxx"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Razorpay Key Secret *</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={keySecret} 
                  onChange={(e) => setKeySecret(e.target.value)}
                  onFocus={() => keySecret === MASK_PLACEHOLDER && setKeySecret('')}
                  placeholder="Insert Key Secret here"
                  required
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Sensitive credential. Masked for security. Leaving it as <code>••••••••</code> will not update or overwrite it on save.
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Webhook Secret (Optional)</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={webhookSecret} 
                  onChange={(e) => setWebhookSecret(e.target.value)} 
                  placeholder="e.g. whsec_xxxxxx"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', marginTop: '2.5rem', alignItems: 'center' }}>
                {config ? (
                  <button type="button" className="btn btn-secondary" style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={handleDelete} disabled={deleting}>
                    {deleting ? <Loader2 className="spinner" size={14} /> : <Trash2 size={14} />} Remove Gateway
                  </button>
                ) : (
                  <div></div>
                )}
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 className="spinner" size={16} /> : <Save size={16} />} Save Configurations
                </button>
              </div>
            </form>
          </div>

          {/* Configuration Status / Help Panel */}
          <div>
            <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Fulfillment Status</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Gateway Status:</span>
                {config ? (
                  <button 
                    onClick={handleToggleStatus}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', color: isActive ? 'var(--accent-color)' : 'var(--text-muted)' }}
                  >
                    {isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{isActive ? 'Active' : 'Inactive'}</span>
                  </button>
                ) : (
                  <span className="badge" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>Not configured</span>
                )}
              </div>
              
              {config && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div><strong>Key ID:</strong> <code>{config.razorpayKeyIdMasked}</code></div>
                  <div><strong>Status:</strong> <span className="badge" style={{ backgroundColor: config.isActive ? 'var(--bg-secondary)' : '#ffebeb', color: config.isActive ? 'var(--text-secondary)' : 'var(--error-color)' }}>{config.isActive ? 'Active' : 'Inactive'}</span></div>
                </div>
              )}
            </div>

            <div className="card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <AlertCircle size={16} /> Setup Instructions
              </h3>
              <ol style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>Log in to your <strong>Razorpay Dashboard</strong>.</li>
                <li>Go to <strong>Settings</strong> &rarr; <strong>API Keys</strong>.</li>
                <li>Generate a key (for either Test or Live environments).</li>
                <li>Copy the <strong>Key ID</strong> and <strong>Key Secret</strong> generated.</li>
                <li>Paste them into the credentials form on the left side and press Save.</li>
                <li>Make sure to toggle the status to <strong>Active</strong>.</li>
              </ol>
            </div>
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
};

export default PaymentSettings;
