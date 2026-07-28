import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, ShoppingCart, ShoppingBag, Plus, Minus, ShieldCheck, Truck } from 'lucide-react';
import type { Product } from './Storefront';

const ProductDetails: React.FC = () => {
  const { storeTenantId, productId } = useParams<{ storeTenantId: string; productId: string }>();
  const { setTenantId } = useAuth();
  const { addToCart, cartCount } = useCart();
  const navigate = useNavigate();
  const linkPrefix = storeTenantId ? `/store/${storeTenantId}` : '';

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    if (storeTenantId) {
      setTenantId(storeTenantId);
    }
  }, [storeTenantId, setTenantId]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        if (productId?.startsWith('product-demo-')) {
          const demos = getDemoProducts();
          const found = demos.find((d) => d.id === productId) || null;
          setProduct(found);
          if (found && found.images && found.images.length > 0) {
            setActiveImage(found.images[0].url);
          }
        } else {
          const res = await apiClient.get(`/api/v1/products/${productId}`);
          const data = res.data.data;
          setProduct(data);
          if (data && data.images && data.images.length > 0) {
            setActiveImage(data.images[0].url);
          } else {
            setActiveImage('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60');
          }
        }
      } catch (error) {
        console.warn('API error fetching product details. Searching mock database.', error);
        const demos = getDemoProducts();
        const found = demos.find((d) => d.id === productId) || null;
        setProduct(found);
        if (found && found.images && found.images.length > 0) {
          setActiveImage(found.images[0].url);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  const handleQuantityChange = (val: number) => {
    if (!product) return;
    const nextVal = quantity + val;
    setQuantity(Math.max(1, Math.min(nextVal, product.stock)));
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: activeImage,
      stock: product.stock
    }, quantity);
    
    // Quick notification redirect
    navigate(linkPrefix || '/');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="content-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="card text-center" style={{ maxWidth: '480px', padding: '3rem' }}>
          <ShoppingBag size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>Product Not Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            The product you are trying to view does not exist in this tenant's inventory.
          </p>
          <Link to={linkPrefix || '/'} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            <ArrowLeft size={16} /> Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link to={linkPrefix || '/'} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={16} /> Back to Catalog
        </Link>

        <Link to={`${linkPrefix}/checkout`} className="btn btn-primary cart-indicator">
          <ShoppingCart size={18} /> View Cart
          {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
        </Link>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'row', gap: '3rem', flexWrap: 'wrap', padding: '3rem' }}>
        {/* Left Side: Images View */}
        <div style={{ flex: '1.2', minWidth: '300px' }}>
          <div style={{ width: '100%', aspectRatio: '1.1', overflow: 'hidden', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
            <img src={activeImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Sub Images thumbnails list */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(img.url)}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: activeImage === img.url ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    background: 'none',
                    padding: 0
                  }}
                >
                  <img src={img.url} alt={img.alt || product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Metadata and Add to Cart */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.25rem', marginBottom: '0.25rem' }}>
              {product.name}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              SKU: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{product.sku || 'N/A'}</span>
            </p>
          </div>

          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
            ${product.price.toFixed(2)}
          </div>

          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {product.description || 'No description available for this product.'}
          </p>

          <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }}></div>

          {/* Stock and Purchase controls */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="form-label">Availability</span>
              {product.stock > 0 ? (
                <span className="status-pill success">{product.stock} In Stock</span>
              ) : (
                <span className="status-pill danger">Out of Stock</span>
              )}
            </div>

            {product.stock > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', padding: '0.25rem' }}>
                  <button className="btn btn-secondary btn-icon" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} style={{ borderRadius: '4px', padding: '0.35rem' }}>
                    <Minus size={14} />
                  </button>
                  <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 700, fontSize: '1rem' }}>{quantity}</span>
                  <button className="btn btn-secondary btn-icon" onClick={() => handleQuantityChange(1)} disabled={quantity >= product.stock} style={{ borderRadius: '4px', padding: '0.35rem' }}>
                    <Plus size={14} />
                  </button>
                </div>

                <button className="btn btn-primary" onClick={handleAddToCart} style={{ flex: 1 }}>
                  <ShoppingCart size={18} /> Add {quantity} to Cart
                </button>
              </div>
            )}
          </div>

          {/* Logistics Trust */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem', backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <Truck size={18} className="text-primary" style={{ color: 'var(--accent-primary)' }} />
              <span><strong>Free Delivery</strong> on orders over $50.</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={18} className="text-secondary" style={{ color: 'var(--accent-secondary)' }} />
              <span><strong>Authentic Product Guarantee</strong> direct from tenant warehouse.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock Fallbacks
function getDemoProducts(): Product[] {
  return [
    {
      id: 'product-demo-1',
      name: 'Vortex Wireless Headphones',
      price: 199.99,
      sku: 'VTX-WH-09',
      description: 'Premium wireless headphones with active noise cancellation, built-in EQ controls, and up to 40 hours of battery life.',
      categoryId: 'category-audio',
      stock: 35,
      images: [
        { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60' },
        { url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&auto=format&fit=crop&q=60' }
      ],
      status: 'Published',
    },
    {
      id: 'product-demo-2',
      name: 'Aero Minimalist Wristwatch',
      price: 145.00,
      sku: 'AER-MW-22',
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
      sku: 'PXL-MK-88',
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
      sku: 'TTM-TM-01',
      description: 'Ultra-lightweight vacuum insulated travel flask keeping liquids hot for 12 hours or ice-cold for 24 hours.',
      categoryId: 'category-travel',
      stock: 80,
      images: [{ url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60' }],
      status: 'Published',
    },
  ];
}

export default ProductDetails;
