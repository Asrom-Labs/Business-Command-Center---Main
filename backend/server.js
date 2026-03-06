'use strict';

require('dotenv').config();

// ── S08 + B08: Startup environment variable validation ───────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET is missing or too short — minimum 32 characters required. Use a random 64-character string in production.');
  process.exit(1);
}

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const { pool } = require('./src/db/pool');
const { errorHandler } = require('./src/middleware/errorHandler');

const authRoutes          = require('./src/routes/auth.routes');
const organizationRoutes  = require('./src/routes/organizations.routes');
const branchRoutes        = require('./src/routes/branches.routes');
const locationRoutes      = require('./src/routes/locations.routes');
const userRoutes          = require('./src/routes/users.routes');
const categoryRoutes      = require('./src/routes/categories.routes');
const unitRoutes          = require('./src/routes/units.routes');
const productRoutes       = require('./src/routes/products.routes');
const transferRoutes      = require('./src/routes/transfers.routes');
const customerRoutes      = require('./src/routes/customers.routes');
const supplierRoutes      = require('./src/routes/suppliers.routes');
const purchaseOrderRoutes = require('./src/routes/purchase-orders.routes');
const salesOrderRoutes    = require('./src/routes/sales-orders.routes');
const returnsRoutes       = require('./src/routes/returns.routes');
const expenseRoutes       = require('./src/routes/expenses.routes');
const stockRoutes         = require('./src/routes/stock.routes');
const paymentRoutes       = require('./src/routes/payments.routes');
const reportRoutes        = require('./src/routes/reports.routes');
const auditLogRoutes      = require('./src/routes/audit-log.routes');

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'RATE_LIMIT', message: 'Too many requests, please try again later' },
});

app.use(globalLimiter);

// ── S12: Request ID middleware ────────────────────────────────────────────────
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
});

// ── S12: Conditional logging ──────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
  app.use(morgan(morganFormat));
}

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── S05: Health check with DB probe ──────────────────────────────────────────
app.get('/health', async (req, res) => {
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    const latencyMs = Date.now() - start;
    return res.json({ status: 'ok', db: 'ok', latencyMs, timestamp: new Date().toISOString() });
  } catch (err) {
    const latencyMs = Date.now() - start;
    return res.status(503).json({ status: 'error', db: 'unreachable', latencyMs, timestamp: new Date().toISOString() });
  }
});

// ── API Routes ────────────────────────────────────────────────────────────────
const API = '/api';

app.use(`${API}/auth`,           authLimiter, authRoutes);
app.use(`${API}/organizations`,  organizationRoutes);
app.use(`${API}/branches`,       branchRoutes);
app.use(`${API}/locations`,      locationRoutes);
app.use(`${API}/users`,          userRoutes);
app.use(`${API}/categories`,     categoryRoutes);
app.use(`${API}/units`,          unitRoutes);
app.use(`${API}/products`,       productRoutes);
app.use(`${API}/transfers`,      transferRoutes);
app.use(`${API}/customers`,      customerRoutes);
app.use(`${API}/suppliers`,      supplierRoutes);
app.use(`${API}/purchase-orders`, purchaseOrderRoutes);
app.use(`${API}/sales-orders`,   salesOrderRoutes);
app.use(`${API}/returns`,        returnsRoutes);
app.use(`${API}/expenses`,       expenseRoutes);
app.use(`${API}/stock`,          stockRoutes);
app.use(`${API}/payments`,       paymentRoutes);
app.use(`${API}/reports`,        reportRoutes);
app.use(`${API}/audit-log`,      auditLogRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, data: null, error: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── S06 + S07: Graceful shutdown and crash handlers ──────────────────────────
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
  process.exit(1);
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`BCC API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down gracefully...`);
  server.close(async () => {
    try {
      await pool.end();
      console.log('Database pool closed.');
    } catch (err) {
      console.error('Error closing pool:', err.message);
    }
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after 10s timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
