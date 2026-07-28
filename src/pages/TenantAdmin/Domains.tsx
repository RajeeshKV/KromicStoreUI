import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { Globe, Save, Loader2, ExternalLink } from 'lucide-react';
import { AdminSidebar } from './Dashboard';

const Domains: React.FC = () => {
  const { tenantId } = useAuth();
  const [subdomain, setSubdomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadSubdomain();
  }, []);

  const loadSubdomain = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Get current tenant details
      const res = await apiClient.get(`/api/v1/tenants/${tenantId}`);
      const data = res.data.data || res.data;
      if (data) {
        setSubdomain(data.subdomain || '');
      }
    } catch (err: any) {
      console.error('Failed to load tenant info:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to retrieve subdomain information from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain.trim()) {
      setErrorMsg('Subdomain cannot be empty.');
      return;
    }
    
    // Clean subdomain: lowercase and alphanumeric only
    const cleanSub = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanSub) {
      setErrorMsg('Invalid subdomain characters. Use alphanumeric and hyphens only.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiClient.put(`/api/v1/tenants/${tenantId}`, { subdomain: cleanSub });
      setSubdomain(cleanSub);
      setSuccessMsg('Subdomain updated successfully!');
    } catch (err: any) {
      console.error('Failed to update subdomain:', err);
      setErrorMsg(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update subdomain on the server.');
    } finally {
      setSaving(false);
    }
  };

  const storeUrl = subdomain ? `https://${subdomain}.kromic.in` : '';
  const localTestUrl = subdomain ? `http://localhost:5173/?subdomain=${subdomain}` : '';

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="domains" />
      <main className="dashboard-content">
        <div className="content-wrapper">
          <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem' }}>Store Address (Subdomain)</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Configure the web address subdomain that customer traffic resolves to access your online storefront catalog.</p>
      </div>

      {successMsg && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-color)', padding: '1rem', marginBottom: '1.5rem', color: 'var(--accent-color)' }}>
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <Loader2 className="spinner" size={32} />
          <p style={{ marginTop: '1rem' }}>Querying store metadata details...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* Subdomain Input Card */}
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={18} /> Subdomain Setup
            </h2>

            <form onSubmit={handleSave}>
              {errorMsg && <p style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>{errorMsg}</p>}

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Your Store Subdomain *</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={subdomain} 
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g. mystore"
                    style={{ flexGrow: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                    required
                  />
                  <span 
                    style={{ 
                      backgroundColor: 'var(--bg-tertiary)', 
                      border: '1px solid var(--border-color)', 
                      borderLeft: 'none',
                      padding: '0.5rem 1rem', 
                      borderRadius: '0 8px 8px 0',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    .kromic.in
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Only alphanumeric characters and hyphens are allowed.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 className="spinner" size={16} /> : <Save size={16} />} Save Subdomain
                </button>
              </div>
            </form>
          </div>

          {/* Current Address Details */}
          <div>
            <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Live Links</h2>
              
              {subdomain ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Production Address:</span>
                    <a 
                      href={storeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      {storeUrl} <ExternalLink size={14} />
                    </a>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Local Sandbox Testing Address:</span>
                    <a 
                      href={localTestUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      {localTestUrl} <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                  Enter a subdomain and save to generate storefront catalog links.
                </p>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
      </main>
    </div>
  );
};

export default Domains;
