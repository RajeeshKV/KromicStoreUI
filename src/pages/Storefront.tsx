import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import apiClient from '../api/apiClient';
import { Search, SlidersHorizontal, ShoppingBag, Eye, Plus, ShoppingCart, RefreshCw } from 'lucide-react';
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
        if (previewBootstrapData.seo?.siteTitle) {
          document.title = previewBootstrapData.seo.siteTitle;
        }
        return;
      }

      try {
        const res = await apiClient.get('/api/v1/store/bootstrap');
        if (res.data) {
          setBootstrapData(res.data);
          if (res.data.theme) {
            const t = res.data.theme;
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
          if (res.data.seo?.siteTitle) {
            document.title = res.data.seo.siteTitle;
          }
        }
      } catch (error: any) {
        console.error('Bootstrap API failed:', error);
        setApiError(error.response?.data?.message || error.message || 'Failed to retrieve storefront configuration details from server.');
      }
    };

    loadBootstrap();
  }, [resolvingTenant, resolutionError, previewBootstrapData]);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {bootstrapData?.tenant?.logoUrl && (
            <img
              src={bootstrapData.tenant.logoUrl}
              alt={bootstrapData.tenant.name || 'Store Logo'}
              style={{ height: '60px', maxHeight: '60px', maxWidth: '120px', objectFit: 'contain', borderRadius: '8px', padding: '0.25rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            />
          )}
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.25rem' }}>{bootstrapData?.tenant?.name || 'Storefront Catalog'}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Merchant ID: <code style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{storeTenantId || tenantId}</code></p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-icon" onClick={loadStoreData} title="Refresh storefront">
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
    </div>
  );
};

export default Storefront;
export type { Product, Category };
