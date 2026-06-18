import { query } from '../db.js';

/**
 * Centrally records system and user actions for audit purposes.
 * @param {string} userId - ID of the user performing the action
 * @param {string} action - Action descriptor (e.g., 'LEASE_SIGNED')
 * @param {string} resourceId - ID of the related asset (property_id or lease_id)
 * @param {object} metadata - Optional JSON payload with additional context (IP, TxHash, etc.)
 */
export async function logAction(userId, action, resourceId = null, metadata = {}) {
    try {
        await query(
            'INSERT INTO audit_logs (id, user_id, action, resource_id, metadata) VALUES (uuid_generate_v4(), $1, $2, $3, $4)',
            [userId, action, resourceId, JSON.stringify(metadata)]
        );
    } catch (error) {
        console.error('Audit logging failed:', error);
    }
}
