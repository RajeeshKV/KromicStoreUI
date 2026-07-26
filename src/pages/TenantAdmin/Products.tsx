import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './Dashboard';
import apiClient from '../../api/apiClient';
import { Plus, Trash2, Edit, X, ToggleLeft, ToggleRight, DollarSign } from 'lucide-react';
import type { Product, Category } from '../Storefront';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Categories
      const catRes = await apiClient.get('/api/v1/categories');
      setCategories(catRes.data.data || []);

      // 2. Fetch Products
      const prodRes = await apiClient.get('/api/v1/products');
      let prodData = prodRes.data.data || [];

      if (prodData.length === 0) {
        // Fallback mock items
        const saved = localStorage.getItem('mockProducts');
        if (saved) {
          prodData = JSON.parse(saved);
        } else {
          prodData = getDemoProducts();
          localStorage.setItem('mockProducts', JSON.stringify(prodData));
        }
      }
      setProducts(prodData);
    } catch (err: any) {
      console.warn('API Products failed. Invoking local database fallback.');
      const saved = localStorage.getItem('mockProducts');
      if (saved) {
        setProducts(JSON.parse(saved));
      } else {
        const demoProds = getDemoProducts();
        localStorage.setItem('mockProducts', JSON.stringify(demoProds));
        setProducts(demoProds);
      }

      // Try local categories
      const catSaved = localStorage.getItem('mockCategories');
      if (catSaved) setCategories(JSON.parse(catSaved));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setPrice(0);
    setStock(0);
    setReorderLevel(10);
    setCategoryId(categories.length > 0 ? categories[0].id : '');
    setDescription('');
    setImageUrl('');
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
    setImageUrl(prod.images && prod.images.length > 0 ? prod.images[0].url : '');
    setShowFormModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');

    const payload = {
      name,
      sku,
      price: Number(price),
      stock: Number(stock),
      reorderLevel: Number(reorderLevel),
      categoryId: categoryId || null,
      description,
      images: imageUrl ? [{ url: imageUrl, displayOrder: 1 }] : [],
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
      console.warn('API save product failed. Saving in localStorage.');
      const generatedId = editingProduct ? editingProduct.id : `product-mock-${Math.random().toString(36).substr(2, 9)}`;
      
      const newProd: Product = {
        id: generatedId,
        name,
        sku,
        price: Number(price),
        stock: Number(stock),
        categoryId,
        description,
        images: imageUrl ? [{ url: imageUrl }] : [],
        status: editingProduct ? editingProduct.status : 'Draft',
      };

      let updatedList: Product[];
      if (editingProduct) {
        updatedList = products.map((p) => (p.id === editingProduct.id ? newProd : p));
      } else {
        updatedList = [...products, newProd];
      }

      localStorage.setItem('mockProducts', JSON.stringify(updatedList));
      setProducts(updatedList);
      setShowFormModal(false);
      setSuccessMsg('Product registered locally.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setSuccessMsg('');
    try {
      await apiClient.delete(`/api/v1/products/${id}`);
      setSuccessMsg('Product deleted.');
      loadData();
    } catch {
      const updated = products.filter((p) => p.id !== id);
      localStorage.setItem('mockProducts', JSON.stringify(updated));
      setProducts(updated);
      setSuccessMsg('Product deleted locally.');
    }
  };

  const handleTogglePublish = async (prod: Product) => {
    setSuccessMsg('');
    const action = prod.status === 'Published' ? 'unpublish' : 'publish';
    
    try {
      if (action === 'publish') {
        await apiClient.post(`/api/v1/products/${prod.id}/publish`);
      } else {
        await apiClient.post(`/api/v1/products/${prod.id}/unpublish`);
      }
      setSuccessMsg(`Product ${action === 'publish' ? 'published' : 'unpublished'}.`);
      loadData();
    } catch {
      // Local toggle fallback
      const updated = products.map((p) => {
        if (p.id === prod.id) {
          return {
            ...p,
            status: action === 'publish' ? 'Published' : 'Draft',
          };
        }
        return p;
      });
      localStorage.setItem('mockProducts', JSON.stringify(updated));
      setProducts(updated);
      setSuccessMsg(`Product status updated locally to ${action === 'publish' ? 'Published' : 'Draft'}.`);
    }
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="products" />

      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem' }}>Product Catalog</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage pricing details, configure inventories, and publish items to storefront.</p>
          </div>

          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Add Product
          </button>
        </div>

        {successMsg && (
          <div className="status-pill success" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
            {successMsg}
          </div>
        )}

        {loading ? (
          <div className="loading-container card">
            <div className="spinner"></div>
            <p>Fetching merchant product inventory...</p>
          </div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod) => {
                    const img = prod.images && prod.images.length > 0 ? prod.images[0].url : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&auto=format&fit=crop&q=60';
                    return (
                      <tr key={prod.id}>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img src={img} alt={prod.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>{prod.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {prod.id}</span>
                          </div>
                        </td>
                        <td><code style={{ fontSize: '0.8rem' }}>{prod.sku || 'N/A'}</code></td>
                        <td style={{ fontWeight: 700 }}>${prod.price.toFixed(2)}</td>
                        <td>
                          <span className={`status-pill ${prod.stock > 10 ? 'success' : prod.stock > 0 ? 'warning' : 'danger'}`}>
                            {prod.stock} Items
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${prod.status === 'Published' ? 'info' : 'warning'}`}>
                            {prod.status || 'Draft'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem' }}
                              onClick={() => handleTogglePublish(prod)}
                              title={prod.status === 'Published' ? 'Unpublish Product' : 'Publish Product'}
                            >
                              {prod.status === 'Published' ? <ToggleRight size={18} style={{ color: 'var(--success)' }} /> : <ToggleLeft size={18} />}
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem' }}
                              onClick={() => openEditModal(prod)}
                              title="Edit product"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem', color: 'var(--danger)' }}
                              onClick={() => handleDeleteProduct(prod.id)}
                              title="Delete product"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
                  <select className="form-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input type="url" className="form-input" placeholder="https://unsplash.com/..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              </div>

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
