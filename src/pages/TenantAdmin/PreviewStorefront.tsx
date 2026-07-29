import React, { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { Loader2, Mail, Phone, MessageCircle } from 'lucide-react';

const PreviewStorefront: React.FC = () => {
  const [storefrontData, setStorefrontData] = useState<any>(null);
  const [themeData, setThemeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load storefront settings
        const storefrontRes = await apiClient.get('/api/v1/storefronts');
        const storefront = storefrontRes.data.data || storefrontRes.data;
        setStorefrontData(storefront);

        // Load active theme
        try {
          const themeRes = await apiClient.get('/api/v1/themes');
          const themes = Array.isArray(themeRes.data.data || themeRes.data) 
            ? (themeRes.data.data || themeRes.data) 
            : [themeRes.data.data || themeRes.data];
          const activeTheme = themes.find((t: any) => t.isActive) || themes[0];
          setThemeData(activeTheme);
        } catch (err) {
          console.warn('Failed to load theme:', err);
          // Theme is optional
        }
      } catch (err: any) {
        console.error('Failed to load storefront preview:', err);
        const errorMsg = err.response?.data?.message || err.message || 'Failed to load storefront preview';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    loadPreview();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', color: '#666' }}>Loading storefront preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '4rem auto' }}>
        <h2 style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 700 }}>Preview Failed</h2>
        <p style={{ color: '#666', margin: '1rem 0' }}>{error}</p>
      </div>
    );
  }

  if (!storefrontData) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '4rem auto' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>No Storefront Found</h2>
        <p style={{ color: '#666', margin: '1rem 0' }}>Please save your storefront settings first.</p>
      </div>
    );
  }

  const primaryColor = themeData?.primaryColor || '#6366f1';
  const backgroundColor = themeData?.backgroundColor || '#f8fafc';
  const textColor = themeData?.textColor || '#0f172a';
  const fontFamily = themeData?.fontFamily || 'system-ui, sans-serif';

  return (
    <div style={{ backgroundColor, color: textColor, fontFamily, minHeight: '100vh' }}>
      {/* Sticky Preview Banner */}
      <div style={{
        background: 'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 10px, #d97706 10px, #d97706 20px)',
        color: '#ffffff',
        padding: '0.65rem',
        textAlign: 'center',
        fontWeight: 700,
        fontSize: '0.85rem',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        ⚠️ PREVIEW MODE — Changes not published yet
      </div>

      {/* Header / Navigation */}
      <header style={{
        borderBottom: `1px solid rgba(0,0,0,0.1)`,
        padding: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '2rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {storefrontData.logoUrl && (
            <img
              src={storefrontData.logoUrl}
              alt={storefrontData.name}
              style={{ height: '50px', maxWidth: '150px', objectFit: 'contain' }}
            />
          )}
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
            {storefrontData.name || 'Storefront'}
          </h1>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {storefrontData.showAboutUs && (
            <a href="#about" style={{ color: textColor, textDecoration: 'none', fontWeight: 500 }}>
              About Us
            </a>
          )}
          {storefrontData.showContactUs && (
            <a href="#contact" style={{ color: textColor, textDecoration: 'none', fontWeight: 500 }}>
              Contact Us
            </a>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Store Information */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '2rem', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Welcome to {storefrontData.name}</h2>
            {storefrontData.currency && (
              <p style={{ color: 'rgba(0,0,0,0.6)', marginBottom: '0.5rem' }}>
                <strong>Currency:</strong> {storefrontData.currency}
              </p>
            )}
            {storefrontData.country && (
              <p style={{ color: 'rgba(0,0,0,0.6)' }}>
                <strong>Country:</strong> {storefrontData.country}
              </p>
            )}
          </div>
        </section>

        {/* About Us Section */}
        {storefrontData.showAboutUs && storefrontData.aboutUsContent && (
          <section id="about" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: primaryColor }}>About Us</h2>
            <div style={{ 
              backgroundColor: 'rgba(0,0,0,0.02)',
              padding: '2rem',
              borderRadius: '8px',
              lineHeight: 1.6
            }}>
              {storefrontData.aboutUsContent}
            </div>
          </section>
        )}

        {/* Contact Us Section */}
        {storefrontData.showContactUs && (
          <section id="contact" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: primaryColor }}>Contact Us</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {storefrontData.contactEmail && (
                <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Mail size={20} style={{ color: primaryColor }} />
                    <span style={{ fontWeight: 600 }}>Email</span>
                  </div>
                  <a href={`mailto:${storefrontData.contactEmail}`} style={{ color: primaryColor, textDecoration: 'none' }}>
                    {storefrontData.contactEmail}
                  </a>
                </div>
              )}
              {storefrontData.contactPhone && (
                <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Phone size={20} style={{ color: primaryColor }} />
                    <span style={{ fontWeight: 600 }}>Phone</span>
                  </div>
                  <a href={`tel:${storefrontData.contactPhone}`} style={{ color: primaryColor, textDecoration: 'none' }}>
                    {storefrontData.contactPhone}
                  </a>
                </div>
              )}
              {storefrontData.whatsapp && (
                <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <MessageCircle size={20} style={{ color: primaryColor }} />
                    <span style={{ fontWeight: 600 }}>WhatsApp</span>
                  </div>
                  <a href={`https://wa.me/${storefrontData.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ color: primaryColor, textDecoration: 'none' }}>
                    {storefrontData.whatsapp}
                  </a>
                </div>
              )}
            </div>
            {storefrontData.address && (
              <div style={{ marginTop: '1.5rem', backgroundColor: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Address</h3>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{storefrontData.address}</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid rgba(0,0,0,0.1)`,
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.02)'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          {/* Social Links */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {storefrontData.socialLinks?.facebook && (
              <a href={storefrontData.socialLinks.facebook} target="_blank" rel="noopener noreferrer" style={{ color: primaryColor, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                Facebook
              </a>
            )}
            {storefrontData.socialLinks?.twitter && (
              <a href={storefrontData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" style={{ color: primaryColor, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                Twitter
              </a>
            )}
            {storefrontData.socialLinks?.instagram && (
              <a href={storefrontData.socialLinks.instagram} target="_blank" rel="noopener noreferrer" style={{ color: primaryColor, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                Instagram
              </a>
            )}
            {storefrontData.socialLinks?.linkedin && (
              <a href={storefrontData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: primaryColor, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                LinkedIn
              </a>
            )}
          </div>

          {/* Copyright */}
          {storefrontData.copyright && (
            <p style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)', margin: 0 }}>
              {storefrontData.copyright}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default PreviewStorefront;
