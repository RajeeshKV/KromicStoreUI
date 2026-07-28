import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './Dashboard';
import apiClient from '../../api/apiClient';
import { UserCheck, Search, Plus, X, Mail, Shield, UserMinus, Loader2 } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string; // Active, Pending
}

const TeamPage: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Invite Form States
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Staff');

  const loadTeam = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.get('/api/v1/team');
      setMembers(res.data.data || res.data || []);
    } catch (err: any) {
      console.error('Failed to load team:', err);
      setMembers([]);
      setErrorMsg('Failed to load team list from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiClient.post('/api/v1/team/invite', { email, role });
      setSuccessMsg(`Team invitation successfully dispatched to ${email}!`);
      setShowModal(false);
      setEmail('');
      setRole('Staff');
      loadTeam();
    } catch (err: any) {
      console.error('Failed to invite member:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to dispatch team member invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from your team?`)) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiClient.delete(`/api/v1/team/${id}`);
      setSuccessMsg(`${name} removed successfully.`);
      loadTeam();
    } catch (err: any) {
      console.error('Failed to remove team member:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to delete team member.');
    }
  };

  const filteredMembers = members.filter(m => {
    const query = searchQuery.toLowerCase();
    return m.name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query);
  });

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="team" />

      <main className="dashboard-content">
        <div className="content-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem' }}>Team Management</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Invite team administrators, manage role hierarchies, and inspect security access controls.</p>
            </div>

            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Invite Member
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
              placeholder="Search by team member name or email address..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ margin: 0, flexGrow: 1 }}
            />
          </div>

          {loading ? (
            <div className="loading-container card">
              <Loader2 className="spinner" size={32} />
              <p style={{ marginTop: '1rem' }}>Querying active team registry...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="card text-center" style={{ padding: '4rem' }}>
              <UserCheck size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3>No Members Found</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>No team members match your filter criteria.</p>
            </div>
          ) : (
            <div className="card">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email ID</th>
                      <th>System Role</th>
                      <th>Invite Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map(m => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {m.name || 'Invited User'}
                        </td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={14} className="text-muted" /> {m.email}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={14} className="text-muted" /> {m.role}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${m.status === 'Active' ? 'success' : 'warning'}`}>
                            {m.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleRemove(m.id, m.name || m.email)}
                            style={{ padding: '0.35rem', color: 'var(--error-color)' }}
                            title="Remove Member"
                          >
                            <UserMinus size={14} />
                          </button>
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
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.35rem' }}>Invite Team Member</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">System Access Role *</label>
                <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)} required>
                  <option value="Staff">Staff</option>
                  <option value="Manager">Manager</option>
                  <option value="TenantAdmin">Tenant Admin</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }} disabled={submitting}>
                {submitting ? 'Sending Invite...' : 'Invite Member'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
