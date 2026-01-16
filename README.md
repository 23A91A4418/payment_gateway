# Payment Gateway System

A production-style payment gateway implementation with Orders, Payments, Refunds, asynchronous processing using Redis queues, and webhook delivery with retry handling. The project runs fully using Docker Compose and includes a hosted checkout page and a dashboard UI.

---

## Features

### Core APIs
- Orders API (create and fetch)
- Payments API
  - Protected merchant payments
  - Public payments for checkout flow
  - Asynchronous payment processing via worker
- Refunds API
  - Refund creation with validation
  - Asynchronous refund processing via worker

### Reliability and Delivery
- Redis + Bull queue-based background processing
- Webhooks
  - Event persistence in database
  - HMAC SHA256 signature support
  - Retry scheduling using `next_retry_at`
  - Delivery status tracking (`pending`, `delivered`, `failed`)
- Idempotency support for payment creation using `Idempotency-Key`

### Deployment
- Docker Compose orchestration for:
  - PostgreSQL
  - Redis
  - API service
  - Worker service
  - Dashboard UI
  - Checkout UI

---

## Tech Stack

- Backend: Node.js, Express
- Database: PostgreSQL
- Queue: Redis + Bull
- Webhook Delivery: Axios + HMAC SHA256
- Containerization: Docker, Docker Compose
- Frontend: React (Dashboard, Checkout Page)

---

## Repository Structure

payment_gateway/
backend/
src/
config/
db.js
controllers/
orderController.js
paymentController.js
refundController.js
testController.js
middleware/
authMiddleware.js
routes/
orderRoutes.js
paymentRoutes.js
refundRoutes.js
testRoutes.js
services/
validationService.js
webhookService.js
index.js
worker.js
Dockerfile
Dockerfile.worker
package.json
dashboard/
checkout-page/
docker-compose.yml
README.md


---

## Prerequisites

- Docker Desktop
- Git

---

## Running the Project (Docker)

From the repository root:

```bash
docker compose up --build
Services:

API: http://localhost:8000

Dashboard UI: http://localhost:3000

Checkout UI: http://localhost:3001

PostgreSQL: localhost:5432

Redis: localhost:6379

To stop:

docker compose down
Health Check
curl http://localhost:8000/health
Expected response contains:

database: connected

redis: connected

status: healthy

Test Merchant Credentials
A test merchant is seeded automatically.

Fetch test merchant credentials:

curl http://localhost:8000/api/v1/test/merchant
Example response:

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com",
  "api_key": "key_test_abc123",
  "api_secret": "secret_test_xyz789",
  "seeded": true
}
These credentials are required for protected endpoints.

API Authentication
Protected endpoints require headers:

X-Api-Key

X-Api-Secret

Example:

-H "X-Api-Key: key_test_abc123"
-H "X-Api-Secret: secret_test_xyz789"
Public endpoints are designed for checkout use and do not require authentication.

API Endpoints
Orders
Create Order (Protected)
curl -X POST http://localhost:8000/api/v1/orders ^
  -H "X-Api-Key: key_test_abc123" ^
  -H "X-Api-Secret: secret_test_xyz789" ^
  -H "Content-Type: application/json" ^
  -d "{\"amount\":50000,\"currency\":\"INR\",\"receipt\":\"rcpt_123\"}"
Get Order (Protected)
curl -X GET http://localhost:8000/api/v1/orders/ORDER_ID ^
  -H "X-Api-Key: key_test_abc123" ^
  -H "X-Api-Secret: secret_test_xyz789"
Get Order (Public)
curl -X GET http://localhost:8000/api/v1/orders/ORDER_ID/public
Payments
Create Payment (Protected)
curl -X POST http://localhost:8000/api/v1/payments ^
  -H "X-Api-Key: key_test_abc123" ^
  -H "X-Api-Secret: secret_test_xyz789" ^
  -H "Content-Type: application/json" ^
  -d "{\"order_id\":\"ORDER_ID\",\"method\":\"upi\",\"vpa\":\"user@paytm\"}"
Create Payment (Public Checkout)
curl -X POST http://localhost:8000/api/v1/payments/public ^
  -H "Content-Type: application/json" ^
  -d "{\"order_id\":\"ORDER_ID\",\"method\":\"upi\",\"vpa\":\"user@paytm\"}"
Get Payment (Protected)
curl -X GET http://localhost:8000/api/v1/payments/PAYMENT_ID ^
  -H "X-Api-Key: key_test_abc123" ^
  -H "X-Api-Secret: secret_test_xyz789"
Get Payment (Public)
curl -X GET http://localhost:8000/api/v1/payments/PAYMENT_ID/public
List Payments (Protected)
curl -X GET http://localhost:8000/api/v1/payments ^
  -H "X-Api-Key: key_test_abc123" ^
  -H "X-Api-Secret: secret_test_xyz789"
Dashboard Stats (Protected)
curl -X GET http://localhost:8000/api/v1/payments/dashboard-stats ^
  -H "X-Api-Key: key_test_abc123" ^
  -H "X-Api-Secret: secret_test_xyz789"
Idempotency
Payment creation supports idempotency using the Idempotency-Key header.

Example (Protected Payment):

curl -X POST http://localhost:8000/api/v1/payments ^
  -H "X-Api-Key: key_test_abc123" ^
  -H "X-Api-Secret: secret_test_xyz789" ^
  -H "Idempotency-Key: abc123" ^
  -H "Content-Type: application/json" ^
  -d "{\"order_id\":\"ORDER_ID\",\"method\":\"upi\",\"vpa\":\"user@paytm\"}"
Running the same request again with the same idempotency key returns the same payment response.

To verify stored keys:

docker exec -it pg_gateway psql -U gateway_user -d payment_gateway -c "SELECT key, merchant_id, expires_at FROM idempotency_keys;"
Refunds
Refunds are only allowed when:

Payment exists and belongs to the merchant

Payment status is success

Refund amount does not exceed refundable balance

Create Refund (Protected)
curl -X POST http://localhost:8000/api/v1/payments/PAYMENT_ID/refunds ^
  -H "X-Api-Key: key_test_abc123" ^
  -H "X-Api-Secret: secret_test_xyz789" ^
  -H "Content-Type: application/json" ^
  -d "{\"amount\":20000,\"reason\":\"customer requested\"}"
Get Refund (Protected)
curl -X GET http://localhost:8000/api/v1/refunds/REFUND_ID ^
  -H "X-Api-Key: key_test_abc123" ^
  -H "X-Api-Secret: secret_test_xyz789"
Asynchronous Worker Processing
Payments and refunds are processed asynchronously by the worker service.

Payment is created with status pending

Worker updates payment status to success or failed

Refund is created with status pending

Worker updates refund status to processed

View worker logs:

docker logs -f gateway_worker
Webhooks
Webhook endpoints are stored per merchant in webhook_endpoints.

Webhook events are stored in webhook_events and delivered by the worker:

Successful delivery updates status to delivered

Failed delivery updates status to pending with next_retry_at

Attempts are tracked in attempts

Delivery uses HMAC SHA256 signature

Verify Webhook Endpoints
docker exec -it pg_gateway psql -U gateway_user -d payment_gateway -c "SELECT id, merchant_id, url, secret, is_active, created_at FROM webhook_endpoints;"
Verify Webhook Events
docker exec -it pg_gateway psql -U gateway_user -d payment_gateway -c "SELECT id, event_type, status, attempts, last_error, next_retry_at FROM webhook_events ORDER BY id DESC LIMIT 10;"
Webhook Headers Sent
X-Webhook-Signature: HMAC SHA256 signature of payload

X-Webhook-Event: event type

Example event types:

payment.success

payment.failed

refund.processed

Testing Webhook Retry
To test retry behavior:

Set webhook URL to an invalid endpoint or one returning 404.

Trigger a payment.

Check webhook_events table and confirm:

status remains pending

attempts increases

next_retry_at is scheduled

Query:

docker exec -it pg_gateway psql -U gateway_user -d payment_gateway -c "SELECT id, event_type, status, attempts, last_error, next_retry_at FROM webhook_events ORDER BY id DESC LIMIT 5;"
Frontend Applications
Dashboard
URL: http://localhost:3000

Displays merchant stats and transactions

Checkout Page
URL: http://localhost:3001

Public flow using:

GET order public endpoint

POST payment public endpoint

Poll payment status via public payment endpoint

Common Issues
Curl multi-line commands failing in Windows
Use ^ for line continuation in CMD. Do not use \.

Containers not starting cleanly
Rebuild:

docker compose down
docker compose up --build

Submission Notes
This project demonstrates:

API design for payment workflows

background job processing using queues

persistence and retry mechanisms for webhook delivery

idempotency handling

Dockerized local environment for evaluation

