import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import ImageUpload from '../../components/ImageUpload';
import { Settings, Save, Globe, Loader2, Eye, X, Mail, Phone, MessageCircle } from 'lucide-react';
import { AdminSidebar } from './Dashboard';
import { ToastContainer, useToast } from '../../components/Toast';

const StorefrontSettings: React.FC = () => {
  const { toasts, removeToast, success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [storefrontId, setStorefrontId] = useState<string>('');
  const [storefrontExists, setStorefrontExists] = useState(false); // Track if storefront exists

  // Preview and Pending Changes States
  const [showPreview, setShowPreview] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{
    hasPendingChanges: boolean;
    status?: string;
    lastUpdated?: string;
    lastPublished?: string;
    changes?: string[];
  } | null>(null);

  // Storefront Details (Name, Logo)
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Contact Information (For Footer)
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  
  // Store Configuration
  const [currency, setCurrency] = useState('INR');
  const [country, setCountry] = useState('India');
  const [copyright, setCopyright] = useState('');
  
  // Content Sections - About Us (Toggle + Optional Text)
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [aboutUsContent, setAboutUsContent] = useState('');

  // Content Sections - Contact Us (Toggle + Form)
  const [showContactUs, setShowContactUs] = useState(false);

  // Social Links (Footer Icons)
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');

  useEffect(() => {
    loadStorefrontSettings();
  }, []);

  // Centralized error message extraction
  const extractErrorMessage = (err: any): string => {
    // Try to extract from validation errors object
    if (err.response?.data?.errors) {
      const errors = err.response.data.errors;
      const errorList = [];
      for (const [, messages] of Object.entries(errors)) {
        if (Array.isArray(messages)) {
          errorList.push(...messages);
        } else if (typeof messages === 'string') {
          errorList.push(messages);
        }
      }
      if (errorList.length > 0) {
        return errorList.join(' • ');
      }
    }
    
    // Try message field
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    
    // Try title field (Problem Details format)
    if (err.response?.data?.title) {
      return err.response.data.title;
    }
    
    // Fallback to error message
    if (err.message) {
      return err.message;
    }
    
    return 'An error occurred. Please try again.';
  };

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
      console.log('Loading storefront settings...');
      const res = await apiClient.get('/api/v1/storefronts');
      console.log('Storefronts API response:', res);
      
      // Now returns single object instead of array
      const storefront = res.data.data || res.data;
      console.log('Storefront data:', storefront);
      
      if (!storefront) {
        console.log('❌ No storefront data returned - first time setup');
        setStorefrontId('');
        setStorefrontExists(false);
        // Leave fields empty for new storefront creation
        return;
      }

      // Extract storefront ID
      const storefrontId = storefront.id || storefront._id || '';
      console.log('Storefront ID:', storefrontId);
      
      if (storefrontId) {
        setStorefrontId(storefrontId);
        setStorefrontExists(true); // Mark that storefront exists
        console.log('✅ StorefrontId set to:', storefrontId);
      }

      // Prefill all fields from storefront data
      console.log('✅ Prefilling form with storefront data');
      
      // Storefront Details
      setName(storefront.name || '');
      setLogoUrl(storefront.logoUrl || '');
      
      // Contact Information
      setContactEmail(storefront.contactEmail || '');
      setContactPhone(storefront.contactPhone || '');
      setWhatsapp(storefront.whatsapp || '');
      setAddress(storefront.address || '');
      
      // Store Configuration
      setCurrency(storefront.currency || 'INR');
      setCountry(storefront.country || 'India');
      setCopyright(storefront.copyright || '');
      
      // Content Sections
      setShowAboutUs(storefront.showAboutUs === true);
      setAboutUsContent(storefront.aboutUsContent || '');
      setShowContactUs(storefront.showContactUs === true);

      // Social Links
      if (storefront.socialLinks) {
        setFacebook(storefront.socialLinks.facebook || '');
        setTwitter(storefront.socialLinks.twitter || '');
        setInstagram(storefront.socialLinks.instagram || '');
        setLinkedin(storefront.socialLinks.linkedin || '');
      }

      // Load pending changes if storefront exists
      if (storefrontId) {
        await loadPendingChanges(storefrontId);
      }
    } catch (err: any) {
      console.error('Failed to load storefront settings:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: err.response?.config?.url
      });
      
      // If 404, storefront doesn't exist yet - that's OK for first time setup
      if (err.response?.status === 404) {
        console.log('No storefront found (404) - first time setup');
        setStorefrontId('');
        setStorefrontExists(false);
      } else {
        error('Failed to load storefront settings. ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSave called', { storefrontExists, saving });
    
    if (saving) {
      console.warn('Already saving, ignoring duplicate click');
      return;
    }

    setSaving(true);

    const payload = {
      // Storefront Details
      name,
      logoUrl,
      
      // Contact Information
      contactEmail,
      contactPhone,
      whatsapp,
      address,
      
      // Store Configuration
      currency,
      country,
      copyright,
      
      // Content Sections
      showAboutUs,
      aboutUsContent: showAboutUs ? aboutUsContent : '',
      showContactUs,
      
      // Social Links
      socialLinks: {
        facebook,
        twitter,
        instagram,
        linkedin
      }
    };

    try {
      if (storefrontExists) {
        // Storefront exists → PUT to update
        console.log('Storefront exists, updating via PUT...', payload);
        const res = await apiClient.put('/api/v1/storefronts', payload);
        console.log('PUT response:', res);
        success('Storefront settings saved to draft successfully!');
      } else {
        // Storefront doesn't exist → POST to create
        console.log('Storefront does not exist, creating via POST...', payload);
        const res = await apiClient.post('/api/v1/storefronts', payload);
        console.log('POST response:', res);
        
        // Extract ID from response and set it
        const newId = res.data?.data?.id || res.data?.id || '';
        if (newId) {
          console.log('New storefront ID:', newId);
          setStorefrontId(newId);
          setStorefrontExists(true); // Mark as existing now
        }
        success('Storefront created and saved to draft successfully!');
      }
      
      loadStorefrontSettings();
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      const errorMessage = extractErrorMessage(err);
      console.error('Error details:', {
        message: errorMessage,
        fullError: err.response?.data
      });
      error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!storefrontId) {
      error('No storefront found. Please save storefront settings first.');
      return;
    }
    setPublishing(true);
    try {
      // 1. Validate storefront configuration
      try {
        console.log('Validating storefront...', storefrontId);
        const valRes = await apiClient.get(`/api/v1/storefronts/${storefrontId}/validate`);
        const valData = valRes.data.data || valRes.data;
        console.log('Validation response:', valData);
        if (valData && !valData.isValid) {
          const errors = valData.errors || [];
          const errorMessage = Array.isArray(errors) ? errors.join(' • ') : 'Validation failed';
          error('Cannot publish: ' + errorMessage);
          setPublishing(false);
          return;
        }
      } catch (valErr: any) {
        console.warn('Validation endpoint returned error:', valErr);
        const errorMessage = extractErrorMessage(valErr);
        
        if (!window.confirm(`Validation failed: ${errorMessage}. Do you want to continue publishing anyway?`)) {
          setPublishing(false);
          return;
        }
      }

      if (!window.confirm('Are you sure you want to publish these storefront changes to live production?')) {
        setPublishing(false);
        return;
      }

      // 2. Publish
      console.log('Publishing storefront...', storefrontId);
      const publishRes = await apiClient.post(`/api/v1/storefronts/${storefrontId}/publish`);
      console.log('Publish response:', publishRes);
      success('Storefront published successfully to live environment!');
      loadStorefrontSettings();
    } catch (err: any) {
      console.error('Failed to publish settings', err);
      const errorMessage = extractErrorMessage(err);
      error('Failed to publish: ' + errorMessage);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="config" />
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <main className="dashboard-content">
        <div className="content-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            Storefront Configuration
            {pendingChanges?.hasPendingChanges && (
              <span className="badge" style={{ backgroundColor: 'var(--warning)', color: '#ffffff', fontSize: '0.75rem', padding: '0.35rem 0.65rem', borderRadius: '6px', fontWeight: 700 }}>
                {pendingChanges.changes?.length || 0} Pending
              </span>
            )}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            Manage store branding, contact information, content sections, and publication settings.
            {pendingChanges?.lastPublished && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '1rem', display: 'block', marginTop: '0.25rem' }}>
                Last published: {new Date(pendingChanges.lastPublished).toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={loadStorefrontSettings} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', fontWeight: 600 }}>
            <Loader2 size={18} /> Reload Data
          </button>
          <button className="btn btn-secondary" onClick={() => setShowPreview(true)} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', fontWeight: 600 }}>
            <Eye size={18} /> Preview
          </button>
          <button className="btn btn-primary" onClick={handlePublish} disabled={publishing || loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', fontWeight: 600 }}>
            {publishing ? <Loader2 className="spinner" size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Globe size={18} />} Publish
          </button>
        </div>
      </div>

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
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', margin: 0 }}>
                <Settings size={20} /> Storefront Details
              </h2>

              {/* Store Name & Logo Section */}
              <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Store Branding</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
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
                </div>

                <ImageUpload 
                  label="Store Header Logo" 
                  value={logoUrl} 
                  onChange={(url) => setLogoUrl(url)} 
                  folder="storefront_branding"
                />
              </div>

              {/* Contact Information Section */}
              <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Contact Information</h3>
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

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>WhatsApp Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={whatsapp} 
                      onChange={(e) => setWhatsapp(e.target.value)} 
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
              </div>

              {/* Store Configuration Section */}
              <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Store Configuration</h3>
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
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, padding: '0.75rem 1.5rem' }} onClick={(e) => {
                  console.log('Button clicked!', e);
                  console.log('saving state:', saving);
                  console.log('storefrontId:', storefrontId);
                  console.log('Form element:', e.currentTarget.form);
                }}>
                  {saving ? <Loader2 className="spinner" size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </div>

            {/* Sidebar - Social Links & Contact Icons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Footer - Social Links & Contact Icons */}
              <div className="card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-secondary)' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Footer Information</h3>
                
                <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem' }}>Contact Icons (displayed in footer)</p>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {contactEmail && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'var(--bg-primary)', borderRadius: '6px', fontSize: '0.85rem' }}>
                        <Mail size={16} /> {contactEmail}
                      </div>
                    )}
                    {contactPhone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'var(--bg-primary)', borderRadius: '6px', fontSize: '0.85rem' }}>
                        <Phone size={16} /> {contactPhone}
                      </div>
                    )}
                    {whatsapp && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'var(--bg-primary)', borderRadius: '6px', fontSize: '0.85rem' }}>
                        <MessageCircle size={16} /> {whatsapp}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem' }}>Social Media Links (footer icons)</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
