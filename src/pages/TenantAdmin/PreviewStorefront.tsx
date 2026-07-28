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
        const res = await apiClient.get('/api/v1/store/preview');
        setBootstrapData(res.data.data || res.data || null);
      } catch (err: any) {
        console.error('Failed to load storefront preview config:', err);
        setError(err.response?.data?.message || err.message || 'Failed to retrieve storefront preview configuration details.');
      } finally {
        setLoading(false);
      }
    };
    loadPreview();
  }, []);

  if (loading) {
    return (
      <div className="loading-container card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader2 className="spinner" size={32} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading storefront preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center" style={{ padding: '4rem 2rem', maxWidth: '600px', margin: '4rem auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--error-color)' }}>Preview Initialization Failed</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="preview-mode" style={{ position: 'relative' }}>
      <div style={{
        background: 'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 10px, #d97706 10px, #d97706 20px)',
        color: '#ffffff',
        padding: '0.65rem',
        textAlign: 'center',
        fontWeight: 700,
        fontSize: '0.85rem',
        letterSpacing: '0.5px',
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
        textTransform: 'uppercase',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        ⚠️ PREVIEW MODE — Changes not published yet
      </div>
      <Storefront previewBootstrapData={bootstrapData} />
    </div>
  );
};

export default PreviewStorefront;
