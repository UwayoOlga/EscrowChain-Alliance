import express from 'express';
import { query } from './db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Must be logged in
const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

router.use(requireAuth);

// Get all disputes for the user
router.get('/', async (req, res) => {
    try {
        const result = await query(
            `SELECT d.*, l.id as lease_uid, p.address as property_address 
             FROM disputes d
             JOIN leases l ON d.lease_id = l.id
             JOIN properties p ON l.property_id = p.id
             WHERE l.landlord_id = $1 OR l.tenant_id = $1
             ORDER BY d.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new dispute
router.post('/', async (req, res) => {
    const { leaseId, reason } = req.body;

    if (!leaseId || !reason) {
        return res.status(400).json({ error: 'leaseId and reason are required' });
    }

    try {
        // Verify lease exists and user is part of it
        const lease = await query('SELECT * FROM leases WHERE id = $1', [leaseId]);
        if (lease.rows.length === 0) return res.status(404).json({ error: 'Lease not found' });

        const l = lease.rows[0];
        if (l.landlord_id !== req.user.id && l.tenant_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const id = uuidv4();
        await query(
            'INSERT INTO disputes (id, lease_id, raised_by, reason) VALUES ($1, $2, $3, $4)',
            [id, leaseId, req.user.id, reason]
        );

        const result = await query('SELECT * FROM disputes WHERE id = $1', [id]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Resolve a dispute (landlord/tenant or admin)
router.patch('/:id/status', async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'resolved', 'arbitration'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        await query('UPDATE disputes SET status = $1 WHERE id = $2', [status, req.params.id]);
        const result = await query('SELECT * FROM disputes WHERE id = $1', [req.params.id]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
