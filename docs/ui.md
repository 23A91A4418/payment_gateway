# User Interface Documentation

This document describes the frontend components of the Payment Gateway system.

The system contains two frontend applications:

1. Merchant Dashboard (Port 3000)
2. Checkout Page (Port 3001)

Both are fully Dockerized and served via docker-compose.

---

## Merchant Dashboard (Port 3000)

### Purpose

Allows merchants to:
- Log in using test credentials
- View API credentials
- Monitor transaction statistics
- View transaction history

---

### Login Page

URL:
/login

Features:
- Simple login form
- Uses pre-seeded test merchant
- Password is not validated for Deliverable 1

Required data-test-id attributes:
- login-form
- email-input
- password-input
- login-button

Successful login redirects to:
/dashboard

---

### Dashboard Home

URL:
/dashboard

Displays:
- API Key
- API Secret
- Transaction statistics

Statistics Calculated:
- total-transactions → count of all payments
- total-amount → sum of successful payments
- success-rate → (successful payments / total payments) × 100

Required data-test-id attributes:
- dashboard
- api-credentials
- api-key
- api-secret
- stats-container
- total-transactions
- total-amount
- success-rate

---

### Transactions Page

URL:
/dashboard/transactions

Displays a table of all payments for the merchant.

Table columns:
- Payment ID
- Order ID
- Amount
- Method
- Status
- Created At

Required data-test-id attributes:
- transactions-table
- transaction-row
- payment-id
- order-id
- amount
- method
- status
- created-at

---

## Checkout Page (Port 3001)

### Purpose

Allows customers to complete payments for a given order.

---

### Checkout URL

http://localhost:3001/checkout?order_id={order_id}

The order_id query parameter is mandatory.

---

### Checkout Flow

1. Page loads with order_id
2. Fetches order details using public API
3. Displays order summary
4. Customer selects payment method
5. Customer submits payment details
6. Payment is created using public payment API
7. UI shows processing state
8. Page polls payment status every 2 seconds
9. Final success or failure state is shown

---

### Payment Methods Supported

UPI:
- VPA format validation
- Example: user@paytm

Card:
- Luhn algorithm validation
- Card network detection
- Expiry date validation
- Only last 4 digits are stored

---

### UI States

Idle:
- Shows payment method selection

Processing:
- Displays spinner and "Processing payment..."

Success:
- Displays payment ID
- Shows success message

Failure:
- Displays error message
- Retry option available

---

### Required data-test-id attributes

- checkout-container
- order-summary
- order-amount
- order-id
- payment-methods
- method-upi
- method-card
- upi-form
- vpa-input
- card-form
- card-number-input
- expiry-input
- cvv-input
- cardholder-name-input
- pay-button
- processing-state
- processing-message
- success-state
- success-message
- error-state
- error-message
- retry-button

---

## Styling Notes

- Inline styles are used (no external CSS dependency)
- Clean, minimal, professional UI
- Responsive and evaluator-friendly
