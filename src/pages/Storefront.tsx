import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import apiClient from '../api/apiClient';
import { Search, SlidersHorizontal, ShoppingBag, Eye, Plus, ShoppingCart, RefreshCw, Mail, Phone } from 'lucide-react';
import { extractSubdomain } from '../utils/subdomain';
import { resolveTenantBySubdomain } from '../api/publicApi';

interface Product {
  id: string;
  name: string;
  price: number;
  sku?: string;
  description?: string;
  categoryId?: string;
  stock: number;
  images?: Array<{
    id?: string;
    url: string;
    cloudinaryPublicId?: string;
    displayOrder?: number;
    isPrimary?: boolean;
    altText?: string;
    alt?: string;
  }>;
  imageUrl?: string;
  status: string;
}

interface Category {
  id: string;
  name: string;
  productCount: number;
  subcategories?: Category[];
}

interface StorefrontProps {
  previewBootstrapData?: any;
}

const Storefront: React.FC<StorefrontProps> = ({ previewBootstrapData }) => {
  const { storeTenantId } = useParams<{ storeTenantId: string }>();
  const { tenantId, setTenantId } = useAuth();
  const { cartCount, addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [bootstrapData, setBootstrapData] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Tenant Resolution States
  const [resolvingTenant, setResolvingTenant] = useState(true);
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  // Link prefix helper
  const linkPrefix = storeTenantId ? `/store/${storeTenantId}` : '';

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');

  useEffect(() => {
    const initializeStorefront = async () => {
      if (previewBootstrapData) {
        setResolvingTenant(false);
        return;
      }
      setResolvingTenant(true);
      setResolutionError(null);
      try {
        // Priority 1: Use tenantId from URL path
        if (storeTenantId) {
          setTenantId(storeTenantId);
          setResolvingTenant(false);
          return;
        }

        // Priority 2: Resolve tenant from subdomain
        const subdomain = extractSubdomain();
        if (subdomain) {
          const tenant = await resolveTenantBySubdomain(subdomain);
          setTenantId(tenant.tenantId);
          setResolvingTenant(false);
          return;
        }

        // Fallback: No tenant context
        setResolutionError('Unable to determine store tenant context. Please check the URL.');
        setResolvingTenant(false);
      } catch (err: any) {
        console.error('Failed to resolve tenant:', err);
        setResolutionError('Store not found. Please check the URL or contact support.');
        setResolvingTenant(false);
      }
    };

    initializeStorefront();
  }, [storeTenantId, setTenantId, previewBootstrapData]);

  useEffect(() => {
    if (resolvingTenant || resolutionError) return;

    const loadBootstrap = async () => {
      if (previewBootstrapData) {
        setBootstrapData(previewBootstrapData);
        if (previewBootstrapData.theme) {
          const t = previewBootstrapData.theme;
          if (t.primaryColor) document.documentElement.style.setProperty('--primary-color', t.primaryColor);
          if (t.secondaryColor) document.documentElement.style.setProperty('--secondary-color', t.secondaryColor);
          if (t.accentColor) document.documentElement.style.setProperty('--accent-color', t.accentColor);
          if (t.backgroundColor) document.documentElement.style.setProperty('--bg-primary', t.backgroundColor);
          if (t.textColor) document.documentElement.style.setProperty('--text-primary', t.textColor);
          if (t.fontFamily) {
            document.documentElement.style.setProperty('--font-display', t.fontFamily);
            document.documentElement.style.setProperty('--font-sans', t.fontFamily);
          }
          if (t.borderRadius !== undefined) document.documentElement.style.setProperty('--radius-sm', `${t.borderRadius}px`);
          if (t.borderRadius !== undefined) document.documentElement.style.setProperty('--radius-md', `${t.borderRadius * 1.5}px`);
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await apiClient.get(`/api/v1/store/bootstrap/${tenantId}`);
        const data = res.data.data || res.data;
        
        if (data) {
          setBootstrapData(data);
          
          // Apply theme colors
          if (data.theme) {
            const t = data.theme;
            if (t.primaryColor) document.documentElement.style.setProperty('--primary-color', t.primaryColor);
            if (t.secondaryColor) document.documentElement.style.setProperty('--secondary-color', t.secondaryColor);
            if (t.accentColor) document.documentElement.style.setProperty('--accent-color', t.accentColor);
            if (t.backgroundColor) document.documentElement.style.setProperty('--bg-primary', t.backgroundColor);
            if (t.textColor) document.documentElement.style.setProperty('--text-primary', t.textColor);
            if (t.fontFamily) {
              document.documentElement.style.setProperty('--font-display', t.fontFamily);
              document.documentElement.style.setProperty('--font-sans', t.fontFamily);
            }
            if (t.borderRadius !== undefined) document.documentElement.style.setProperty('--radius-sm', `${t.borderRadius}px`);
            if (t.borderRadius !== undefined) document.documentElement.style.setProperty('--radius-md', `${t.borderRadius * 1.5}px`);
          }
        }
      } catch (error: any) {
        console.error('Bootstrap API failed:', error);
        setApiError(error.response?.data?.message || error.message || 'Failed to retrieve storefront configuration details from server.');
      } finally {
        setLoading(false);
      }
    };

    loadBootstrap();
  }, [resolvingTenant, resolutionError, previewBootstrapData, tenantId]);

  const loadStoreData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      // 1. Fetch categories
      const catRes = await apiClient.get('/api/v1/categories');
      setCategories(catRes.data.data || catRes.data || []);

      // 2. Fetch products
      const params: any = { status: 'Published' };
      if (selectedCategory) params.categoryId = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      if (minPrice !== '') params.minPrice = minPrice;
      if (maxPrice !== '') params.maxPrice = maxPrice;

      const prodRes = await apiClient.get('/api/v1/products', { params });
      const prodData = prodRes.data.data || prodRes.data || [];
      setProducts(prodData);
    } catch (err: any) {
      console.error('API error fetching storefront data:', err);
      setApiError(err.response?.data?.message || err.message || 'Failed to retrieve storefront catalog items from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!resolvingTenant && !resolutionError) {
      loadStoreData();
    }
  }, [resolvingTenant, resolutionError, storeTenantId, selectedCategory, searchQuery, minPrice, maxPrice]);

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
  };

  if (resolvingTenant) {
    return (
      <div className="content-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '80vh' }}>
        {/* Header Navigation skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
          <div className="skeleton" style={{ width: '130px', height: '32px', borderRadius: 'var(--radius-sm)' }} />
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="skeleton" style={{ width: '80px', height: '20px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton" style={{ width: '80px', height: '20px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton" style={{ width: '80px', height: '20px', borderRadius: 'var(--radius-sm)' }} />
          </div>
          <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
        </div>

        {/* Hero Banner skeleton */}
        <div className="skeleton" style={{ width: '100%', height: '200px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem', gap: '1rem' }}>
          <div style={{ width: '35%', height: '32px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 'var(--radius-sm)' }} />
          <div style={{ width: '55%', height: '18px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)' }} />
        </div>

        {/* Main Grid skeleton */}
        <div className="storefront-layout" style={{ marginTop: '1rem' }}>
          {/* Sidebar filters skeleton */}
          <div className="sidebar-filters" style={{ gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="skeleton" style={{ width: '120px', height: '18px', borderRadius: 'var(--radius-sm)' }} />
              <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: 'var(--radius-sm)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="skeleton" style={{ width: '100px', height: '18px', borderRadius: 'var(--radius-sm)' }} />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton" style={{ width: '100%', height: '32px', borderRadius: 'var(--radius-sm)' }} />
              ))}
            </div>
          </div>

          {/* Products grid skeleton */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="skeleton" style={{ width: '140px', height: '20px', borderRadius: 'var(--radius-sm)' }} />
              <div className="skeleton" style={{ width: '100px', height: '36px', borderRadius: 'var(--radius-sm)' }} />
            </div>

            <div className="products-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                  <div className="skeleton" style={{ width: '100%', height: '180px', borderTopLeftRadius: 'var(--radius-md)', borderTopRightRadius: 'var(--radius-md)' }} />
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="skeleton" style={{ width: '80%', height: '20px', borderRadius: 'var(--radius-sm)' }} />
                    <div className="skeleton" style={{ width: '45%', height: '16px', borderRadius: 'var(--radius-sm)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      <div className="skeleton" style={{ width: '60px', height: '22px', borderRadius: 'var(--radius-sm)' }} />
                      <div className="skeleton" style={{ width: '80px', height: '32px', borderRadius: 'var(--radius-sm)' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (resolutionError) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '75vh',
        padding: '2rem',
        background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.04), transparent 40%), radial-gradient(circle at bottom left, rgba(6, 182, 212, 0.04), transparent 40%)'
      }}>
        <div className="card text-center" style={{
          padding: '4rem 3rem',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.06)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Neon Top Accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color))'
          }} />

          {/* Icon Circle */}
          <div style={{
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.25rem',
            border: '1px solid rgba(239, 68, 68, 0.12)'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
              <path d="m3 9 2.44-4.88A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.12L21 9" />
              <path d="M12 3v6" />
              <path d="m2 2 20 20" />
            </svg>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.65rem',
            margin: 0,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)'
          }}>
            Store Not Found
          </h2>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            margin: '0 0 0.5rem 0'
          }}>
            {resolutionError}
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            width: '100%',
            marginTop: '0.25rem'
          }}>
            <button
              className="btn btn-primary"
              onClick={() => window.location.href = 'https://store.kromic.in'}
              style={{
                width: '100%',
                padding: '0.75rem',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              Go to Kromic Hub
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => window.location.reload()}
              style={{
                width: '100%',
                padding: '0.75rem',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              Reload Page
            </button>
          </div>

          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: '0.5rem',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1rem',
            width: '100%'
          }}>
            Want to setup your own store? <a href="https://store.kromic.in/start" style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>Get Started →</a>
          </div>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="card text-center" style={{ padding: '4rem 2rem', maxWidth: '600px', margin: '4rem auto', borderLeft: '4px solid var(--error-color)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--error-color)' }}>Server Connection Error</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem' }}>{apiError}</p>
        <button className="btn btn-primary" onClick={loadStoreData} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}>
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      {/* Storefront Header */}
      <div style={{
        zIndex: 100,
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '2px solid var(--primary-color)',
        padding: '1rem 2rem',
        marginLeft: '-2rem',
        marginRight: '-2rem',
        marginTop: '-2rem',
        marginBottom: '2.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {loading ? (
            <>
              <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '6px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div className="skeleton" style={{ width: '120px', height: '18px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ width: '150px', height: '12px', borderRadius: '4px' }} />
              </div>
            </>
          ) : (
            <>
              {bootstrapData?.storefront?.logoUrl && (
                <img
                  src={bootstrapData.storefront.logoUrl}
                  alt={bootstrapData.storefront.name || 'Store Logo'}
                  style={{ height: '48px', width: 'auto', maxWidth: '100px', objectFit: 'contain', borderRadius: '6px' }}
                />
              )}
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>{bootstrapData?.storefront?.name || 'Storefront Catalog'}</h1>
                {storeTenantId && (
                  <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.75rem' }}>Merchant ID: <code style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.15rem 0.35rem', borderRadius: '3px', fontFamily: 'monospace', fontSize: '0.7rem' }}>{storeTenantId}</code></p>
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-icon" onClick={loadStoreData} title="Refresh storefront" disabled={loading}>
            <RefreshCw size={18} />
          </button>

          <Link to={`${linkPrefix}/checkout`} className="btn btn-primary cart-indicator">
            <ShoppingCart size={18} />
            View Cart
            {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
          </Link>
        </div>
      </div>

      <div className="storefront-layout">
        {/* Sidebar Filters */}
        <aside className="sidebar-filters card">
          <div>
            <h3 className="filter-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SlidersHorizontal size={16} /> Filters
            </h3>
            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.75rem 0 1.25rem' }}></div>
          </div>

          {/* Search bar */}
          <div className="form-group">
            <label className="form-label">Search catalog</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem', width: '100%' }}
              />
            </div>
          </div>

          {/* Category Tree list */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Categories</label>
            <ul className="category-list">
              <li>
                <button
                  className={`category-item-btn ${selectedCategory === null ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(null)}
                >
                  <span>All Categories</span>
                </button>
              </li>
              {categories.map((cat) => (
                <React.Fragment key={cat.id}>
                  <li>
                    <button
                      className={`category-item-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      <span>{cat.name}</span>
                      <span className="category-count">{cat.productCount || 0}</span>
                    </button>
                  </li>
                  {/* Nested Subcategories */}
                  {cat.subcategories && cat.subcategories.map((sub) => (
                    <li key={sub.id} style={{ paddingLeft: '1.25rem' }}>
                      <button
                        className={`category-item-btn ${selectedCategory === sub.id ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(sub.id)}
                        style={{ fontSize: '0.85rem' }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>↳ {sub.name}</span>
                        <span className="category-count" style={{ fontSize: '0.7rem' }}>{sub.productCount || 0}</span>
                      </button>
                    </li>
                  ))}
                </React.Fragment>
              ))}
            </ul>
          </div>

          {/* Price Filters */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Price range</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number"
                className="form-input"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                style={{ width: '100%', padding: '0.5rem' }}
              />
              <span style={{ color: 'var(--text-muted)' }}>-</span>
              <input
                type="number"
                className="form-input"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
          </div>

          <button className="btn btn-secondary" onClick={handleClearFilters} style={{ width: '100%', marginTop: '0.5rem' }}>
            Clear Filters
          </button>
        </aside>

        {/* Product Catalog Grid */}
        <main>
          {loading ? (
            <div className="loading-container card">
              <div className="spinner"></div>
              <p>Fetching storefront products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="card text-center" style={{ padding: '4rem 2rem' }}>
              <ShoppingBag size={48} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }} />
              <h3>No products found</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                There are no matching items published in this store right now.
              </p>
              <button className="btn btn-primary" onClick={handleClearFilters} style={{ marginTop: '1.5rem' }}>
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((prod) => {
                const mainImg = prod.images && prod.images.length > 0
                  ? prod.images[0].url
                  : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';

                return (
                  <div className="card product-card" key={prod.id}>
                    <div className="product-img-wrapper">
                      <img src={mainImg} alt={prod.name} loading="lazy" />
                      {prod.stock <= 5 && (
                        <span className="product-badge" style={{ backgroundColor: 'var(--danger)' }}>
                          Only {prod.stock} left
                        </span>
                      )}
                    </div>
                    <div className="product-card-body">
                      <h3 className="product-title">{prod.name}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {prod.description || 'No description provided.'}
                      </p>
                      <p className="product-stock">Stock: {prod.stock} items</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <span className="product-price">${prod.price.toFixed(2)}</span>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <Link to={`${linkPrefix}/product/${prod.id}`} className="btn btn-secondary" style={{ padding: '0.45rem' }} title="View details">
                            <Eye size={16} />
                          </Link>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.45rem' }}
                            title="Add to cart"
                            disabled={prod.stock <= 0}
                            onClick={() => addToCart({
                              id: prod.id,
                              name: prod.name,
                              price: prod.price,
                              image: mainImg,
                              stock: prod.stock
                            }, 1)}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer style={{
        marginTop: '4rem',
        paddingTop: '3rem',
        paddingBottom: '2rem',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '2rem', paddingRight: '2rem' }}>
          {/* Footer Main Content */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '2rem' }}>
            {/* Left: Store Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                {bootstrapData?.storefront?.logoUrl && (
                  <img
                    src={bootstrapData.storefront.logoUrl}
                    alt={bootstrapData?.storefront?.name || 'Store Logo'}
                    style={{ height: '40px', width: 'auto', maxWidth: '80px', objectFit: 'contain', flexShrink: 0 }}
                  />
                )}
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--text-primary)', margin: 0 }}>
                    {bootstrapData?.storefront?.name || 'Store'}
                  </h3>
                  {bootstrapData?.storefront?.address && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                      {bootstrapData.storefront.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Contact + Social Icons + Copyright */}
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end' }}>
                {/* Contact + Social Icons */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {bootstrapData?.storefront?.contactEmail && (
                    <a
                      href={`mailto:${bootstrapData.storefront.contactEmail}`}
                      title={bootstrapData.storefront.contactEmail}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--primary-color)', textDecoration: 'none', transition: 'all 0.2s ease' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--primary-color)';
                        (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--bg-primary)';
                        (e.currentTarget as HTMLAnchorElement).style.color = 'var(--primary-color)';
                      }}
                    >
                      <Mail size={18} />
                    </a>
                  )}
                  {bootstrapData?.storefront?.contactPhone && (
                    <a
                      href={`tel:${bootstrapData.storefront.contactPhone}`}
                      title={bootstrapData.storefront.contactPhone}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--primary-color)', textDecoration: 'none', transition: 'all 0.2s ease' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--primary-color)';
                        (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--bg-primary)';
                        (e.currentTarget as HTMLAnchorElement).style.color = 'var(--primary-color)';
                      }}
                    >
                      <Phone size={18} />
                    </a>
                  )}
                {bootstrapData?.storefront?.facebookUrl && (
                  <a
                    href={bootstrapData.storefront.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Facebook"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--primary-color)', textDecoration: 'none', transition: 'all 0.2s ease' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--primary-color)';
                      (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--bg-primary)';
                      (e.currentTarget as HTMLAnchorElement).style.color = 'var(--primary-color)';
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {bootstrapData?.storefront?.twitterUrl && (
                  <a
                    href={bootstrapData.storefront.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Twitter / X"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--primary-color)', textDecoration: 'none', transition: 'all 0.2s ease' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--primary-color)';
                      (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--bg-primary)';
                      (e.currentTarget as HTMLAnchorElement).style.color = 'var(--primary-color)';
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.514l-5.106-6.694-5.854 6.694h-3.308l7.73-8.835L.424 2.25h6.679l4.882 6.479 5.259-6.479zM17.002 20.331h1.834L6.822 4.169H4.881l12.121 16.162z"/>
                    </svg>
                  </a>
                )}
                {bootstrapData?.storefront?.instagramUrl && (
                  <a
                    href={bootstrapData.storefront.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Instagram"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--primary-color)', textDecoration: 'none', transition: 'all 0.2s ease' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--primary-color)';
                      (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--bg-primary)';
                      (e.currentTarget as HTMLAnchorElement).style.color = 'var(--primary-color)';
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.441 7.313c.05.799.05 2.541.05 3.688 0 3.783-2.881 6.664-6.663 6.664-1.325 0-2.557-.357-3.611-1.029l-.734.734h-1.582V7.627h1.582l.734.734c1.054-.672 2.286-1.029 3.611-1.029 3.782 0 6.663 2.881 6.663 6.663v.318zm-1.908-2.068c-.984 0-1.867.373-2.53 1.036l1.511 1.511c.413-.154.863-.242 1.325-.242 1.908 0 3.48 1.572 3.48 3.48s-1.572 3.48-3.48 3.48c-1.908 0-3.48-1.572-3.48-3.48 0-.462.088-.912.242-1.325l-1.511-1.511c-.663.663-1.036 1.546-1.036 2.53 0 3.197 2.588 5.786 5.786 5.786s5.786-2.588 5.786-5.786-2.588-5.785-5.786-5.785z"/>
                    </svg>
                  </a>
                )}
                {bootstrapData?.storefront?.linkedInUrl && (
                  <a
                    href={bootstrapData.storefront.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="LinkedIn"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--primary-color)', textDecoration: 'none', transition: 'all 0.2s ease' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--primary-color)';
                      (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--bg-primary)';
                      (e.currentTarget as HTMLAnchorElement).style.color = 'var(--primary-color)';
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.731-2.004 1.438-.103.25-.129.599-.129.948v5.419h-3.554s.05-8.746 0-9.637h3.554v1.364c.429-.658 1.196-1.594 2.905-1.594 2.12 0 3.708 1.388 3.708 4.368v5.499zM5.337 9.432c-1.144 0-1.915-.759-1.915-1.71 0-.956.771-1.71 1.954-1.71 1.18 0 1.913.754 1.937 1.71 0 .951-.757 1.71-1.976 1.71zm1.581 11.02H3.715V9.815h3.203v10.637zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}
              </div>

              {/* Copyright */}
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                margin: 0,
                textAlign: 'right'
              }}>
                {bootstrapData?.storefront?.copyright || `© ${new Date().getFullYear()} Store. All rights reserved.`}
              </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Storefront;
export type { Product, Category };
