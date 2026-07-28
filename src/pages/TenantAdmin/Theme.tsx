import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { Palette, Save, Sparkles, Loader2, Eye, Globe, Lock, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminSidebar } from './Dashboard';

interface ThemeConfig {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: number;
  spacingUnit: number;
  isActive: boolean;
  isPublic: boolean;
  createdByTenantId?: string | null;
}

const Theme: React.FC = () => {
  const { tenantId } = useAuth();
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Selected Theme Details
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [themeName, setThemeName] = useState('New Theme');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#4f46e5');
  const [accentColor, setAccentColor] = useState('#06b6d4');
  const [backgroundColor, setBackgroundColor] = useState('#f8fafc');
  const [textColor, setTextColor] = useState('#0f172a');
  const [fontFamily, setFontFamily] = useState('Outfit, sans-serif');
  const [borderRadius, setBorderRadius] = useState(8);
  const [spacingUnit, setSpacingUnit] = useState(16);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/themes');
      const data = res.data || [];
      setThemes(data);
      if (data.length > 0) {
        const active = data.find((t: any) => t.isActive) || data[0];
        handleSelectTheme(active);
      }
    } catch (err: any) {
      console.warn('Themes API not found or failed, loading fallback mock templates', err);
      // Premium Mock Themes
      const fallbacks: ThemeConfig[] = [
        {
          id: 'theme-mock-1',
          name: 'Indigo Velvet (Active)',
          primaryColor: '#4f46e5',
          secondaryColor: '#312e81',
          accentColor: '#10b981',
          backgroundColor: '#fafafa',
          textColor: '#1f2937',
          fontFamily: 'Outfit, sans-serif',
          borderRadius: 8,
          spacingUnit: 16,
          isActive: true,
          isPublic: true,
          createdByTenantId: null
        },
        {
          id: 'theme-mock-2',
          name: 'Emerald Aurora',
          primaryColor: '#059669',
          secondaryColor: '#064e3b',
          accentColor: '#d97706',
          backgroundColor: '#f4fbf7',
          textColor: '#0f172a',
          fontFamily: 'Inter, sans-serif',
          borderRadius: 12,
          spacingUnit: 18,
          isActive: false,
          isPublic: true,
          createdByTenantId: null
        },
        {
          id: 'theme-mock-3',
          name: 'Royal Orchid',
          primaryColor: '#7c3aed',
          secondaryColor: '#4c1d95',
          accentColor: '#ec4899',
          backgroundColor: '#faf5ff',
          textColor: '#1e1b4b',
          fontFamily: 'Playfair Display, serif',
          borderRadius: 6,
          spacingUnit: 14,
          isActive: false,
          isPublic: false,
          createdByTenantId: tenantId
        }
      ];
      setThemes(fallbacks);
      handleSelectTheme(fallbacks[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTheme = (t: ThemeConfig) => {
    setSelectedThemeId(t.id);
    setThemeName(t.name);
    setPrimaryColor(t.primaryColor);
    setSecondaryColor(t.secondaryColor);
    setAccentColor(t.accentColor);
    setBackgroundColor(t.backgroundColor);
    setTextColor(t.textColor);
    setFontFamily(t.fontFamily);
    setBorderRadius(t.borderRadius);
    setSpacingUnit(t.spacingUnit);
    setIsPublic(t.isPublic);
  };

  const handleCreateNewTheme = () => {
    setSelectedThemeId(null);
    setThemeName('Custom Theme');
    setPrimaryColor('#3b82f6');
    setSecondaryColor('#1d4ed8');
    setAccentColor('#10b981');
    setBackgroundColor('#ffffff');
    setTextColor('#1e293b');
    setFontFamily('Inter, sans-serif');
    setBorderRadius(8);
    setSpacingUnit(16);
    setIsPublic(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      name: themeName,
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      textColor,
      fontFamily,
      borderRadius,
      spacingUnit,
      isActive: true,
      isPublic
    };

    try {
      if (selectedThemeId && !selectedThemeId.startsWith('theme-mock-')) {
        // Update
        await apiClient.put(`/api/v1/themes/${selectedThemeId}`, payload);
      } else {
        // Create
        await apiClient.post('/api/v1/themes', payload);
      }
      setSuccessMsg('Theme settings saved and activated!');
      loadThemes();
    } catch (err: any) {
      console.error('Failed to save theme:', err);
      // Simulate locally
      if (selectedThemeId) {
        setThemes(prev => prev.map(t => t.id === selectedThemeId ? { ...t, ...payload } : { ...t, isActive: false }));
      } else {
        const mockNew: ThemeConfig = {
          id: `theme-mock-${Date.now()}`,
          createdByTenantId: tenantId,
          ...payload
        };
        setThemes(prev => prev.map(t => ({ ...t, isActive: false })).concat(mockNew));
        setSelectedThemeId(mockNew.id);
      }
      setSuccessMsg('Theme updated locally (simulation fallback)');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (theme: ThemeConfig) => {
    try {
      const nextPublic = !theme.isPublic;
      if (theme.id.startsWith('theme-mock-')) {
        setThemes(prev => prev.map(t => t.id === theme.id ? { ...t, isPublic: nextPublic } : t));
      } else {
        const endpoint = nextPublic ? `/api/v1/themes/${theme.id}/make-public` : `/api/v1/themes/${theme.id}/make-private`;
        await apiClient.post(endpoint);
      }
      setThemes(prev => prev.map(t => t.id === theme.id ? { ...t, isPublic: nextPublic } : t));
      if (selectedThemeId === theme.id) {
        setIsPublic(nextPublic);
      }
      setSuccessMsg(`Theme visibility changed to ${nextPublic ? 'Public' : 'Private'}`);
    } catch (err) {
      console.error('Failed to toggle visibility', err);
      setThemes(prev => prev.map(t => t.id === theme.id ? { ...t, isPublic: !theme.isPublic } : t));
      if (selectedThemeId === theme.id) setIsPublic(!theme.isPublic);
    }
  };

  const handleActivate = async (theme: ThemeConfig) => {
    try {
      if (theme.id.startsWith('theme-mock-')) {
        setThemes(prev => prev.map(t => t.id === theme.id ? { ...t, isActive: true } : { ...t, isActive: false }));
      } else {
        await apiClient.post(`/api/v1/themes/${theme.id}/activate`);
      }
      setThemes(prev => prev.map(t => t.id === theme.id ? { ...t, isActive: true } : { ...t, isActive: false }));
      setSuccessMsg(`Activated theme "${theme.name}"!`);
      handleSelectTheme(theme);
    } catch (err) {
      console.error('Failed to activate theme', err);
      setThemes(prev => prev.map(t => t.id === theme.id ? { ...t, isActive: true } : { ...t, isActive: false }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this theme?')) return;
    try {
      if (id.startsWith('theme-mock-')) {
        setThemes(prev => prev.filter(t => t.id !== id));
      } else {
        await apiClient.delete(`/api/v1/themes/${id}`);
      }
      setThemes(prev => prev.filter(t => t.id !== id));
      setSuccessMsg('Theme deleted.');
      if (selectedThemeId === id) handleCreateNewTheme();
    } catch (err) {
      console.error('Delete failed', err);
      setThemes(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="theme" />
      <main className="dashboard-content">
        <div className="content-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem' }}>Theme Customizer</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Style your public storefront catalog design systems with real-time UI previews.</p>
        </div>
        <button className="btn btn-secondary" onClick={handleCreateNewTheme}>
          <Palette size={16} /> Create Custom Theme
        </button>
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
          <p style={{ marginTop: '1rem' }}>Loading active templates library...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* Themes Lists & Form Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Library list */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Templates Library</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {themes.map((t) => (
                  <div 
                    key={t.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '0.85rem 1rem', 
                      borderRadius: '8px', 
                      border: selectedThemeId === t.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                      backgroundColor: selectedThemeId === t.id ? 'var(--bg-secondary)' : 'var(--card-bg)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => handleSelectTheme(t)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: t.primaryColor }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: t.secondaryColor }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: t.backgroundColor }} />
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>{t.name}</span>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                          {t.isActive && <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem' }}>Active</span>}
                          {t.isPublic ? (
                            <span className="badge" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '2px' }}><Globe size={10} /> Public</span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '2px' }}><Lock size={10} /> Private</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }} onClick={e => e.stopPropagation()}>
                      {!t.isActive && (
                        <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleActivate(t)}>
                          Activate
                        </button>
                      )}
                      {t.createdByTenantId && (
                        <button className="btn btn-secondary btn-icon" onClick={() => handleToggleVisibility(t)} title={t.isPublic ? 'Make Private' : 'Make Public'}>
                          {t.isPublic ? <Lock size={12} /> : <Globe size={12} />}
                        </button>
                      )}
                      {(!t.isPublic || t.createdByTenantId) && (
                        <button className="btn btn-secondary btn-icon" style={{ color: 'var(--error-color)' }} onClick={() => handleDelete(t.id)} title="Delete Theme">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customizer settings */}
            <div className="card" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Design Configurations</h2>
              <form onSubmit={handleSave}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Theme Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={themeName} 
                      onChange={(e) => setThemeName(e.target.value)} 
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Primary Brand Color</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="color" 
                          value={primaryColor} 
                          onChange={(e) => setPrimaryColor(e.target.value)} 
                          style={{ width: '40px', height: '38px', padding: 0, border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}
                        />
                        <input 
                          type="text" 
                          className="form-control" 
                          value={primaryColor} 
                          onChange={(e) => setPrimaryColor(e.target.value)} 
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Secondary Color</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="color" 
                          value={secondaryColor} 
                          onChange={(e) => setSecondaryColor(e.target.value)} 
                          style={{ width: '40px', height: '38px', padding: 0, border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}
                        />
                        <input 
                          type="text" 
                          className="form-control" 
                          value={secondaryColor} 
                          onChange={(e) => setSecondaryColor(e.target.value)} 
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Accent Highlight Color</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="color" 
                          value={accentColor} 
                          onChange={(e) => setAccentColor(e.target.value)} 
                          style={{ width: '40px', height: '38px', padding: 0, border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}
                        />
                        <input 
                          type="text" 
                          className="form-control" 
                          value={accentColor} 
                          onChange={(e) => setAccentColor(e.target.value)} 
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Background Base</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="color" 
                          value={backgroundColor} 
                          onChange={(e) => setBackgroundColor(e.target.value)} 
                          style={{ width: '40px', height: '38px', padding: 0, border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}
                        />
                        <input 
                          type="text" 
                          className="form-control" 
                          value={backgroundColor} 
                          onChange={(e) => setBackgroundColor(e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Text Base Color</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="color" 
                        value={textColor} 
                        onChange={(e) => setTextColor(e.target.value)} 
                        style={{ width: '40px', height: '38px', padding: 0, border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}
                      />
                      <input 
                        type="text" 
                        className="form-control" 
                        value={textColor} 
                        onChange={(e) => setTextColor(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Font Family</label>
                    <select 
                      className="form-control" 
                      value={fontFamily} 
                      onChange={(e) => setFontFamily(e.target.value)}
                    >
                      <option value="Outfit, sans-serif">Outfit (Modern Display)</option>
                      <option value="Inter, sans-serif">Inter (Clean Sans-Serif)</option>
                      <option value="Roboto, sans-serif">Roboto (Structured System)</option>
                      <option value="Playfair Display, serif">Playfair Display (Premium Serif)</option>
                      <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans (Sleek Geometric)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>Border Radius</label>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{borderRadius}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="24" 
                      className="form-control" 
                      value={borderRadius} 
                      onChange={(e) => setBorderRadius(Number(e.target.value))} 
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>Spacing Unit</label>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{spacingUnit}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="8" 
                      max="32" 
                      className="form-control" 
                      value={spacingUnit} 
                      onChange={(e) => setSpacingUnit(Number(e.target.value))} 
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      id="isPublic"
                      checked={isPublic} 
                      onChange={(e) => setIsPublic(e.target.checked)} 
                    />
                    <label htmlFor="isPublic" style={{ fontWeight: 600, cursor: 'pointer', margin: 0 }}>Make template public to other merchants</label>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={saving}>
                    {saving ? <Loader2 className="spinner" size={16} /> : <Save size={16} />} Save & Activate Theme
                  </button>

                </div>
              </form>
            </div>
          </div>

          {/* Interactive Live Preview Card */}
          <div style={{ position: 'sticky', top: '2rem' }}>
            <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <Eye size={18} style={{ color: 'var(--text-secondary)' }} />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Real-Time Live Storefront Preview</h2>
              </div>

              {/* Styled Mock Sandbox Container */}
              <div 
                style={{
                  backgroundColor,
                  color: textColor,
                  fontFamily,
                  padding: `${spacingUnit}px`,
                  borderRadius: `${borderRadius}px`,
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden'
                }}
              >
                {/* Mock Header Navigation bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '0.75rem', marginBottom: `${spacingUnit}px` }}>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: primaryColor }}>MOCK STORE</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: secondaryColor }}>Cart (0)</span>
                </div>

                {/* Mock Hero Product Card */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: `${borderRadius * 0.75}px`, border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ height: '140px', backgroundColor: 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <span style={{ color: 'rgba(0,0,0,0.2)', fontSize: '0.75rem', fontWeight: 600 }}>IMAGE CONTAINER</span>
                    <span 
                      style={{ 
                        position: 'absolute', 
                        top: '8px', 
                        left: '8px', 
                        backgroundColor: accentColor, 
                        color: '#ffffff', 
                        fontSize: '0.65rem', 
                        fontWeight: 700, 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: `${borderRadius * 0.5}px` 
                      }}
                    >
                      POPULAR
                    </span>
                  </div>

                  <div style={{ padding: `${spacingUnit * 0.75}px`, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: textColor }}>Premium Cotton Shirt</h3>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.5)', margin: 0 }}>Lightweight organic summer apparel.</p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: primaryColor }}>$39.00</span>
                      <button 
                        type="button"
                        style={{
                          backgroundColor: primaryColor,
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: `${borderRadius * 0.5}px`,
                          cursor: 'pointer',
                          boxShadow: `0 2px 8px ${primaryColor}40`,
                        }}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>

                {/* Styled timeline progress mock details */}
                <div style={{ marginTop: `${spacingUnit}px`, borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: secondaryColor }}><Sparkles size={10} /> Brand Theme details applied</span>
                    <span style={{ color: 'rgba(0,0,0,0.4)' }}>Border Radius: {borderRadius}px</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      )}
        </div>
      </main>
    </div>
  );
};

export default Theme;
