import express from 'express';
import { query } from './db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Must be logged in for all escrow routes
const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

router.use(requireAuth);

// Get all escrow transactions for the logged-in user (across all leases)
router.get('/my-transactions', async (req, res) => {
    try {
        const result = await query(
            `SELECT et.*, l.id as lease_uid, p.address as property_address 
             FROM escrow_transactions et
             JOIN leases l ON et.lease_id = l.id
             JOIN properties p ON l.property_id = p.id
             WHERE l.landlord_id = $1 OR l.tenant_id = $1
             ORDER BY et.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get escrow transactions for a specific lease
router.get('/lease/:leaseId', async (req, res) => {
    try {
        const result = await query(
            `SELECT * FROM escrow_transactions WHERE lease_id = $1 ORDER BY created_at DESC`,
            [req.params.leaseId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create an escrow transaction (matches smart contract actions)
router.post('/', async (req, res) => {
    const { leaseId, action, amount, txHash } = req.body;
    const validActions = ['CollectRent', 'RefundDeposit', 'CompleteLease', 'ContractSigned'];

    if (!leaseId || !action || !amount) {
        return res.status(400).json({ error: 'leaseId, action, and amount are required' });
    }

    if (!validActions.includes(action)) {
        return res.status(400).json({ error: `Action must be one of: ${validActions.join(', ')}` });
    }

    try {
        // Verify the lease exists and user is part of it
        const lease = await query('SELECT * FROM leases WHERE id = $1', [leaseId]);
        if (lease.rows.length === 0) return res.status(404).json({ error: 'Lease not found' });

        const l = lease.rows[0];
        if (l.landlord_id !== req.user.id && l.tenant_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const id = uuidv4();
        await query(
            'INSERT INTO escrow_transactions (id, lease_id, action, amount, tx_hash, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, leaseId, action, amount, txHash || null, 'pending']
        );

        const result = await query('SELECT * FROM escrow_transactions WHERE id = $1', [id]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update transaction status (e.g. after on-chain confirmation)
router.patch('/:id', async (req, res) => {
    const { status, txHash } = req.body;

    try {
        const tx = await query('SELECT * FROM escrow_transactions WHERE id = $1', [req.params.id]);
        if (tx.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });

        await query(
            'UPDATE escrow_transactions SET status = $1, tx_hash = COALESCE($2, tx_hash) WHERE id = $3',
            [status || tx.rows[0].status, txHash || null, req.params.id]
        );

        const result = await query('SELECT * FROM escrow_transactions WHERE id = $1', [req.params.id]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
