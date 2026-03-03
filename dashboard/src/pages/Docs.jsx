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
                    <pre>{`curl --request POST \\
  --url http://localhost:8000/api/v1/orders \\
  --header 'Content-Type: application/json' \\
  --header 'X-Api-Key: YOUR_API_KEY' \\
  --header 'X-Api-Secret: YOUR_API_SECRET' \\
  --data '{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_order_123",
  "notes": {
    "merchant_order_id": "67890"
  }
}'`}</pre>
                </div>
            </section>

            <section className="doc-section">
                <h2>SDK Integration</h2>
                <p>Include the script and initialize the checkout component:</p>
                <div className="code-block">
                    <pre>{`<script src="http://localhost:3001/checkout.js"></script>

<script>
  const options = {
    key: "YOUR_API_KEY",
    orderId: "order_AbCdEfGhIjKlMnOp",
    onSuccess: (data) => {
      console.log("Payment Successful", data.payment_id);
    },
    onFailure: (data) => {
      console.log("Payment Failed", data.error);
    }
  };
  const pg = new PaymentGateway(options);
  pg.open();
</script>`}</pre>
                </div>
            </section>

            <section className="doc-section">
                <h2>Webhook Verification (HMAC-SHA256)</h2>
                <p>Verify signatures using your Webhook Secret:</p>
                <div className="code-block">
                    <pre>{`const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return expected === signature;
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
