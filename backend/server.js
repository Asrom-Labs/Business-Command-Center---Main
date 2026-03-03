'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

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
  windowMs: 15 * 60 * 1000, // 15 minutes
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

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

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

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`BCC API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;
