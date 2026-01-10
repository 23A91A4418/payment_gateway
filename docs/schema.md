# Database Schema Documentation

This document describes the database structure used in the Payment Gateway system.

The database is PostgreSQL and is automatically initialized and seeded on application startup.

---

## Tables Overview

1. merchants
2. orders
3. payments

---

## merchants

Stores merchant accounts used to authenticate API requests.

### Columns

id (UUID, PK)  
email (VARCHAR, UNIQUE)  
api_key (VARCHAR, UNIQUE)  
api_secret (VARCHAR)  
is_active (BOOLEAN)  
created_at (TIMESTAMP)  

### Notes

- A test merchant is automatically seeded at startup
- API authentication uses api_key + api_secret
- All protected endpoints validate against this table

---

## orders

Stores payment orders created by merchants.

### Columns

id (VARCHAR, PK, format: order_XXXXXXXXXXXXXXXX)  
merchant_id (UUID, FK → merchants.id)  
amount (INTEGER, stored in paise)  
currency (VARCHAR)  
receipt (VARCHAR, nullable)  
notes (JSONB, nullable)  
status (VARCHAR)  
created_at (TIMESTAMP)  
updated_at (TIMESTAMP)  

### Relationships

- One merchant → many orders
- Orders must belong to a valid merchant

### Notes

- Orders are created in `created` state
- Order ID format is strictly enforced for evaluation

---

## payments

Stores payment transactions against orders.

### Columns

id (VARCHAR, PK, format: pay_XXXXXXXXXXXXXXXX)  
order_id (VARCHAR, FK → orders.id)  
merchant_id (UUID, FK → merchants.id)  
amount (INTEGER)  
currency (VARCHAR)  
method (VARCHAR: upi | card)  
status (VARCHAR: processing | success | failed)  
vpa (VARCHAR, nullable)  
card_network (VARCHAR, nullable)  
card_last4 (VARCHAR, nullable)  
error_code (VARCHAR, nullable)  
error_description (VARCHAR, nullable)  
created_at (TIMESTAMP)  
updated_at (TIMESTAMP)  

### Relationships

- One order → many payments
- One merchant → many payments

### Notes

- Payments are created directly in `processing` state
- After a delay, status transitions to `success` or `failed`
- CVV and full card numbers are never stored
- Only card network and last 4 digits are persisted

---

## Referential Integrity Summary

merchants.id → orders.merchant_id  
orders.id → payments.order_id  
merchants.id → payments.merchant_id  

---

## Data Integrity Rules

- Orders cannot exist without a valid merchant
- Payments cannot exist without a valid order
- Public checkout endpoints validate merchant existence indirectly via order ownership
