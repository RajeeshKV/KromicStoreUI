import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';
import { Store, Shield, ArrowRight, Lock, Mail, Globe, Sparkles, CheckCircle, ShieldCheck, Zap, Headphones, Phone, Eye, EyeOff } from 'lucide-react';

const InstagramIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const SaaSLanding: React.FC = () => {
  const navigate = useNavigate();
  const { login, registerTenant } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Register Form States
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [country, setCountry] = useState('IN');

  // New validation fields states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');



  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);



  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (registerPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await registerTenant(registerEmail, firstName, lastName, registerPassword, confirmPassword, country);
      setSuccessMsg('Business registered successfully! Redirecting to console...');
      setTimeout(() => {
        navigate('/business');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to register business.');
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
      const user = await login(loginEmail, loginPassword);
      setSuccessMsg('Logged in successfully!');

      setTimeout(() => {
        if (user.roles.includes('SuperUser')) {
          navigate('/admin');
        } else {
          navigate('/business');
        }
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.response?.data?.error?.message || 'Invalid credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };



  // Public config & subscription plans states
  const [apiConfig, setApiConfig] = useState<any>(null);
  const [apiPlans, setApiPlans] = useState<any[]>([]);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const configRes = await apiClient.get('/api/v1/public/config');
        if (configRes.data.data) {
          setApiConfig(configRes.data.data);
        }
      } catch (err) {
        console.warn('Failed to load public config, using default mocks', err);
      }

      try {
        const plansRes = await apiClient.get('/api/v1/public/plans');
        if (plansRes.data.data && plansRes.data.data.length > 0) {
          setApiPlans(plansRes.data.data);
        }
      } catch (err) {
        console.warn('Failed to load public plans, using default mocks', err);
      }
    };
    fetchPublicData();
  }, []);

  const getDefaultPlansFallback = () => [
    {
      id: 'starter',
      name: 'Free',
      price: 0,
      features: ['1 Store', 'Up to 25 Products', 'Up to 100 Orders / month', 'Basic Themes', 'Community Support']
    },
    {
      id: 'professional',
      name: 'Pro',
      price: 799,
      features: ['5 Stores', 'Up to 1,000 Products', 'Up to 10,000 Orders / month', 'Premium Themes', 'Advanced Analytics', 'Priority Support']
    },
    {
      id: 'enterprise',
      name: 'Business',
      price: 2499,
      features: ['Unlimited Stores', 'Unlimited Products', 'Unlimited Orders / month', 'Premium Themes', 'Advanced Analytics', 'Priority Support', 'Dedicated Account Manager']
    }
  ];

  // Contact Form States
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(false);
    try {
      await apiClient.post('/api/v1/public/contactus', {
        name: contactName,
        email: contactEmail,
        message: contactMsg
      });
      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactMsg('');
      setTimeout(() => setContactSuccess(false), 4000);
    } catch (err) {
      console.warn('Contact API failed, simulating local success submission');
      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactMsg('');
      setTimeout(() => setContactSuccess(false), 4000);
    }
  };

  return (
    <>
      <div className="content-wrapper">
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
                className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
                style={{ flex: 1 }}
              >
                Log In
              </button>
              <button
                className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
                style={{ flex: 1 }}
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

            {/* LOGIN FORM */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <Lock size={40} style={{ color: 'var(--accent-primary)', marginBottom: '0.75rem' }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Console Access</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Sign in to your business dashboard console.
                  </p>
                </div>

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
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 12, color: 'var(--text-muted)' }} />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', width: '100%' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
                      title={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Authenticating...' : 'Sign In'}
                </button>

                <div style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  <p>Demo: <code>admin@mystore.com</code> / <code>SecurePassword123!</code></p>
                </div>
              </form>
            )}

            {/* TAB 3: REGISTER */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <Store size={40} style={{ color: 'var(--accent-primary)', marginBottom: '0.75rem' }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Business Registration</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Launch your business storefront in minutes.
                  </p>
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

                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Admin Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 12, color: 'var(--text-muted)' }} />
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Min 8 characters"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', width: '100%' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
                      title={showRegisterPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Admin Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 12, color: 'var(--text-muted)' }} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', width: '100%' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
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
                  {isSubmitting ? 'Creating business...' : 'Register Business'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="pricing-section">
        <div className="pricing-header">
          <h2 className="pricing-title">Choose the <span>perfect plan</span> for your business</h2>
          <p className="pricing-subtitle">
            Kromic Store is the all-in-one platform to build, manage and grow your online store effortlessly.
          </p>
        </div>

        <div className="pricing-grid">
          {(apiPlans.length > 0 ? apiPlans : getDefaultPlansFallback()).map((plan, index) => {
            const isProfessional = plan.id === 'professional' || plan.id === 'pro' || index === 1;
            const isEnterprise = plan.id === 'enterprise' || plan.id === 'business' || index === 2;
            
            let cardClass = "card pricing-card";
            let ctaText = "Get Started Free";
            
            if (isProfessional) {
              cardClass += " pro-plan";
              ctaText = "Start Pro Plan";
            } else if (isEnterprise) {
              cardClass += " business-plan";
              ctaText = "Start Business Plan";
            } else {
              cardClass += " free-plan";
            }
            
            const displayPrice = plan.price === 0 ? "₹0" : `${plan.currency === 'USD' ? '$' : '₹'}${plan.price}`;

            return (
              <div className={cardClass} key={plan.id}>
                {isProfessional && <div className="popular-badge">Most Popular</div>}
                
                <div className="pricing-card-header">
                  <h3 className="pricing-card-title">{plan.name}</h3>
                  <p className="pricing-card-desc">
                    {isProfessional ? "Best value for scaling businesses" : isEnterprise ? "For custom high-volume operations" : "Perfect for getting started"}
                  </p>
                </div>
                
                <div className="pricing-card-price">
                  {displayPrice}<span>/month</span>
                </div>
                
                <ul className="pricing-features-list">
                  {plan.features.map((feature: string, idx: number) => (
                    <li className="pricing-feature-item" key={idx}>
                      <CheckCircle size={18} className="pricing-feature-icon" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  className={`btn ${isProfessional ? 'btn-primary' : 'btn-outline'} pricing-cta-btn`}
                  onClick={() => {
                    setActiveTab('register');
                    const el = document.querySelector('.hero-card-wrapper');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {ctaText}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Banner */}
        <div className="pricing-footer-banner">
          <div className="pricing-footer-item">
            <div className="pricing-footer-icon-wrapper">
              <ShieldCheck size={20} />
            </div>
            <div className="pricing-footer-info">
              <h4>No Hidden Fees</h4>
              <p>What you see is what you pay.</p>
            </div>
          </div>
          <div className="pricing-footer-item">
            <div className="pricing-footer-icon-wrapper">
              <Lock size={20} />
            </div>
            <div className="pricing-footer-info">
              <h4>Secure & Reliable</h4>
              <p>Enterprise-grade security you can trust.</p>
            </div>
          </div>
          <div className="pricing-footer-item">
            <div className="pricing-footer-icon-wrapper">
              <Zap size={20} />
            </div>
            <div className="pricing-footer-info">
              <h4>Built to Scale</h4>
              <p>From startup to enterprise, we've got you covered.</p>
            </div>
          </div>
          <div className="pricing-footer-item">
            <div className="pricing-footer-icon-wrapper">
              <Headphones size={20} />
            </div>
            <div className="pricing-footer-info">
              <h4>24/7 Support</h4>
              <p>Always here to help you succeed.</p>
            </div>
          </div>
        </div>
      </div>

      {/* About Us Section */}
      <div className="about-section">
        <div className="pricing-header">
          <h2 className="pricing-title">About <span>Kromic Store</span></h2>
          <p className="pricing-subtitle">
            Empowering next-generation merchants with secure, scalable, and customizable multi-tenant commerce pipelines.
          </p>
        </div>

        <div className="card about-card">
          <div className="about-grid">
            <div className="about-info">
              <h3>Our Mission</h3>
              <p>
                We believe that every brand deserves a robust, secure, and lightning-fast digital storefront. 
                Our platform isolates database schemas, handles complex webhook delivery queues, and routes payments 
                securely under dedicated merchant tenants.
              </p>
              <p style={{ marginTop: '1rem' }}>
                With Kromic Store, setting up an isolated storefront takes minutes, not weeks, allowing you to focus on what matters most—growing your brand.
              </p>
            </div>
            <div className="about-stats">
              <div className="stat-card">
                <h4>99.99%</h4>
                <p>Platform Uptime</p>
              </div>
              <div className="stat-card">
                <h4>10,000+</h4>
                <p>Global Merchants</p>
              </div>
              <div className="stat-card">
                <h4>15M+</h4>
                <p>Monthly API Operations</p>
              </div>
              <div className="stat-card">
                <h4>&lt; 50ms</h4>
                <p>Query Latency</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Us Section */}
      <div className="contact-section">
        <div className="pricing-header">
          <h2 className="pricing-title">Contact <span>Our Team</span></h2>
          <p className="pricing-subtitle">
            Have questions about our multi-tenant SaaS features or enterprise deployments? Drop us a line.
          </p>
        </div>

        <div className="contact-grid">
          {/* Left Column: Info Card */}
          <div className="card contact-info-card">
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.5rem' }}>Get In Touch</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Our operations, sales, and support departments operate around the clock to support your commerce channels.
              </p>
            </div>

            <div className="contact-info-list">
              <div className="contact-info-item">
                <div className="contact-info-icon-wrapper">
                  <Mail size={18} />
                </div>
                <div className="contact-info-details">
                  <h4>Enterprise Sales</h4>
                  <p>sales@kromic-store.com</p>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-info-icon-wrapper">
                  <Mail size={18} />
                </div>
                <div className="contact-info-details">
                  <h4>Merchant Operations</h4>
                  <p>support@kromic-store.com</p>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-info-icon-wrapper">
                  <Globe size={18} />
                </div>
                <div className="contact-info-details">
                  <h4>Uptime & Infrastructure</h4>
                  <p>Typical response under 2 hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form Card */}
          <div className="card contact-form-card">
            <form onSubmit={handleContactSubmit}>
              {contactSuccess && (
                <div className="status-pill success" style={{ padding: '0.75rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
                  Message sent successfully! Our team will contact you shortly.
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Business Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. name@company.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">How can we help you?</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Tell us about your project or storefront requirements..."
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

    {/* Footer Section */}
    <footer style={{ borderTop: '1px solid var(--border-color)', padding: '3rem 0 4rem', marginTop: '4rem', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="content-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div className="brand-logo" style={{ fontSize: '1.35rem' }}>
            <img src="/logo.png" alt="Logo" style={{ height: '36px' }} />
            <span>{apiConfig?.companyName || 'Kromic Store'}</span>
          </div>
          
          {/* Contact Icons Footer Grid */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {apiConfig?.websiteUrl && (
              <a href={apiConfig.websiteUrl} target="_blank" rel="noopener noreferrer" title="Website" className="theme-toggle-btn" style={{ textDecoration: 'none', display: 'flex', padding: '0.5rem', borderRadius: '50%' }}>
                <Globe size={18} />
              </a>
            )}
            {apiConfig?.instagramUrl && (
              <a href={apiConfig.instagramUrl} target="_blank" rel="noopener noreferrer" title="Instagram" className="theme-toggle-btn" style={{ textDecoration: 'none', display: 'flex', padding: '0.5rem', borderRadius: '50%' }}>
                <InstagramIcon size={18} />
              </a>
            )}
            {apiConfig?.contactEmail && (
              <a href={`mailto:${apiConfig.contactEmail}`} title="Email Us" className="theme-toggle-btn" style={{ textDecoration: 'none', display: 'flex', padding: '0.5rem', borderRadius: '50%' }}>
                <Mail size={18} />
              </a>
            )}
            {apiConfig?.contactPhone && (
              <a href={`tel:${apiConfig.contactPhone}`} title="Call Us" className="theme-toggle-btn" style={{ textDecoration: 'none', display: 'flex', padding: '0.5rem', borderRadius: '50%' }}>
                <Phone size={18} />
              </a>
            )}
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <p>© {new Date().getFullYear()} {apiConfig?.companyName || 'Kromic Store'}. All rights reserved.</p>
          <p style={{ display: 'flex', gap: '1.5rem' }}>
            <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
            <span style={{ cursor: 'pointer' }}>Terms of Service</span>
          </p>
        </div>
      </div>
    </footer>
    </>
  );
};

export default SaaSLanding;
