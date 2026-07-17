'use strict';

const { Pool, types } = require('pg');

// DATE columns (oid 1082) must serialize as plain 'YYYY-MM-DD' strings.
// By default node-postgres parses DATE into a JS Date at the Node process's local
// timezone, which JSON-serializes to a full UTC timestamp ("2026-08-19T21:00:00.000Z"
// for the date 2026-08-20 in UTC+3) — both timezone-shifted and unusable by the
// frontend's date convention of appending 'T00:00:00' before new Date() (see BUG-01).
// A DATE has no time or zone; returning the raw string keeps it that way.
// Affects: purchase_orders.expected_date, payments.payment_date, expenses.date,
// and reports' created_at::DATE groupings.
types.setTypeParser(1082, (v) => v);

// Enable SSL for any remote database (Railway, Render, Supabase, etc.)
// regardless of NODE_ENV — SSL must be on whenever the host is not local.
const dbUrl = process.env.DATABASE_URL || '';
const isRemote =
  dbUrl.length > 0 &&
  !dbUrl.includes('localhost') &&
  !dbUrl.includes('127.0.0.1');

const pool = new Pool({
  connectionString: dbUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  query_timeout: 30000, // 30s max per query — prevents indefinite hangs on lock waits or stalled connections
  ssl: isRemote ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Do not exit — log and let the pool recover; process.exit here would
  // crash the server on any transient network blip.
});

/**
 * Execute a parameterized query using the pool.
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 */
const query = (text, params) => pool.query(text, params);

/**
 * Execute a callback within a transaction.
 * Automatically commits on success and rolls back on error.
 * @param {Function} callback - Async function receiving the client
 */
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, withTransaction };
