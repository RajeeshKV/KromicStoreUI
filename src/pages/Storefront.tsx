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
  images?: Array<{ url: string; alt?: string }>;
  status: string;
}

interface Category {
  id: string;
  name: string;
  productCount: number;
  subcategories?: Category[];
}

const Storefront: React.FC = () => {
  const { storeTenantId } = useParams<{ storeTenantId: string }>();
  const { tenantId, setTenantId } = useAuth();
  const { cartCount, addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [bootstrapData, setBootstrapData] = useState<any>(null);

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
  }, [storeTenantId, setTenantId]);

  useEffect(() => {
    if (resolvingTenant || resolutionError) return;

    const loadBootstrap = async () => {
      try {
        const res = await apiClient.get('/api/v1/store/bootstrap');
        if (res.data) {
          setBootstrapData(res.data);
          if (res.data.theme) {
            const t = res.data.theme;
            if (t.primaryColor) document.documentElement.style.setProperty('--primary-color', t.primaryColor);
            if (t.secondaryColor) document.documentElement.style.setProperty('--secondary-color', t.secondaryColor);
            if (t.accentColor) document.documentElement.style.setProperty('--accent-color', t.accentColor);
          }
          if (res.data.seo?.siteTitle) {
            document.title = res.data.seo.siteTitle;
          }
        }
      } catch (error) {
        console.warn('Bootstrap API failed, using default fallbacks', error);
      }
    };

    loadBootstrap();
  }, [resolvingTenant, resolutionError]);

  const loadStoreData = async () => {
    setLoading(true);
    try {
      // 1. Fetch categories
      const catRes = await apiClient.get('/api/v1/categories');
      setCategories(catRes.data.data || []);

      // 2. Fetch products
      const params: any = { status: 'Published' };
      if (selectedCategory) params.categoryId = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      if (minPrice !== '') params.minPrice = minPrice;
      if (maxPrice !== '') params.maxPrice = maxPrice;

      const prodRes = await apiClient.get('/api/v1/products', { params });
      let prodData = prodRes.data.data || [];

      // If the backend has no products yet for this tenant, load gorgeous demo items
      if (prodData.length === 0 && !selectedCategory && !searchQuery && minPrice === '' && maxPrice === '') {
        prodData = getDemoProducts();
      }

      setProducts(prodData);
    } catch (err: any) {
      console.warn('API error, loading demo storefront fallback products', err);
      // Fallback in case of API sleep or initial empty state
      setProducts(getDemoProducts());
      setCategories(getDemoCategories());
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
      <div className="loading-container card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Resolving storefront context...</p>
      </div>
    );
  }

  if (resolutionError) {
    return (
      <div className="card text-center" style={{ padding: '4rem 2rem', maxWidth: '600px', margin: '4rem auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Store Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem' }}>{resolutionError}</p>
        <button className="btn btn-primary" onClick={() => window.location.href = 'https://kromic.in'}>
          Go to Kromic Home
        </button>
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      {/* Storefront Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {(bootstrapData?.tenant?.logoUrl || localStorage.getItem('storeLogo')) && (
            <img 
              src={bootstrapData?.tenant?.logoUrl || localStorage.getItem('storeLogo') || ''} 
              alt={bootstrapData?.tenant?.name || 'Store Logo'} 
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

// --- MOCK FALLBACK DATA ---
function getDemoProducts(): Product[] {
  return [
    {
      id: 'product-demo-1',
      name: 'Vortex Wireless Headphones',
      price: 199.99,
      description: 'Premium wireless headphones with active noise cancellation, built-in EQ controls, and up to 40 hours of battery life.',
      categoryId: 'category-audio',
      stock: 35,
      images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60' }],
      status: 'Published',
    },
    {
      id: 'product-demo-2',
      name: 'Aero Minimalist Wristwatch',
      price: 145.00,
      description: 'Minimalist quartz watch with top-grain leather straps, surgical grade steel casing, and water-resistance up to 50 meters.',
      categoryId: 'category-watches',
      stock: 4,
      images: [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60' }],
      status: 'Published',
    },
    {
      id: 'product-demo-3',
      name: 'Pixel mechanical keyboard',
      price: 129.99,
      description: 'Hot-swappable tactile mechanical keyboard featuring customized RGB backlight matrices and robust double-shot keycaps.',
      categoryId: 'category-keyboards',
      stock: 12,
      images: [{ url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60' }],
      status: 'Published',
    },
    {
      id: 'product-demo-4',
      name: 'Titanium Travel Mug',
      price: 45.50,
      description: 'Ultra-lightweight vacuum insulated travel flask keeping liquids hot for 12 hours or ice-cold for 24 hours.',
      categoryId: 'category-travel',
      stock: 80,
      images: [{ url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60' }],
      status: 'Published',
    },
  ];
}

function getDemoCategories(): Category[] {
  return [
    {
      id: 'category-audio',
      name: 'Audio',
      productCount: 1,
      subcategories: [{ id: 'category-headphones', name: 'Headphones', productCount: 1 }],
    },
    {
      id: 'category-watches',
      name: 'Timepieces',
      productCount: 1,
    },
    {
      id: 'category-keyboards',
      name: 'Keyboards',
      productCount: 1,
    },
  ];
}

export default Storefront;
export type { Product, Category };
