import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Store, Shield, ShoppingBag, ArrowRight, Lock, Mail, Globe, Sparkles } from 'lucide-react';

const SaaSLanding: React.FC = () => {
  const navigate = useNavigate();
  const { login, registerTenant, setTenantId } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'portal'>('portal');
  const [loginRole, setLoginRole] = useState<'admin' | 'superuser' | 'customer'>('admin');

  // Register Form States
  const [companyName, setCompanyName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [country, setCountry] = useState('US');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginTenantIdInput, setLoginTenantIdInput] = useState('');

  // Customer Public Storefront Portal
  const [portalTenantId, setPortalTenantId] = useState('tenant-a1b2c3d4'); // Default mock store ID

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      await registerTenant(companyName, registerEmail, registerPassword, country);
      setSuccessMsg('Store registered successfully! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/admin');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to register store.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      // Set the X-Tenant-Id header context if the user specifies a tenant during customer login
      if (loginRole === 'customer' && loginTenantIdInput) {
        setTenantId(loginTenantIdInput);
      }

      const user = await login(loginEmail, loginPassword);
      setSuccessMsg('Logged in successfully!');

      setTimeout(() => {
        if (user.roles.includes('SuperUser')) {
          navigate('/super-admin');
        } else if (user.roles.includes('TenantAdmin')) {
          navigate('/admin');
        } else {
          // Customer login under specific tenant
          const resolvedTenant = user.tenantId || loginTenantIdInput || 'tenant-a1b2c3d4';
          navigate(`/store/${resolvedTenant}`);
        }
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.response?.data?.error?.message || 'Invalid credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnterStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalTenantId.trim()) {
      setErrorMsg('Please enter a valid Tenant ID.');
      return;
    }
    setTenantId(portalTenantId);
    navigate(`/store/${portalTenantId}`);
  };

  return (
    <div className="hero-section">
      {/* Left Hand: Hero Info */}
      <div className="hero-content">
        <div className="hero-badge">
          <Sparkles size={14} style={{ marginRight: 6 }} />
          Next-Gen Multi-Tenant Storefront
        </div>
        <h1 className="hero-title">
          Power Your Brand With <span>KromicStore</span>
        </h1>
        <p className="hero-subtitle">
          Spin up high-performance, responsive e-commerce storefronts instantly. Isolated database queries, built-in global configurations, webhooks execution pipelines, and integrated payment checkout routing out of the box.
        </p>

        <div className="hero-cta">
          <button className="btn btn-primary" onClick={() => setActiveTab('register')}>
            Start Free Trial <ArrowRight size={16} />
          </button>
          <button className="btn btn-secondary" onClick={() => setActiveTab('login')}>
            Console Login
          </button>
          <button className="btn btn-outline" onClick={() => setActiveTab('portal')}>
            Explore Shop Portal
          </button>
        </div>

        <div className="grid-3">
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Shield size={20} className="text-primary" style={{ color: 'var(--accent-primary)' }} />
                <h4 style={{ fontWeight: 700 }}>Full Isolation</h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Robust multi-tenant separation using JWT-based tenant extraction middleware.
              </p>
            </div>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Store size={20} style={{ color: 'var(--accent-secondary)' }} />
                <h4 style={{ fontWeight: 700 }}>Custom Stores</h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Instant deployment matching the client theme configurations and customized storefront components.
              </p>
            </div>
          </div>
        </div>

        {/* Right Hand: Interactive Panel Card */}
        <div className="hero-card-wrapper">
          <div className="card" style={{ padding: '2.5rem' }}>
            <div className="tabs-container">
              <button
                className={`tab-btn ${activeTab === 'portal' ? 'active' : ''}`}
                onClick={() => { setActiveTab('portal'); setErrorMsg(''); }}
              >
                Find Store
              </button>
              <button
                className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
              >
                Log In
              </button>
              <button
                className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
              >
                Register
              </button>
            </div>

            {errorMsg && (
              <div className="status-pill danger" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="status-pill success" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                {successMsg}
              </div>
            )}

            {/* TAB 1: STORE PORTAL */}
            {activeTab === 'portal' && (
              <form onSubmit={handleEnterStore}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <ShoppingBag size={40} style={{ color: 'var(--accent-primary)', marginBottom: '0.75rem' }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Browse Storefront</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Enter a tenant ID to inspect a merchant's published catalog.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Merchant Tenant ID</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., tenant-a1b2c3d4"
                      value={portalTenantId}
                      onChange={(e) => setPortalTenantId(e.target.value)}
                      style={{ flex: 1 }}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                  View Public Catalog <ArrowRight size={16} />
                </button>

                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Quick Links:
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => { setPortalTenantId('tenant-a1b2c3d4'); navigate('/store/tenant-a1b2c3d4'); }}
                    >
                      Demo Store (US)
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: LOGIN */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <Lock size={40} style={{ color: 'var(--accent-primary)', marginBottom: '0.75rem' }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Console Access</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Sign in to your dashboard console.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '0.25rem', marginBottom: '1.25rem' }}>
                  <button
                    type="button"
                    style={{ flex: 1, border: 'none', background: loginRole === 'admin' ? 'var(--bg-secondary)' : 'none', color: loginRole === 'admin' ? 'var(--text-primary)' : 'var(--text-secondary)', padding: '0.4rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => { setLoginRole('admin'); setErrorMsg(''); }}
                  >
                    Tenant Admin
                  </button>
                  <button
                    type="button"
                    style={{ flex: 1, border: 'none', background: loginRole === 'superuser' ? 'var(--bg-secondary)' : 'none', color: loginRole === 'superuser' ? 'var(--text-primary)' : 'var(--text-secondary)', padding: '0.4rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => { setLoginRole('superuser'); setErrorMsg(''); }}
                  >
                    Super User
                  </button>
                  <button
                    type="button"
                    style={{ flex: 1, border: 'none', background: loginRole === 'customer' ? 'var(--bg-secondary)' : 'none', color: loginRole === 'customer' ? 'var(--text-primary)' : 'var(--text-secondary)', padding: '0.4rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => { setLoginRole('customer'); setErrorMsg(''); }}
                  >
                    Customer
                  </button>
                </div>

                {loginRole === 'customer' && (
                  <div className="form-group">
                    <label className="form-label">Merchant Tenant ID</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., tenant-a1b2c3d4"
                      value={loginTenantIdInput}
                      onChange={(e) => setLoginTenantIdInput(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      className="form-input"
                      placeholder="admin@mystore.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      style={{ paddingLeft: '2.5rem', width: '100%' }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      style={{ paddingLeft: '2.5rem', width: '100%' }}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Authenticating...' : 'Sign In'}
                </button>

                <div style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  {loginRole === 'admin' ? (
                    <p>Demo: <code>admin@mystore.com</code> / <code>SecurePassword123!</code></p>
                  ) : loginRole === 'superuser' ? (
                    <p>Demo: <code>admin@kromic-store.com</code> / <code>SecurePassword123!</code></p>
                  ) : (
                    <p>Demo: <code>customer@example.com</code> / <code>SecurePassword123!</code></p>
                  )}
                </div>
              </form>
            )}

            {/* TAB 3: REGISTER */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <Store size={40} style={{ color: 'var(--accent-primary)', marginBottom: '0.75rem' }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Merchant Registration</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Launch your multi-tenant store in minutes.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Company / Store Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="My Awesome Store"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Admin Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      className="form-input"
                      placeholder="admin@mystore.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      style={{ paddingLeft: '2.5rem', width: '100%' }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Admin Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Min 8 characters"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      style={{ paddingLeft: '2.5rem', width: '100%' }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Country</label>
                  <div style={{ position: 'relative' }}>
                    <Globe size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }} />
                    <select
                      className="form-input"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      style={{ paddingLeft: '2.5rem', width: '100%', appearance: 'none', WebkitAppearance: 'none' }}
                      required
                    >
                      <option value="US">United States (USD)</option>
                      <option value="IN">India (INR)</option>
                      <option value="GB">United Kingdom (GBP)</option>
                      <option value="DE">Germany (EUR)</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating store...' : 'Register Store'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
  );
};

export default SaaSLanding;
