import express from 'express';
import { query } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from './utils/errors.js';

const router = express.Router();

router.use((req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    next();
});

// GET all escrow transactions for the user
router.get('/my-transactions', asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT et.*, p.address as property_address 
        FROM escrow_transactions et
        JOIN leases l ON et.lease_id = l.id
        JOIN properties p ON l.property_id = p.id
        WHERE et.landlord_id = $1 OR et.tenant_id = $1
        ORDER BY et.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
}));

// GET transactions for a specific lease
router.get('/lease/:leaseId', asyncHandler(async (req, res) => {
    const result = await query(
        'SELECT * FROM escrow_transactions WHERE lease_id = $1 ORDER BY created_at DESC',
        [req.params.leaseId]
    );
    res.json(result.rows);
}));

// POST a new escrow transaction
router.post('/', asyncHandler(async (req, res) => {
    const { leaseId, action, amount, txHash, metadata } = req.body;
    const validActions = ['CollectRent', 'RefundDeposit', 'CompleteLease', 'ContractSigned'];

    if (!leaseId || !action || amount === undefined) {
        return res.status(400).json({ error: 'leaseId, action, and amount required' });
    }

    if (!validActions.includes(action)) {
        return res.status(400).json({ error: `Invalid action. Valid: ${validActions.join(', ')}` });
    }

    // Lookup lease participants
    const leaseRes = await query('SELECT landlord_id, tenant_id FROM leases WHERE id = $1', [leaseId]);
    if (leaseRes.rows.length === 0) return res.status(404).json({ error: 'Associated lease not found' });

    const { landlord_id, tenant_id } = leaseRes.rows[0];
    if (req.user.id !== landlord_id && req.user.id !== tenant_id) {
        return res.status(403).json({ error: 'Access denied: not a party to this lease' });
    }

    const id = uuidv4();
    await query(
        `INSERT INTO escrow_transactions (id, lease_id, landlord_id, tenant_id, amount, action, tx_hash, metadata, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, leaseId, landlord_id, tenant_id, amount, action, txHash || null, JSON.stringify(metadata || {}), 'pending']
    );

    const result = await query('SELECT * FROM escrow_transactions WHERE id = $1', [id]);
    res.json(result.rows[0]);
}));

// PATCH update status (Admin or participants only)
router.patch('/:id', asyncHandler(async (req, res) => {
    const { status, txHash, metadata } = req.body;
    const validStatuses = ['pending', 'locked', 'released', 'refunded', 'disputed'];

    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const txRes = await query('SELECT * FROM escrow_transactions WHERE id = $1', [req.params.id]);
    if (txRes.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });

    const tx = txRes.rows[0];
    if (req.user.id !== tx.landlord_id && req.user.id !== tx.tenant_id) {
        return res.status(403).json({ error: 'Unauthorized to modify transaction' });
    }

    let updatedMetadata = tx.metadata;
    if (metadata) {
        let oldMeta = {};
        try { oldMeta = JSON.parse(tx.metadata || '{}'); } catch { }
        updatedMetadata = JSON.stringify({ ...oldMeta, ...metadata });
    }

    await query(
        'UPDATE escrow_transactions SET status = COALESCE($1, status), tx_hash = COALESCE($2, tx_hash), metadata = COALESCE($3, metadata) WHERE id = $4',
        [status || null, txHash || null, updatedMetadata, req.params.id]
    );

    const result = await query('SELECT * FROM escrow_transactions WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
}));

export default router;
