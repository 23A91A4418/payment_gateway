# Payment Gateway (Production-Ready)

A production-style payment gateway backend with async processing, refunds, idempotency, and webhook delivery with retries. Includes a merchant dashboard and a hosted checkout page for public payments.

---

## Features

### Core APIs
- Orders API (create + fetch)
- Payments API (create + fetch + list)
- Refunds API (create + fetch)

### Async Processing
- Payment processing happens asynchronously via a worker queue
- Refund processing happens asynchronously via a worker queue

### Idempotency
- Payment creation supports `Idempotency-Key` header
- Same idempotency key returns the same payment response for the same merchant

### Webhooks
- Webhook endpoints stored per merchant
- Webhook events are queued in DB and delivered asynchronously
- Retry logic with backoff schedule
- After max retries, events are marked as failed

### Apps Included
- Backend API (Node.js + Express + PostgreSQL + Redis + Bull)
- Dashboard (frontend)
- Checkout Page (frontend)

---

## Tech Stack

- Node.js (Express)
- PostgreSQL
- Redis
- Bull Queue
- Docker + Docker Compose
- React (Dashboard + Checkout Page)

---

## Repository Structure

payment_gateway/
backend/
src/
config/
controllers/
middleware/
routes/
services/
worker.js
package.json
dashboard/
checkout-page/
docker-compose.yml


---

## Getting Started (Docker)

### 1) Prerequisites
- Docker Desktop installed and running

### 2) Start the full system
From the root folder:

```bash
docker compose up --build
This will start:

PostgreSQL

Redis

Backend API

Worker

Dashboard

Checkout page

3) Verify health
curl http://localhost:8000/health
Expected response:

{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "worker": "running"
}
Test Merchant Credentials
The seeded test merchant is available for development/testing.

Get test merchant credentials
curl http://localhost:8000/api/v1/test/merchant
Expected response (example):

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com",
  "api_key": "key_test_abc123",
  "api_secret": "secret_test_xyz789",
  "seeded": true
}
API Usage (Windows CMD curl)
All protected endpoints require:

X-Api-Key

X-Api-Secret

Replace the values below if your DB uses different test keys.

1) Create an Order (Protected)
curl -X POST http://localhost:8000/api/v1/orders ^
  -H "X-Api-Key: key_test_abc123" ^
  -H "X-Api-Secret: secret_test_xyz789" ^
  -H "Content-Type: application/json" ^
  -d "{\"amount\":50000,\"currency\":\"INR\",\"receipt\":\"rcpt_123\"}"
Response:

{
  "id": "order_xxxxx",
  "amount": 50000,
  "currency": "INR",
  "receipt": "rcpt_123",
  "status": "created"
}
2) Fetch Order (Public)
curl -X GET http://localhost:8000/api/v1/orders/order_xxxxx/public
3) Create a Payment (Protected + Idempotency)
curl -X POST http://localhost:8000/api/v1/payments ^
  -H "X-Api-Key: key_test_abc123" ^
  -H "X-Api-Secret: secret_test_xyz789" ^
  -H "Idempotency-Key: abc123" ^
  -H "Content-Type: application/json" ^
  -d "{\"order_id\":\"order_xxxxx\",\"method\":\"upi\",\"vpa\":\"user@paytm\"}"
Notes:

Payment is created with status=pending

Worker later updates it to success or failed

4) Fetch Payment (Protected)
curl -X GET http://localhost:8000/api/v1/payments/pay_xxxxx ^
  -H "X-Api-Key: key_test_abc123" ^
  -H "X-Api-Secret: secret_test_xyz789"
5) Create a Payment (Public Checkout Flow)
Used by the hosted checkout page.

curl -X POST http://localhost:8000/api/v1/payments/public ^
  -H "Content-Type: application/json" ^
  -d "{\"order_id\":\"order_xxxxx\",\"method\":\"upi\",\"vpa\":\"user@paytm\"}"
6) Fetch Payment (Public)
curl -X GET http://localhost:8000/api/v1/payments/pay_xxxxx/public
This endpoint is used for checkout polling.

7) Create a Refund (Protected)
Only successful payments can be refunded.

curl -X POST http://localhost:8000/api/v1/payments/pay_xxxxx/refunds ^
  -H "X-Api-Key: key_test_abc123" ^
  -H "X-Api-Secret: secret_test_xyz789" ^
  -H "Content-Type: application/json" ^
  -d "{\"amount\":20000,\"reason\":\"customer requested\"}"
Response:

{
  "id": "rfnd_xxxxx",
  "payment_id": "pay_xxxxx",
  "amount": 20000,
  "reason": "customer requested",
  "status": "pending"
}
Worker updates refund to processed.

8) Fetch Refund (Protected)
curl -X GET http://localhost:8000/api/v1/refunds/rfnd_xxxxx ^
  -H "X-Api-Key: key_test_abc123" ^
  -H "X-Api-Secret: secret_test_xyz789"
Webhooks
Database Tables
webhook_endpoints stores merchant webhook configuration

webhook_events stores queued events and delivery attempts

Events Supported
payment.success

payment.failed

refund.processed

How delivery works
Payment/Refund worker creates a webhook event row in webhook_events

Webhook queue worker delivers it to the latest active endpoint

If delivery fails, it schedules a retry using next_retry_at

Attempts increase on each delivery attempt

After max retries, the event is marked as failed

Check webhook event status (PostgreSQL)
docker exec -it pg_gateway psql -U gateway_user -d payment_gateway -c "SELECT id,event_type,status,attempts,last_error,next_retry_at FROM webhook_events ORDER BY id DESC LIMIT 10;"
Worker Logs
API logs
docker logs -f gateway_api
Worker logs
docker logs -f gateway_worker
Dashboard
The dashboard displays:

Merchant API credentials

Transaction stats

Recent transactions

Run via Docker Compose and open the dashboard URL exposed in your compose file.

Checkout Page
Hosted checkout page supports:

Order summary display

Payment method selection (UPI/Card)

Public payment creation

Polling public payment status until success/failed

Notes
This project is designed for local development and evaluation

Uses async processing patterns found in production systems (queues + workers)

Webhooks include retry support and delivery state tracking in DB