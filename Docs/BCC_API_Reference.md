# BCC API Reference

**Version:** v0.6.0
**Date:** March 7, 2026
**Base URL:** `http://localhost:3001/api`
**Health Check:** `GET http://localhost:3001/health`

---

## Global Conventions

### Authentication
All protected routes require:
```
Authorization: Bearer <jwt_token>
```
Tokens are obtained from `/api/auth/login` or `/api/auth/register`. Tokens expire in 24 hours.

### Response Shape
All responses follow a consistent envelope:

**Success:**
```json
{ "success": true, "data": {...}, "message": "Success" }
```

**List with pagination:**
```json
{
  "success": true,
  "data": [...],
  "message": "Success",
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

**Error:**
```json
{ "success": false, "data": null, "error": "ERROR_CODE", "message": "Human-readable message" }
```

### Common Error Codes
| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `VALIDATION_ERROR` | 400/422 | Input failed validation |
| `NOT_FOUND` | 404 | Resource does not exist |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Authenticated but insufficient role |
| `DUPLICATE_ENTRY` | 409 | Unique constraint violation |
| `BUSINESS_RULE` | 422 | Business logic constraint violated |
| `RATE_LIMIT` | 429 | Too many requests |
| `NO_CHANGES` | 400 | PATCH sent with no valid fields |
| `OVERPAYMENT` | 422 | Payment exceeds order total |

### Role Hierarchy
`readonly` < `staff` < `admin` < `owner`

`requireMinRole('staff')` means staff, admin, and owner are all permitted.

### Rate Limiting
- **Auth routes** (`/api/auth`): 20 requests per 15 minutes per IP
- **All other routes**: 500 requests per 15 minutes per IP

### Data Types
- All primary keys and foreign keys: **UUID**
- All timestamps: **TIMESTAMPTZ** (ISO 8601 in responses)
- All monetary values: **NUMERIC(12,2)**
- Pagination defaults: `page=1`, `limit=20` (max 100 unless noted)

### Dates and Timezones
All dates are stored and returned in UTC (ISO 8601 format). Clients in UTC+3 (Jordan/KSA) should convert timestamps to local time for display purposes. Date-only fields submitted as YYYY-MM-DD are interpreted as midnight UTC, which may appear as the previous calendar day when viewed in UTC+3. Frontend implementations must account for this in all date display components and date range filter inputs.

---

## 1. Auth — `/api/auth`

> No authentication required on `/register` or `/login`.
> Auth rate limiter applies to all four endpoints (20 req/15 min).

### POST /api/auth/register
Create a new organization with an owner account.

**Request body:**
```json
{
  "org_name": "Acme Corp",
  "country": "US",
  "currency": "USD",
  "name": "Alice",
  "email": "alice@example.com",
  "password": "securepassword"
}
```
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `org_name` | string | Yes | Organization name |
| `country` | string | No | Country code/name |
| `currency` | string | No | e.g. "USD" |
| `name` | string | Yes | Owner's display name |
| `email` | string | Yes | Must be unique |
| `password` | string | Yes | 8–72 characters |

**Response: 201**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "Alice", "email": "alice@example.com", "role": "owner" },
    "org": { "id": "uuid", "name": "Acme Corp" },
    "token": "eyJ..."
  },
  "message": "Registration successful"
}
```

---

### POST /api/auth/login
Authenticate and receive a JWT token.

**Request body:**
```json
{ "email": "alice@example.com", "password": "securepassword" }
```

**Response: 200**
```json
{
  "success": true,
  "data": { "id": "uuid", "name": "Alice", "email": "alice@example.com", "role": "owner", "org_id": "uuid" },
  "token": "eyJ...",
  "message": "Login successful"
}
```

**Lockout:** 5 consecutive failed attempts within 15 minutes → 429 for 15 minutes. Lockout events are recorded in the audit log.

---

### GET /api/auth/me
`authenticate`

Returns the currently authenticated user's profile.

**Response: 200**
```json
{
  "success": true,
  "data": { "id": "uuid", "name": "Alice", "email": "alice@example.com", "role": "owner", "org_id": "uuid" },
  "message": "Success"
}
```

---

### PATCH /api/auth/password
`authenticate`

Change the authenticated user's password.

**Request body:**
```json
{ "current_password": "old_pass", "new_password": "new_pass_8+_chars" }
```
`new_password`: 8–72 characters.

**Response: 200**
```json
{ "success": true, "data": null, "message": "Password updated" }
```

---

## 2. Organizations — `/api/organizations`

> All routes require `authenticate`.

### GET /api/organizations/me
Returns the authenticated user's organization.

**Response: 200**
```json
{
  "success": true,
  "data": { "id": "uuid", "name": "Acme Corp", "country": "US", "currency": "USD", "created_at": "...", "updated_at": "..." },
  "message": "Success"
}
```

---

### PATCH /api/organizations/me
`requireMinRole('admin')`

Update organization settings.

**Request body (all optional):**
```json
{ "name": "New Name", "country": "AE", "currency": "AED" }
```

**Response: 200** — Returns updated organization object.

---

## 3. Branches — `/api/branches`

> All routes require `authenticate`.

### GET /api/branches
List active branches for the organization.

**Query params:** `search`, `page`, `limit`

**Response: 200** — Paginated list of branches.

---

### POST /api/branches
`requireMinRole('admin')`

**Request body:**
```json
{ "name": "Main Branch", "city": "Dubai" }
```
| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | max 255 chars |
| `city` | No | max 255 chars |

**Response: 201**

---

### GET /api/branches/:id
Returns a single active branch.

**Response: 200 / 404**

---

### PATCH /api/branches/:id
`requireMinRole('admin')`

**Request body (all optional):** `name`, `city`

**Response: 200**

---

### DELETE /api/branches/:id
`requireMinRole('owner')`

Soft-deletes the branch (`active = FALSE`).

**Response: 200** `{ "message": "Branch deactivated" }`

---

## 4. Locations — `/api/locations`

> All routes require `authenticate`.
> Locations belong to branches. Only active locations of active branches are returned.

### GET /api/locations
**Query params:** `search`, `branch_id` (UUID), `page`, `limit`

**Response: 200** — Each row includes `branch_name`.

---

### POST /api/locations
`requireMinRole('admin')`

**Request body:**
```json
{ "branch_id": "uuid", "name": "Warehouse A", "type": "warehouse" }
```
| Field | Required | Values |
|-------|----------|--------|
| `branch_id` | Yes | UUID of existing branch in org |
| `name` | Yes | max 255 chars |
| `type` | Yes | `warehouse` or `store` |

**Response: 201**

---

### GET /api/locations/:id
**Response: 200 / 404**

---

### PATCH /api/locations/:id
`requireMinRole('admin')`

**Request body (all optional):** `name`, `type`

**Response: 200**

---

### DELETE /api/locations/:id
`requireMinRole('owner')`

Soft-deletes the location (`active = FALSE`).

**Response: 200** `{ "message": "Location deactivated" }`

---

## 5. Users — `/api/users`

> All routes require `authenticate`.

### GET /api/users
`requireMinRole('admin')`

**Query params:** `search`, `page`, `limit`

**Response: 200** — Each row includes `role` (joined from `roles` table).

---

### POST /api/users
`requireMinRole('admin')`

Create a new user in the organization.

**Request body:**
```json
{ "name": "Bob", "email": "bob@example.com", "password": "pass1234", "role": "staff" }
```
| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | |
| `email` | Yes | Must be globally unique |
| `password` | Yes | 8–72 characters |
| `role` | Yes | `admin`, `staff`, or `readonly` |

> Only `owner` can create `admin` users. An `admin` creating another `admin` returns 403.

**Response: 201**

---

### GET /api/users/:id
`requireMinRole('admin')`

**Response: 200 / 404**

---

### PATCH /api/users/:id
`requireMinRole('admin')`

**Request body (all optional):** `name`, `role`, `active`

- Cannot modify your own role or deactivate yourself.
- Cannot assign the `owner` role via this endpoint.
- Cannot modify an `owner` account unless you are also an `owner`.

**Response: 200**

---

### DELETE /api/users/:id
`requireMinRole('owner')`

Soft-deactivates the user (`active = FALSE`). Cannot delete yourself. Cannot delete the last owner.

**Response: 200** `{ "message": "User deactivated" }`

---

## 6. Categories — `/api/categories`

> All routes require `authenticate`.
> Categories are org-scoped. Name must be unique within an org. Hard-deleted (not soft-deleted).

### GET /api/categories
**Query params:** `search`, `page`, `limit`

### POST /api/categories
`requireMinRole('admin')` — Body: `{ "name": "Electronics" }`

### GET /api/categories/:id

### PATCH /api/categories/:id
`requireMinRole('admin')` — Body: `{ "name": "New Name" }`

### DELETE /api/categories/:id
`requireMinRole('admin')` — Hard delete. Will fail if products reference this category (FK constraint).

---

## 7. Units — `/api/units`

> All routes require `authenticate`.
> Units can be system-global (`organization_id IS NULL`) or org-specific. System units cannot be modified or deleted. Hard-deleted (org-owned units only).

### GET /api/units
Returns both org-specific and system global units. **Query params:** `search`, `page`, `limit`

### POST /api/units
`requireMinRole('admin')` — Body: `{ "name": "Piece" }` (max 100 chars)

### GET /api/units/:id

### PATCH /api/units/:id
`requireMinRole('admin')` — Body: `{ "name": "New Name" }`. Cannot update system units (404).

### DELETE /api/units/:id
`requireMinRole('admin')` — Hard delete. Cannot delete system units (404).

---

## 8. Products — `/api/products`

> All routes require `authenticate`.

### GET /api/products
**Query params:** `search` (name/sku/barcode), `category_id`, `active` (true/false), `page`, `limit`

**Response:** Each row includes `category_name`, `unit_name`.

---

### POST /api/products
`requireMinRole('admin')`

**Request body:**
```json
{
  "name": "Widget A",
  "sku": "WGT-001",
  "barcode": "1234567890",
  "price": 29.99,
  "cost": 15.00,
  "low_stock_threshold": 10,
  "category_id": "uuid",
  "unit_id": "uuid"
}
```
All fields except `name` are optional/nullable. SKU and barcode must be unique within the organization.

**Response: 201**

---

### GET /api/products/:id
Returns product with:
- `variants`: array of product variants (with `effective_price`, `effective_cost`)
- `stock_by_location`: current stock on hand per location

**Response: 200 / 404**

---

### PATCH /api/products/:id
`requireMinRole('admin')`

**Request body (all optional):** `name`, `sku`, `barcode`, `price`, `cost`, `low_stock_threshold`, `category_id`, `unit_id`, `active`

**Response: 200**

---

### DELETE /api/products/:id
`requireMinRole('admin')`

Soft-deletes (`active = FALSE`). Returns updated product row.

**Response: 200** `{ "message": "Product deactivated" }`

---

## 9. Product Variants — `/api/products/:productId/variants`

> Inherited `authenticate` from the products router. Product must belong to the org.

### GET /api/products/:productId/variants
Returns all variants for a product.

### POST /api/products/:productId/variants
`requireMinRole('admin')`

**Request body:**
```json
{ "name": "Red / Large", "sku": "WGT-001-RL", "barcode": null, "price": 32.99, "cost": 16.00 }
```
`price` and `cost`: if `null`, the variant inherits the parent product's values.

**Response: 201**

---

### GET /api/products/:productId/variants/:id

### PATCH /api/products/:productId/variants/:id
`requireMinRole('admin')`

**Request body (all optional):** `name`, `sku`, `barcode`, `price`, `cost`, `active`

### DELETE /api/products/:productId/variants/:id
`requireMinRole('admin')`

Soft-deactivates (`active = FALSE`).

**Response: 200** `{ "message": "Variant deactivated" }`

---

## 10. Customers — `/api/customers`

> All routes require `authenticate`.

### GET /api/customers
**Query params:** `search` (name/phone/email), `page`, `limit`

### POST /api/customers
`requireMinRole('staff')`

**Request body:**
```json
{ "name": "Jane Smith", "phone": "+971501234567", "email": "jane@example.com", "address": "Dubai, UAE" }
```
All except `name` are optional.

**Response: 201**

---

### GET /api/customers/:id
Returns customer with `notes` array (each note includes `created_by_name`). Also returns `credit_balance`.

### PATCH /api/customers/:id
`requireMinRole('staff')`

**Request body (all optional):** `name`, `phone`, `email`, `address`

### DELETE /api/customers/:id
`requireMinRole('admin')`

Soft-deactivates (`active = FALSE`).

**Response: 200** `{ "message": "Customer deactivated" }`

---

### POST /api/customers/:id/notes
`requireMinRole('staff')`

Append a note to a customer record.

**Request body:** `{ "note": "Called to confirm order" }`

**Response: 201** — Returns the new note row.

---

## 11. Suppliers — `/api/suppliers`

> All routes require `authenticate`.

### GET /api/suppliers
**Query params:** `search` (name/contact_person), `page`, `limit`

### POST /api/suppliers
`requireMinRole('admin')`

**Request body:**
```json
{ "name": "Acme Supplies", "phone": "...", "email": "...", "address": "...", "contact_person": "John" }
```
All except `name` are optional.

**Response: 201**

---

### GET /api/suppliers/:id

### PATCH /api/suppliers/:id
`requireMinRole('admin')`

**Request body (all optional):** `name`, `phone`, `email`, `address`, `contact_person`

### DELETE /api/suppliers/:id
`requireMinRole('admin')`

Soft-deactivates (`active = FALSE`).

**Response: 200** `{ "message": "Supplier deactivated" }`

---

## 12. Transfers — `/api/transfers`

> All routes require `authenticate`.
> Transfers move stock between locations. Stock moves only when confirmed (`POST /:id/confirm`).

### GET /api/transfers
**Query params:** `status` (`pending`, `completed`, `cancelled`), `page`, `limit`

**Response:** Each row includes `from_location_name`, `to_location_name`, `created_by_name`.

---

### POST /api/transfers
`requireMinRole('staff')`

Create a transfer in `pending` status.

> **Important:** Stock does NOT move at transfer creation. Stock only moves when the transfer is confirmed via `POST /api/transfers/:id/confirm`.

> **Frontend Note:** Before submitting a transfer, the UI should check available stock at the source location and prevent submission if quantity exceeds `stock_on_hand`. Display live stock availability to the user on the transfer creation form.

**Request body:**
```json
{
  "from_location_id": "uuid",
  "to_location_id": "uuid",
  "note": "Monthly restock",
  "items": [
    { "product_id": "uuid", "variant_id": null, "quantity": 10 }
  ]
}
```
- `from_location_id` and `to_location_id` must be different.
- Both locations must belong to the organization.
- At least one item required.

**Response: 201**

---

### GET /api/transfers/:id
Returns transfer with `items` array (each includes `product_name`, `variant_name`).

---

### POST /api/transfers/:id/confirm
`requireMinRole('admin')`

Confirms the transfer: writes `transfer_out` ledger entries for the source and `transfer_in` ledger entries for the destination. Updates status to `completed`.

Only `pending` transfers can be confirmed.

**Response: 200** `{ "message": "Transfer confirmed and stock updated" }`

---

### POST /api/transfers/:id/cancel
`requireMinRole('admin')`

Cancels the transfer. Only `pending` transfers can be cancelled. No stock movement occurs.

**Response: 200** `{ "message": "Transfer cancelled" }`

---

## 13. Purchase Orders — `/api/purchase-orders`

> All routes require `authenticate`.

### Status flow:
`draft` → `submitted` → `partially_received` / `received` → *(terminal)*
`draft` / `submitted` / `partially_received` → `cancelled`

### GET /api/purchase-orders
**Query params:** `status`, `supplier_id`, `page`, `limit`

**Response:** Each row includes `supplier_name`, `location_name`, `created_by_name`.

---

### POST /api/purchase-orders
`requireMinRole('admin')`

**Request body:**
```json
{
  "supplier_id": "uuid",
  "location_id": "uuid",
  "expected_date": "2026-04-01",
  "note": "Urgent reorder",
  "items": [
    { "product_id": "uuid", "variant_id": null, "quantity": 50, "unit_cost": 12.50 }
  ]
}
```
- `expected_date`, `note` are optional.
- `variant_id` is optional per item.
- At least one item required.

Created in `draft` status.

**Response: 201**

---

### GET /api/purchase-orders/:id
Returns PO with:
- `items`: array of line items with `product_name`, `variant_name`
- `receipts`: array of goods receipts (id, received_at, note, created_by_name)

---

### PATCH /api/purchase-orders/:id/status
`requireMinRole('admin')`

**Request body:**
```json
{ "status": "submitted" }
```
Valid values: `submitted`, `partially_received`, `received`, `cancelled`.

Transitions are enforced — invalid transitions return 422.

**Response: 200**

---

### POST /api/purchase-orders/:id/receive
`requireMinRole('staff')`

Record a goods receipt. Creates a `goods_receipts` record, `goods_receipt_items`, and writes `purchase` stock ledger entries. Automatically updates PO status to `partially_received` or `received`.

Only POs in `submitted` or `partially_received` status can receive goods.

**Request body:**
```json
{
  "note": "Partial shipment received",
  "items": [
    { "purchase_order_item_id": "uuid", "quantity_received": 25 },
    { "product_id": "uuid", "quantity_received": 10 }
  ]
}
```
Each item requires either `purchase_order_item_id` OR `product_id` (not both required, but at least one).

**Response: 201** — Returns the `goods_receipt` row.

---

## 14. Sales Orders — `/api/sales-orders`

> All routes require `authenticate`.
> Stock is deducted immediately at order creation. Cancelled orders restore stock.

### Status flow (manual transitions via PATCH /:id/status):
`pending` → `processing` / `cancelled`
`partially_paid` → `processing` / `cancelled`
`paid` → `processing` / `shipped`
`processing` → `shipped` / `cancelled`
`shipped` → `delivered`
`delivered` → *(terminal)*
`cancelled` → *(terminal)*

> `paid` and `partially_paid` are set automatically by the payments system — cannot be set manually.

### GET /api/sales-orders
**Query params:** `status`, `channel`, `customer_id`, `location_id`, `page`, `limit`

Valid statuses: `pending`, `partially_paid`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`
Valid channels: `in_store`, `whatsapp`, `instagram`, `snapchat`, `tiktok`, `online`, `other`

**Response:** Each row includes `customer_name`, `location_name`, `user_name`.

---

### POST /api/sales-orders
`requireMinRole('staff')`

**Request body:**
```json
{
  "location_id": "uuid",
  "customer_id": "uuid",
  "channel": "in_store",
  "discount": 5.00,
  "tax": 2.50,
  "note": "Walk-in customer",
  "items": [
    { "product_id": "uuid", "variant_id": null, "quantity": 2, "price": 29.99, "discount": 0 }
  ]
}
```
- `customer_id`, `channel`, `discount`, `tax`, `note` are optional.
- Item `price`: if omitted, uses the variant price or product price from the database.
- Item `discount`: per-line item discount amount.
- `total = subtotal - order_discount + tax`. Total cannot be negative.
- Stock is deducted immediately for each item.

> **Frontend Note:** Quantity inputs should be capped at the current `stock_on_hand` value for the selected location in real time. This prevents overselling attempts from reaching the API and provides immediate feedback to the user.

**Response: 201** — Returns the sales_order row (without items).

---

### GET /api/sales-orders/:id
Returns order with:
- `items`: line items with `product_name`, `variant_name`
- `payments`: all payments for this order

---

### PATCH /api/sales-orders/:id/status
`requireMinRole('staff')`

**Request body:**
```json
{ "status": "processing" }
```
Valid values: `pending`, `processing`, `shipped`, `delivered`, `cancelled`

On `cancelled`: restores stock for all items (net of any prior returns).

**Response: 200**

---

## 15. Payments — `/api/payments`

> All routes require `authenticate` + `requireMinRole('staff')`.
> Payments are linked to sales orders. They automatically update `sales_orders.amount_paid` and `status` to `partially_paid` or `paid`.

### GET /api/payments/order/:orderId
List all payments for a sales order.

**Response: 200** — Array of payment rows including `created_by_name`.

---

### POST /api/payments/order/:orderId
Record a payment against a sales order.

**Request body:**
```json
{ "amount": 50.00, "method": "cash", "note": "Cash received" }
```
| Field | Required | Values |
|-------|----------|--------|
| `amount` | Yes | > 0 |
| `method` | Yes | `cash`, `card`, `bank_transfer`, `credit`, `store_credit`, `other` |
| `note` | No | |

**Payment method behavior:**
- `credit`: Adds amount to `customers.credit_balance` (buy now, pay later)
- `store_credit`: Deducts from `customers.credit_balance` (redeeming credit). Requires order to be linked to a customer with sufficient balance.

Payment cannot exceed the order's remaining balance (total - amount_paid).

**Response: 201** — Returns the payment row.

---

### GET /api/payments/:id
Get a single payment record.

**Response: 200 / 404**

---

## 16. Returns — `/api/returns`

> All routes require `authenticate`.

### GET /api/returns/reasons
Returns the global list of return reasons (seed data, not org-specific).

**Response: 200** — Array of `{ id, reason, created_at }`.

---

### GET /api/returns
**Query params:** `page`, `limit`

**Response:** Each row includes `reason_name`, `created_by_name`.

---

### POST /api/returns
`requireMinRole('staff')`

Process a return against a sales order. Restores stock to the original location. Optionally credits the customer's balance.

**Request body:**
```json
{
  "sales_order_id": "uuid",
  "reason_id": "uuid",
  "note": "Customer changed mind",
  "items": [
    { "sales_order_item_id": "uuid", "quantity_returned": 1, "refund_amount": 29.99 }
  ]
}
```
- `reason_id`, `note` are optional.
- `refund_amount` per item is optional (defaults to 0).
- Cannot exceed the original quantity minus already-returned quantity.
- `refund_amount` cannot exceed `item.price * quantity_returned`.
- If order has a customer and `totalRefund > 0`, adds to `credit_balance`.
- Cannot return from a cancelled order.

**Response: 201** `{ "message": "Return processed and stock restored" }`

---

### GET /api/returns/:id
Returns the return with `items` array (each includes `product_name`, `variant_name`).

---

## 17. Stock — `/api/stock`

> All routes require `authenticate`.

### GET /api/stock
Current stock on hand per product per location.

**Query params:** `location_id`, `product_id`, `low_stock` (true/false), `page`, `limit` (max 200, default 50)

**Response:** Each row includes `product_name`, `sku`, `low_stock_threshold`, `variant_name`, `location_name`, `branch_name`, `stock_on_hand`.

---

### GET /api/stock/summary
`requireMinRole('staff')`

Aggregate inventory value across all locations per product.

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      { "product_id": "uuid", "product_name": "Widget A", "sku": "WGT-001", "cost": 15.00, "total_stock_on_hand": 100, "inventory_value": "1500.00" }
    ],
    "total_inventory_value": "1500.00"
  }
}
```

---

### GET /api/stock/ledger
`authenticate`

Paginated raw stock ledger entries.

**Query params:** `product_id`, `location_id`, `movement_type`, `page`, `limit` (max 200)

Valid `movement_type` values: `purchase`, `sale`, `transfer_in`, `transfer_out`, `return`, `adjustment`, `cancellation`

**Response:** Each row includes `product_name`, `variant_name`, `location_name`, `created_by_name`.

---

### POST /api/stock/adjust
`requireMinRole('admin')`

Manual stock adjustment. Writes an `adjustment` ledger entry.

**Request body:**
```json
{ "product_id": "uuid", "variant_id": null, "location_id": "uuid", "quantity_change": -5, "note": "Damage write-off" }
```
- `quantity_change`: non-zero integer (positive = add, negative = remove)
- `variant_id`, `note` are optional

**Response: 201**
```json
{ "success": true, "data": { "product_id": "uuid", "location_id": "uuid", "stock_on_hand": 95 }, "message": "Stock adjusted" }
```

---

## 18. Expenses — `/api/expenses`

> All routes require `authenticate`.
> Expenses and their categories are org-scoped. Both categories and expenses are hard-deleted.

### Expense Categories

#### GET /api/expenses/categories
Returns all expense categories for the org.

#### POST /api/expenses/categories
`requireMinRole('admin')` — Body: `{ "name": "Rent" }`

**Response: 201**

#### GET /api/expenses/categories/:id

#### PATCH /api/expenses/categories/:id
`requireMinRole('admin')` — Body: `{ "name": "New Name" }`

#### DELETE /api/expenses/categories/:id
`requireMinRole('admin')` — Hard delete. Will fail if expenses reference this category (FK constraint).

---

### Expenses

#### GET /api/expenses
**Query params:** `category_id`, `location_id`, `from` (ISO date), `to` (ISO date), `page`, `limit`

`from` must be ≤ `to`.

**Response:** Each row includes `category_name`, `location_name`, `created_by_name`.

---

#### POST /api/expenses
`requireMinRole('staff')`

**Request body:**
```json
{ "category_id": "uuid", "location_id": "uuid", "amount": 1500.00, "date": "2026-03-01", "recurring": false, "note": "March rent" }
```
- `location_id`, `recurring`, `note` are optional.
- `amount` must be > 0.
- `date` must be a valid ISO date (YYYY-MM-DD).

**Response: 201**

---

#### GET /api/expenses/:id

#### PATCH /api/expenses/:id
`requireMinRole('staff')`

**Request body (all optional):** `category_id`, `location_id`, `amount`, `date`, `recurring`, `note`

#### DELETE /api/expenses/:id
`requireMinRole('admin')` — Hard delete.

---

## 19. Reports — `/api/reports`

> All routes require `authenticate` + `requireMinRole('staff')`.
> All date-range endpoints accept `from` and `to` as ISO dates (`YYYY-MM-DD`).
> Default range: current month (first day through today) when `from`/`to` are omitted.

### GET /api/reports/dashboard
Key business metrics for the date range.

**Response data:**
```json
{
  "period": { "from": "2026-03-01", "to": "2026-03-07" },
  "sales": { "order_count": 42, "gross_revenue": 12500.00, "collected": 11000.00, "outstanding": 1500.00 },
  "profitability": {
    "gross_revenue": 12500.00,
    "total_cost": 7000.00,
    "gross_profit": 5500.00,
    "total_expenses": 1500.00,
    "total_refund_amount": 200.00,
    "net_profit": 3800.00,
    "gross_margin_pct": 44.00
  },
  "returns": { "return_count": 3, "total_refund_amount": 200.00 },
  "customers": { "new_customers": 8 },
  "inventory": { "low_stock_count": 5, "pending_po_count": 2 }
}
```
Excludes cancelled orders from all sales calculations.

---

### GET /api/reports/sales-by-day
Daily sales breakdown for charting.

**Query params:** `from`, `to`

**Response data:** Array of `{ day, order_count, revenue }` ordered by day ascending.

---

### GET /api/reports/top-products
Top-selling products by quantity sold.

**Query params:** `from`, `to`, `limit` (1–50, default 10)

**Response data:** Array of `{ product_id, product_name, sku, total_quantity_sold, total_revenue, total_cost }`.

---

### GET /api/reports/sales-by-channel
Sales breakdown by order channel.

**Query params:** `from`, `to`

**Response data:** Array of `{ channel, order_count, revenue }` ordered by revenue descending.

---

### GET /api/reports/expenses-by-category
Expense totals grouped by category.

**Query params:** `from`, `to`

**Response data:** Array of `{ category, total }` ordered by total descending.

---

### GET /api/reports/low-stock
Products at or below their `low_stock_threshold`.

**Query params:** none (uses current stock)

**Response data:** Array of `{ id, name, sku, low_stock_threshold, category_name, location_id, location_name, stock_on_hand }` ordered by stock_on_hand ascending.

---

## 20. Audit Log — `/api/audit-log`

> Requires `authenticate` + `requireMinRole('admin')`.
> Records are written automatically by all create/update/delete/action operations across the system.

### GET /api/audit-log
**Query params:** `entity`, `action`, `user_id`, `from` (ISO date), `to` (ISO date), `page`, `limit` (max 200, default 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "user_id": "uuid",
      "user_name": "Alice",
      "action": "create",
      "entity": "products",
      "entity_id": "uuid",
      "changes": null,
      "created_at": "2026-03-07T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

## Health Check

### GET /health
No authentication required.

**Response: 200 (healthy)**
```json
{ "status": "ok", "db": "ok", "latencyMs": 12, "timestamp": "2026-03-07T10:00:00.000Z" }
```

**Response: 503 (DB unreachable)**
```json
{ "status": "error", "db": "unreachable", "latencyMs": 5000, "timestamp": "..." }
```

---

## Summary Table

| Module | Prefix | Min Role (write) | Min Role (delete) |
|--------|--------|-----------------|-------------------|
| Auth | `/api/auth` | Public | — |
| Organizations | `/api/organizations` | admin | — |
| Branches | `/api/branches` | admin | owner |
| Locations | `/api/locations` | admin | owner |
| Users | `/api/users` | admin | owner |
| Categories | `/api/categories` | admin | admin |
| Units | `/api/units` | admin | admin |
| Products | `/api/products` | admin | admin |
| Product Variants | `/api/products/:id/variants` | admin | admin |
| Customers | `/api/customers` | staff | admin |
| Suppliers | `/api/suppliers` | admin | admin |
| Transfers | `/api/transfers` | staff (create) / admin (confirm/cancel) | — |
| Purchase Orders | `/api/purchase-orders` | admin (create/status) / staff (receive) | — |
| Sales Orders | `/api/sales-orders` | staff | — |
| Payments | `/api/payments` | staff | — |
| Returns | `/api/returns` | staff | — |
| Stock | `/api/stock` | admin (adjust) / staff (summary) | — |
| Expenses | `/api/expenses` | staff (expense) / admin (category) | admin |
| Reports | `/api/reports` | staff | — |
| Audit Log | `/api/audit-log` | admin (read only) | — |
