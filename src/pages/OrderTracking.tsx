import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, ShieldCheck, Send, HelpCircle, AlertCircle } from 'lucide-react';

interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  items: OrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  payment?: {
    id: string;
    status: string;
    paidAt?: string;
    method?: string;
  };
  timeline?: Array<{
    status: string;
    timestamp: string;
  }>;
  createdAt: string;
}

const OrderTracking: React.FC = () => {
  const { storeTenantId, orderId } = useParams<{ storeTenantId: string; orderId: string }>();
  const { setTenantId } = useAuth();
  const linkPrefix = storeTenantId ? `/store/${storeTenantId}` : '';

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Support Form State
  const [supportSubject, setSupportSubject] = useState('');
  const [supportDesc, setSupportDesc] = useState('');
  const [supportCategory, setSupportCategory] = useState('missing_item');
  const [supportTicket, setSupportTicket] = useState<any | null>(null);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);

  // Return Form State
  const [returnItemId, setReturnItemId] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnSuccess, setReturnSuccess] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  useEffect(() => {
    if (storeTenantId) {
      setTenantId(storeTenantId);
    }
  }, [storeTenantId, setTenantId]);

  const loadOrderDetails = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await apiClient.get(`/api/v1/orders/${orderId}`);
      setOrder(res.data.data || res.data);
    } catch (err: any) {
      console.error('API error fetching order details:', err);
      setApiError(err.response?.data?.message || err.message || 'Failed to retrieve tracking details from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportLoading(true);
    setSupportError(null);
    try {
      const res = await apiClient.post(`/api/v1/orders/${orderId}/support`, {
        subject: supportSubject,
        description: supportDesc,
        category: supportCategory,
      });
      setSupportTicket(res.data.data || res.data);
      setSupportSubject('');
      setSupportDesc('');
    } catch (err: any) {
      console.error('API support creation failed:', err);
      setSupportError(err.response?.data?.message || err.message || 'Failed to submit support ticket.');
    } finally {
      setSupportLoading(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturnLoading(true);
    setReturnError(null);
    try {
      await apiClient.post(`/api/v1/orders/${orderId}/returns`, {
        itemId: returnItemId,
        reason: returnReason,
      });
      setReturnSuccess(true);
    } catch (err: any) {
      console.error('API return submission failed:', err);
      setReturnError(err.response?.data?.message || err.message || 'Failed to submit return request.');
    } finally {
      setReturnLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading tracking information...</p>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="content-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="card text-center" style={{ maxWidth: '480px', padding: '3rem', borderLeft: '4px solid var(--error-color)' }}>
          <AlertCircle size={48} style={{ color: 'var(--error-color)', marginBottom: '1rem' }} />
          <h3>Connection Error</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{apiError}</p>
          <Link to={linkPrefix || '/'} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            Browse Catalog
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="content-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="card text-center" style={{ maxWidth: '480px', padding: '3rem' }}>
          <AlertCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>Order Not Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            We could not locate this order ID in our database.
          </p>
          <Link to={linkPrefix || '/'} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            Browse Catalog
          </Link>
        </div>
      </div>
    );
  }

  // Pre-configured status list to map progress
  const orderStages = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
  const currentStageIndex = orderStages.indexOf(order.status);

  return (
    <div className="content-wrapper">
      <div style={{ marginBottom: '2rem' }}>
        <Link to={linkPrefix || '/'} className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
        {/* Left Side: Order Details, Items, and Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Order Header Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="status-pill info" style={{ marginBottom: '0.5rem' }}>Order Placed</span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.65rem' }}>
                  {order.orderNumber}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Placed on: {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Amount</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.25rem' }}>
                  ${order.total.toFixed(2)}
                </h3>
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '1.5rem 0' }}></div>

            {/* Stage tracker bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', margin: '2rem 0 1rem' }}>
              {/* Progress bar line */}
              <div style={{ position: 'absolute', top: '15px', left: '20px', right: '20px', height: '3px', backgroundColor: 'var(--border-color)', zIndex: 1 }}>
                <div style={{
                  width: `${(Math.max(0, currentStageIndex) / (orderStages.length - 1)) * 100}%`,
                  height: '100%',
                  backgroundColor: 'var(--success)',
                  transition: 'width 0.4s ease'
                }} />
              </div>

              {orderStages.map((stage, idx) => {
                const isCompleted = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? 'var(--success)' : 'var(--bg-tertiary)',
                      border: isCurrent ? '3px solid var(--accent-primary)' : '3px solid var(--bg-secondary)',
                      color: isCompleted ? 'white' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      boxShadow: isCurrent ? '0 0 12px var(--accent-glow)' : 'none'
                    }}>
                      {idx + 1}
                    </div>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? 'var(--accent-primary)' : isCompleted ? 'var(--text-primary)' : 'var(--text-muted)',
                      marginTop: '0.5rem'
                    }}>
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items Card */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.25rem' }}>
              Items Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {order.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx < order.items.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: idx < order.items.length - 1 ? '0.75rem' : 0 }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.productName}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Qty: {item.quantity} x ${item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    ${item.lineTotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '1.5rem 0' }}></div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'flex-end', width: '200px', marginLeft: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Tax (8%)</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Shipping</span>
                <span>${order.shipping.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Shipping & Support Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Shipping and Payment Info */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1rem' }}>
              Delivery Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div>
                <strong style={{ color: 'var(--text-muted)' }}>Shipping Destination:</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                  {order.shippingAddress.street}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                  {order.shippingAddress.country}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <strong style={{ color: 'var(--text-muted)' }}>Payment Method:</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Credit / Debit Card (Razorpay)</span>
                  <span className="status-pill success" style={{ fontSize: '0.65rem' }}>Completed</span>
                </p>
              </div>
            </div>
          </div>

          {/* Support Ticket Section */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HelpCircle size={20} style={{ color: 'var(--accent-primary)' }} /> Order Support
            </h3>

            {supportTicket ? (
              <div style={{ backgroundColor: 'var(--accent-glow)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <div style={{ color: 'var(--success)', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={16} /> Ticket Opened Successfully!
                </div>
                <p>Ticket ID: <strong>{supportTicket.ticketId}</strong></p>
                <p style={{ marginTop: '0.25rem' }}>Subject: {supportTicket.subject}</p>
                <p>Status: <span className="status-pill warning" style={{ padding: '0.05rem 0.4rem', fontSize: '0.65rem' }}>{supportTicket.status}</span></p>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {supportError && (
                  <div className="status-pill danger" style={{ padding: '0.65rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                    {supportError}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Damaged item received"
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={supportCategory}
                    onChange={(e) => setSupportCategory(e.target.value)}
                    required
                  >
                    <option value="missing_item">Missing Item</option>
                    <option value="damaged_item">Damaged Item</option>
                    <option value="wrong_item">Wrong Item Received</option>
                    <option value="shipping_delay">Shipping Delay</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    placeholder="Provide details..."
                    value={supportDesc}
                    onChange={(e) => setSupportDesc(e.target.value)}
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={supportLoading}>
                  <Send size={14} /> {supportLoading ? 'Submitting...' : 'Open Support Ticket'}
                </button>
              </form>
            )}
          </div>

          {/* Return Request Section */}
          {order.status === 'Delivered' && (
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1rem' }}>
                Request Item Return
              </h3>

              {returnSuccess ? (
                <div className="status-pill success" style={{ padding: '1rem', width: '100%', borderRadius: 'var(--radius-sm)' }}>
                  <ShieldCheck size={16} style={{ marginRight: 6 }} /> Return request submitted. Shipping labels will be sent via email.
                </div>
              ) : (
                <form onSubmit={handleReturnSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {returnError && (
                    <div className="status-pill danger" style={{ padding: '0.65rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                      {returnError}
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Select Item to Return</label>
                    <select
                      className="form-input"
                      value={returnItemId}
                      onChange={(e) => setReturnItemId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Item --</option>
                      {order.items.map((it, idx) => (
                        <option key={idx} value={it.productId}>
                          {it.productName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reason for Return</label>
                    <textarea
                      className="form-input"
                      placeholder="Explain why you wish to return this item..."
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      style={{ minHeight: '60px' }}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-danger" style={{ width: '100%' }} disabled={returnLoading}>
                    {returnLoading ? 'Requesting...' : 'Submit Return Request'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
export type { OrderDetail };
