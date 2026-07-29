import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { Palette, Save, Loader2, Eye, Globe, Lock, Trash2, Copy, Plus, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminSidebar } from './Dashboard';

interface Theme {
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

// Theme Card Component for Grid Display
const ThemeCard: React.FC<{
  theme: Theme;
  isSelected: boolean;
  isOwned: boolean;
  onSelect: (t: Theme) => void;
  onActivate: (id: string) => void;
  onToggleVisibility: (id: string, isPublic: boolean) => void;
  onDelete: (id: string) => void;
}> = ({ theme, isSelected, isOwned, onSelect, onActivate, onToggleVisibility, onDelete }) => {
  return (
    <div
      onClick={() => onSelect(theme)}
      style={{
        padding: '1rem',
        border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
        borderRadius: '8px',
        backgroundColor: isSelected ? 'var(--bg-secondary)' : 'var(--card-bg)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}
    >
      <div style={{ display: 'flex', gap: '4px' }}>
        <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: theme.primaryColor }} />
        <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: theme.secondaryColor }} />
        <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: theme.accentColor }} />
        <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: theme.backgroundColor, border: '1px solid var(--border-color)' }} />
      </div>
      <div>
        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 600 }}>{theme.name}</h4>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {theme.isActive && <span style={{ fontSize: '0.7rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>Active</span>}
          {theme.isPublic && <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', padding: '0.15rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}><Globe size={10} /> Public</span>}
        </div>
      </div>
      
      {isOwned && (
        <div style={{ display: 'flex', gap: '0.35rem', marginTop: 'auto', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
          {!theme.isActive && (
            <button onClick={() => onActivate(theme.id)} className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', flex: 1 }}>
              Activate
            </button>
          )}
          <button onClick={() => onToggleVisibility(theme.id, theme.isPublic)} className="btn btn-secondary btn-icon" style={{ padding: '0.3rem' }} title={theme.isPublic ? 'Make Private' : 'Make Public'}>
            {theme.isPublic ? <Lock size={14} /> : <Globe size={14} />}
          </button>
          <button onClick={() => onDelete(theme.id)} className="btn btn-secondary btn-icon" style={{ padding: '0.3rem', color: '#ef4444' }} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

// Public Theme Card Component
const PublicThemeCard: React.FC<{ theme: Theme; onClone: (t: Theme) => void }> = ({ theme, onClone }) => {
  return (
    <div style={{
      padding: '1rem',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      backgroundColor: 'var(--card-bg)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: theme.primaryColor }} />
        <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: theme.secondaryColor }} />
        <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: theme.accentColor }} />
        <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: theme.backgroundColor, border: '1px solid var(--border-color)' }} />
      </div>
      <div>
        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 600 }}>{theme.name}</h4>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>By {theme.createdByTenantId || 'Unknown'}</span>
      </div>
      <button onClick={() => onClone(theme)} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
        <Copy size={14} /> Clone Theme
      </button>
    </div>
  );
};

// Color Input Field Component
const ColorInputField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="form-group">
    <label className="form-label" style={{ fontWeight: 600 }}>{label}</label>
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '40px', height: '38px', padding: 0, border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }} />
      <input type="text" className="form-control" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  </div>
);

// Range Input Component
const RangeInputField: React.FC<{ label: string; value: number; onChange: (v: number) => void; min: number; max: number; unit: string }> = ({ label, value, onChange, min, max, unit }) => (
  <div className="form-group">
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
      <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>{label}</label>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="form-control" />
  </div>
);

// Theme Preview Component
const ThemePreview: React.FC<{
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: number;
  spacingUnit: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  tab: string;
}> = ({ backgroundColor, textColor, fontFamily, borderRadius, spacingUnit, primaryColor, secondaryColor, accentColor, tab }) => {
  return (
    <div style={{
      backgroundColor,
      color: textColor,
      fontFamily,
      padding: `${spacingUnit}px`,
      borderRadius: `${borderRadius}px`,
      border: '1px solid rgba(0,0,0,0.08)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      minHeight: '320px',
      display: 'flex',
      flexDirection: 'column',
      fontSize: '0.8rem'
    }}>
      {tab === 'catalog' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ backgroundColor: '#fff', borderRadius: `${borderRadius * 0.75}px`, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ height: '80px', backgroundColor: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'rgba(0,0,0,0.2)' }}>Product {i}</div>
              <div style={{ padding: '0.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Item {i}</div>
                <div style={{ color: primaryColor, fontWeight: 800 }}>$29.99</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'details' && (
        <div>
          <div style={{ fontSize: '0.7rem', color: secondaryColor, marginBottom: '0.75rem' }}>← Back</div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '100px', height: '100px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: `${borderRadius * 0.75}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'rgba(0,0,0,0.2)' }}>Image</div>
            <div>
              <div style={{ color: accentColor, fontSize: '0.65rem', fontWeight: 700, marginBottom: '0.25rem' }}>IN STOCK</div>
              <h3 style={{ margin: '0 0 0.25rem 0', fontWeight: 800 }}>Product Name</h3>
              <div style={{ color: primaryColor, fontWeight: 800, marginBottom: '0.5rem' }}>$199.99</div>
              <button style={{ backgroundColor: primaryColor, color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: `${borderRadius * 0.5}px`, fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>Add to Cart</button>
            </div>
          </div>
        </div>
      )}
      {tab === 'checkout' && (
        <div>
          <h4 style={{ margin: '0 0 0.75rem 0', fontWeight: 700 }}>Checkout</h4>
          <input placeholder="Name" style={{ width: '100%', padding: '0.4rem', marginBottom: '0.5rem', border: '1px solid rgba(0,0,0,0.1)', borderRadius: `${borderRadius * 0.5}px`, fontSize: '0.75rem' }} disabled />
          <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: `${borderRadius * 0.5}px`, marginBottom: '0.75rem', fontSize: '0.7rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>Subtotal:</span>
              <span>$99.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: primaryColor }}>
              <span>Total:</span>
              <span>$99.00</span>
            </div>
          </div>
          <button style={{ width: '100%', backgroundColor: primaryColor, color: '#fff', border: 'none', padding: '0.5rem', borderRadius: `${borderRadius * 0.5}px`, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Pay Now</button>
        </div>
      )}
      {tab === 'tracking' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 700 }}>Order #ORD-8012</span>
            <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.1rem 0.4rem', borderRadius: '3px', fontSize: '0.65rem' }}>Shipped</span>
          </div>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: `${borderRadius * 0.5}px`, fontSize: '0.7rem' }}>
            <div><strong>Courier:</strong> Delhivery</div>
            <div><strong>Tracking:</strong> DEL9018471253</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Theme Component
const Theme: React.FC = () => {
  const { tenantId } = useAuth();
  const [tenantThemes, setTenantThemes] = useState<Theme[]>([]);
  const [publicThemes, setPublicThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [themeName, setThemeName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#4f46e5');
  const [accentColor, setAccentColor] = useState('#06b6d4');
  const [backgroundColor, setBackgroundColor] = useState('#f8fafc');
  const [textColor, setTextColor] = useState('#0f172a');
  const [fontFamily, setFontFamily] = useState('Outfit, sans-serif');
  const [borderRadius, setBorderRadius] = useState(8);
  const [spacingUnit, setSpacingUnit] = useState(16);
  const [isPublic, setIsPublic] = useState(false);
  const [previewTab, setPreviewTab] = useState<'catalog' | 'details' | 'checkout' | 'tracking'>('catalog');

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/themes');
      const allThemes = res.data.data || res.data || [];
      const ownThemes = allThemes.filter((t: Theme) => t.createdByTenantId === tenantId);
      const publicOnly = allThemes.filter((t: Theme) => t.isPublic && t.createdByTenantId !== tenantId);
      setTenantThemes(ownThemes);
      setPublicThemes(publicOnly);
      if (ownThemes.length > 0) {
        const active = ownThemes.find((t: Theme) => t.isActive) || ownThemes[0];
        handleSelectTheme(active);
      } else {
        resetThemeForm();
      }
    } catch (err: any) {
      console.error('Failed to load themes:', err);
      setErrorMsg('Failed to load themes from server.');
    } finally {
      setLoading(false);
    }
  };

  const resetThemeForm = () => {
    setSelectedThemeId(null);
    setThemeName('');
    setPrimaryColor('#6366f1');
    setSecondaryColor('#4f46e5');
    setAccentColor('#06b6d4');
    setBackgroundColor('#f8fafc');
    setTextColor('#0f172a');
    setFontFamily('Outfit, sans-serif');
    setBorderRadius(8);
    setSpacingUnit(16);
    setIsPublic(false);
  };

  const handleSelectTheme = (theme: Theme) => {
    setSelectedThemeId(theme.id);
    setThemeName(theme.name);
    setPrimaryColor(theme.primaryColor);
    setSecondaryColor(theme.secondaryColor);
    setAccentColor(theme.accentColor);
    setBackgroundColor(theme.backgroundColor);
    setTextColor(theme.textColor);
    setFontFamily(theme.fontFamily);
    setBorderRadius(theme.borderRadius);
    setSpacingUnit(theme.spacingUnit);
    setIsPublic(theme.isPublic);
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
      isPublic
    };

    try {
      if (selectedThemeId) {
        await apiClient.put(`/api/v1/themes/${selectedThemeId}`, payload);
        setSuccessMsg('Theme updated successfully!');
      } else {
        const res = await apiClient.post('/api/v1/themes', payload);
        const newTheme = res.data.data || res.data;
        setSelectedThemeId(newTheme.id);
        setSuccessMsg('Theme created successfully!');
      }
      loadThemes();
    } catch (err: any) {
      console.error('Failed to save theme:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save theme.');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (themeId: string) => {
    try {
      await apiClient.post(`/api/v1/themes/${themeId}/activate`);
      setSuccessMsg('Theme activated!');
      loadThemes();
    } catch (err: any) {
      console.error('Failed to activate theme:', err);
      setErrorMsg('Failed to activate theme.');
    }
  };

  const handleToggleVisibility = async (themeId: string, currentlyPublic: boolean) => {
    try {
      const endpoint = currentlyPublic ? `/api/v1/themes/${themeId}/make-private` : `/api/v1/themes/${themeId}/make-public`;
      await apiClient.post(endpoint);
      setSuccessMsg(`Theme is now ${!currentlyPublic ? 'Public' : 'Private'}`);
      loadThemes();
    } catch (err: any) {
      console.error('Failed to toggle visibility:', err);
      setErrorMsg('Failed to change theme visibility.');
    }
  };

  const handleDelete = async (themeId: string) => {
    if (!window.confirm('Delete this theme?')) return;
    try {
      await apiClient.delete(`/api/v1/themes/${themeId}`);
      setSuccessMsg('Theme deleted successfully.');
      if (selectedThemeId === themeId) {
        resetThemeForm();
      }
      loadThemes();
    } catch (err: any) {
      console.error('Failed to delete theme:', err);
      setErrorMsg('Failed to delete theme.');
    }
  };

  const handleCloneTheme = async (theme: Theme) => {
    try {
      const res = await apiClient.post(`/api/v1/themes/${theme.id}/clone`);
      const clonedTheme = res.data.data || res.data;
      setSuccessMsg(`Theme "${clonedTheme.name}" cloned successfully!`);
      loadThemes();
      handleSelectTheme(clonedTheme);
    } catch (err: any) {
      console.error('Failed to clone theme:', err);
      setErrorMsg('Failed to clone theme.');
    }
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="theme" />
      <main className="dashboard-content">
        <div className="content-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem' }}>Theme Management</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Create, customize, and manage themes for your storefront. Share themes publicly for other merchants to clone.</p>
            </div>
            <button className="btn btn-primary" onClick={resetThemeForm}>
              <Plus size={16} /> New Theme
            </button>
          </div>

          {successMsg && (
            <div className="card" style={{ borderLeft: '4px solid var(--accent-color)', padding: '1rem', marginBottom: '1.5rem', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={20} /> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="card" style={{ borderLeft: '4px solid #ef4444', padding: '1rem', marginBottom: '1.5rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ✕ {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="loading-container">
              <Loader2 className="spinner" size={32} />
              <p style={{ marginTop: '1rem' }}>Loading themes...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2.5rem', alignItems: 'start' }}>
              
              {/* LEFT COLUMN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* MY THEMES */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Palette size={20} /> My Themes ({tenantThemes.length})
                  </h2>
                  
                  {tenantThemes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
                      <p>No themes yet. Create your first theme to get started.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                      {tenantThemes.map((theme) => (
                        <ThemeCard
                          key={theme.id}
                          theme={theme}
                          isSelected={selectedThemeId === theme.id}
                          isOwned={true}
                          onSelect={handleSelectTheme}
                          onActivate={handleActivate}
                          onToggleVisibility={handleToggleVisibility}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* PUBLIC BROWSE */}
                {publicThemes.length > 0 && (
                  <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Globe size={20} /> Public Library ({publicThemes.length})
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Browse and clone themes from other merchants.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                      {publicThemes.map((theme) => (
                        <PublicThemeCard key={theme.id} theme={theme} onClone={handleCloneTheme} />
                      ))}
                    </div>
                  </div>
                )}

                {/* FORM */}
                <div className="card" style={{ padding: '2rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                    {selectedThemeId ? 'Edit Theme' : 'Create New Theme'}
                  </h2>
                  <form onSubmit={handleSave}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600 }}>Theme Name *</label>
                        <input type="text" className="form-control" value={themeName} onChange={(e) => setThemeName(e.target.value)} placeholder="e.g., Summer Sale 2026" required />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <ColorInputField label="Primary Color" value={primaryColor} onChange={setPrimaryColor} />
                        <ColorInputField label="Secondary Color" value={secondaryColor} onChange={setSecondaryColor} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <ColorInputField label="Accent Color" value={accentColor} onChange={setAccentColor} />
                        <ColorInputField label="Background Color" value={backgroundColor} onChange={setBackgroundColor} />
                      </div>

                      <ColorInputField label="Text Color" value={textColor} onChange={setTextColor} />

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600 }}>Font Family</label>
                        <select className="form-control" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                          <option value="Outfit, sans-serif">Outfit (Modern Display)</option>
                          <option value="Inter, sans-serif">Inter (Clean Sans-Serif)</option>
                          <option value="Roboto, sans-serif">Roboto (Structured)</option>
                          <option value="Playfair Display, serif">Playfair Display (Premium)</option>
                        </select>
                      </div>

                      <RangeInputField label="Border Radius" value={borderRadius} onChange={setBorderRadius} min={0} max={24} unit="px" />
                      <RangeInputField label="Spacing Unit" value={spacingUnit} onChange={setSpacingUnit} min={8} max={32} unit="px" />

                      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" id="isPublic" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                        <label htmlFor="isPublic" style={{ fontWeight: 600, cursor: 'pointer', margin: 0 }}>Make public for other merchants</label>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
                          {saving ? <Loader2 className="spinner" size={16} /> : <Save size={16} />} 
                          {selectedThemeId ? 'Update & Activate' : 'Create & Activate'}
                        </button>
                        {selectedThemeId && (
                          <button type="button" className="btn btn-secondary" onClick={resetThemeForm}>Clear</button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* RIGHT COLUMN: PREVIEW */}
              <div style={{ position: 'sticky', top: '2rem' }}>
                <div className="card" style={{ padding: '1.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Eye size={18} style={{ color: 'var(--text-secondary)' }} />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Live Preview</h2>
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem', border: '1px solid var(--border-color)', padding: '0.2rem', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', marginBottom: '1.5rem' }}>
                    {['catalog', 'details', 'checkout', 'tracking'].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        style={{
                          border: 'none',
                          background: previewTab === tab ? 'var(--card-bg)' : 'none',
                          color: previewTab === tab ? 'var(--primary-color)' : 'var(--text-secondary)',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.75rem',
                          borderRadius: '6px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                          flex: 1
                        }}
                        onClick={() => setPreviewTab(tab as any)}
                      >
                        {tab === 'details' ? 'Product' : tab}
                      </button>
                    ))}
                  </div>

                  <ThemePreview
                    backgroundColor={backgroundColor}
                    textColor={textColor}
                    fontFamily={fontFamily}
                    borderRadius={borderRadius}
                    spacingUnit={spacingUnit}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                    accentColor={accentColor}
                    tab={previewTab}
                  />
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
