import React from 'react';
import { useNavigate } from 'react-router-dom';
import "./Dashboard.css";

const Docs = () => {
    const navigate = useNavigate();

    return (
        <div className="dashboard" style={{ textAlign: 'left', maxWidth: '900px' }}>
            <h1 className="dashboard-title">API Documentation</h1>

            <button
                className="login-button"
                style={{ marginBottom: '20px', maxWidth: '200px' }}
                onClick={() => navigate('/dashboard')}
            >
                Back to Dashboard
            </button>

            <section className="doc-section">
                <h2>Authentication</h2>
                <p>All merchant-protected endpoints require the following headers:</p>
                <div className="code-block">
                    <code>X-Api-Key: key_test_abc123</code><br />
                    <code>X-Api-Secret: secret_test_xyz789</code>
                </div>
            </section>

            <section className="doc-section">
                <h2>Create Order</h2>
                <p><code>POST /api/v1/orders</code></p>
                <div className="code-block">
                    <pre>{`{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_123",
  "notes": {
    "customer_name": "John Doe"
  }
}`}</pre>
                </div>
            </section>

            <section className="doc-section">
                <h2>SDK Integration</h2>
                <p>Include the following script in your page:</p>
                <div className="code-block">
                    <code>{`<script src="http://localhost:3000/checkout.js"></script>`}</code>
                </div>
                <p>Initialize and open the checkout modal:</p>
                <div className="code-block">
                    <pre>{`const options = {
  key: "key_test_abc123",
  orderId: "order_AbCdEfGhIjKlMnOp",
  onSuccess: (data) => console.log("Success!", data),
  onFailure: (data) => console.log("Failed!", data),
  onClose: () => console.log("Modal closed")
};
const pg = new PaymentGateway(options);
pg.open();`}</pre>
                </div>
            </section>

            <section className="doc-section">
                <h2>Verify Webhook Signature</h2>
                <p>Webhooks are sent as POST requests with an <code>X-Webhook-Signature</code> header.</p>
                <p>Verify the signature using HMAC-SHA256 with your webhook secret:</p>
                <div className="code-block">
                    <pre>{`const crypto = require('crypto');
const signature = req.headers['x-webhook-signature'];
const expectedSignature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (signature === expectedSignature) {
  // Valid signature
}`}</pre>
                </div>
            </section>

            <style>{`
                .doc-section {
                    margin-bottom: 30px;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 20px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .code-block {
                    background: #1e1e1e;
                    padding: 15px;
                    border-radius: 4px;
                    font-family: 'Courier New', Courier, monospace;
                    color: #d4d4d4;
                    overflow-x: auto;
                    margin-top: 10px;
                }
                pre {
                    margin: 0;
                }
                h2 {
                    color: #4facfe;
                    margin-top: 0;
                }
            `}</style>
        </div>
    );
};

export default Docs;
