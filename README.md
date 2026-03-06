# Business Command Center (BCC)

Multi-tenant SaaS business management platform — inventory, sales, purchasing, expenses, reporting, and more.

## Stack

- **Backend**: Node.js 20+, Express 4, PostgreSQL (via `pg`)
- **Auth**: JWT (HS256, 24h expiry), bcryptjs (cost 12)
- **Validation**: express-validator
- **Security**: helmet, cors (whitelist), express-rate-limit

## Quick Start

### Prerequisites

- Node.js >= 20
- PostgreSQL >= 14

### Setup

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit .env with your DATABASE_URL and a strong JWT_SECRET

# 3. Initialize database
psql "$DATABASE_URL" -f backend/db/schema.sql

# 4. Apply migrations (if upgrading from a previous version)
psql "$DATABASE_URL" -f backend/db/migrations/002_add_cancellation_movement_type.sql
psql "$DATABASE_URL" -f backend/db/migrations/003_add_locations_active.sql
psql "$DATABASE_URL" -f backend/db/migrations/004_drop_bundles.sql

# 5. Start development server
npm run dev
```

### Health Check

```
GET /health
```

Returns `{ status: 'ok', db: 'ok', latencyMs: <n> }` — 503 if DB is unreachable.

## API

Base URL: `/api`

| Prefix | Description |
|--------|-------------|
| `/auth` | Register, login, me, change password |
| `/organizations` | Organization profile |
| `/branches` | Branch management |
| `/locations` | Location (warehouse/shelf) management |
| `/users` | User management (admin+) |
| `/categories` | Product categories |
| `/units` | Units of measure |
| `/products` | Product catalog with variants |
| `/transfers` | Inter-location stock transfers |
| `/customers` | Customer management + notes |
| `/suppliers` | Supplier management |
| `/purchase-orders` | Purchase orders + goods receipt |
| `/sales-orders` | Sales orders + status management |
| `/returns` | Returns with stock restoration |
| `/expenses` | Expense tracking with categories |
| `/stock` | Stock on hand, ledger, adjustments, summary |
| `/payments` | Payment recording for sales orders |
| `/reports` | Dashboard, sales, top products, expenses |
| `/audit-log` | Audit trail (admin+) |

## Response Format

All responses follow:

```json
{
  "success": true,
  "data": {},
  "message": "Human-readable message",
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

## Role Hierarchy

`readonly` < `staff` < `admin` < `owner`
