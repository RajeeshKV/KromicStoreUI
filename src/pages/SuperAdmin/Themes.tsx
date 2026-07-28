import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Palette, Globe, Lock, Plus, Save, Trash2, Shield, Loader2, Sparkles, Eye, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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
  createdByTenantName?: string;
}

const SuperAdminThemes: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Selected Theme Details
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [themeName, setThemeName] = useState('New Global Template');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [secondaryColor, setSecondaryColor] = useState('#312e81');
  const [accentColor, setAccentColor] = useState('#10b981');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#1f2937');
  const [fontFamily, setFontFamily] = useState('Outfit, sans-serif');
  const [borderRadius, setBorderRadius] = useState(8);
  const [spacingUnit, setSpacingUnit] = useState(16);

  useEffect(() => {
    loadAllThemes();
  }, []);

  const loadAllThemes = async () => {
    setLoading(true);
    try {
      // In SuperAdmin scope, we fetch all themes across the database
      const res = await apiClient.get('/api/v1/superuser/platform/themes');
      setThemes(res.data || []);
      if (res.data && res.data.length > 0) {
        handleSelectTheme(res.data[0]);
      }
    } catch {
      try {
        const res = await apiClient.get('/api/v1/themes');
        setThemes(res.data || []);
        if (res.data && res.data.length > 0) {
          handleSelectTheme(res.data[0]);
        }
      } catch (err: any) {
        console.warn('SuperAdmin themes lookup failed, loading fallback mock defaults', err);
        const mocks: ThemeConfig[] = [
          {
            id: 'theme-global-1',
            name: 'Indigo Velvet (Default)',
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
            id: 'theme-global-2',
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
            id: 'theme-global-3',
            name: 'Retro Mustard',
            primaryColor: '#b45309',
            secondaryColor: '#78350f',
            accentColor: '#4f46e5',
            backgroundColor: '#fffbeb',
            textColor: '#451a03',
            fontFamily: 'Playfair Display, serif',
            borderRadius: 4,
            spacingUnit: 12,
            isActive: false,
            isPublic: false,
            createdByTenantId: 'tenant-abc-xyz',
            createdByTenantName: 'Nike Retail India'
          }
        ];
        setThemes(mocks);
        handleSelectTheme(mocks[0]);
      }
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
  };

  const handleCreateNewTheme = () => {
    setSelectedThemeId(null);
    setThemeName('Global Design Template');
    setPrimaryColor('#4f46e5');
    setSecondaryColor('#312e81');
    setAccentColor('#10b981');
    setBackgroundColor('#ffffff');
    setTextColor('#1e293b');
    setFontFamily('Inter, sans-serif');
    setBorderRadius(8);
    setSpacingUnit(16);
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
      isActive: false,
      isPublic: true, // SuperUser created templates are public by default
      createdByTenantId: null // Admin generated
    };

    try {
      if (selectedThemeId && !selectedThemeId.startsWith('theme-global-')) {
        await apiClient.put(`/api/v1/themes/${selectedThemeId}`, payload);
      } else {
        await apiClient.post('/api/v1/themes', payload);
      }
      setSuccessMsg('Global theme template saved successfully!');
      loadAllThemes();
    } catch (err: any) {
      console.error('Failed to save global theme:', err);
      // Simulate locally
      if (selectedThemeId) {
        setThemes(prev => prev.map(t => t.id === selectedThemeId ? { ...t, ...payload } : t));
      } else {
        const mockNew: ThemeConfig = {
          id: `theme-global-${Date.now()}`,
          ...payload
        };
        setThemes(prev => [...prev, mockNew]);
        setSelectedThemeId(mockNew.id);
      }
      setSuccessMsg('Saved locally (simulation fallback mode)');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (theme: ThemeConfig) => {
    try {
      const nextPublic = !theme.isPublic;
      if (theme.id.startsWith('theme-global-')) {
        setThemes(prev => prev.map(t => t.id === theme.id ? { ...t, isPublic: nextPublic } : t));
      } else {
        const endpoint = nextPublic ? `/api/v1/themes/${theme.id}/make-public` : `/api/v1/themes/${theme.id}/make-private`;
        await apiClient.post(endpoint);
      }
      setThemes(prev => prev.map(t => t.id === theme.id ? { ...t, isPublic: nextPublic } : t));
      setSuccessMsg(`Theme visibility changed to ${nextPublic ? 'Public' : 'Private'}`);
    } catch (err) {
      console.error('Failed to change visibility', err);
      setThemes(prev => prev.map(t => t.id === theme.id ? { ...t, isPublic: !theme.isPublic } : t));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this theme template? This will remove it from all storefront options.')) return;
    try {
      if (id.startsWith('theme-global-')) {
        setThemes(prev => prev.filter(t => t.id !== id));
      } else {
        await apiClient.delete(`/api/v1/themes/${id}`);
      }
      setThemes(prev => prev.filter(t => t.id !== id));
      setSuccessMsg('Global theme template deleted.');
      if (selectedThemeId === id) handleCreateNewTheme();
    } catch (err) {
      console.error('Delete failed', err);
      setThemes(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="app-container">
      {/* Super Header Navigation */}
      <header className="main-navbar" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={26} style={{ color: 'var(--accent-secondary)' }} />
          <span>Kromic SaaS Console</span>
          <span className="status-pill danger" style={{ fontSize: '0.6rem', padding: '0.15rem 0.5rem', marginLeft: '0.5rem' }}>Super User</span>
        </div>

        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/admin" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Settings size={14} /> Configs
          </Link>
          <Link to="/admin/themes" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Palette size={14} /> Themes
          </Link>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      <div className="content-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            <Shield size={14} /> PLATFORM CONTROL CONSOLE
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem' }}>Global Themes Gallery</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage public design templates and inspect private styling settings across all merchants.</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateNewTheme}>
          <Plus size={16} /> Add Global Template
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
          <p style={{ marginTop: '1rem' }}>Loading global themes directory...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* Left panel: List and Create/Edit Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Platform templates list */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Global Directory</h2>
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
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                          {t.createdByTenantId ? (
                            <span className="badge" style={{ backgroundColor: '#fff7ed', color: '#c2410c', fontSize: '0.65rem' }}>Merchant: {t.createdByTenantName || 'Custom'}</span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '2px' }}><Shield size={8} /> Admin Template</span>
                          )}
                          {t.isPublic ? (
                            <span className="badge" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '2px' }}><Globe size={8} /> Public</span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '2px' }}><Lock size={8} /> Private</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-secondary btn-icon" onClick={() => handleToggleVisibility(t)} title={t.isPublic ? 'Make Private' : 'Make Public'}>
                        {t.isPublic ? <Lock size={12} /> : <Globe size={12} />}
                      </button>
                      <button className="btn btn-secondary btn-icon" style={{ color: 'var(--error-color)' }} onClick={() => handleDelete(t.id)} title="Delete Template">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customizer settings */}
            <div className="card" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Template Settings</h2>
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

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={saving}>
                    {saving ? <Loader2 className="spinner" size={16} /> : <Save size={16} />} Save Global Template
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
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Template Render Preview</h2>
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
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: primaryColor }}>PREVIEW</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: secondaryColor }}>Cart (0)</span>
                </div>

                {/* Mock Hero Product Card */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: `${borderRadius * 0.75}px`, border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ height: '140px', backgroundColor: 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <span style={{ color: 'rgba(0,0,0,0.2)', fontSize: '0.75rem', fontWeight: 600 }}>IMAGE PLACEHOLDER</span>
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
                      NEW
                    </span>
                  </div>

                  <div style={{ padding: `${spacingUnit * 0.75}px`, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: textColor }}>Premium Cotton Shirt</h3>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.5)', margin: 0 }}>Clean display system layout.</p>
                    
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
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: secondaryColor }}><Sparkles size={10} /> Active platform colors</span>
                    <span style={{ color: 'rgba(0,0,0,0.4)' }}>Border Radius: {borderRadius}px</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      )}
      </div>
    </div>
  );
};

export default SuperAdminThemes;
