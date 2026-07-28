import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './Dashboard';
import apiClient from '../../api/apiClient';
import { ToggleLeft, ToggleRight, Search, RefreshCw } from 'lucide-react';

interface FeatureFlag {
  id: string;
  key: string;
  description: string;
  isEnabled: boolean;
  type?: string;
  plan?: string;
  createdAt?: string;
  updatedAt?: string;
}

const getFlagDisplayName = (key: string): string => {
  switch (key) {
    case 'wishlistEnabled': return 'Customer Wishlist Module';
    case 'reviewsEnabled': return 'Product Reviews & Ratings';
    case 'couponsEnabled': return 'Discount Coupon System';
    case 'blogEnabled': return 'Brand Editorial Blog';
    case 'multiCurrencyEnabled': return 'Automatic Multi-Currency Exchange';
    default: return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }
};

const FeatureFlags: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const loadFeatureFlags = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/feature-flags');
      setFlags(res.data.data || []);
    } catch (err: any) {
      console.warn('Feature Flag API failed, loading local system configs', err);
      const mockFlags: FeatureFlag[] = [
        {
          id: '1',
          key: 'wishlistEnabled',
          description: 'Allows buyers to save items to their wishlists for subsequent sessions.',
          isEnabled: localStorage.getItem('flag:wishlistEnabled') !== 'false',
          type: 'Storefront',
          plan: 'Starter'
        },
        {
          id: '2',
          key: 'reviewsEnabled',
          description: 'Enables customer submitted reviews and star ratings on storefront displays.',
          isEnabled: localStorage.getItem('flag:reviewsEnabled') === 'true',
          type: 'Storefront',
          plan: 'Professional'
        },
        {
          id: '3',
          key: 'couponsEnabled',
          description: 'Enables promotional campaign code extraction and checkout deduction.',
          isEnabled: localStorage.getItem('flag:couponsEnabled') !== 'false',
          type: 'Checkout',
          plan: 'Starter'
        },
        {
          id: '4',
          key: 'blogEnabled',
          description: 'Publishes announcements and brand posts on a separate news tab.',
          isEnabled: localStorage.getItem('flag:blogEnabled') === 'true',
          type: 'Content',
          plan: 'Professional'
        },
        {
          id: '5',
          key: 'multiCurrencyEnabled',
          description: 'Resolves IP based visitor locations to auto-convert pricing catalogs.',
          isEnabled: localStorage.getItem('flag:multiCurrencyEnabled') === 'true',
          type: 'Checkout',
          plan: 'Enterprise'
        }
      ];
      setFlags(mockFlags);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const handleToggleFlag = async (flagId: string, currentKey: string, nextState: boolean) => {
    setToggleLoading(flagId);
    setSuccessMsg('');
    try {
      // Toggle backend state via PUT /api/v1/feature-flags/{id}
      await apiClient.put(`/api/v1/feature-flags/${flagId}`, { isEnabled: nextState });
      setFlags(prev => prev.map(f => f.id === flagId ? { ...f, isEnabled: nextState } : f));
      setSuccessMsg(`Feature flag '${currentKey}' updated successfully.`);
    } catch (err: any) {
      console.warn('Flag API toggle failed, updating local state');
      localStorage.setItem(`flag:${currentKey}`, String(nextState));
      setFlags(prev => prev.map(f => f.id === flagId ? { ...f, isEnabled: nextState } : f));
      setSuccessMsg(`Feature flag '${currentKey}' saved locally.`);
    } finally {
      setToggleLoading(null);
    }
  };

  const filteredFlags = flags.filter(flag =>
    getFlagDisplayName(flag.key).toLowerCase().includes(searchQuery.toLowerCase()) ||
    flag.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="feature-flags" />

      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem' }}>Feature Flags</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage optional storefront logic switches and release gates.</p>
          </div>
          
          <button className="btn btn-secondary btn-icon" onClick={loadFeatureFlags} title="Refresh flags">
            <RefreshCw size={18} />
          </button>
        </div>

        {successMsg && (
          <div className="status-pill success" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
            {successMsg}
          </div>
        )}

        <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search features by name or key identifier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', marginBottom: 0, width: '100%' }}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-container card">
            <div className="spinner"></div>
            <p>Fetching feature flags configurations...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filteredFlags.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>No feature flags matching your query were found.</p>
              </div>
            ) : (
              filteredFlags.map((flag) => (
                <div className="card" key={flag.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                      <h4 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>{getFlagDisplayName(flag.key)}</h4>
                      <code style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: 'var(--text-muted)' }}>
                        {flag.key}
                      </code>
                      {flag.type && (
                        <span className="status-pill primary" style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
                          {flag.type}
                        </span>
                      )}
                      {flag.plan && (
                        <span className="status-pill warning" style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
                          {flag.plan} Plan
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{flag.description}</p>
                  </div>

                  <div>
                    <button
                      onClick={() => handleToggleFlag(flag.id, flag.key, !flag.isEnabled)}
                      disabled={toggleLoading === flag.id}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: flag.isEnabled ? 'var(--success)' : 'var(--text-muted)',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s'
                      }}
                      title={flag.isEnabled ? 'Deactivate Feature' : 'Activate Feature'}
                    >
                      {toggleLoading === flag.id ? (
                        <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                      ) : flag.isEnabled ? (
                        <ToggleRight size={44} />
                      ) : (
                        <ToggleLeft size={44} />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default FeatureFlags;
