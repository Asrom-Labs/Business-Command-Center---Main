# BCC Database Schema Summary

**Schema Version:** v1.3
**Date:** March 7, 2026
**Source file:** `backend/db/schema.sql`
**Extension required:** `pgcrypto` (for `gen_random_uuid()`)

---

## Global Conventions

| Convention | Value |
|------------|-------|
| All primary keys | `UUID DEFAULT gen_random_uuid()` |
| All timestamps | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` |
| All monetary values | `NUMERIC(12,2)` |
| All foreign keys | `ON DELETE RESTRICT` |
| Re-runnable | `CREATE TABLE IF NOT EXISTS` everywhere — safe to re-apply on existing DB |

---

## Layer Overview

| Layer | Tables |
|-------|--------|
| Organizational | organizations, branches, locations, roles, users, user_roles |
| Product | categories, units, products, product_variants |
| Stock | stock_ledger |
| Transfer | transfers, transfer_items |
| Customer | customers, customer_notes |
| Supplier/Purchasing | suppliers, purchase_orders, purchase_order_items, goods_receipts, goods_receipt_items, supplier_payments |
| Sales | sales_orders, sales_order_items, payments |
| Returns | return_reasons, returns, return_items |
| Expense | expense_categories, expenses |
| Audit | audit_log |

**Total: 27 tables**

---

## Organizational Layer

### organizations
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | gen_random_uuid() |
| name | VARCHAR(255) | NOT NULL |
| country | VARCHAR(100) | nullable |
| currency | VARCHAR(10) | NOT NULL DEFAULT 'USD' |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

---

### branches
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| organization_id | UUID | NOT NULL FK→organizations |
| name | VARCHAR(255) | NOT NULL |
| city | VARCHAR(255) | nullable |
| active | BOOLEAN | NOT NULL DEFAULT TRUE |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_branches_org` on (organization_id)

**Soft-delete:** `active = FALSE` (API never hard-deletes branches)

---

### locations
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| branch_id | UUID | NOT NULL FK→branches |
| name | VARCHAR(255) | NOT NULL |
| type | VARCHAR(20) | NOT NULL CHECK IN ('warehouse', 'store') |
| active | BOOLEAN | NOT NULL DEFAULT TRUE |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_locations_branch` on (branch_id), `idx_locations_active` on (branch_id, active)

**Soft-delete:** `active = FALSE`

---

### roles
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| name | VARCHAR(50) | NOT NULL UNIQUE CHECK IN ('owner', 'admin', 'staff', 'readonly') |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Seed data:** 'owner', 'admin', 'staff', 'readonly'

---

### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| organization_id | UUID | NOT NULL FK→organizations |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | NOT NULL UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL |
| active | BOOLEAN | NOT NULL DEFAULT TRUE |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_users_org`, `idx_users_email`, `idx_users_active` on (organization_id, active)

**Soft-delete:** `active = FALSE`
**Note:** `email` is globally unique across all organizations.

---

### user_roles
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | UUID | NOT NULL FK→users |
| role_id | UUID | NOT NULL FK→roles |
| PRIMARY KEY | (user_id, role_id) | |

**Note:** Each user has exactly one role in practice (enforced by API). The table supports M:M for extensibility.

---

## Product Layer

### categories
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| organization_id | UUID | NOT NULL FK→organizations |
| name | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| UNIQUE | (organization_id, name) | |

**Indexes:** `idx_categories_org`

---

### units
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| organization_id | UUID | nullable FK→organizations |
| name | VARCHAR(100) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| UNIQUE | (organization_id, name) | |

**Note:** `organization_id IS NULL` = system/global unit (seeded). Units with `organization_id` set are org-specific.

**Seed data:** Piece, Box, Kilogram, Gram, Liter, Milliliter, Meter, Pack, Dozen

---

### products
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| organization_id | UUID | NOT NULL FK→organizations |
| category_id | UUID | nullable FK→categories |
| unit_id | UUID | nullable FK→units |
| name | VARCHAR(255) | NOT NULL |
| sku | VARCHAR(100) | nullable |
| barcode | VARCHAR(100) | nullable |
| price | NUMERIC(12,2) | nullable |
| cost | NUMERIC(12,2) | nullable |
| low_stock_threshold | INTEGER | NOT NULL DEFAULT 0 CHECK >= 0 |
| active | BOOLEAN | NOT NULL DEFAULT TRUE |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Unique indexes (partial — only when NOT NULL):**
- `products_sku_org_unique` on (organization_id, sku) WHERE sku IS NOT NULL
- `products_barcode_org_unique` on (organization_id, barcode) WHERE barcode IS NOT NULL

**Other indexes:** `idx_products_org`, `idx_products_category`, `idx_products_active` on (organization_id, active)

**Soft-delete:** `active = FALSE`

---

### product_variants
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| product_id | UUID | NOT NULL FK→products |
| name | VARCHAR(255) | NOT NULL |
| sku | VARCHAR(100) | nullable |
| barcode | VARCHAR(100) | nullable |
| price | NUMERIC(12,2) | nullable — NULL inherits parent product price |
| cost | NUMERIC(12,2) | nullable — NULL inherits parent product cost |
| active | BOOLEAN | NOT NULL DEFAULT TRUE |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Unique indexes (partial):**
- `product_variants_sku_product_unique` on (product_id, sku) WHERE sku IS NOT NULL
- `product_variants_barcode_product_unique` on (product_id, barcode) WHERE barcode IS NOT NULL

**Soft-delete:** `active = FALSE`

---

## Stock Ledger

### stock_ledger
**Append-only — never UPDATE this table.**

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| product_id | UUID | NOT NULL FK→products |
| variant_id | UUID | nullable FK→product_variants |
| location_id | UUID | NOT NULL FK→locations |
| quantity_change | INTEGER | NOT NULL — positive=in, negative=out |
| movement_type | VARCHAR(30) | NOT NULL CHECK IN ('purchase','sale','transfer_in','transfer_out','return','adjustment','cancellation') |
| reference_id | UUID | nullable — GoodsReceipt.id, SalesOrder.id, Transfer.id, or Return.id |
| note | TEXT | nullable |
| created_by | UUID | nullable FK→users |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** idx_stock_ledger_product, idx_stock_ledger_variant, idx_stock_ledger_location, idx_stock_ledger_product_location, idx_stock_ledger_movement_type, idx_stock_ledger_created_at, idx_stock_ledger_reference

**Stock on hand** for a product/variant/location = `SUM(quantity_change)` filtered by those keys.

---

## Transfer Layer

### transfers
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| organization_id | UUID | NOT NULL FK→organizations |
| from_location_id | UUID | NOT NULL FK→locations |
| to_location_id | UUID | NOT NULL FK→locations |
| status | VARCHAR(20) | NOT NULL DEFAULT 'pending' CHECK IN ('pending','completed','cancelled') |
| note | TEXT | nullable |
| created_by | UUID | nullable FK→users |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_transfers_org`, `idx_transfers_status`

---

### transfer_items
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| transfer_id | UUID | NOT NULL FK→transfers |
| product_id | UUID | NOT NULL FK→products |
| variant_id | UUID | nullable FK→product_variants |
| quantity | INTEGER | NOT NULL CHECK > 0 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_transfer_items_transfer`, `idx_transfer_items_product`

---

## Customer Layer

### customers
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| organization_id | UUID | NOT NULL FK→organizations |
| name | VARCHAR(255) | NOT NULL |
| phone | VARCHAR(50) | nullable |
| email | VARCHAR(255) | nullable |
| address | TEXT | nullable |
| credit_balance | NUMERIC(12,2) | NOT NULL DEFAULT 0.00 CHECK >= 0 |
| active | BOOLEAN | NOT NULL DEFAULT TRUE |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_customers_org`

**Soft-delete:** `active = FALSE`
**Note:** `credit_balance` is increased by `credit` payments and returns; decreased by `store_credit` payments.

---

### customer_notes
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| customer_id | UUID | NOT NULL FK→customers |
| note | TEXT | NOT NULL |
| created_by | UUID | nullable FK→users |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_customer_notes_customer`

---

## Supplier / Purchasing Layer

### suppliers
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| organization_id | UUID | NOT NULL FK→organizations |
| name | VARCHAR(255) | NOT NULL |
| phone | VARCHAR(50) | nullable |
| email | VARCHAR(255) | nullable |
| address | TEXT | nullable |
| contact_person | VARCHAR(255) | nullable |
| active | BOOLEAN | NOT NULL DEFAULT TRUE |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_suppliers_org`

**Soft-delete:** `active = FALSE`

---

### purchase_orders
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| organization_id | UUID | NOT NULL FK→organizations |
| supplier_id | UUID | NOT NULL FK→suppliers |
| location_id | UUID | NOT NULL FK→locations |
| status | VARCHAR(30) | NOT NULL DEFAULT 'draft' CHECK IN ('draft','submitted','partially_received','received','cancelled') |
| expected_date | DATE | nullable |
| note | TEXT | nullable |
| created_by | UUID | nullable FK→users |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_purchase_orders_org`, `idx_purchase_orders_supplier`, `idx_purchase_orders_status`, `idx_purchase_orders_created`

---

### purchase_order_items
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| purchase_order_id | UUID | NOT NULL FK→purchase_orders |
| product_id | UUID | NOT NULL FK→products |
| variant_id | UUID | nullable FK→product_variants |
| quantity | INTEGER | NOT NULL CHECK > 0 |
| cost | NUMERIC(12,2) | NOT NULL CHECK >= 0 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_purchase_order_items_po`

---

### goods_receipts
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| organization_id | UUID | NOT NULL FK→organizations |
| purchase_order_id | UUID | NOT NULL FK→purchase_orders |
| received_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| note | TEXT | nullable |
| created_by | UUID | nullable FK→users |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_goods_receipts_org`, `idx_goods_receipts_po`

---

### goods_receipt_items
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| goods_receipt_id | UUID | NOT NULL FK→goods_receipts |
| purchase_order_item_id | UUID | NOT NULL FK→purchase_order_items |
| product_id | UUID | NOT NULL FK→products |
| variant_id | UUID | nullable FK→product_variants |
| quantity_received | INTEGER | NOT NULL CHECK > 0 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_goods_receipt_items_gr`, `idx_goods_receipt_items_poi`

---

### supplier_payments
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| organization_id | UUID | NOT NULL FK→organizations |
| supplier_id | UUID | NOT NULL FK→suppliers |
| amount | NUMERIC(12,2) | NOT NULL CHECK > 0 |
| payment_date | DATE | NOT NULL |
| method | VARCHAR(30) | NOT NULL DEFAULT 'cash' CHECK IN ('cash','card','bank_transfer','other') |
| reference | VARCHAR(255) | nullable |
| note | TEXT | nullable |
| created_by | UUID | nullable FK→users |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_supplier_payments_org`, `idx_supplier_payments_supplier`, `idx_supplier_payments_date`

**Note:** No API endpoint currently exposes supplier_payments — table is present in schema for future use.

---

## Sales Layer

### sales_orders
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| organization_id | UUID | NOT NULL FK→organizations |
| customer_id | UUID | nullable FK→customers |
| location_id | UUID | NOT NULL FK→locations |
| user_id | UUID | nullable FK→users |
| channel | VARCHAR(30) | NOT NULL DEFAULT 'in_store' CHECK IN ('in_store','whatsapp','instagram','snapchat','tiktok','online','other') |
| status | VARCHAR(20) | NOT NULL DEFAULT 'pending' CHECK IN ('pending','partially_paid','paid','processing','shipped','delivered','cancelled') |
| subtotal | NUMERIC(12,2) | NOT NULL DEFAULT 0 |
| discount | NUMERIC(12,2) | NOT NULL DEFAULT 0 |
| tax | NUMERIC(12,2) | NOT NULL DEFAULT 0 |
| total | NUMERIC(12,2) | NOT NULL DEFAULT 0 |
| amount_paid | NUMERIC(12,2) | NOT NULL DEFAULT 0 |
| note | TEXT | nullable |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Computed:** `total = subtotal - discount + tax`

**Indexes:** `idx_sales_orders_org`, `idx_sales_orders_customer`, `idx_sales_orders_status`, `idx_sales_orders_created_at`, `idx_sales_orders_channel`

---

### sales_order_items
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| sales_order_id | UUID | NOT NULL FK→sales_orders |
| product_id | UUID | NOT NULL FK→products |
| variant_id | UUID | nullable FK→product_variants |
| quantity | INTEGER | NOT NULL CHECK > 0 |
| price | NUMERIC(12,2) | NOT NULL — price snapshot at time of sale |
| discount | NUMERIC(12,2) | NOT NULL DEFAULT 0 — per-line discount |
| cost | NUMERIC(12,2) | NOT NULL DEFAULT 0 — cost snapshot at time of sale |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_sales_order_items_order`, `idx_sales_order_items_product`

---

### payments
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| organization_id | UUID | NOT NULL FK→organizations |
| sales_order_id | UUID | NOT NULL FK→sales_orders |
| amount | NUMERIC(12,2) | NOT NULL CHECK > 0 |
| method | VARCHAR(30) | NOT NULL CHECK IN ('cash','card','bank_transfer','credit','store_credit','other') |
| paid_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| note | TEXT | nullable |
| created_by | UUID | nullable FK→users |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_payments_org`, `idx_payments_order`, `idx_payments_paid_at`

---

## Returns Layer

### return_reasons
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| reason | VARCHAR(255) | NOT NULL UNIQUE |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Seed data:** Defective product, Wrong item shipped, Customer changed mind, Product not as described, Damaged during delivery, Duplicate order, Quality not acceptable, Other

---

### returns
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| organization_id | UUID | NOT NULL FK→organizations |
| sales_order_id | UUID | NOT NULL FK→sales_orders |
| reason_id | UUID | nullable FK→return_reasons |
| total_refund_amount | NUMERIC(12,2) | NOT NULL DEFAULT 0 |
| note | TEXT | nullable |
| created_by | UUID | nullable FK→users |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_returns_org`, `idx_returns_order`

---

### return_items
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| return_id | UUID | NOT NULL FK→returns |
| sales_order_item_id | UUID | NOT NULL FK→sales_order_items |
| product_id | UUID | NOT NULL FK→products |
| variant_id | UUID | nullable FK→product_variants |
| quantity_returned | INTEGER | NOT NULL CHECK > 0 |
| refund_amount | NUMERIC(12,2) | NOT NULL DEFAULT 0 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_return_items_return`

---

## Expense Layer

### expense_categories
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| organization_id | UUID | NOT NULL FK→organizations |
| name | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| UNIQUE | (organization_id, name) | |

**Indexes:** `idx_expense_categories_org`

---

### expenses
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| organization_id | UUID | NOT NULL FK→organizations |
| category_id | UUID | NOT NULL FK→expense_categories |
| location_id | UUID | nullable FK→locations |
| amount | NUMERIC(12,2) | NOT NULL CHECK > 0 |
| date | DATE | NOT NULL |
| recurring | BOOLEAN | NOT NULL DEFAULT FALSE |
| note | TEXT | nullable |
| created_by | UUID | nullable FK→users |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_expenses_org`, `idx_expenses_date`, `idx_expenses_category`

---

## Audit Layer

### audit_log
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | |
| organization_id | UUID | NOT NULL FK→organizations |
| user_id | UUID | nullable FK→users |
| action | VARCHAR(50) | NOT NULL |
| entity | VARCHAR(100) | NOT NULL |
| entity_id | UUID | nullable |
| changes | JSONB | nullable — before/after data for status changes |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_audit_log_org`, `idx_audit_log_user`, `idx_audit_log_entity` on (entity, entity_id), `idx_audit_log_created_at`

**Recorded actions include:** create, update, delete, status_change, confirm, cancel, receive, adjustment

---

## Seed Data Summary

| Table | Seeded rows |
|-------|-------------|
| roles | owner, admin, staff, readonly |
| units | Piece, Box, Kilogram, Gram, Liter, Milliliter, Meter, Pack, Dozen (organization_id = NULL) |
| return_reasons | 8 standard reasons |

All seed inserts use `ON CONFLICT DO NOTHING` — safe to re-run.

---

## Index Count Summary

| Layer | Index count |
|-------|-------------|
| Organizational | 6 |
| Products | 7 |
| Stock ledger | 7 (performance-critical) |
| Transfers | 4 |
| Customers | 2 |
| Suppliers/Purchasing | 9 |
| Sales | 8 |
| Returns | 3 |
| Expenses | 3 |
| Audit | 4 |
| **Total** | **53 indexes** |
