import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Webhooks = () => {
  const [merchant, setMerchant] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Track retry state per row (so UI updates instantly)
  const [retryingIds, setRetryingIds] = useState({});
  // Prevent state updates after unmount
  const isMountedRef = useRef(true);

  const [config, setConfig] = useState({ url: "", secret: "" });
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  const fetchMerchant = async () => {
    const res = await fetch("http://localhost:8000/api/v1/test/merchant");
    if (!res.ok) throw new Error("Failed to fetch merchant");
    return res.json();
  };

  const fetchLogs = async (m) => {
    const res = await fetch(
      "http://localhost:8000/api/v1/webhooks?limit=10&offset=0",
      {
        headers: {
          "X-Api-Key": m.api_key,
          "X-Api-Secret": m.api_secret,
        },
      }
    );

    if (!res.ok) throw new Error("Failed to fetch webhook logs");

    const data = await res.json();
    if (!isMountedRef.current) return;

    setLogs(data.data || []);
  };

  const fetchConfig = async (m) => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/webhooks/config", {
        headers: {
          "X-Api-Key": m.api_key,
          "X-Api-Secret": m.api_secret,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (isMountedRef.current) {
          setConfig({ url: data.webhook_url || "", secret: data.webhook_secret || "" });
        }
      }
    } catch (err) {
      console.error("fetchConfig error:", err);
    }
  };

  const updateConfig = async (regenerate = false) => {
    if (!merchant) return;
    try {
      setSaving(true);
      const res = await fetch("http://localhost:8000/api/v1/webhooks/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": merchant.api_key,
          "X-Api-Secret": merchant.api_secret,
        },
        body: JSON.stringify({
          url: config.url,
          regenerate_secret: regenerate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (isMountedRef.current) {
          setConfig({ url: data.webhook_url || "", secret: data.webhook_secret || "" });
          setMsg(regenerate ? "Secret regenerated successfully" : "Configuration saved successfully");
        }
      } else {
        if (isMountedRef.current) setMsg("Failed to update configuration");
      }
    } catch (err) {
      if (isMountedRef.current) setMsg("Error saving configuration");
    } finally {
      if (isMountedRef.current) setSaving(false);
    }
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setMsg("");

      const m = await fetchMerchant();
      if (!isMountedRef.current) return;

      setMerchant(m);
      await Promise.all([fetchLogs(m), fetchConfig(m)]);
    } catch (err) {
      if (!isMountedRef.current) return;
      setMsg(err.message || "Failed to load webhooks");
    } finally {
      if (!isMountedRef.current) return;
      setLoading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    loadAll();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshAfterRetry = async (m) => {
    const attempts = 6;
    for (let i = 0; i < attempts; i++) {
      if (!isMountedRef.current) return;
      await fetchLogs(m);
      await new Promise((r) => setTimeout(r, 2000));
    }
  };

  const retryWebhook = async (id) => {
    if (!merchant) return;

    setLogs((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
            ...w,
            status: "pending",
            last_error: null,
            next_retry_at: null,
          }
          : w
      )
    );

    setRetryingIds((prev) => ({ ...prev, [id]: true }));

    try {
      setMsg("");
      const res = await fetch(
        `http://localhost:8000/api/v1/webhooks/${id}/retry`,
        {
          method: "POST",
          headers: {
            "X-Api-Key": merchant.api_key,
            "X-Api-Secret": merchant.api_secret,
          },
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (isMountedRef.current) setMsg(data?.error?.description || "Retry failed");
        return;
      }

      if (isMountedRef.current) setMsg(`Retry scheduled for webhook event ${id}`);
      await refreshAfterRetry(merchant);
    } catch (err) {
      if (isMountedRef.current) setMsg("Retry failed");
    } finally {
      if (isMountedRef.current) {
        setRetryingIds((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
      }
    }
  };

  const sendTestWebhook = async () => {
    if (!merchant) return;
    try {
      setMsg("Sending test webhook...");
      const res = await fetch("http://localhost:8000/api/v1/webhooks/test-webhook", {
        method: "POST",
        headers: {
          "X-Api-Key": merchant.api_key,
          "X-Api-Secret": merchant.api_secret,
        },
      });
      if (res.ok) {
        setMsg("Test webhook scheduled successfully");
        fetchLogs(merchant);
      } else {
        setMsg("Failed to send test webhook");
      }
    } catch (err) {
      setMsg("Error sending test webhook");
    }
  };

  return (
    <div className="dashboard" data-testid="webhook-config">
      <h1 className="dashboard-title">Webhooks</h1>

      <button
        className="login-button"
        style={{ marginBottom: "20px", maxWidth: "200px" }}
        onClick={() => navigate("/dashboard")}
      >
        Back to Dashboard
      </button>

      {msg && (
        <div style={{ marginBottom: "20px", padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>{msg}</div>
      )}

      <div className="credential-card" style={{ marginBottom: "24px" }}>
        <h3 style={{ marginBottom: "10px" }}>Webhook Configuration</h3>

        <form data-testid="webhook-config-form" onSubmit={(e) => { e.preventDefault(); updateConfig(false); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '5px' }}>Webhook URL</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  data-testid="webhook-url-input"
                  type="text"
                  value={config.url}
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  placeholder="https://your-site.com/webhooks"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#1e1e1e',
                    border: '1px solid #333',
                    color: '#fff'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '5px' }}>Webhook Secret</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1e1e1e', padding: '8px 12px', borderRadius: '6px', border: '1px solid #333' }}>
                <span data-testid="webhook-secret" style={{ fontFamily: 'monospace', flex: 1 }}>{config.secret || 'Not set'}</span>
                <button
                  type="button"
                  data-testid="regenerate-secret-button"
                  onClick={() => updateConfig(true)}
                  disabled={saving}
                  style={{
                    background: 'transparent',
                    border: '1px solid #4facfe',
                    color: '#4facfe',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Regenerate
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                data-testid="save-webhook-button"
                className="login-button"
                disabled={saving}
                style={{ width: 'auto', padding: '0 20px', margin: 0 }}
              >
                {saving ? "Saving..." : "Save Configuration"}
              </button>
              <button
                type="button"
                data-testid="test-webhook-button"
                className="login-button"
                onClick={sendTestWebhook}
                style={{ width: 'auto', padding: '0 20px', margin: 0, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                Send Test Webhook
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="credential-card">
        <h3 style={{ marginBottom: "14px" }}>Webhook Delivery Logs</h3>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <table data-testid="webhook-logs-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Last Attempt</th>
                <th>Response Code</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6">No webhook logs found</td>
                </tr>
              ) : (
                logs.map((w) => {
                  const isRetrying = !!retryingIds[w.id];
                  const disableRetry =
                    isRetrying || String(w.status).toLowerCase() === "pending";

                  return (
                    <tr key={w.id} data-testid="webhook-log-item" data-webhook-id={w.id}>
                      <td data-testid="webhook-event">{w.event}</td>
                      <td data-testid="webhook-status">{w.status}</td>
                      <td data-testid="webhook-attempts">{w.attempts}</td>
                      <td data-testid="webhook-last-attempt">
                        {w.last_attempt_at ? new Date(w.last_attempt_at).toLocaleString() : '-'}
                      </td>
                      <td data-testid="webhook-response-code">{w.response_code || '-'}</td>
                      <td>
                        <button
                          data-testid="retry-webhook-button"
                          onClick={() => retryWebhook(w.id)}
                          disabled={disableRetry}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            opacity: disableRetry ? 0.6 : 1,
                            cursor: disableRetry ? "not-allowed" : "pointer",
                          }}
                        >
                          {isRetrying ? "Retrying..." : "Retry"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Webhooks;
