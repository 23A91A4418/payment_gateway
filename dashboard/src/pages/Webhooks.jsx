import React, { useEffect, useState } from "react";
import "./Dashboard.css";

const Webhooks = () => {
  const [merchant, setMerchant] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

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
    setLogs(data.data || []);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setMsg("");
      const m = await fetchMerchant();
      setMerchant(m);
      await fetchLogs(m);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const retryWebhook = async (id) => {
    if (!merchant) return;
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

      const data = await res.json();

      if (!res.ok) {
        setMsg(data?.error?.description || "Retry failed");
        return;
      }

      setMsg(`Retry scheduled for webhook event ${id}`);
      await fetchLogs(merchant);
    } catch (err) {
      setMsg("Retry failed");
    }
  };

  return (
    <div className="dashboard" data-test-id="webhook-config">
      <h1 className="dashboard-title">Webhooks</h1>

      {msg && (
        <div style={{ marginBottom: "20px", color: "#1f2937" }}>
          {msg}
        </div>
      )}

      <div className="credential-card" style={{ marginBottom: "24px" }}>
        <h3 style={{ marginBottom: "10px" }}>Webhook Configuration</h3>

        <div style={{ fontSize: "14px", color: "#6b7280" }}>
          Current URL is configured in backend table <b>webhook_endpoints</b>.
        </div>

        {merchant && (
          <div style={{ marginTop: "14px" }}>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>Secret</div>
            <div style={{ fontFamily: "monospace", marginTop: "6px" }}>
              whsec_test_123
            </div>
          </div>
        )}
      </div>

      <div className="credential-card">
        <h3 style={{ marginBottom: "14px" }}>Webhook Delivery Logs</h3>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <table data-test-id="webhook-logs-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Last Error</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6">No webhook logs found</td>
                </tr>
              ) : (
                logs.map((w) => (
                  <tr key={w.id} data-test-id="webhook-log-item">
                    <td>{w.id}</td>
                    <td data-test-id="webhook-event">{w.event_type}</td>
                    <td data-test-id="webhook-status">{w.status}</td>
                    <td data-test-id="webhook-attempts">{w.attempts}</td>
                    <td style={{ maxWidth: "260px", wordBreak: "break-word" }}>
                      {w.last_error || "-"}
                    </td>
                    <td>
                      <button
                        data-test-id="retry-webhook-button"
                        onClick={() => retryWebhook(w.id)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "6px",
                          fontSize: "13px",
                        }}
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Webhooks;
