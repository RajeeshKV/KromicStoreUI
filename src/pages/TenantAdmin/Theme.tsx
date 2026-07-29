import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { Palette, Save, Loader2, Eye, Globe, Lock, Trash2, Copy, Plus, X, Edit2 } from 'lucide-react';
import { AdminSidebar } from './Dashboard';
import { ToastContainer, useToast } from '../../components/Toast';

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

// Color Input Component
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

// Theme Grid Card Component
interface ThemeGridCardProps {
  theme: Theme;
  isOwned: boolean;
  onEdit?: (theme: Theme) => void;
  onActivate?: (id: string) => void;
  onToggleVisibility?: (id: string, isPublic: boolean) => void;
  onDelete?: (id: string) => void;
  onClone?: (theme: Theme) => void;
}

const ThemeGridCard: React.FC<ThemeGridCardProps> = ({
  theme,
  isOwned,
  onEdit,
  onActivate,
  onToggleVisibility,
  onDelete,
  onClone
}) => {
  return (
    <div
      style={{
        padding: '1.25rem',
        border: theme.isActive ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
        borderRadius: '12px',
        backgroundColor: theme.isActive ? 'rgba(99, 102, 241, 0.05)' : 'var(--card-bg)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (!theme.isActive) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Active Badge */}
      {theme.isActive && (
        <div style={{
          position: 'absolute',
          top: '0.75rem',
          right: '0.75rem',
          backgroundColor: 'var(--primary-color)',
          color: '#ffffff',
          padding: '0.35rem 0.75rem',
          borderRadius: '20px',
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Active
        </div>
      )}

      {/* Color Palette */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: theme.primaryColor, border: '1px solid rgba(0,0,0,0.1)' }} />
        <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: theme.secondaryColor, border: '1px solid rgba(0,0,0,0.1)' }} />
        <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: theme.accentColor, border: '1px solid rgba(0,0,0,0.1)' }} />
        <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: theme.backgroundColor, border: '1px solid var(--border-color)' }} />
      </div>

      {/* Name and Badges */}
      <div>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{theme.name}</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {theme.isPublic && (
            <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Globe size={10} /> Public
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', flexWrap: 'wrap' }}>
        {isOwned ? (
          <>
            {!theme.isActive && (
              <button
                onClick={() => onActivate?.(theme.id)}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', flex: 1, minWidth: '60px' }}
                title="Activate"
              >
                Activate
              </button>
            )}
            <button
              onClick={() => onEdit?.(theme)}
              className="btn btn-secondary btn-icon"
              style={{ padding: '0.35rem 0.6rem' }}
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onToggleVisibility?.(theme.id, theme.isPublic)}
              className="btn btn-secondary btn-icon"
              style={{ padding: '0.35rem 0.6rem' }}
              title={theme.isPublic ? 'Make Private' : 'Make Public'}
            >
              {theme.isPublic ? <Lock size={14} /> : <Globe size={14} />}
            </button>
            <button
              onClick={() => onDelete?.(theme.id)}
              className="btn btn-secondary btn-icon"
              style={{ padding: '0.35rem 0.6rem', color: '#ef4444' }}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </>
        ) : (
          <button
            onClick={() => onClone?.(theme)}
            className="btn btn-primary"
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
          >
            <Copy size={14} /> Clone
          </button>
        )}
      </div>
    </div>
  );
};

// Theme Editor Modal Component
interface ThemeEditorModalProps {
  theme?: Theme;
  themeName: string;
  setThemeName: (v: string) => void;
  primaryColor: string;
  setPrimaryColor: (v: string) => void;
  secondaryColor: string;
  setSecondaryColor: (v: string) => void;
  accentColor: string;
  setAccentColor: (v: string) => void;
  backgroundColor: string;
  setBackgroundColor: (v: string) => void;
  textColor: string;
  setTextColor: (v: string) => void;
  fontFamily: string;
  setFontFamily: (v: string) => void;
  borderRadius: number;
  setBorderRadius: (v: number) => void;
  spacingUnit: number;
  setSpacingUnit: (v: number) => void;
  isPublic: boolean;
  setIsPublic: (v: boolean) => void;
  previewTab: 'catalog' | 'details' | 'checkout' | 'tracking';
  setPreviewTab: (v: any) => void;
  saving: boolean;
  isEditMode: boolean;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

const ThemeEditorModal: React.FC<ThemeEditorModalProps> = ({
  themeName,
  setThemeName,
  primaryColor,
  setPrimaryColor,
  secondaryColor,
  setSecondaryColor,
  accentColor,
  setAccentColor,
  backgroundColor,
  setBackgroundColor,
  textColor,
  setTextColor,
  fontFamily,
  setFontFamily,
  borderRadius,
  setBorderRadius,
  spacingUnit,
  setSpacingUnit,
  isPublic,
  setIsPublic,
  previewTab,
  setPreviewTab,
  saving,
  isEditMode,
  onSave,
  onClose
}) => {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--card-bg)',
        borderRadius: '12px',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 0
      }}>
        
        {/* Left: Form */}
        <div style={{ padding: '2rem', borderRight: '1px solid var(--border-color)', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {isEditMode ? 'Edit Theme' : 'Create New Theme'}
            </h2>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '1.5rem', color: 'var(--text-secondary)' }}
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Theme Name *</label>
              <input
                type="text"
                className="form-control"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                placeholder="e.g., Summer Sale 2026"
                required
              />
            </div>

            <ColorInputField label="Primary Color" value={primaryColor} onChange={setPrimaryColor} />
            <ColorInputField label="Secondary Color" value={secondaryColor} onChange={setSecondaryColor} />
            <ColorInputField label="Accent Color" value={accentColor} onChange={setAccentColor} />
            <ColorInputField label="Background Color" value={backgroundColor} onChange={setBackgroundColor} />
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
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <label htmlFor="isPublic" style={{ fontWeight: 600, cursor: 'pointer', margin: 0 }}>
                Make public for other merchants
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {saving ? <Loader2 className="spinner" size={16} /> : <Save size={16} />}
                {isEditMode ? 'Update & Activate' : 'Create & Activate'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Right: Preview */}
        <div style={{ padding: '2rem', backgroundColor: 'var(--bg-secondary)', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Eye size={18} /> Live Preview
          </h3>

          <div style={{ display: 'flex', gap: '0.25rem', border: '1px solid var(--border-color)', padding: '0.2rem', borderRadius: '8px', backgroundColor: 'var(--card-bg)', marginBottom: '1.5rem' }}>
            {['catalog', 'details', 'checkout', 'tracking'].map((tab) => (
              <button
                key={tab}
                type="button"
                style={{
                  border: 'none',
                  background: previewTab === tab ? 'var(--primary-color)' : 'transparent',
                  color: previewTab === tab ? '#ffffff' : 'var(--text-secondary)',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  flex: 1,
                  transition: 'all 0.2s ease'
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
  );
};

const Theme: React.FC = () => {
  const { toasts, removeToast, success, error } = useToast();
  const [tenantThemes, setTenantThemes] = useState<Theme[]>([]);
  const [publicThemes, setPublicThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  
  // Form state
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
      const privateRes = await apiClient.get('/api/v1/themes/private');
      const ownThemes = privateRes.data.data || privateRes.data || [];

      const publicRes = await apiClient.get('/api/v1/themes/public');
      const publicOnly = publicRes.data.data || publicRes.data || [];

      setTenantThemes(ownThemes);
      setPublicThemes(publicOnly);
    } catch (err: any) {
      console.error('Failed to load themes:', err);
      error('Failed to load themes from server.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingThemeId(null);
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
    setPreviewTab('catalog');
  };

  const openNewThemeModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditThemeModal = (theme: Theme) => {
    setEditingThemeId(theme.id);
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
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

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
      if (editingThemeId) {
        await apiClient.put(`/api/v1/themes/${editingThemeId}`, payload);
        success('Theme updated successfully!');
      } else {
        await apiClient.post('/api/v1/themes', payload);
        success('Theme created successfully!');
      }
      setShowModal(false);
      loadThemes();
    } catch (err: any) {
      console.error('Failed to save theme:', err);
      const errorMsg = err.response?.data?.message || 'Failed to save theme.';
      error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (themeId: string) => {
    try {
      await apiClient.post(`/api/v1/themes/${themeId}/activate`);
      success('Theme activated!');
      loadThemes();
    } catch (err: any) {
      console.error('Failed to activate theme:', err);
      error('Failed to activate theme.');
    }
  };

  const handleToggleVisibility = async (themeId: string, currentlyPublic: boolean) => {
    try {
      const endpoint = currentlyPublic ? `/api/v1/themes/${themeId}/make-private` : `/api/v1/themes/${themeId}/make-public`;
      await apiClient.post(endpoint);
      success(`Theme is now ${!currentlyPublic ? 'Public' : 'Private'}`);
      loadThemes();
    } catch (err: any) {
      console.error('Failed to toggle visibility:', err);
      error('Failed to change theme visibility.');
    }
  };

  const handleDelete = async (themeId: string) => {
    if (!window.confirm('Delete this theme?')) return;
    try {
      await apiClient.delete(`/api/v1/themes/${themeId}`);
      success('Theme deleted successfully.');
      loadThemes();
    } catch (err: any) {
      console.error('Failed to delete theme:', err);
      error('Failed to delete theme.');
    }
  };

  const handleCloneTheme = async (theme: Theme) => {
    try {
      const res = await apiClient.post(`/api/v1/themes/${theme.id}/clone`);
      const clonedTheme = res.data.data || res.data;
      success(`Theme "${clonedTheme.name}" cloned successfully!`);
      openEditThemeModal(clonedTheme);
      loadThemes();
    } catch (err: any) {
      console.error('Failed to clone theme:', err);
      error('Failed to clone theme.');
    }
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="theme" />
      <main className="dashboard-content">
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <div className="content-wrapper">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem' }}>Theme Management</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Create, customize, and manage themes for your storefront. Share themes publicly for other merchants to clone.</p>
            </div>
            <button className="btn btn-primary" onClick={openNewThemeModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> New Theme
            </button>
          </div>

          {loading ? (
            <div className="loading-container">
              <Loader2 className="spinner" size={32} />
              <p style={{ marginTop: '1rem' }}>Loading themes...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
              
              {/* LEFT COLUMN: My Themes */}
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Palette size={22} /> My Themes ({tenantThemes.length})
                </h2>
                
                {tenantThemes.length === 0 ? (
                  <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Palette size={40} style={{ opacity: 0.3, marginBottom: '1rem', margin: '0 auto 1rem' }} />
                    <p>No themes yet. Create your first theme to get started.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {tenantThemes.map((theme) => (
                      <ThemeGridCard
                        key={theme.id}
                        theme={theme}
                        isOwned={true}
                        onEdit={openEditThemeModal}
                        onActivate={handleActivate}
                        onToggleVisibility={handleToggleVisibility}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Public Themes */}
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Globe size={22} /> Public Library ({publicThemes.length})
                </h2>
                
                {publicThemes.length === 0 ? (
                  <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Globe size={40} style={{ opacity: 0.3, marginBottom: '1rem', margin: '0 auto 1rem' }} />
                    <p>No public themes available. Check back later!</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {publicThemes.map((theme) => (
                      <ThemeGridCard
                        key={theme.id}
                        theme={theme}
                        isOwned={false}
                        onClone={handleCloneTheme}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Theme Editor Modal */}
          {showModal && (
            <ThemeEditorModal
              theme={editingThemeId ? tenantThemes.find(t => t.id === editingThemeId) : undefined}
              themeName={themeName}
              setThemeName={setThemeName}
              primaryColor={primaryColor}
              setPrimaryColor={setPrimaryColor}
              secondaryColor={secondaryColor}
              setSecondaryColor={setSecondaryColor}
              accentColor={accentColor}
              setAccentColor={setAccentColor}
              backgroundColor={backgroundColor}
              setBackgroundColor={setBackgroundColor}
              textColor={textColor}
              setTextColor={setTextColor}
              fontFamily={fontFamily}
              setFontFamily={setFontFamily}
              borderRadius={borderRadius}
              setBorderRadius={setBorderRadius}
              spacingUnit={spacingUnit}
              setSpacingUnit={setSpacingUnit}
              isPublic={isPublic}
              setIsPublic={setIsPublic}
              previewTab={previewTab}
              setPreviewTab={setPreviewTab}
              saving={saving}
              isEditMode={!!editingThemeId}
              onSave={handleSave}
              onClose={() => { setShowModal(false); resetForm(); }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Theme;
