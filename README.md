Payment Gateway System with Hosted Checkout

This repository contains a complete, Dockerized payment gateway implementation inspired by real-world platforms such as Stripe and Razorpay.
The system supports merchant authentication, order creation, multi-method payment processing (UPI and Card), and a publicly accessible hosted checkout page, along with a merchant dashboard.

The project focuses on backend correctness, payment lifecycle management, API security, and seamless frontend–backend integration.

Key Capabilities

Merchant authentication using API Key and API Secret

REST APIs for creating and querying orders

Payment processing with:

UPI payments with strict VPA validation

Card payments with Luhn algorithm validation, expiry checks, and network detection

Public hosted checkout page for customer payments

Merchant dashboard for viewing credentials and transaction statistics

Deterministic test mode for automated evaluation

Fully containerized setup using Docker Compose

PostgreSQL persistence with automatic schema creation and seeding

High-Level Architecture
Core Components

Backend API (Node.js + Express)
Handles authentication, order management, payment processing, and validation logic.

PostgreSQL Database
Stores merchants, orders, and payments with proper relational integrity.

Merchant Dashboard (React + Nginx)
Allows merchants to view API credentials, transaction metrics, and payment history.

Checkout Page (React + Nginx)
Public-facing payment page used by customers to complete payments.

Docker-Based Deployment
Requirements

Docker

Docker Compose

Running the Application
docker-compose up -d --build


All services are started together with a single command.

Exposed Services
Component	Address
Backend API	http://localhost:8000

Merchant Dashboard	http://localhost:3000

Checkout Page	http://localhost:3001
Test Merchant Details

A test merchant is automatically created when the backend starts.

Email: test@example.com

API Key: key_test_abc123

API Secret: secret_test_xyz789

No manual database setup or merchant creation is required.

Environment Variables

A sample environment configuration is provided in .env.example.
It documents all environment variables used by the backend, including database connection details and test-mode flags.

API Overview
Health Check

GET /health

Returns system readiness and dependency status.

{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "worker": "running",
  "timestamp": "2026-01-10T12:30:00.000Z"
}

Create Order (Authenticated)

POST /api/v1/orders

Headers

X-Api-Key

X-Api-Secret

{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_123",
  "notes": {
    "customer_name": "John Doe"
  }
}

Create Payment (Authenticated)

POST /api/v1/payments

UPI Payment
{
  "order_id": "order_xxxxxxxxxxxxxxxx",
  "method": "upi",
  "vpa": "user@paytm"
}

Card Payment
{
  "order_id": "order_xxxxxxxxxxxxxxxx",
  "method": "card",
  "card": {
    "number": "4111111111111111",
    "expiry_month": "12",
    "expiry_year": "2026",
    "cvv": "123",
    "holder_name": "John Doe"
  }
}

Hosted Checkout Flow
Checkout URL Format
http://localhost:3001/checkout?order_id=<ORDER_ID>

Payment Flow

Checkout page fetches order details using a public API

Customer selects UPI or Card payment method

Payment is created and enters the processing state

Final status transitions to success or failed

UI updates automatically based on payment status

All required data-test-id attributes are implemented to support automated UI testing.

Database Design
Tables

merchants

orders

payments

Relationships

One merchant can create multiple orders

Each order can have multiple associated payments

Deterministic Test Mode

To support predictable automated evaluation, the system includes a test mode:

TEST_MODE=true
TEST_PAYMENT_SUCCESS=true
TEST_PROCESSING_DELAY=1000


When enabled, payment outcomes and delays become deterministic.

