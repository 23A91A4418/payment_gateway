import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../index.css";

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const isEmbedded = searchParams.get("embedded") === "true";

  const [order, setOrder] = useState(null);
  const [method, setMethod] = useState(null); // 'upi' | 'card'
  const [loading, setLoading] = useState(false);

  const [paymentId, setPaymentId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'processing' | 'success' | 'failed'
  const [error, setError] = useState(null);

  // Form States
  const [vpa, setVpa] = useState("");
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  // Fetch order when orderId changes
  useEffect(() => {
    if (!orderId) {
      setError("Missing Order ID");
      return;
    }
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Poll payment status every 2 seconds while processing
  useEffect(() => {
    let interval;

    if (paymentId && paymentStatus === "processing") {
      interval = setInterval(() => {
        checkStatus();
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, paymentStatus]);

  // Send postMessage to parent when embedded + success/failure
  useEffect(() => {
    if (!isEmbedded) return;

    const targetOrigin = searchParams.get("origin");

    // Safety check: don't post to '*' if we can avoid it.
    // If no origin is provided, we default to localhost:3000 for development, 
    // but in production it MUST be provided.
    const safeTargetOrigin = (targetOrigin && targetOrigin !== "*") ? targetOrigin : "http://localhost:3000";

    if (paymentStatus === "success") {
      window.parent.postMessage(
        {
          type: "payment_success",
          data: { paymentId },
        },
        safeTargetOrigin
      );
    }

    if (paymentStatus === "failed") {
      window.parent.postMessage(
        {
          type: "payment_failed",
          data: { paymentId },
        },
        safeTargetOrigin
      );
    }
  }, [paymentStatus, paymentId, isEmbedded, searchParams]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/orders/${orderId}/public`
      );

      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        setError("Invalid Order");
      }
    } catch (err) {
      console.error(err);
      setError("Network Error");
    }
  };

  const checkStatus = async () => {
    if (!paymentId) return;

    try {
      // Public payment status endpoint required for hosted checkout
      const res = await fetch(
        `http://localhost:8000/api/v1/payments/${paymentId}/public`
      );

      if (res.ok) {
        const data = await res.json();

        const status = (data.status || "").toLowerCase();

        // Your backend might return: processing/pending/success/failed
        if (status === "pending" || status === "processing") {
          setPaymentStatus("processing");
        } else if (status === "success") {
          setPaymentStatus("success");
        } else if (status === "failed") {
          setPaymentStatus("failed");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!method) return;

    setLoading(true);
    setError(null);

    const payload = {
      order_id: orderId,
      method: method,
    };

    if (method === "upi") {
      payload.vpa = vpa;
    } else {
      // Expecting MM/YY
      const parts = cardDetails.expiry.split("/");
      const mm = parts[0] ? parts[0].trim() : "";
      const yy = parts[1] ? parts[1].trim() : "";

      payload.card = {
        number: cardDetails.number,
        expiry_month: mm,
        expiry_year: yy,
        cvv: cardDetails.cvv,
        holder_name: cardDetails.name,
      };
    }

    try {
      const res = await fetch("http://localhost:8000/api/v1/payments/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setPaymentId(data.id);
        setPaymentStatus("processing");
      } else {
        setPaymentStatus("failed");
        setError(
          data?.error?.description || "Payment could not be created. Try again."
        );
      }
    } catch (err) {
      console.error(err);
      setPaymentStatus("failed");
      setError("Network error while creating payment");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEmbedded = () => {
    if (!isEmbedded) return;

    const targetOrigin = searchParams.get("origin") || "http://localhost:3000";

    window.parent.postMessage(
      {
        type: "close_modal",
      },
      targetOrigin
    );
  };

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        <div className="text-center">
          <h2 className="text-2xl mb-2">Error</h2>
          <p>{error}</p>

          {isEmbedded && (
            <button
              onClick={handleCloseEmbedded}
              style={{
                marginTop: "12px",
                padding: "10px 14px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!order) return <div>Loading...</div>;

  if (loading || paymentStatus === "processing") {
    return (
      <div
        data-testid="checkout-container"
        className="flex justify-center items-center h-screen"
      >
        <div data-testid="processing-state" className="text-center">
          <div className="spinner mb-4">Loading...</div>
          <span data-testid="processing-message">Processing payment...</span>

          {isEmbedded && (
            <button
              onClick={handleCloseEmbedded}
              style={{
                marginTop: "16px",
                padding: "10px 14px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  if (paymentStatus === "success") {
    return (
      <div
        data-testid="checkout-container"
        className="flex justify-center items-center h-screen"
      >
        <div
          data-testid="success-state"
          className="text-center p-8 bg-green-50 rounded shadow"
        >
          <h2 className="text-2xl mb-4">Payment Successful</h2>

          <div className="mb-2">
            <span>Payment ID: </span>
            <span data-testid="payment-id">{paymentId}</span>
          </div>

          <span data-testid="success-message">
            Your payment has been processed successfully
          </span>

          {isEmbedded && (
            <div style={{ marginTop: "16px" }}>
              <button
                onClick={handleCloseEmbedded}
                style={{
                  padding: "10px 14px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (paymentStatus === "failed") {
    return (
      <div
        data-testid="checkout-container"
        className="flex justify-center items-center h-screen"
      >
        <div
          data-testid="error-state"
          className="text-center p-8 bg-red-50 rounded shadow"
        >
          <h2 className="text-2xl mb-4 text-red-600">Payment Failed</h2>

          <span data-testid="error-message" className="block mb-4">
            {error || "Payment could not be processed"}
          </span>

          <button
            data-testid="retry-button"
            onClick={() => {
              setPaymentStatus(null);
              setPaymentId(null);
              setMethod(null);
              setError(null);
            }}
            style={{
              padding: "10px 14px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              background: "#fff",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            Try Again
          </button>

          {isEmbedded && (
            <button
              onClick={handleCloseEmbedded}
              style={{
                padding: "10px 14px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="checkout-container"
      className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded"
    >
      <div data-testid="order-summary" className="mb-6 border-b pb-4">
        <div className="flex items-center justify-between">
          <h2 data-testid="checkout-title" className="text-xl font-bold mb-2">
            Complete Payment
          </h2>

          {isEmbedded && (
            <button
              onClick={handleCloseEmbedded}
              style={{
                padding: "6px 10px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          )}
        </div>

        <div className="flex justify-between">
          <span>Amount: </span>
          <span data-testid="order-amount">
            ₹{(order.amount / 100).toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Order ID: </span>
          <span data-testid="order-id">{order.id}</span>
        </div>
      </div>

      {!method ? (
        <div data-testid="payment-methods" className="space-y-4">
          <button
            data-testid="method-upi"
            data-method="upi"
            className="w-full p-4 border rounded hover:bg-gray-50"
            onClick={() => setMethod("upi")}
          >
            UPI
          </button>

          <button
            data-testid="method-card"
            data-method="card"
            className="w-full p-4 border rounded hover:bg-gray-50"
            onClick={() => setMethod("card")}
          >
            Card
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setMethod(null)}
            className="mb-4 text-sm text-gray-500"
          >
            Back
          </button>

          {method === "upi" && (
            <form data-testid="upi-form" onSubmit={handlePayment}>
              <input
                data-testid="vpa-input"
                placeholder="username@bank"
                type="text"
                className="w-full p-2 border rounded mb-4"
                value={vpa}
                onChange={(e) => setVpa(e.target.value)}
              />

              <button
                data-testid="pay-button"
                type="submit"
                className="w-full bg-blue-600 text-white p-2 rounded"
              >
                Pay ₹{(order.amount / 100).toFixed(2)}
              </button>
            </form>
          )}

          {method === "card" && (
            <form
              data-testid="card-form"
              onSubmit={handlePayment}
              className="space-y-4"
            >
              <input
                data-testid="card-number-input"
                placeholder="Card Number"
                type="text"
                className="w-full p-2 border rounded"
                value={cardDetails.number}
                onChange={(e) =>
                  setCardDetails({ ...cardDetails, number: e.target.value })
                }
              />

              <div className="flex gap-4">
                <input
                  data-testid="expiry-input"
                  placeholder="MM/YY"
                  type="text"
                  className="w-1/2 p-2 border rounded"
                  value={cardDetails.expiry}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, expiry: e.target.value })
                  }
                />

                <input
                  data-testid="cvv-input"
                  placeholder="CVV"
                  type="text"
                  className="w-1/2 p-2 border rounded"
                  value={cardDetails.cvv}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, cvv: e.target.value })
                  }
                />
              </div>

              <input
                data-testid="cardholder-name-input"
                placeholder="Name on Card"
                type="text"
                className="w-full p-2 border rounded"
                value={cardDetails.name}
                onChange={(e) =>
                  setCardDetails({ ...cardDetails, name: e.target.value })
                }
              />

              <button
                data-testid="pay-button"
                type="submit"
                className="w-full bg-blue-600 text-white p-2 rounded"
              >
                Pay ₹{(order.amount / 100).toFixed(2)}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default Checkout;
