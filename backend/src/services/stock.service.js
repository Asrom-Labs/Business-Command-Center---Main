'use strict';

/**
 * Calculate current stock on hand for a product+variant+location combination.
 */
const getStockOnHand = async (client, productId, variantId, locationId) => {
  const result = await client.query(
    `SELECT COALESCE(SUM(quantity_change), 0)::INTEGER AS stock
     FROM stock_ledger
     WHERE product_id = $1
       AND ($2::uuid IS NULL AND variant_id IS NULL OR variant_id = $2)
       AND location_id = $3`,
    [productId, variantId || null, locationId]
  );
  return result.rows[0].stock;
};

/**
 * Insert a stock ledger entry after validating no negative stock.
 * For negative movements, checks current stock first.
 * @throws {Error} with errorCode BUSINESS_RULE if stock would go negative
 */
const insertLedgerEntry = async (client, entry) => {
  const { productId, variantId, locationId, changeQty, movementType, referenceId, note, createdBy } = entry;

  if (changeQty < 0) {
    // Advisory lock per product+location — serializes concurrent negative movements
    // and closes the TOCTOU gap under PostgreSQL READ COMMITTED isolation.
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1 || $2))`, [productId, locationId]);
    const current = await getStockOnHand(client, productId, variantId, locationId);
    if (current + changeQty < 0) {
      const err = new Error(
        `Insufficient stock. Available: ${current}, Requested: ${Math.abs(changeQty)}`
      );
      err.isAppError = true;
      err.statusCode = 422;
      err.errorCode = 'BUSINESS_RULE';
      throw err;
    }
  }

  await client.query(
    `INSERT INTO stock_ledger (product_id, variant_id, location_id, quantity_change, movement_type, reference_id, note, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [productId, variantId || null, locationId, changeQty, movementType, referenceId || null, note || null, createdBy]
  );
};

module.exports = { getStockOnHand, insertLedgerEntry };
