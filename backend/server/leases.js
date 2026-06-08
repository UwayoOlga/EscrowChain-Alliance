import express from 'express';
import { query } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import { notifyLeaseRequested, notifyLeaseApproved } from './mailer.js';

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
            `SELECT l.*, 
                    u_landlord.wallet_address as landlord_wallet, 
                    u_tenant.wallet_address as tenant_wallet
             FROM leases l
             JOIN users u_landlord ON l.landlord_id = u_landlord.id
             JOIN users u_tenant ON l.tenant_id = u_tenant.id
             WHERE l.landlord_id = $1 OR l.tenant_id = $1 
             ORDER BY l.created_at DESC`,
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

        // Only allow tenants to rent, or landlords to draft for a tenant
        if (req.user.role === 'tenant') {
            if (req.user.id !== tenantId) {
                return res.status(403).json({ error: 'Tenants can only lease for themselves.' });
            }
        } else if (prop.landlord_id !== req.user.id) {
            return res.status(403).json({ error: 'Only the landlord or an applying tenant can initiate this lease.' });
        }

        // Exception Handling: No 2 tenants can rent the same property
        if (prop.status !== 'available') {
            return res.status(409).json({ error: 'This property has already been leased or is currently unavailable.' });
        }

        const id = uuidv4();
        const initialStatus = req.user.role === 'tenant' ? 'requested' : 'approved';
        await query(
            'INSERT INTO leases (id, property_id, landlord_id, tenant_id, rent_amount, deposit_amount, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [id, propertyId, req.user.id, tenantId, prop.rent_amount, prop.deposit_amount, startDate, endDate, initialStatus]
        );

        // Mark property as securely pending so no other tenant can double-book
        await query('UPDATE properties SET status = $1 WHERE id = $2', ['pending approval', propertyId]);

        // Auto-Generate a "Notification" message to Landlord
        const msgId = uuidv4();
        await query(
            'INSERT INTO messages (id, sender_id, receiver_id, content) VALUES ($1, $2, $3, $4)',
            [msgId, req.user.id, prop.landlord_id, `SYSTEM: I have initiated a lease for ${prop.title}.`]
        );

        // Email the landlord that a new application arrived
        const landlord = await query('SELECT name, email FROM users WHERE id = $1', [prop.landlord_id]);
        const tenant = await query('SELECT name FROM users WHERE id = $1', [req.user.id]);
        if (landlord.rows.length > 0 && tenant.rows.length > 0) {
            await notifyLeaseRequested({
                landlordEmail: landlord.rows[0].email,
                landlordName: landlord.rows[0].name,
                tenantName: tenant.rows[0].name,
                propertyTitle: prop.title || prop.address,
                leaseId: id
            });
        }

        const result = await query('SELECT * FROM leases WHERE id = $1', [id]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single lease
router.get('/:id', async (req, res) => {
    try {
        const result = await query(
            `SELECT l.*, 
                    u_landlord.wallet_address as landlord_wallet, 
                    u_tenant.wallet_address as tenant_wallet
             FROM leases l
             JOIN users u_landlord ON l.landlord_id = u_landlord.id
             JOIN users u_tenant ON l.tenant_id = u_tenant.id
             WHERE l.id = $1`,
            [req.params.id]
        );
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

// Update lease status (activate, complete, cancel, approve)
router.patch('/:id/status', async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['approved', 'active', 'completed', 'cancelled'];

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
