import express from 'express';
import { query } from './db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Middleware: must be logged in
const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

router.use(requireAuth);

// Get all leases for the logged-in user (as landlord or tenant)
router.get('/', async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM leases WHERE landlord_id = $1 OR tenant_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new lease
router.post('/', async (req, res) => {
    const { propertyId, tenantId, startDate, endDate } = req.body;

    if (!propertyId || !tenantId || !startDate || !endDate) {
        return res.status(400).json({ error: 'propertyId, tenantId, startDate, and endDate are required' });
    }

    try {
        // Get the property to pull rent/deposit amounts
        const property = await query('SELECT * FROM properties WHERE id = $1', [propertyId]);
        if (property.rows.length === 0) return res.status(404).json({ error: 'Property not found' });

        const prop = property.rows[0];

        // Only the property landlord can create a lease
        if (prop.landlord_id !== req.user.id) {
            return res.status(403).json({ error: 'Only the landlord can create a lease' });
        }

        const id = uuidv4();
        await query(
            'INSERT INTO leases (id, property_id, landlord_id, tenant_id, rent_amount, deposit_amount, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [id, propertyId, req.user.id, tenantId, prop.rent_amount, prop.deposit_amount, startDate, endDate]
        );

        // Mark property as rented
        await query('UPDATE properties SET status = $1 WHERE id = $2', ['rented', propertyId]);

        const result = await query('SELECT * FROM leases WHERE id = $1', [id]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single lease
router.get('/:id', async (req, res) => {
    try {
        const result = await query('SELECT * FROM leases WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Lease not found' });

        const lease = result.rows[0];

        // Only landlord or tenant can view
        if (lease.landlord_id !== req.user.id && lease.tenant_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(lease);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update lease status (activate, complete, cancel)
router.patch('/:id/status', async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['active', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    try {
        const result = await query('SELECT * FROM leases WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Lease not found' });

        const lease = result.rows[0];
        if (lease.landlord_id !== req.user.id && lease.tenant_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await query('UPDATE leases SET status = $1 WHERE id = $2', [status, req.params.id]);

        // If completed or cancelled, free up the property
        if (status === 'completed' || status === 'cancelled') {
            await query('UPDATE properties SET status = $1 WHERE id = $2', ['available', lease.property_id]);
        }

        const updated = await query('SELECT * FROM leases WHERE id = $1', [req.params.id]);
        res.json(updated.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
