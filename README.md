# Payment Gateway System

A full-stack Payment Gateway implementation featuring merchant authentication, order management, payment processing (UPI and Card), a hosted checkout page, and a merchant dashboard.  
The entire system is Dockerized and can be started using a single command.

---

## Features

- Dockerized deployment using docker-compose
- RESTful APIs for order creation and payment processing
- Merchant authentication using API Key and API Secret
- UPI payments with VPA format validation
- Card payments with Luhn algorithm validation and card network detection
- Hosted checkout page for customers
- Merchant dashboard with transaction analytics
- PostgreSQL database with persistent storage
- Clear separation of public and authenticated endpoints
- Fully documented APIs, database schema, and UI

---

## Architecture Overview

### Components

- Backend API (Node.js + Express)
- Merchant Dashboard (React)
- Checkout Page (React)
- PostgreSQL Database

### Flow

1. Merchant creates orders and views transactions using the Dashboard
2. Customers complete payments using the Hosted Checkout page
3. Backend API handles authentication, validation, and payment processing
4. PostgreSQL persists merchants, orders, and payments

Architecture diagram available at:

docs/architecture.png

yaml
Copy code

---

## Project Structure

payment_gateway/
├── backend/
│ ├── src/
│ ├── Dockerfile
│ └── package.json
│
├── checkout/
│ ├── src/
│ ├── Dockerfile
│ └── package.json
│
├── dashboard/
│ ├── src/
│ ├── Dockerfile
│ └── package.json
│
├── docs/
│ ├── api.md
│ ├── schema.md
│ ├── ui.md
│ ├── architecture.png
│ ├── merchant-dashboard.png
│ ├── complete-payment.png
│ └── payment-success.png
│
├── docker-compose.yml
├── .env.example
└── README.md

yaml
Copy code

---

## Dockerized Setup

### Prerequisites

- Docker
- Docker Compose

### Run All Services

docker-compose up -d

yaml
Copy code

### Services Started

- Backend API: http://localhost:8000
- Merchant Dashboard: http://localhost:3000
- Checkout Page: http://localhost:3001
- PostgreSQL Database: port 5432

---

## Test Merchant Credentials

The test merchant is automatically seeded at application startup.

Email: test@example.com
API Key: key_test_abc123
API Secret: secret_test_xyz789

yaml
Copy code

---

## Environment Variables

Create a `.env` file using the provided example.

### `.env.example`

PORT=8000

DATABASE_URL=postgresql://gateway_user:gateway_pass@postgres:5432/payment_gateway

TEST_MODE=false
TEST_PAYMENT_SUCCESS=true
TEST_PROCESSING_DELAY=1000

TEST_MERCHANT_EMAIL=test@example.com
TEST_API_KEY=key_test_abc123
TEST_API_SECRET=secret_test_xyz789

yaml
Copy code

---

## API Documentation Summary

Base URL:

http://localhost:8000

shell
Copy code

### Health Check

GET /health

yaml
Copy code

---

### Create Order (Authenticated)

POST /api/v1/orders

makefile
Copy code

Headers:
X-Api-Key
X-Api-Secret

yaml
Copy code

---

### Get Order (Authenticated)

GET /api/v1/orders/{order_id}

yaml
Copy code

---

### Get Order (Public – Checkout)

GET /api/v1/orders/{order_id}/public

yaml
Copy code

---

### Create Payment (Authenticated)

POST /api/v1/payments

yaml
Copy code

---

### Create Payment (Public – Checkout)

POST /api/v1/payments/public

yaml
Copy code

---

### Get Payment Status

GET /api/v1/payments/{payment_id}

yaml
Copy code

---

### Test Merchant Endpoint

GET /api/v1/test/merchant

sql
Copy code

Full request and response examples are available in:

docs/api.md

yaml
Copy code

---

## Payment Processing Details

### UPI Payments

- VPA format validation: `username@bank`
- Simulated success rate (90 percent by default)
- Always passes through `processing` state before final status

### Card Payments

- Full Luhn algorithm validation
- Card network detection (Visa, MasterCard, etc.)
- Expiry date validation
- Only last 4 digits stored (never full card number)

---

## Merchant Dashboard

### Capabilities

- View API Key and API Secret
- View total transactions
- View total successful payment amount
- View payment success rate
- View detailed transaction list

Screenshot available at:

docs/merchant-dashboard.png

yaml
Copy code

---

## Hosted Checkout Page

### Access Format

http://localhost:3001/checkout?order_id=order_xxxxxxxxxxxxxxxx

markdown
Copy code

### Features

- Public access (no authentication)
- UPI and Card payment options
- Real-time payment status polling
- Professional and clean UI

Screenshots:

docs/complete-payment.png
docs/payment-success.png

yaml
Copy code

---

## Database Schema

### Tables

- merchants
- orders
- payments

### Relationships

- One merchant has many orders
- One order has many payments

Detailed schema documentation:

docs/schema.md

yaml
Copy code

---

## Error Codes

| Code                  | Description                      |
|-----------------------|----------------------------------|
| AUTHENTICATION_ERROR  | Invalid API credentials          |
| BAD_REQUEST_ERROR     | Validation failure               |
| NOT_FOUND_ERROR       | Resource not found               |
| INVALID_VPA           | Invalid UPI VPA                  |
| INVALID_CARD          | Card validation failed           |
| EXPIRED_CARD          | Card expired                     |
| PAYMENT_FAILED        | Payment processing failed        |

---

## Task Requirement Compliance

- Dockerized deployment with docker-compose
- RESTful APIs with fixed endpoints
- Merchant authentication using API key and secret
- UPI and Card payment processing with proper validations
- Hosted checkout page with professional UI
- Database persistence with correct schema and relationships

---

## Conclusion

This project delivers a complete, production-style payment gateway system with secure authentication, validated payment processing, professional UI, and Docker-based deployment, fully satisfying all core task requirements.