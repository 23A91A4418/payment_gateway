import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../index.css';

const Checkout = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('order_id');

    const [order, setOrder] = useState(null);
    const [method, setMethod] = useState(null); // 'upi' or 'card'
    const [loading, setLoading] = useState(false);
    const [paymentId, setPaymentId] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null); // 'processing', 'success', 'failed'
    const [error, setError] = useState(null);

    // Form States
    const [vpa, setVpa] = useState('');
    const [cardDetails, setCardDetails] = useState({
        number: '',
        expiry: '',
        cvv: '',
        name: ''
    });

    useEffect(() => {
        if (!orderId) return;
        fetchOrder();
    }, [orderId]);

    useEffect(() => {
        let interval;
        if (paymentId && paymentStatus === 'processing') {
            interval = setInterval(checkStatus, 2000);
        }
        return () => clearInterval(interval);
    }, [paymentId, paymentStatus]);

    const fetchOrder = async () => {
        try {
            // Using public endpoint or standard endpoint if auth is loose
            const res = await fetch(`http://localhost:8000/api/v1/orders/${orderId}/public`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
            } else {
                console.error("Failed to fetch order");
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
            // Check status. The GET /payments/:id endpoint is PROTECTED in my spec:
            // "Headers: X-Api-Key..."
            // But the Checkout Page is "Hosted checkout page where customers..." (Public).
            // "Checkout Page API Authentication: ... Public Endpoints (Recommended) ... POST /api/v1/payments/public"

            // I haven't implemented public payment status check!
            // Wait, the spec says: "Poll /api/v1/payments/{payment_id} every 2 seconds"
            // And "Checkout page needs to make unauthenticated API calls"

            // I should implement GET /api/v1/payments/:id/public or allow public access to GET /payments/:id if it belongs to valid order?
            // The spec implies I should create public endpoints for the flow.
            // I'll assume I should use the protected one (impossible from browser without keys) OR I need to add a public one.
            // I WILL ADD A PUBLIC ENDPOINT FOR PAYMENT STATUS.

            // For now, I will try to fetch from /api/v1/payments/:id/public (which I need to create).

            const res = await fetch(`http://localhost:8000/api/v1/payments/${paymentId}/public`);
            // I'll update backend to add public endpoint.
            if (res.ok) {
                const data = await res.json();
                setPaymentStatus(data.status.toLowerCase());
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        setPaymentStatus('processing'); // Optimistic

        const payload = {
            order_id: orderId,
            method: method
        };

        if (method === 'upi') {
            payload.vpa = vpa;
        } else {
            // Parse expiry "MM/YY"
            const [mm, yy] = cardDetails.expiry.split('/');
            payload.card = {
                number: cardDetails.number,
                expiry_month: mm,
                expiry_year: yy,
                cvv: cardDetails.cvv,
                holder_name: cardDetails.name
            };
        }

        try {
            // "POST /api/v1/payments/public"
            const res = await fetch('http://localhost:8000/api/v1/payments/public', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setPaymentId(data.id);
                setPaymentStatus('processing');
                setLoading(false);
            } else {
                setLoading(false);
                setPaymentStatus('failed'); // Show error state immediately if creation fails?
                // Or show error message.
            }
        } catch (err) {
            setLoading(false);
            setPaymentStatus('failed');
        }
    };

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen text-red-600">
                <div className="text-center">
                    <h2 className="text-2xl mb-2">Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!order) return <div>Loading...</div>;

    if (loading || paymentStatus === 'processing') {
        return (
            <div data-test-id="checkout-container" className="flex justify-center items-center h-screen">
                <div data-test-id="processing-state" className="text-center">
                    <div className="spinner mb-4">Loading...</div>
                    <span data-test-id="processing-message">Processing payment...</span>
                </div>
            </div>
        );
    }

    if (paymentStatus === 'success') {
        return (
            <div data-test-id="checkout-container" className="flex justify-center items-center h-screen">
                <div data-test-id="success-state" className="text-center p-8 bg-green-50 rounded shadow">
                    <h2 className="text-2xl mb-4">Payment Successful!</h2>
                    <div className="mb-2">
                        <span>Payment ID: </span>
                        <span data-test-id="payment-id">{paymentId}</span>
                    </div>
                    <span data-test-id="success-message">Your payment has been processed successfully</span>
                </div>
            </div>
        );
    }

    if (paymentStatus === 'failed') {
        return (
            <div data-test-id="checkout-container" className="flex justify-center items-center h-screen">
                <div data-test-id="error-state" className="text-center p-8 bg-red-50 rounded shadow">
                    <h2 className="text-2xl mb-4 text-red-600">Payment Failed</h2>
                    <span data-test-id="error-message" className="block mb-4">Payment could not be processed</span>
                    <button data-test-id="retry-button" onClick={() => { setLoading(false); setPaymentStatus(null); }}>Try Again</button>
                </div>
            </div>
        );
    }

    return (
        <div data-test-id="checkout-container" className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded">
            <div data-test-id="order-summary" className="mb-6 border-b pb-4">
                <h2 data-test-id="checkout-title" className="text-xl font-bold mb-2">Complete Payment</h2>
                <div className="flex justify-between">
                    <span>Amount: </span>
                    <span data-test-id="order-amount">₹{(order.amount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Order ID: </span>
                    <span data-test-id="order-id">{order.id}</span>
                </div>
            </div>

            {!method ? (
                <div data-test-id="payment-methods" className="space-y-4">
                    <button
                        data-test-id="method-upi"
                        data-method="upi"
                        className="w-full p-4 border rounded hover:bg-gray-50"
                        onClick={() => setMethod('upi')}
                    >
                        UPI
                    </button>
                    <button
                        data-test-id="method-card"
                        data-method="card"
                        className="w-full p-4 border rounded hover:bg-gray-50"
                        onClick={() => setMethod('card')}
                    >
                        Card
                    </button>
                </div>
            ) : (
                <div>
                    <button onClick={() => setMethod(null)} className="mb-4 text-sm text-gray-500">Back</button>

                    {method === 'upi' && (
                        <form data-test-id="upi-form" onSubmit={handlePayment}>
                            <input
                                data-test-id="vpa-input"
                                placeholder="username@bank"
                                type="text"
                                className="w-full p-2 border rounded mb-4"
                                value={vpa}
                                onChange={e => setVpa(e.target.value)}
                            />
                            <button data-test-id="pay-button" type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
                                Pay ₹{(order.amount / 100).toFixed(2)}
                            </button>
                        </form>
                    )}

                    {method === 'card' && (
                        <form data-test-id="card-form" onSubmit={handlePayment} className="space-y-4">
                            <input
                                data-test-id="card-number-input"
                                placeholder="Card Number"
                                type="text"
                                className="w-full p-2 border rounded"
                                value={cardDetails.number}
                                onChange={e => setCardDetails({ ...cardDetails, number: e.target.value })}
                            />
                            <div className="flex gap-4">
                                <input
                                    data-test-id="expiry-input"
                                    placeholder="MM/YY"
                                    type="text"
                                    className="w-1/2 p-2 border rounded"
                                    value={cardDetails.expiry}
                                    onChange={e => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                />
                                <input
                                    data-test-id="cvv-input"
                                    placeholder="CVV"
                                    type="text"
                                    className="w-1/2 p-2 border rounded"
                                    value={cardDetails.cvv}
                                    onChange={e => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                                />
                            </div>
                            <input
                                data-test-id="cardholder-name-input"
                                placeholder="Name on Card"
                                type="text"
                                className="w-full p-2 border rounded"
                                value={cardDetails.name}
                                onChange={e => setCardDetails({ ...cardDetails, name: e.target.value })}
                            />
                            <button data-test-id="pay-button" type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
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