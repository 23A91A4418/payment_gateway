import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    successRate: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/payments', {
      headers: {
        'X-Api-Key': 'key_test_abc123',
        'X-Api-Secret': 'secret_test_xyz789'
      }
    })
      .then(res => res.json())
      .then(data => {
        const total = data.length;
        const success = data.filter(p => p.status === 'success');
        const amount = success.reduce((sum, p) => sum + p.amount, 0);

        setStats({
          totalTransactions: total,
          totalAmount: amount,
          successRate: total === 0 ? 0 : Math.round((success.length / total) * 100)
        });
      });
  }, []);

  return (
    <div
      data-test-id="dashboard"
      style={{
        maxWidth: '1100px',
        margin: '40px auto',
        padding: '24px',
        fontFamily: 'Inter, Arial, sans-serif'
      }}
    >
      <h1 style={{ marginBottom: '24px' }}>Dashboard</h1>

      {/* API Credentials */}
      <div
        data-test-id="api-credentials"
        style={{
          background: '#ffffff',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          marginBottom: '32px'
        }}
      >
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontWeight: 500 }}>API Key:</label>
          <span
            data-test-id="api-key"
            style={{ marginLeft: '8px', fontWeight: 600 }}
          >
            key_test_abc123
          </span>
        </div>
        <div>
          <label style={{ fontWeight: 500 }}>API Secret:</label>
          <span
            data-test-id="api-secret"
            style={{ marginLeft: '8px', fontWeight: 600 }}
          >
            secret_test_xyz789
          </span>
        </div>
      </div>

      {/* Stats */}
      <div
        data-test-id="stats-container"
        style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '32px'
        }}
      >
        {/* Total Transactions */}
        <div
          data-test-id="total-transactions"
          style={{
            flex: 1,
            background: '#f1f5f9',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '6px' }}>
            Total Transactions
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700 }}>
            {stats.totalTransactions}
          </div>
        </div>

        {/* Total Amount */}
        <div
          data-test-id="total-amount"
          style={{
            flex: 1,
            background: '#f1f5f9',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '6px' }}>
            Total Amount (INR)
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700 }}>
            ₹{stats.totalAmount}
          </div>
        </div>

        {/* Success Rate */}
        <div
          data-test-id="success-rate"
          style={{
            flex: 1,
            background: '#f1f5f9',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '6px' }}>
            Success Rate
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700 }}>
            {stats.successRate}%
          </div>
        </div>
      </div>

      {/* Navigation Button */}
      <button
        onClick={() => navigate('/dashboard/transactions')}
        style={{
          padding: '12px 20px',
          borderRadius: '8px',
          border: 'none',
          background: '#2563eb',
          color: '#ffffff',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        View Transactions
      </button>
    </div>
  );
}

export default Dashboard;
