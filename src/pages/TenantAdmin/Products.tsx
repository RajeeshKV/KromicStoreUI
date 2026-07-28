import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './Dashboard';
import apiClient from '../../api/apiClient';
import { Plus, Trash2, Edit, X, ToggleLeft, ToggleRight, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product, Category } from '../Storefront';
import ImageUpload from '../../components/ImageUpload';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  // Form States (Create / Edit modal)
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [reorderLevel, setReorderLevel] = useState(10);
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [productImages, setProductImages] = useState<Array<{url: string, publicId: string, displayOrder: number, isPrimary: boolean}>>([]);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch Categories
      const catRes = await apiClient.get('/api/v1/categories');
      setCategories(catRes.data.data || catRes.data || []);

      // 2. Fetch Products with pagination
      const params: any = {
        pageNumber: pageNumber,
        pageSize: pageSize
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const prodRes = await apiClient.get('/api/v1/products', { params });
      const prodData = prodRes.data.data || prodRes.data || [];
      setProducts(prodData);

      // Store total count if backend provides it
      if (prodRes.data.totalCount) {
        setTotalCount(prodRes.data.totalCount);
      }
    } catch (err: any) {
      console.error('API Products loading failed:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to retrieve products and categories from server.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when pagination changes
  useEffect(() => {
    loadData();
  }, [pageNumber, pageSize, statusFilter]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setPrice(0);
    setStock(0);
    setReorderLevel(10);
    setCategoryId('');
    setDescription('');
    setImageUrl('');
    setProductImages([]);
    setShowFormModal(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setSku(prod.sku || '');
    setPrice(prod.price);
    setStock(prod.stock);
    setCategoryId(prod.categoryId || '');
    setDescription(prod.description || '');
    
    const prodImages = prod.images || [];
    setProductImages(prodImages.map((img, idx) => ({
      url: img.url,
      publicId: img.cloudinaryPublicId || '',
      displayOrder: img.displayOrder || idx,
      isPrimary: img.isPrimary || idx === 0
    })));
    setImageUrl(prod.imageUrl || (prodImages.length > 0 ? prodImages[0].url : ''));
    
    setShowFormModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    const payload = {
      name,
      sku,
      price: Number(price),
      stock: Number(stock),
      reorderLevel: Number(reorderLevel),
      categoryId: categoryId || null,
      description,
      imageUrl: imageUrl || null,
      images: productImages.map(img => ({
        url: img.url,
        cloudinaryPublicId: img.publicId,
        displayOrder: img.displayOrder,
        isPrimary: img.isPrimary,
        altText: `${name} image`
      }))
    };

    try {
      if (editingProduct) {
        await apiClient.put(`/api/v1/products/${editingProduct.id}`, payload);
        setSuccessMsg('Product updated successfully!');
      } else {
        await apiClient.post('/api/v1/products', payload);
        setSuccessMsg('Product created successfully!');
      }
      setShowFormModal(false);
      loadData();
    } catch (err: any) {
      console.error('API save product failed:', err);
      setErrorMsg(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save product details on server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await apiClient.delete(`/api/v1/products/${id}`);
      setSuccessMsg('Product deleted.');
      loadData();
    } catch (err: any) {
      console.error('Failed to delete product:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to delete product from server.');
    }
  };

  const handleTogglePublish = async (prod: Product) => {
    setSuccessMsg('');
    setErrorMsg('');
    const action = prod.status === 'Published' ? 'unpublish' : 'publish';
    
    try {
      if (action === 'publish') {
        await apiClient.post(`/api/v1/products/${prod.id}/publish`, {});
      } else {
        await apiClient.post(`/api/v1/products/${prod.id}/unpublish`, {});
      }
      setSuccessMsg(`Product ${action === 'publish' ? 'published' : 'unpublished'} successfully.`);
      loadData();
    } catch (err: any) {
      console.error('Failed to update product publish status:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to toggle product publishing status on server.');
    }
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="products" />

      <main className="dashboard-content">
        <div className="content-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', marginBottom: '0.25rem' }}>Product Catalog</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Manage pricing, inventory, and publication status for your product listings.</p>
            </div>

            <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}>
              <Plus size={18} /> Add Product
            </button>
          </div>

        {successMsg && (
          <div className="card" style={{ borderLeft: '4px solid var(--accent-color)', padding: '1rem', marginBottom: '1.5rem', backgroundColor: 'rgba(79, 70, 229, 0.05)' }}>
            <p style={{ color: 'var(--accent-color)', fontWeight: 600, margin: 0 }}>{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="card" style={{ borderLeft: '4px solid var(--error-color)', padding: '1rem', marginBottom: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
            <p style={{ color: 'var(--error-color)', fontWeight: 600, margin: 0 }}>{errorMsg}</p>
          </div>
        )}

        {/* Pagination and Filter Controls */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', backgroundColor: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Show:</label>
              <select 
                value={pageSize} 
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageNumber(1);
                }}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer' }}
              >
                <option value={10}>10 items</option>
                <option value={20}>20 items</option>
                <option value={50}>50 items</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter:</label>
              <select 
                value={statusFilter} 
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPageNumber(1);
                }}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer' }}
              >
                <option value="">All Status</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {totalCount > 0 && (
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span>{Math.min(pageSize, products.length)} of {totalCount} products</span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span>Page {pageNumber}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-container card">
            <div className="spinner"></div>
            <p>Fetching merchant product inventory...</p>
          </div>
        ) : (
          <>
            <div className="card">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</th>
                      <th style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SKU</th>
                      <th style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price</th>
                      <th style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stock</th>
                      <th style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                      <th style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          <p style={{ fontSize: '0.95rem' }}>No products found.</p>
                        </td>
                      </tr>
                    ) : (
                      products.map((prod) => {
                        const img = prod.imageUrl || (prod.images && prod.images.length > 0 ? prod.images[0].url : '') || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&auto=format&fit=crop&q=60';
                        return (
                          <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <td style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem' }}>
                              <img src={img} alt={prod.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                              <div>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', fontSize: '0.95rem' }}>{prod.name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {prod.id.substring(0, 8)}...</span>
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem' }}><code style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{prod.sku || 'N/A'}</code></td>
                            <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--accent-color)' }}>${prod.price.toFixed(2)}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span className={`status-pill ${prod.stock > 10 ? 'success' : prod.stock > 0 ? 'warning' : 'danger'}`} style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}>
                                {prod.stock} units
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <span className={`status-pill ${prod.status === 'Published' ? 'info' : 'warning'}`} style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}>
                                {prod.status || 'Draft'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', padding: '0.75rem' }}>
                              <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  onClick={() => handleTogglePublish(prod)}
                                  title={prod.status === 'Published' ? 'Unpublish Product' : 'Publish Product'}
                                >
                                  {prod.status === 'Published' ? <ToggleRight size={16} style={{ color: 'var(--success)' }} /> : <ToggleLeft size={16} />}
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                                  onClick={() => openEditModal(prod)}
                                  title="Edit product"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', color: 'var(--error-color)' }}
                                  onClick={() => handleDeleteProduct(prod.id)}
                                  title="Delete product"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Navigation */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '2rem', padding: '1.5rem' }}>
              <button
                className="btn btn-secondary"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', fontSize: '0.9rem', fontWeight: 600 }}
              >
                <ChevronLeft size={18} /> Previous
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Page</span>
                <input 
                  type="number" 
                  min={1}
                  max={Math.ceil((totalCount || pageSize) / pageSize)}
                  value={pageNumber}
                  onChange={(e) => {
                    const max = Math.ceil((totalCount || pageSize) / pageSize);
                    const newPage = Math.max(1, Math.min(max, Number(e.target.value)));
                    setPageNumber(newPage);
                  }}
                  style={{ width: '50px', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>of {Math.ceil((totalCount || pageSize) / pageSize)}</span>
              </div>
              
              <button
                className="btn btn-secondary"
                disabled={pageNumber * pageSize >= (totalCount || pageSize)}
                onClick={() => setPageNumber(pageNumber + 1)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', fontSize: '0.9rem', fontWeight: 600 }}
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}
        </div>
      </main>

      {/* --- FORM DIALOG MODAL --- */}
      {showFormModal && (
        <div className="modal-backdrop">
          <div className="modal-content card" style={{ maxWidth: '650px', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.35rem' }}>
                {editingProduct ? 'Edit Catalog Product' : 'Add New Product'}
              </h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowFormModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU Code (Unique)</label>
                  <input type="text" className="form-input" value={sku} onChange={(e) => setSku(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Price ($)</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={14} style={{ position: 'absolute', left: 10, top: 15, color: 'var(--text-muted)' }} />
                    <input type="number" step="0.01" className="form-input" value={price} onChange={(e) => setPrice(Number(e.target.value))} style={{ paddingLeft: '2rem', width: '100%' }} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Qty</label>
                  <input type="number" className="form-input" value={stock} onChange={(e) => setStock(Number(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <React.Fragment key={c.id}>
                        <option value={c.id}>{c.name}</option>
                        {c.subcategories && c.subcategories.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            &nbsp;&nbsp;↳ {sub.name}
                          </option>
                        ))}
                      </React.Fragment>
                    ))}
                  </select>
                </div>
              </div>

              <ImageUpload
                value={imageUrl}
                onChange={(url, publicId) => {
                  setImageUrl(url);
                  if (url) {
                    setProductImages([{ url, publicId, displayOrder: 1, isPrimary: true }]);
                  } else {
                    setProductImages([]);
                  }
                }}
                label="Product Image"
                folder="products"
              />

              <div className="form-group">
                <label className="form-label">Product Description</label>
                <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} style={{ minHeight: '80px' }} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }} disabled={submitting}>
                {submitting ? 'Saving changes...' : 'Save Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Mock Fallbacks
function getDemoProducts(): Product[] {
  return [
    {
      id: 'prod-101',
      name: 'Vortex Wireless Headphones',
      price: 199.99,
      sku: 'VTX-WH-09',
      description: 'Premium wireless headphones with active noise cancellation, built-in EQ controls, and up to 40 hours of battery life.',
      categoryId: 'category-audio',
      stock: 35,
      images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60' }],
      status: 'Published',
    },
    {
      id: 'prod-102',
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
      id: 'prod-103',
      name: 'Pixel mechanical keyboard',
      price: 129.99,
      sku: 'PXL-MK-88',
      description: 'Hot-swappable tactile mechanical keyboard featuring customized RGB backlight matrices and robust double-shot keycaps.',
      categoryId: 'category-keyboards',
      stock: 12,
      images: [{ url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60' }],
      status: 'Draft',
    }
  ];
}

export default Products;
export { getDemoProducts };
