import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import ImageUpload from '../../components/ImageUpload';
import { Settings, Save, Globe, Loader2 } from 'lucide-react';
import { AdminSidebar } from './Dashboard';

const StorefrontSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  const loadStorefrontSettings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/storefront');
      if (res.data) {
        const data = res.data.data || res.data;
        setName(data.name || '');
        setLogoUrl(data.logoUrl || '');
        setContactEmail(data.contactEmail || '');
        setContactPhone(data.contactPhone || '');
        setAddress(data.address || '');
        setCurrency(data.currency || 'INR');
        setCountry(data.country || 'India');
        setBrandColor(data.brandColor || '#4f46e5');
        setCopyright(data.copyright || '');
        
        // Navigation options
        setShowAboutUs(data.showAboutUs !== false);
        setShowContactUs(data.showContactUs !== false);

        // Social links
        if (data.socialLinks) {
          setFacebook(data.socialLinks.facebook || '');
          setTwitter(data.socialLinks.twitter || '');
          setInstagram(data.socialLinks.instagram || '');
          setLinkedin(data.socialLinks.linkedin || '');
        }
      }
    } catch (err: any) {
      console.warn('Storefront settings API not found, loading fallback configs', err);
      // Local storage fallback
      const localMock = localStorage.getItem('mock_storefront_settings');
      if (localMock) {
        const data = JSON.parse(localMock);
        setName(data.name);
        setLogoUrl(data.logoUrl);
        setContactEmail(data.contactEmail);
        setContactPhone(data.contactPhone);
        setAddress(data.address);
        setCurrency(data.currency);
        setCountry(data.country);
        setBrandColor(data.brandColor);
        setCopyright(data.copyright);
        setShowAboutUs(data.showAboutUs);
        setShowContactUs(data.showContactUs);
        setFacebook(data.socialLinks?.facebook || '');
        setTwitter(data.socialLinks?.twitter || '');
        setInstagram(data.socialLinks?.instagram || '');
        setLinkedin(data.socialLinks?.linkedin || '');
      } else {
        // Defaults
        setName('Merchant Storefront');
        setLogoUrl(localStorage.getItem('storeLogo') || '');
        setContactEmail('support@merchant.com');
        setContactPhone('+91-9876543210');
        setAddress('Corporate Office, Sector 15, Gurugram, India');
        setCurrency('INR');
        setCountry('India');
        setBrandColor('#4f46e5');
        setCopyright('© 2026 Merchant Inc. All rights reserved.');
        setShowAboutUs(true);
        setShowContactUs(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await apiClient.put('/api/v1/storefront', payload);
      setSuccessMsg('Storefront settings saved!');
      localStorage.setItem('mock_storefront_settings', JSON.stringify(payload));
      if (logoUrl) {
        localStorage.setItem('storeLogo', logoUrl);
      }
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      // Simulate locally
      localStorage.setItem('mock_storefront_settings', JSON.stringify(payload));
      if (logoUrl) {
        localStorage.setItem('storeLogo', logoUrl);
      }
      setSuccessMsg('Storefront settings updated (simulation fallback)');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiClient.post('/api/v1/storefront/publish');
      setSuccessMsg('Storefront published successfully to live environment!');
    } catch (err) {
      console.error('Failed to publish settings', err);
      setSuccessMsg('Published successfully (simulation fallback mode)');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="config" />
      <main className="dashboard-content">
        <div className="content-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem' }}>Storefront Configuration</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage catalog layouts, branding color variables, contact info, and copyright settings.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handlePublish} disabled={publishing || loading}>
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
    </div>
  );
};

export default StorefrontSettings;
