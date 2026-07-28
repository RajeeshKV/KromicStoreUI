import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './Dashboard';
import apiClient from '../../api/apiClient';
import { Users, Search, Plus, X, Mail, Phone, Calendar, Loader2 } from 'lucide-react';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  createdAt: string;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form Modal States
  const [showModal, setShowModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const loadCustomers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.get('/api/v1/customers');
      setCustomers(res.data.data || res.data || []);
    } catch (err: any) {
      console.error('Failed to load customers:', err);
      setCustomers([]);
      setErrorMsg('Failed to load customer list from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      firstName,
      lastName,
      email,
      phone: phone || null,
    };

    try {
      await apiClient.post('/api/v1/customers', payload);
      setSuccessMsg('Customer registered successfully!');
      setShowModal(false);
      
      // Reset Form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      
      loadCustomers();
    } catch (err: any) {
      console.error('Failed to create customer:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to register customer on server.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const query = searchQuery.toLowerCase();
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    return fullName.includes(query) || c.email.toLowerCase().includes(query);
  });

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="customers" />

      <main className="dashboard-content">
        <div className="content-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem' }}>Customers Management</h1>
              <p style={{ color: 'var(--text-secondary)' }}>View buyer profile logs, contact details, and registered store account summaries.</p>
            </div>

            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Register Customer
            </button>
          </div>

          {successMsg && (
            <div className="status-pill success" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="status-pill danger" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
              {errorMsg}
            </div>
          )}

          {/* Search bar */}
          <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by customer name or email address..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ margin: 0, flexGrow: 1 }}
            />
          </div>

          {loading ? (
            <div className="loading-container card">
              <Loader2 className="spinner" size={32} />
              <p style={{ marginTop: '1rem' }}>Querying registered customer base...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="card text-center" style={{ padding: '4rem' }}>
              <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3>No Customers Found</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>No customers match your search criteria or are registered yet.</p>
            </div>
          ) : (
            <div className="card">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Email ID</th>
                      <th>Phone Number</th>
                      <th>Joined Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {c.firstName} {c.lastName}
                        </td>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Mail size={14} className="text-muted" /> {c.email}
                        </td>
                        <td>
                          {c.phone ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Phone size={14} className="text-muted" /> {c.phone}
                            </span>
                          ) : 'N/A'}
                        </td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={14} className="text-muted" /> {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- FORM DIALOG MODAL --- */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content card" style={{ maxWidth: '500px', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.35rem' }}>Register Customer Account</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input type="text" className="form-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input type="text" className="form-input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Phone (Optional)</label>
                <input type="tel" className="form-input" placeholder="+91..." value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }} disabled={submitting}>
                {submitting ? 'Saving Account...' : 'Register Customer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
