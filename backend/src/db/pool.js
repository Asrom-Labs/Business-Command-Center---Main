'use strict';

const { Pool } = require('pg');

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
