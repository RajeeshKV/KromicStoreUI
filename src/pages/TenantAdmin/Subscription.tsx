import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './Dashboard';
import apiClient from '../../api/apiClient';
import { CreditCard, Award, CheckCircle, Zap, Loader2, BarChart2 } from 'lucide-react';

interface Subscription {
  plan: string;
  status: string;
  startedAt: string;
  trialEndsAt?: string;
  features: {
    maxUsers: number;
    maxProducts: number;
    maxApiCallsPerMonth: number;
    webhooksEnabled: boolean;
    analyticsEnabled: boolean;
  };
}

interface Usage {
  users: { used: number; limit: number };
  products: { used: number; limit: number };
  apiCallsThisMonth: { used: number; limit: number };
}

const SubscriptionPage: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadSubscriptionData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const subRes = await apiClient.get('/api/v1/subscriptions/current');
      setSubscription(subRes.data.data || subRes.data || null);

      const usageRes = await apiClient.get('/api/v1/subscriptions/current/usage');
      setUsage(usageRes.data.data || usageRes.data || null);
    } catch (err: any) {
      console.error('Failed to load subscription status:', err);
      setErrorMsg('Failed to retrieve subscription plan details from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const handlePlanAction = async (action: 'upgrade' | 'downgrade', targetPlan: string) => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const endpoint = `/api/v1/subscriptions/${action}`;
      await apiClient.post(endpoint, { plan: targetPlan });
      setSuccessMsg(`Successfully processed subscription plan ${action} to ${targetPlan}!`);
      loadSubscriptionData();
    } catch (err: any) {
      console.error(`Subscription ${action} failed:`, err);
      setErrorMsg(err.response?.data?.message || err.message || `Failed to process plan change request.`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="subscription" />

      <main className="dashboard-content">
        <div className="content-wrapper">
          <div style={{ marginBottom: '2.5rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem' }}>Subscription & Billing</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage your workspace tier plan, monitor resource usage metrics, and upgrade features.</p>
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

          {loading ? (
            <div className="loading-container card">
              <Loader2 className="spinner" size={32} />
              <p style={{ marginTop: '1rem' }}>Loading subscription tier information...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
              
              {/* Left side: Current status and plans grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Active Plan details card */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Award size={20} style={{ color: 'var(--accent-primary)' }} /> Active Plan Tier
                    </h3>
                    <span className="badge badge-success">{subscription?.status || 'Active'}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CURRENT PLAN</span>
                      <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-color)' }}>{subscription?.plan || '__'}</h4>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STARTED ON</span>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{subscription?.startedAt ? new Date(subscription.startedAt).toLocaleDateString() : '__'}</h4>
                    </div>
                    {subscription?.trialEndsAt && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TRIAL ENDS ON</span>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--warning)' }}>{new Date(subscription.trialEndsAt).toLocaleDateString()}</h4>
                      </div>
                    )}
                  </div>
                </div>

                {/* Available Plans overview list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Upgrade or Switch Plans</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Professional Card */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', opacity: subscription?.plan === 'Professional' ? 0.7 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontWeight: 700, fontSize: '1.15rem' }}>Professional Tier</h4>
                        {subscription?.plan === 'Professional' && <span className="badge badge-info">Current</span>}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Perfect for growing brands looking to scale their product inventory and catalog sales.</p>
                      
                      <ul style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: 0, listStyle: 'none' }}>
                        <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <CheckCircle size={14} style={{ color: 'var(--success)' }} /> Up to 100 products
                        </li>
                        <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <CheckCircle size={14} style={{ color: 'var(--success)' }} /> Up to 5 admin users
                        </li>
                        <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <CheckCircle size={14} style={{ color: 'var(--success)' }} /> Webhooks enabled
                        </li>
                      </ul>

                      <button 
                        className="btn btn-primary" 
                        disabled={subscription?.plan === 'Professional' || actionLoading}
                        onClick={() => handlePlanAction(subscription?.plan === 'Enterprise' ? 'downgrade' : 'upgrade', 'Professional')}
                        style={{ marginTop: 'auto' }}
                      >
                        {actionLoading ? <Loader2 className="spinner" size={16} /> : <Zap size={16} />} Switch to Professional
                      </button>
                    </div>

                    {/* Enterprise Card */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '2px solid var(--accent-color)', opacity: subscription?.plan === 'Enterprise' ? 0.7 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontWeight: 700, fontSize: '1.15rem' }}>Enterprise Tier</h4>
                        {subscription?.plan === 'Enterprise' && <span className="badge badge-info">Current</span>}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Full access suite for high-volume sales storefront operations and customized API configurations.</p>
                      
                      <ul style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: 0, listStyle: 'none' }}>
                        <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <CheckCircle size={14} style={{ color: 'var(--success)' }} /> Unlimited products list
                        </li>
                        <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <CheckCircle size={14} style={{ color: 'var(--success)' }} /> Unlimited admin users
                        </li>
                        <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <CheckCircle size={14} style={{ color: 'var(--success)' }} /> Full custom dashboard analytics
                        </li>
                      </ul>

                      <button 
                        className="btn btn-primary" 
                        disabled={subscription?.plan === 'Enterprise' || actionLoading}
                        onClick={() => handlePlanAction('upgrade', 'Enterprise')}
                        style={{ marginTop: 'auto', backgroundColor: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}
                      >
                        {actionLoading ? <Loader2 className="spinner" size={16} /> : <Zap size={16} />} Upgrade to Enterprise
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side: Limits and Quotas indicators */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart2 size={18} style={{ color: 'var(--accent-secondary)' }} /> Usage limits
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Products bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600 }}>Catalog Limit</span>
                      <span>{usage?.products.used !== undefined ? usage.products.used : '__'} / {usage?.products.limit !== undefined ? usage.products.limit : '__'}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${usage ? Math.min(((usage.products.used || 0) / (usage.products.limit || 1)) * 100, 100) : 0}%`,
                        backgroundColor: 'var(--accent-primary)',
                        borderRadius: '100px'
                      }} />
                    </div>
                  </div>

                  {/* Users bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600 }}>Admin Seats</span>
                      <span>{usage?.users.used !== undefined ? usage.users.used : '__'} / {usage?.users.limit !== undefined ? usage.users.limit : '__'}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${usage ? Math.min(((usage.users.used || 0) / (usage.users.limit || 1)) * 100, 100) : 0}%`,
                        backgroundColor: 'var(--accent-secondary)',
                        borderRadius: '100px'
                      }} />
                    </div>
                  </div>

                  {/* API Calls bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600 }}>Monthly API Calls</span>
                      <span>{usage?.apiCallsThisMonth.used !== undefined ? usage.apiCallsThisMonth.used : '__'} / {usage?.apiCallsThisMonth.limit !== undefined ? usage.apiCallsThisMonth.limit : '__'}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${usage ? Math.min(((usage.apiCallsThisMonth.used || 0) / (usage.apiCallsThisMonth.limit || 1)) * 100, 100) : 0}%`,
                        backgroundColor: 'var(--warning)',
                        borderRadius: '100px'
                      }} />
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
                  <CreditCard size={16} />
                  <span>Billing is handled securely via Razorpay invoice links. Next billing date: {subscription?.startedAt ? new Date(new Date(subscription.startedAt).setMonth(new Date(subscription.startedAt).getMonth() + 1)).toLocaleDateString() : '__'}.</span>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SubscriptionPage;
