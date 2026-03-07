# BCC Environment Variables

**Version:** v0.6.0
**Date:** March 7, 2026

This document describes every environment variable used by the BCC backend. All variables are loaded from the `.env` file in the `backend/` directory via `dotenv`.

---

## Required Variables

These variables are validated at startup (`server.js` lines 6–15). If either is missing, the process exits immediately with a fatal error before the server starts.

### `DATABASE_URL`

| Property | Value |
|----------|-------|
| **Required** | Yes |
| **Type** | PostgreSQL connection string |
| **Format** | `postgresql://user:password@host:port/dbname` |

**What it controls:** The PostgreSQL connection string used by `pg.Pool` in `src/db/pool.js`. Every database query in the backend uses this connection.

**Failure behavior:** If missing at startup:
```
FATAL: Missing required environment variables: DATABASE_URL
```
Process exits with code 1. No requests are served.

**If the database is unreachable at runtime:** The `/health` endpoint returns HTTP 503. API endpoints return HTTP 500 with an internal server error.

**Example:**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/bcc_db
DATABASE_URL=postgresql://user:pass@shuttle.proxy.rlwy.net:48585/railway
```

---

### `JWT_SECRET`

| Property | Value |
|----------|-------|
| **Required** | Yes |
| **Minimum length** | 32 characters |
| **Recommended length** | 64+ random characters in production |

**What it controls:** The HMAC-SHA256 signing secret used to sign and verify all JWT authentication tokens. Used in `src/middleware/auth.js`. Tokens signed with this secret expire in 24 hours.

**Failure behavior:** If missing or shorter than 32 characters at startup:
```
FATAL: JWT_SECRET is missing or too short — minimum 32 characters required. Use a random 64-character string in production.
```
Process exits with code 1.

**Security note:** If this secret is rotated or changed, all existing tokens are immediately invalidated. All users will be logged out.

**Example (development only — do not use in production):**
```
JWT_SECRET=bcc_dev_secret_key_32chars_minimum_do_not_use_in_prod
```

**Generate a production secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Optional Variables

These variables are not required. The server starts without them using the defaults described below.

### `PORT`

| Property | Value |
|----------|-------|
| **Required** | No |
| **Default** | `3001` |
| **Type** | Integer |

**What it controls:** The TCP port the HTTP server listens on.

**Example:**
```
PORT=3001
PORT=8080
```

---

### `NODE_ENV`

| Property | Value |
|----------|-------|
| **Required** | No |
| **Default** | `development` |
| **Valid values** | `development`, `production`, `test` |

**What it controls:**

| Value | Effect |
|-------|--------|
| `development` | Morgan logs in `dev` format (colorized, compact). |
| `production` | Morgan logs in `combined` format (Apache combined log format with IPs, user agents). |
| `test` | Morgan logging is disabled entirely (prevents log noise during test runs). |

**Note:** Does not affect security headers (Helmet is always enabled), rate limiting, or any business logic.

**Example:**
```
NODE_ENV=development
NODE_ENV=production
```

---

### `ALLOWED_ORIGINS`

| Property | Value |
|----------|-------|
| **Required** | No |
| **Default** | `http://localhost:5173` |
| **Type** | Comma-separated list of URLs |

**What it controls:** The CORS allowed origins list. Only requests from these origins (or requests with no `Origin` header, e.g., server-to-server or Postman) are permitted. Requests from unlisted origins receive an HTTP 403.

**Parsing:** Split on `,` and whitespace-trimmed. The list is applied at startup and cannot be changed at runtime.

**Example:**
```
ALLOWED_ORIGINS=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
ALLOWED_ORIGINS=https://app.mybusiness.com,https://www.mybusiness.com
```

---

## Startup Validation Logic

```
server.js startup sequence:
  1. Load .env via dotenv
  2. Check DATABASE_URL present → exit(1) if missing
  3. Check JWT_SECRET present → exit(1) if missing
  4. Check JWT_SECRET.length >= 32 → exit(1) if too short
  5. Initialize Express, helmet, CORS, rate limiters
  6. Connect pool (lazy — first query attempt)
  7. Start HTTP server on PORT
```

---

## Complete `.env` Template

```env
# ── Required ──────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=replace_with_64_random_chars_in_production

# ── Optional ──────────────────────────────────────────────────
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## Security Reminders

- Never commit `.env` to version control. The `backend/.env` file is listed in `.gitignore`.
- In production, set `JWT_SECRET` to at least 64 random characters.
- In production, set `NODE_ENV=production` to enable combined-format access logs.
- In production, restrict `ALLOWED_ORIGINS` to your actual frontend domain(s) only.
- Rotate `JWT_SECRET` immediately if it is ever exposed. All active sessions will be invalidated.
