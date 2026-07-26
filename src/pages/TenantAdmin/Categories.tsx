import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './Dashboard';
import apiClient from '../../api/apiClient';
import { Trash2, Layers, FolderPlus, ArrowUpDown } from 'lucide-react';
import type { Category } from '../Storefront';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [parentCategoryId, setParentCategoryId] = useState('');

  const [successMsg, setSuccessMsg] = useState('');

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/categories');
      setCategories(res.data.data || []);
    } catch (err: any) {
      console.warn('API categories failed, resolving locally');
      // Mock Fallbacks
      const saved = localStorage.getItem('mockCategories');
      if (saved) {
        setCategories(JSON.parse(saved));
      } else {
        const demoCats = getDemoCategories();
        localStorage.setItem('mockCategories', JSON.stringify(demoCats));
        setCategories(demoCats);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');

    const payload = {
      name,
      description,
      displayOrder: Number(displayOrder),
      parentCategoryId: parentCategoryId || null,
    };

    try {
      await apiClient.post('/api/v1/categories', payload);
      setSuccessMsg('Category created successfully!');
      
      // Reset forms
      setName('');
      setDescription('');
      setDisplayOrder(1);
      setParentCategoryId('');

      loadCategories();
    } catch (err: any) {
      console.warn('API category post failed. Appending locally for test workflow.');
      
      const newCat: Category = {
        id: `category-mock-${Math.random().toString(36).substr(2, 9)}`,
        name,
        productCount: 0,
        subcategories: [],
      };

      let updatedList = [...categories];

      if (parentCategoryId) {
        // Append as subcategory
        updatedList = updatedList.map((c) => {
          if (c.id === parentCategoryId) {
            return {
              ...c,
              subcategories: [...(c.subcategories || []), newCat],
            };
          }
          return c;
        });
      } else {
        updatedList.push(newCat);
      }

      localStorage.setItem('mockCategories', JSON.stringify(updatedList));
      setCategories(updatedList);

      setSuccessMsg('Category registered locally.');
      setName('');
      setDescription('');
      setDisplayOrder(1);
      setParentCategoryId('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setSuccessMsg('');
    try {
      await apiClient.delete(`/api/v1/categories/${id}`);
      setSuccessMsg('Category deleted.');
      loadCategories();
    } catch {
      // Local filter fallback
      const updated = categories.filter((c) => c.id !== id).map((c) => {
        if (c.subcategories) {
          return {
            ...c,
            subcategories: c.subcategories.filter((s) => s.id !== id),
          };
        }
        return c;
      });
      localStorage.setItem('mockCategories', JSON.stringify(updated));
      setCategories(updated);
      setSuccessMsg('Category deleted locally.');
    }
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="categories" />

      <main className="dashboard-content">
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem' }}>Categories Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Organize your store product taxonomy, nesting subcategories dynamically.</p>
        </div>

        {successMsg && (
          <div className="status-pill success" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
            {successMsg}
          </div>
        )}

        {loading ? (
          <div className="loading-container card">
            <div className="spinner"></div>
            <p>Fetching catalog categories...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
            {/* Left side: categories table tree */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem' }}>Active Taxonomy Tree</h3>
              
              {categories.length === 0 ? (
                <div style={{ padding: '2rem 0', textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No categories registered yet.
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Category Name</th>
                        <th>Subcount</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat) => (
                        <React.Fragment key={cat.id}>
                          <tr>
                            <td style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Layers size={16} className="text-muted" /> {cat.name}
                            </td>
                            <td>{cat.productCount} items</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleDeleteCategory(cat.id)}
                                style={{ padding: '0.35rem', color: 'var(--danger)' }}
                                title="Delete category"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>

                          {/* Render subcategories */}
                          {cat.subcategories && cat.subcategories.map((sub) => (
                            <tr key={sub.id}>
                              <td style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>↳</span> {sub.name}
                              </td>
                              <td>{sub.productCount} items</td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => handleDeleteCategory(sub.id)}
                                  style={{ padding: '0.35rem', color: 'var(--danger)' }}
                                  title="Delete subcategory"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right side: creation card */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FolderPlus size={20} style={{ color: 'var(--accent-primary)' }} /> Create Category
              </h3>

              <form onSubmit={handleCreateCategory}>
                <div className="form-group">
                  <label className="form-label">Category Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Electronics, Apparel, etc."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nesting Parent (Optional)</label>
                  <select
                    className="form-input"
                    value={parentCategoryId}
                    onChange={(e) => setParentCategoryId(e.target.value)}
                  >
                    <option value="">-- None (Root Category) --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Display Order Index</label>
                  <div style={{ position: 'relative' }}>
                    <ArrowUpDown size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }} />
                    <input
                      type="number"
                      className="form-input"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(Number(e.target.value))}
                      style={{ paddingLeft: '2.5rem', width: '100%' }}
                      min={1}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Taxonomy Description</label>
                  <textarea
                    className="form-input"
                    placeholder="Brief description of products within this category..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ minHeight: '80px', resize: 'vertical' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submitting}>
                  {submitting ? 'Creating Category...' : 'Create Category'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

function getDemoCategories(): Category[] {
  return [
    {
      id: 'category-audio',
      name: 'Audio Electronics',
      productCount: 12,
      subcategories: [
        { id: 'category-headphones', name: 'Headphones', productCount: 5 },
        { id: 'category-speakers', name: 'Speakers & Docks', productCount: 7 }
      ]
    },
    {
      id: 'category-watches',
      name: 'Wristwatches',
      productCount: 4,
      subcategories: []
    }
  ];
}

export default Categories;
export { getDemoCategories };
