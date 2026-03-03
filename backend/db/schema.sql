-- ============================================================
-- Business Command Center — Production PostgreSQL Schema v1.2
-- All PKs: UUID with gen_random_uuid()
-- All timestamps: TIMESTAMPTZ DEFAULT NOW()
-- All monetary values: NUMERIC(12,2)
-- All FKs: ON DELETE RESTRICT
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ORGANIZATIONAL LAYER
-- ============================================================

CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255)  NOT NULL,
  country     VARCHAR(100),
  currency    VARCHAR(10)   NOT NULL DEFAULT 'USD',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE branches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name            VARCHAR(255)  NOT NULL,
  city            VARCHAR(255),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE locations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id  UUID         NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  name       VARCHAR(255) NOT NULL,
  type       VARCHAR(20)  NOT NULL CHECK (type IN ('warehouse', 'store')),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(50)  NOT NULL UNIQUE CHECK (name IN ('owner', 'admin', 'staff', 'readonly')),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  active          BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (email)
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  PRIMARY KEY (user_id, role_id)
);

-- ============================================================
-- PRODUCT LAYER
-- ============================================================

CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name            VARCHAR(255) NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, name)
);

CREATE TABLE units (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID          NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  category_id         UUID          REFERENCES categories(id) ON DELETE RESTRICT,
  unit_id             UUID          REFERENCES units(id) ON DELETE RESTRICT,
  name                VARCHAR(255)  NOT NULL,
  sku                 VARCHAR(100),
  barcode             VARCHAR(100),
  price               NUMERIC(12,2),
  cost                NUMERIC(12,2),
  low_stock_threshold INTEGER       NOT NULL DEFAULT 0 CHECK (low_stock_threshold >= 0),
  active              BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Partial unique indexes for SKU/barcode (only when NOT NULL)
CREATE UNIQUE INDEX products_sku_org_unique     ON products(organization_id, sku)     WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX products_barcode_org_unique ON products(organization_id, barcode) WHERE barcode IS NOT NULL;

CREATE TABLE product_variants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID         NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  name       VARCHAR(255) NOT NULL,
  sku        VARCHAR(100),
  barcode    VARCHAR(100),
  price      NUMERIC(12,2),   -- NULL means inherit parent product price
  cost       NUMERIC(12,2),   -- NULL means inherit parent product cost
  active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX product_variants_sku_product_unique     ON product_variants(product_id, sku)     WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX product_variants_barcode_product_unique ON product_variants(product_id, barcode) WHERE barcode IS NOT NULL;

CREATE TABLE bundles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bundle_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id  UUID    NOT NULL REFERENCES bundles(id)  ON DELETE RESTRICT,
  product_id UUID    NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  UNIQUE (bundle_id, product_id)
);

-- ============================================================
-- STOCK LEDGER — The Accuracy Engine (append-only, never UPDATE)
-- ============================================================

CREATE TABLE stock_ledger (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID         NOT NULL REFERENCES products(id)         ON DELETE RESTRICT,
  variant_id    UUID                  REFERENCES product_variants(id) ON DELETE RESTRICT,
  location_id   UUID         NOT NULL REFERENCES locations(id)        ON DELETE RESTRICT,
  change_qty    INTEGER      NOT NULL,  -- positive = in, negative = out
  movement_type VARCHAR(30)  NOT NULL CHECK (movement_type IN ('purchase','sale','transfer_in','transfer_out','return','adjustment')),
  reference_id  UUID,                   -- points to GoodsReceipt.id, SalesOrder.id, Transfer.id, or Return.id
  note          TEXT,
  created_by    UUID                  REFERENCES users(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRANSFER LAYER
-- ============================================================

CREATE TABLE transfers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID         NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  from_location_id UUID         NOT NULL REFERENCES locations(id)     ON DELETE RESTRICT,
  to_location_id   UUID         NOT NULL REFERENCES locations(id)     ON DELETE RESTRICT,
  status           VARCHAR(20)  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  note             TEXT,
  created_by       UUID                  REFERENCES users(id)         ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE transfer_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID    NOT NULL REFERENCES transfers(id)         ON DELETE RESTRICT,
  product_id  UUID    NOT NULL REFERENCES products(id)          ON DELETE RESTRICT,
  variant_id  UUID             REFERENCES product_variants(id)  ON DELETE RESTRICT,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CUSTOMER LAYER
-- ============================================================

CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name            VARCHAR(255)  NOT NULL,
  phone           VARCHAR(50),
  email           VARCHAR(255),
  address         TEXT,
  credit_balance  NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (credit_balance >= 0),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE customer_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  note        TEXT NOT NULL,
  created_by  UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUPPLIER / PURCHASING LAYER
-- ============================================================

CREATE TABLE suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name            VARCHAR(255) NOT NULL,
  phone           VARCHAR(50),
  email           VARCHAR(255),
  address         TEXT,
  contact_person  VARCHAR(255),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  supplier_id     UUID         NOT NULL REFERENCES suppliers(id)     ON DELETE RESTRICT,
  location_id     UUID         NOT NULL REFERENCES locations(id)     ON DELETE RESTRICT,
  status          VARCHAR(30)  NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','partially_received','received','cancelled')),
  expected_date   DATE,
  note            TEXT,
  created_by      UUID                  REFERENCES users(id)         ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID          NOT NULL REFERENCES purchase_orders(id)   ON DELETE RESTRICT,
  product_id        UUID          NOT NULL REFERENCES products(id)           ON DELETE RESTRICT,
  variant_id        UUID                   REFERENCES product_variants(id)   ON DELETE RESTRICT,
  quantity          INTEGER       NOT NULL CHECK (quantity > 0),
  cost              NUMERIC(12,2) NOT NULL CHECK (cost >= 0),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE goods_receipts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID        NOT NULL REFERENCES organizations(id)   ON DELETE RESTRICT,
  purchase_order_id UUID        NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
  received_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note              TEXT,
  created_by        UUID                 REFERENCES users(id)            ON DELETE RESTRICT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE goods_receipt_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goods_receipt_id      UUID    NOT NULL REFERENCES goods_receipts(id)       ON DELETE RESTRICT,
  purchase_order_item_id UUID   NOT NULL REFERENCES purchase_order_items(id) ON DELETE RESTRICT,
  product_id            UUID    NOT NULL REFERENCES products(id)              ON DELETE RESTRICT,
  variant_id            UUID             REFERENCES product_variants(id)      ON DELETE RESTRICT,
  quantity_received     INTEGER NOT NULL CHECK (quantity_received > 0),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE supplier_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  supplier_id     UUID          NOT NULL REFERENCES suppliers(id)     ON DELETE RESTRICT,
  amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_date    DATE          NOT NULL,
  method          VARCHAR(30)   NOT NULL DEFAULT 'cash' CHECK (method IN ('cash','card','bank_transfer','other')),
  reference       VARCHAR(255),
  note            TEXT,
  created_by      UUID                   REFERENCES users(id)         ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SALES LAYER
-- ============================================================

CREATE TABLE sales_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  customer_id     UUID                   REFERENCES customers(id)     ON DELETE RESTRICT,
  location_id     UUID          NOT NULL REFERENCES locations(id)     ON DELETE RESTRICT,
  user_id         UUID                   REFERENCES users(id)         ON DELETE RESTRICT,
  source          VARCHAR(30)   NOT NULL DEFAULT 'in_store' CHECK (source IN ('in_store','whatsapp','instagram','snapchat','tiktok','online','other')),
  status          VARCHAR(20)   NOT NULL DEFAULT 'new' CHECK (status IN ('new','processing','shopped','delivered','cancelled')),
  subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax             NUMERIC(12,2) NOT NULL DEFAULT 0,
  total           NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid     NUMERIC(12,2) NOT NULL DEFAULT 0,
  note            TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE sales_order_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID          NOT NULL REFERENCES sales_orders(id)     ON DELETE RESTRICT,
  product_id     UUID          NOT NULL REFERENCES products(id)          ON DELETE RESTRICT,
  variant_id     UUID                   REFERENCES product_variants(id)  ON DELETE RESTRICT,
  quantity       INTEGER       NOT NULL CHECK (quantity > 0),
  price          NUMERIC(12,2) NOT NULL,                   -- price snapshot at time of sale
  discount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost           NUMERIC(12,2) NOT NULL DEFAULT 0,         -- cost snapshot from product record
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  sales_order_id UUID          NOT NULL REFERENCES sales_orders(id)   ON DELETE RESTRICT,
  amount         NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method         VARCHAR(30)   NOT NULL CHECK (method IN ('cash','card','bank_transfer','credit','credit_settlement','other')),
  paid_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  note           TEXT,
  created_by     UUID                   REFERENCES users(id)           ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RETURNS LAYER
-- ============================================================

CREATE TABLE return_reasons (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reason     VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE returns (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  sales_order_id UUID          NOT NULL REFERENCES sales_orders(id)   ON DELETE RESTRICT,
  reason_id      UUID                   REFERENCES return_reasons(id)  ON DELETE RESTRICT,
  total_refund   NUMERIC(12,2) NOT NULL DEFAULT 0,
  note           TEXT,
  created_by     UUID                   REFERENCES users(id)           ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE return_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id           UUID          NOT NULL REFERENCES returns(id)           ON DELETE RESTRICT,
  sales_order_item_id UUID          NOT NULL REFERENCES sales_order_items(id) ON DELETE RESTRICT,
  product_id          UUID          NOT NULL REFERENCES products(id)           ON DELETE RESTRICT,
  variant_id          UUID                   REFERENCES product_variants(id)   ON DELETE RESTRICT,
  quantity_returned   INTEGER       NOT NULL CHECK (quantity_returned > 0),
  refund_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EXPENSE LAYER
-- ============================================================

CREATE TABLE expense_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name            VARCHAR(255) NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, name)
);

CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES organizations(id)     ON DELETE RESTRICT,
  category_id     UUID          NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  location_id     UUID                   REFERENCES locations(id)           ON DELETE RESTRICT,
  amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  date            DATE          NOT NULL,
  recurring       BOOLEAN       NOT NULL DEFAULT FALSE,
  note            TEXT,
  created_by      UUID                   REFERENCES users(id)               ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LAYER
-- ============================================================

CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id         UUID                  REFERENCES users(id)         ON DELETE RESTRICT,
  action          VARCHAR(50)  NOT NULL,
  entity          VARCHAR(100) NOT NULL,
  entity_id       UUID,
  changes         JSONB,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Branches
CREATE INDEX idx_branches_org ON branches(organization_id);

-- Locations
CREATE INDEX idx_locations_branch ON locations(branch_id);

-- Users
CREATE INDEX idx_users_org   ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(organization_id, active);

-- Categories
CREATE INDEX idx_categories_org ON categories(organization_id);

-- Products
CREATE INDEX idx_products_org      ON products(organization_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active   ON products(organization_id, active);

-- Product variants
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_active  ON product_variants(product_id, active);

-- Stock ledger (critical for performance)
CREATE INDEX idx_stock_ledger_product          ON stock_ledger(product_id);
CREATE INDEX idx_stock_ledger_variant          ON stock_ledger(variant_id);
CREATE INDEX idx_stock_ledger_location         ON stock_ledger(location_id);
CREATE INDEX idx_stock_ledger_product_location ON stock_ledger(product_id, location_id);
CREATE INDEX idx_stock_ledger_movement_type    ON stock_ledger(movement_type);
CREATE INDEX idx_stock_ledger_created_at       ON stock_ledger(created_at);
CREATE INDEX idx_stock_ledger_reference        ON stock_ledger(reference_id);

-- Transfers
CREATE INDEX idx_transfers_org    ON transfers(organization_id);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfer_items_transfer ON transfer_items(transfer_id);
CREATE INDEX idx_transfer_items_product  ON transfer_items(product_id);

-- Customers
CREATE INDEX idx_customers_org ON customers(organization_id);

-- Customer notes
CREATE INDEX idx_customer_notes_customer ON customer_notes(customer_id);

-- Suppliers
CREATE INDEX idx_suppliers_org ON suppliers(organization_id);

-- Purchase orders
CREATE INDEX idx_purchase_orders_org      ON purchase_orders(organization_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status   ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_created  ON purchase_orders(created_at);
CREATE INDEX idx_purchase_order_items_po  ON purchase_order_items(purchase_order_id);

-- Goods receipts
CREATE INDEX idx_goods_receipts_org      ON goods_receipts(organization_id);
CREATE INDEX idx_goods_receipts_po       ON goods_receipts(purchase_order_id);
CREATE INDEX idx_goods_receipt_items_gr  ON goods_receipt_items(goods_receipt_id);

-- Supplier payments
CREATE INDEX idx_supplier_payments_org      ON supplier_payments(organization_id);
CREATE INDEX idx_supplier_payments_supplier ON supplier_payments(supplier_id);
CREATE INDEX idx_supplier_payments_date     ON supplier_payments(payment_date);

-- Sales orders
CREATE INDEX idx_sales_orders_org        ON sales_orders(organization_id);
CREATE INDEX idx_sales_orders_customer   ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status     ON sales_orders(status);
CREATE INDEX idx_sales_orders_created_at ON sales_orders(created_at);
CREATE INDEX idx_sales_orders_source     ON sales_orders(source);
CREATE INDEX idx_sales_order_items_order ON sales_order_items(sales_order_id);

-- Payments
CREATE INDEX idx_payments_org   ON payments(organization_id);
CREATE INDEX idx_payments_order ON payments(sales_order_id);

-- Returns
CREATE INDEX idx_returns_org          ON returns(organization_id);
CREATE INDEX idx_returns_order        ON returns(sales_order_id);
CREATE INDEX idx_return_items_return  ON return_items(return_id);

-- Expenses
CREATE INDEX idx_expenses_org      ON expenses(organization_id);
CREATE INDEX idx_expenses_date     ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category_id);

-- Audit log
CREATE INDEX idx_audit_log_org        ON audit_log(organization_id);
CREATE INDEX idx_audit_log_user       ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity     ON audit_log(entity, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Roles (required before any user can be created)
INSERT INTO roles (name) VALUES
  ('owner'),
  ('admin'),
  ('staff'),
  ('readonly');

-- Units of measurement
INSERT INTO units (name) VALUES
  ('Piece'),
  ('Box'),
  ('Kilogram'),
  ('Gram'),
  ('Liter'),
  ('Milliliter'),
  ('Meter'),
  ('Pack'),
  ('Dozen');

-- Return reasons
INSERT INTO return_reasons (reason) VALUES
  ('Defective product'),
  ('Wrong item shipped'),
  ('Customer changed mind'),
  ('Product not as described'),
  ('Damaged during delivery'),
  ('Duplicate order'),
  ('Quality not acceptable'),
  ('Other');
