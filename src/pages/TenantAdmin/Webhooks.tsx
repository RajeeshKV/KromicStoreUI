import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './Dashboard';
import apiClient from '../../api/apiClient';
import { Plus, Trash2, Activity, Send } from 'lucide-react';

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  deliveryUrl: string;
  responseStatusCode: number;
  deliveredAt: string;
  payload: string;
  durationMs: number;
}

const Webhooks: React.FC = () => {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['order.created']);
  const [description, setDescription] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  
  // Secret Reveal helper
  const [createdSecret, setCreatedSecret] = useState('');

  const loadWebhookData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/webhooks');
      setWebhooks(res.data.data || []);

      // If webhookId exists, try fetching delivery logs (usually mock logs)
      const delivRes = await apiClient.get('/api/v1/webhooks/deliveries').catch(() => null);
      if (delivRes) {
        setDeliveries(delivRes.data.data || []);
      } else {
        setDeliveries(getDemoDeliveries());
      }
    } catch (err: any) {
      console.warn('Webhooks API failed. Using local storage webhooks mockup.');
      const saved = localStorage.getItem('mockWebhooks');
      if (saved) {
        setWebhooks(JSON.parse(saved));
      } else {
        const demoHooks = getDemoWebhooks();
        localStorage.setItem('mockWebhooks', JSON.stringify(demoHooks));
        setWebhooks(demoHooks);
      }
      setDeliveries(getDemoDeliveries());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWebhookData();
  }, []);

  const handleCheckboxChange = (event: string) => {
    if (events.includes(event)) {
      setEvents(events.filter((e) => e !== event));
    } else {
      setEvents([...events, event]);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setCreatedSecret('');

    const payload = {
      url,
      events,
      description,
    };

    try {
      const res = await apiClient.post('/api/v1/webhooks', payload);
      const data = res.data.data;
      setSuccessMsg('Webhook listener registered successfully!');
      if (data.secret) {
        setCreatedSecret(data.secret);
      }

      setUrl('');
      setDescription('');
      setEvents(['order.created']);
      loadWebhookData();
    } catch (err: any) {
      console.warn('API webhooks post failed. Saving locally.');
      const newSecret = `whsec_${Math.random().toString(36).substr(2, 24)}`;
      const newHook: WebhookItem = {
        id: `webhook-${Math.random().toString(36).substr(2, 9)}`,
        url,
        events,
        secret: newSecret,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const updated = [...webhooks, newHook];
      localStorage.setItem('mockWebhooks', JSON.stringify(updated));
      setWebhooks(updated);

      setSuccessMsg('Webhook registered locally. Guard this secret below!');
      setCreatedSecret(newSecret);

      setUrl('');
      setDescription('');
      setEvents(['order.created']);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    setSuccessMsg('');
    try {
      await apiClient.delete(`/api/v1/webhooks/${id}`);
      setSuccessMsg('Webhook endpoint deleted.');
      loadWebhookData();
    } catch {
      const updated = webhooks.filter((w) => w.id !== id);
      localStorage.setItem('mockWebhooks', JSON.stringify(updated));
      setWebhooks(updated);
      setSuccessMsg('Webhook deleted locally.');
    }
  };

  const handleTestWebhook = async (id: string) => {
    setSuccessMsg('');
    try {
      await apiClient.post(`/api/v1/webhooks/${id}/test`);
      setSuccessMsg('Test notification payload dispatched successfully!');
      loadWebhookData();
    } catch {
      // Prepend a mock delivery log entry on test
      const newDelivery: WebhookDelivery = {
        id: `deliv-${Math.random().toString(36).substr(2, 6)}`,
        webhookId: id,
        event: 'order.created',
        deliveryUrl: webhooks.find((w) => w.id === id)?.url || 'https://unknown.com',
        responseStatusCode: 200,
        deliveredAt: new Date().toISOString(),
        payload: '{"event": "order.created", "data": {"orderId": "order-123", "status": "Pending", "total": 99.99}}',
        durationMs: 142,
      };

      setDeliveries([newDelivery, ...deliveries]);
      setSuccessMsg('Simulated webhook test dispatched. Review log entry below.');
    }
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="webhooks" />

      <main className="dashboard-content">
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem' }}>Webhooks Integration</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Configure automated HTTP notification endpoints for order and payment updates.</p>
        </div>

        {successMsg && (
          <div className="status-pill success" style={{ width: '100%', padding: '1rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontWeight: 600 }}>{successMsg}</p>
            {createdSecret && (
              <div style={{ marginTop: '0.75rem', backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <code style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)' }}>Secret Key: {createdSecret}</code>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                  Copy this key now. It will not be shown again!
                </span>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="loading-container card">
            <div className="spinner"></div>
            <p>Fetching webhooks registration configs...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
            {/* Left Column: Registered webhooks and logs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Webhooks Registered list */}
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem' }}>Configured Webhooks</h3>
                
                {webhooks.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1.5rem 0', textAlign: 'center' }}>
                    No webhook listeners active.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {webhooks.map((wh) => (
                      <div key={wh.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <div style={{ flex: 1, marginRight: '1rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block', wordBreak: 'break-all' }}>
                            {wh.url}
                          </span>
                          
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                            {wh.events.map((e) => (
                              <span key={e} className="status-pill info" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                                {e}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleTestWebhook(wh.id)}
                            style={{ padding: '0.45rem' }}
                            title="Send test payload"
                          >
                            <Send size={14} />
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleDeleteWebhook(wh.id)}
                            style={{ padding: '0.45rem', color: 'var(--danger)' }}
                            title="Delete webhook"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery log card */}
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={18} style={{ color: 'var(--accent-secondary)' }} /> Delivery History Logs
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Recent event dispatch logs.</p>

                {deliveries.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No log entries recorded.</p>
                ) : (
                  <div className="table-container" style={{ border: 'none' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Event</th>
                          <th>Status</th>
                          <th>Duration</th>
                          <th>Delivered At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveries.map((del) => (
                          <tr key={del.id}>
                            <td><strong style={{ fontSize: '0.85rem' }}>{del.event}</strong></td>
                            <td>
                              <span className={`status-pill ${del.responseStatusCode === 200 ? 'success' : 'danger'}`}>
                                {del.responseStatusCode}
                              </span>
                            </td>
                            <td>{del.durationMs}ms</td>
                            <td style={{ fontSize: '0.8rem' }}>{new Date(del.deliveredAt).toLocaleTimeString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Register form webhook */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} style={{ color: 'var(--accent-primary)' }} /> Register Endpoint
              </h3>

              <form onSubmit={handleCreateWebhook}>
                <div className="form-group">
                  <label className="form-label">Webhook Destination URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://myapi.com/webhooks/kromic"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block' }}>Trigger Events</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={events.includes('order.created')}
                        onChange={() => handleCheckboxChange('order.created')}
                      />
                      <span>order.created</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={events.includes('order.updated')}
                        onChange={() => handleCheckboxChange('order.updated')}
                      />
                      <span>order.updated</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={events.includes('payment.received')}
                        onChange={() => handleCheckboxChange('payment.received')}
                      />
                      <span>payment.received</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    placeholder="Brief description of this webhook listener purpose..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ minHeight: '60px' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submitting}>
                  {submitting ? 'Registering Endpoint...' : 'Register Webhook'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Fallbacks
function getDemoWebhooks(): WebhookItem[] {
  return [
    {
      id: 'webhook-demo-1',
      url: 'https://mystore.com/webhooks/kromic-store',
      events: ['order.created', 'payment.received'],
      secret: 'whsec_dummySecretKey3992019a',
      isActive: true,
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    }
  ];
}

function getDemoDeliveries(): WebhookDelivery[] {
  return [
    {
      id: 'deliv-1',
      webhookId: 'webhook-demo-1',
      event: 'payment.received',
      deliveryUrl: 'https://mystore.com/webhooks/kromic-store',
      responseStatusCode: 200,
      deliveredAt: new Date(Date.now() - 3600000).toISOString(),
      payload: '{"event": "payment.received"}',
      durationMs: 87,
    },
    {
      id: 'deliv-2',
      webhookId: 'webhook-demo-1',
      event: 'order.created',
      deliveryUrl: 'https://mystore.com/webhooks/kromic-store',
      responseStatusCode: 502,
      deliveredAt: new Date(Date.now() - 7200000).toISOString(),
      payload: '{"event": "order.created"}',
      durationMs: 1202,
    }
  ];
}

export default Webhooks;
export { getDemoWebhooks };
