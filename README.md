<<<<<<< HEAD
# payment_gateway
=======
###Payment Gateway System###

A full-stack Payment Gateway implementation with merchant authentication, order management, payment processing (UPI & Card), hosted checkout, and a merchant dashboard — fully Dockerized and runnable using a single command.

Features

Dockerized deployment using docker-compose

RESTful APIs for orders and payments

Merchant authentication using API Key and Secret

UPI payments with VPA validation

Card payments with Luhn algorithm and network detection

Hosted checkout page for customers

Merchant dashboard with transactions and analytics

PostgreSQL database with persistent storage

Separation of public and authenticated endpoints

Complete API, database, and UI documentation

Architecture Overview

Components:

Backend API (Node.js + Express)

Merchant Dashboard (React)

Checkout Page (React)

PostgreSQL Database

Flow:

Merchant creates orders and views transactions via Dashboard

Customers complete payments via Checkout Page

Backend API handles authentication, validation, and processing

PostgreSQL persists merchants, orders, and payments

Architecture diagram is available at:
docs/architecture.png

Project Structure
payment_gateway/
├── backend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
│
├── checkout/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
│
├── dashboard/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
│
├── docs/
│   ├── api.md
│   ├── schema.md
│   ├── ui.md
│   ├── architecture.png
│   ├── merchant-dashboard.png
│   ├── complete-payment.png
│   └── payment-success.png
│
├── docker-compose.yml
├── .env.example
└── README.md

Dockerized Setup
Prerequisites

Docker

Docker Compose

Run All Services
docker-compose up -d


Services started:

Backend API: http://localhost:8000

Merchant Dashboard: http://localhost:3000

Checkout Page: http://localhost:3001

PostgreSQL Database: port 5432

Test Merchant Credentials

These credentials are automatically seeded at startup.

API Key:    key_test_abc123
API Secret: secret_test_xyz789
Email:      test@example.com

Environment Variables

Example .env.example:

PORT=8000

DATABASE_URL=postgresql://gateway_user:gateway_pass@postgres:5432/payment_gateway

TEST_MODE=false
TEST_PAYMENT_SUCCESS=true
TEST_PROCESSING_DELAY=1000

TEST_API_KEY=key_test_abc123
TEST_API_SECRET=secret_test_xyz789
TEST_MERCHANT_EMAIL=test@example.com

API Documentation Summary

Base URL:

http://localhost:8000

Health Check
GET /health

Create Order (Authenticated)
POST /api/v1/orders
Headers:
X-Api-Key
X-Api-Secret

Get Order (Authenticated)
GET /api/v1/orders/{order_id}

Get Order (Public – Checkout)
GET /api/v1/orders/{order_id}/public

Create Payment (Authenticated)
POST /api/v1/payments

Create Payment (Public – Checkout)
POST /api/v1/payments/public

Get Payment Status
GET /api/v1/payments/{payment_id}

Test Merchant
GET /api/v1/test/merchant


Full request and response examples are available in docs/api.md.

Payment Processing Details
UPI Payments

VPA format validation (username@bank)

Simulated success rate (90 percent by default)

Card Payments

Luhn algorithm validation

Card network detection (Visa, MasterCard, etc.)

Expiry date validation

Merchant Dashboard

Capabilities:

View API Key and Secret

Total transactions count

Total successful payment amount

Payment success rate percentage

Transactions list with detailed payment data

Screenshot available at:
docs/merchant-dashboard.png

Hosted Checkout Page

Access format:

http://localhost:3001/checkout?order_id=order_xxx


Features:

Public access (no authentication)

UPI and Card payment methods

Real-time payment status polling

Screenshots:

docs/complete-payment.png

docs/payment-success.png

Database Schema

Tables:

merchants

orders

payments

Relationships:

One merchant has many orders

One order has many payments

Detailed schema documentation:
docs/schema.md

Error Codes
Code	Description
AUTHENTICATION_ERROR	Invalid API credentials
BAD_REQUEST_ERROR	Validation failure
NOT_FOUND_ERROR	Resource not found
INVALID_VPA	Invalid UPI VPA
INVALID_CARD	Card validation failed
EXPIRED_CARD	Card expired
PAYMENT_FAILED	Payment processing failed
Task Requirement Compliance

Dockerized deployment with docker-compose

RESTful APIs with fixed endpoints

Merchant authentication using API key and secret

UPI and Card payment processing with validations

Hosted checkout page with professional UI

Database persistence with correct schema and relationships

Conclusion

This project delivers a complete, production-style payment gateway system with proper authentication, validation, UI, and Docker-based deployment, satisfying all core requirements of the task.
>>>>>>> f3cdab5 (Added files to git)
