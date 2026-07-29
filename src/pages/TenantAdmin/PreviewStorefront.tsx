import React, { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import Storefront from '../Storefront';
import { Loader2 } from 'lucide-react';

const PreviewStorefront: React.FC = () => {
  const [bootstrapData, setBootstrapData] = useState<any>(null);
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

        // Load products
        const productsRes = await apiClient.get('/api/v1/products');
        const products = Array.isArray(productsRes.data.data) ? productsRes.data.data : [];

        // Load categories
        const categoriesRes = await apiClient.get('/api/v1/categories');
        const categories = Array.isArray(categoriesRes.data.data) ? categoriesRes.data.data : [];

        // Load active theme
        let theme = null;
        try {
          const themeRes = await apiClient.get('/api/v1/themes');
          const themes = Array.isArray(themeRes.data.data || themeRes.data) 
            ? (themeRes.data.data || themeRes.data) 
            : [themeRes.data.data || themeRes.data];
          theme = themes.find((t: any) => t.isActive) || themes[0];
        } catch (err) {
          console.warn('Failed to load theme:', err);
        }

        setBootstrapData({
          storefront,
          products,
          categories,
          theme
        });
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

  return (
    <div style={{ position: 'relative' }}>
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
      
      {/* Storefront Catalog */}
      <Storefront previewBootstrapData={bootstrapData} />
    </div>
  );
};

export default PreviewStorefront;
