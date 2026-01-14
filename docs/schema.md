#  Database Schema Documentation

The payment gateway uses **PostgreSQL** as its primary database.  
The schema is designed to support merchants, orders, and payments with strict validation and relational integrity.

---

##  Merchants Table

Stores merchant details and API credentials used for authentication.

**Table Name:** `merchants`

| Column Name  | Data Type        | Description |
|-------------|------------------|-------------|
| id          | UUID (PK)        | Unique merchant identifier (auto-generated) |
| name        | VARCHAR(255)     | Merchant name |
| email       | VARCHAR(255)     | Unique merchant email |
| api_key     | VARCHAR(64)      | API key for authentication |
| api_secret  | VARCHAR(64)      | API secret for authentication |
| webhook_url | TEXT             | Optional webhook URL |
| is_active   | BOOLEAN          | Merchant active status (default: true) |
| created_at | TIMESTAMP        | Creation timestamp |
| updated_at | TIMESTAMP        | Last update timestamp |

---

##  Orders Table

Represents payment orders created by merchants.

**Table Name:** `orders`

| Column Name  | Data Type        | Description |
|-------------|------------------|-------------|
| id          | VARCHAR(64) (PK) | Order ID (`order_` + 16 alphanumeric characters) |
| merchant_id | UUID (FK)        | References `merchants.id` |
| amount      | INTEGER          | Order amount in paise (minimum 100) |
| currency    | VARCHAR(3)       | Currency code (default: INR) |
| receipt     | VARCHAR(255)     | Optional receipt reference |
| notes       | JSONB            | Optional metadata |
| status      | VARCHAR(20)      | Order status (default: created) |
| created_at | TIMESTAMP        | Creation timestamp |
| updated_at | TIMESTAMP        | Last update timestamp |

**Constraints:**
- `amount >= 100`
- Foreign key constraint on `merchant_id`

**Indexes:**
- Index on `merchant_id` for efficient merchant-based queries

---

##  Payments Table

Tracks all payment attempts for orders.

**Table Name:** `payments`

| Column Name        | Data Type        | Description |
|-------------------|------------------|-------------|
| id                | VARCHAR(64) (PK) | Payment ID (`pay_` + 16 alphanumeric characters) |
| order_id          | VARCHAR(64) (FK) | References `orders.id` |
| merchant_id       | UUID (FK)        | References `merchants.id` |
| amount            | INTEGER          | Payment amount in paise |
| currency          | VARCHAR(3)       | Currency code (default: INR) |
| method            | VARCHAR(20)      | Payment method (`upi` or `card`) |
| status            | VARCHAR(20)      | Payment status (`processing`, `success`, `failed`) |
| vpa               | VARCHAR(255)     | Virtual Payment Address (UPI only) |
| card_network      | VARCHAR(20)      | Card network (visa, mastercard, amex, rupay, unknown) |
| card_last4        | VARCHAR(4)       | Last 4 digits of card number |
| error_code        | VARCHAR(50)      | Error code if payment fails |
| error_description | TEXT             | Error description if payment fails |
| created_at       | TIMESTAMP        | Creation timestamp |
| updated_at       | TIMESTAMP        | Last update timestamp |

**Indexes:**
- Index on `order_id`
- Index on `status`

---

##  Table Relationships

- One **merchant** can have many **orders**
- One **order** can have many **payments**
- Each **payment** belongs to:
  - One order
  - One merchant

---

##  Database Seeding

On application startup, a **test merchant** is automatically inserted if it does not already exist:

Email: test@example.com

API Key: key_test_abc123
API Secret: secret_test_xyz789
