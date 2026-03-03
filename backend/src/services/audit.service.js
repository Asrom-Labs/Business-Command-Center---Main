'use strict';

/**
 * Insert an audit log entry.
 * @param {Object} options
 * @param {Object} options.client - pg client (pool or transaction client)
 * @param {string} options.orgId
 * @param {string} options.userId
 * @param {string} options.action - create|update|delete|transfer|adjustment|confirm|cancel|status_change
 * @param {string} options.entity - table name
 * @param {string} options.entityId - UUID of affected record
 * @param {Object} [options.changes] - optional before/after snapshot
 */
const log = async ({ client, orgId, userId, action, entity, entityId, changes = null }) => {
  await client.query(
    `INSERT INTO audit_log (organization_id, user_id, action, entity, entity_id, changes)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [orgId, userId || null, action, entity, entityId, changes ? JSON.stringify(changes) : null]
  );
};

module.exports = { log };
