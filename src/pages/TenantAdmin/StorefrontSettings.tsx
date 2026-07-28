import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import ImageUpload from '../../components/ImageUpload';
import { Settings, Save, Globe, Loader2, Eye, X } from 'lucide-react';
import { AdminSidebar } from './Dashboard';

const StorefrontSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [storefrontId, setStorefrontId] = useState<string>('');

  // Preview and Pending Changes States
  const [showPreview, setShowPreview] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{
    hasPendingChanges: boolean;
    status?: string;
    lastUpdated?: string;
    lastPublished?: string;
    changes?: string[];
  } | null>(null);

  // Storefront Form States
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [country, setCountry] = useState('India');
  const [brandColor, setBrandColor] = useState('#4f46e5');
  const [copyright, setCopyright] = useState('');
  
  // Navigation & Page Toggles
  const [showAboutUs, setShowAboutUs] = useState(true);
  const [showContactUs, setShowContactUs] = useState(true);

  // Social Links
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');

  useEffect(() => {
    loadStorefrontSettings();
  }, []);

  const loadPendingChanges = async (id?: string) => {
    const targetId = id || storefrontId;
    if (!targetId) return;
    try {
      const res = await apiClient.get(`/api/v1/storefronts/${targetId}/pending-changes`);
      setPendingChanges(res.data.data || res.data || null);
    } catch (err) {
      // Pending changes are optional - feature may not be implemented
      console.warn('Pending changes feature not available:', err);
      setPendingChanges(null);
    }
  };

  const loadStorefrontSettings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/storefronts');
      const storefronts = res.data.data || res.data;
      if (!storefronts || storefronts.length === 0) {
        setErrorMsg('No storefront found. Please create one first.');
        setStorefrontId('');
        setName('');
        setLogoUrl('');
        setContactEmail('');
        setContactPhone('');
        setAddress('');
        setCurrency('INR');
        setCountry('India');
        setBrandColor('#4f46e5');
        setCopyright('');
        setShowAboutUs(true);
        setShowContactUs(true);
        setFacebook('');
        setTwitter('');
        setInstagram('');
        setLinkedin('');
        return;
      }
      const data = storefronts[0];
      const activeId = data.id || data._id || '';
      setStorefrontId(activeId);
      setName(data.name || '');
      setLogoUrl(data.logoUrl || '');
      setContactEmail(data.contactEmail || '');
      setContactPhone(data.contactPhone || '');
      setAddress(data.address || '');
      setCurrency(data.currency || 'INR');
      setCountry(data.country || 'India');
      setBrandColor(data.brandColor || '#4f46e5');
      setCopyright(data.copyright || '');
      
      setShowAboutUs(data.showAboutUs !== false);
      setShowContactUs(data.showContactUs !== false);

      if (data.socialLinks) {
        setFacebook(data.socialLinks.facebook || '');
        setTwitter(data.socialLinks.twitter || '');
        setInstagram(data.socialLinks.instagram || '');
        setLinkedin(data.socialLinks.linkedin || '');
      }

      await loadPendingChanges(activeId);
    } catch (err: any) {
      console.error('Failed to load storefront settings', err);
      setErrorMsg('Failed to load storefront settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storefrontId) return;

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      name,
      logoUrl,
      contactEmail,
      contactPhone,
      address,
      currency,
      country,
      brandColor,
      copyright,
      showAboutUs,
      showContactUs,
      socialLinks: {
        facebook,
        twitter,
        instagram,
        linkedin
      }
    };

    try {
      await apiClient.put(`/api/v1/storefronts/${storefrontId}`, payload);
      setSuccessMsg('Storefront settings saved to draft!');
      loadStorefrontSettings();
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setErrorMsg('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!storefrontId) return;
    setPublishing(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      // 1. Validate storefront configuration
      try {
        const valRes = await apiClient.get(`/api/v1/storefronts/${storefrontId}/validate`);
        const valData = valRes.data.data || valRes.data;
        if (valData && !valData.isValid) {
          setErrorMsg('Cannot publish: ' + (valData.errors?.join(', ') || 'Validation failed.'));
          setPublishing(false);
          return;
        }
      } catch (valErr) {
        console.warn('Validation endpoint returned error:', valErr);
        if (!window.confirm('Validation check failed. Do you want to continue publishing anyway?')) {
          setPublishing(false);
          return;
        }
      }

      if (!window.confirm('Are you sure you want to publish these storefront changes to live production?')) {
        setPublishing(false);
        return;
      }

      // 2. Publish
      await apiClient.post(`/api/v1/storefronts/${storefrontId}/publish`);
      setSuccessMsg('Storefront published successfully to live environment!');
      setShowPreview(false);
      loadStorefrontSettings();
    } catch (err: any) {
      console.error('Failed to publish settings', err);
      setErrorMsg('Failed to publish: ' + (err.response?.data?.message || err.message));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="config" />
      <main className="dashboard-content">
        <div className="content-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            Storefront Configuration
            {pendingChanges?.hasPendingChanges && (
              <span className="badge" style={{ backgroundColor: 'var(--warning)', color: '#ffffff', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                {pendingChanges.changes?.length || 0} Draft Changes
              </span>
            )}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage catalog layouts, branding color variables, contact info, and copyright settings.
            {pendingChanges?.lastPublished && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>
                Last published: {new Date(pendingChanges.lastPublished).toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowPreview(true)} disabled={loading}>
            <Eye size={16} /> Preview Storefront
          </button>
          <button className="btn btn-primary" onClick={handlePublish} disabled={publishing || loading}>
            {publishing ? <Loader2 className="spinner" size={16} /> : <Globe size={16} />} Publish Site
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-color)', padding: '1rem', marginBottom: '1.5rem', color: 'var(--accent-color)' }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="card" style={{ borderLeft: '4px solid var(--error-color)', padding: '1rem', marginBottom: '1.5rem', color: 'var(--error-color)' }}>
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <Loader2 className="spinner" size={32} />
          <p style={{ marginTop: '1rem' }}>Querying storefront settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
            
            {/* Main configurations card */}
            <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={18} /> Store Details & Metadata
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Store Display Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="e.g. My Premium Store"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Store Brand Color</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="color" 
                      value={brandColor} 
                      onChange={(e) => setBrandColor(e.target.value)} 
                      style={{ width: '40px', height: '38px', padding: 0, border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}
                    />
                    <input 
                      type="text" 
                      className="form-control" 
                      value={brandColor} 
                      onChange={(e) => setBrandColor(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              {/* Cloudinary upload for store logo */}
              <ImageUpload 
                label="Store Header Logo" 
                value={logoUrl} 
                onChange={(url) => setLogoUrl(url)} 
                folder="storefront_branding"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Contact Email</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={contactEmail} 
                    onChange={(e) => setContactEmail(e.target.value)} 
                    placeholder="support@mystore.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Contact Phone</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={contactPhone} 
                    onChange={(e) => setContactPhone(e.target.value)} 
                    placeholder="e.g. +91-98765-xxxxx"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Physical Address</label>
                <textarea 
                  className="form-control" 
                  rows={2}
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  placeholder="Insert store warehouse/office location"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Default Currency</label>
                  <select 
                    className="form-control" 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Country</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)} 
                    placeholder="e.g. India"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Copyright Text</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={copyright} 
                  onChange={(e) => setCopyright(e.target.value)} 
                  placeholder="e.g. © 2026 MyStore. All rights reserved."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 className="spinner" size={16} /> : <Save size={16} />} Save Settings
                </button>
              </div>

            </div>

            {/* Sidebar widgets (Social links & navigation items) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Navigation settings */}
              <div className="card" style={{ padding: '1.75rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem' }}>Navigation Options</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      id="showAbout" 
                      checked={showAboutUs} 
                      onChange={(e) => setShowAboutUs(e.target.checked)} 
                    />
                    <label htmlFor="showAbout" style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>Enable "About Us" Footer Link</label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      id="showContact" 
                      checked={showContactUs} 
                      onChange={(e) => setShowContactUs(e.target.checked)} 
                    />
                    <label htmlFor="showContact" style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>Enable "Contact Us" Footer Link</label>
                  </div>
                </div>
              </div>

              {/* Social links */}
              <div className="card" style={{ padding: '1.75rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>Social Media Links</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Facebook URL</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={facebook} 
                      onChange={(e) => setFacebook(e.target.value)} 
                      placeholder="https://facebook.com/brand"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Twitter / X URL</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={twitter} 
                      onChange={(e) => setTwitter(e.target.value)} 
                      placeholder="https://x.com/brand"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Instagram URL</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={instagram} 
                      onChange={(e) => setInstagram(e.target.value)} 
                      placeholder="https://instagram.com/brand"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>LinkedIn URL</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={linkedin} 
                      onChange={(e) => setLinkedin(e.target.value)} 
                      placeholder="https://linkedin.com/company/brand"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </form>
      )}
        </div>
      </main>

      {/* --- PREVIEW IFRAME MODAL --- */}
      {showPreview && (
        <div className="modal-backdrop">
          <div className="modal-content card" style={{ maxWidth: '90%', width: '1200px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.35rem' }}>Storefront Interactive Preview</h3>
                {pendingChanges?.hasPendingChanges && (
                  <span className="badge" style={{ backgroundColor: 'var(--warning)', color: '#ffffff', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    Unpublished Draft
                  </span>
                )}
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowPreview(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
              <iframe
                src="/preview-storefront"
                style={{ width: '100%', height: '65vh', border: 'none' }}
                title="Storefront Live Preview"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowPreview(false)}>
                Close Preview
              </button>
              {pendingChanges?.hasPendingChanges && (
                <button className="btn btn-primary" onClick={handlePublish} disabled={publishing}>
                  {publishing ? <Loader2 className="spinner" size={16} /> : <Globe size={16} />} Publish Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorefrontSettings;
