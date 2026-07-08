import express from 'express';
import { query } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import { notifyLeaseRequested, notifyLeaseApproved } from './mailer.js';
import { asyncHandler } from './utils/errors.js';
import { logAction } from './utils/logger.js';

const router = express.Router();

// Middleware: must be logged in
const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

router.use(requireAuth);

// Get all leases for the logged-in user
router.get('/', asyncHandler(async (req, res) => {
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
}));

// Create a new lease
router.post('/', asyncHandler(async (req, res) => {
    const { propertyId, tenantId, startDate, endDate } = req.body;

    if (!propertyId || !tenantId || !startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required lease fields' });
    }

    const property = await query('SELECT * FROM properties WHERE id = $1', [propertyId]);
    if (property.rows.length === 0) return res.status(404).json({ error: 'Property not found' });
    const prop = property.rows[0];

    // Authorization: Only the landlord can "offer" a lease, or a tenant can "apply"
    if (req.user.role === 'tenant') {
        if (req.user.id !== tenantId) return res.status(403).json({ error: 'Unauthorized lease identity' });
    } else if (prop.landlord_id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized landlord' });
    }

    if (prop.status !== 'available') return res.status(409).json({ error: 'Property unavailable for lease' });

    const id = uuidv4();
    const initialStatus = req.user.role === 'tenant' ? 'requested' : 'approved';

    await query(
        'INSERT INTO leases (id, property_id, landlord_id, tenant_id, rent_amount, deposit_amount, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [id, propertyId, prop.landlord_id, tenantId, prop.rent_amount, prop.deposit_amount, startDate, endDate, initialStatus]
    );

    await query('UPDATE properties SET status = $1 WHERE id = $2', ['pending approval', propertyId]);

    await logAction(req.user.id, 'LEASE_INITIATED', id, { status: initialStatus });

    const landlord = await query('SELECT name, email FROM users WHERE id = $1', [prop.landlord_id]);
    const tenant = await query('SELECT name FROM users WHERE id = $1', [tenantId]);

    if (landlord.rows[0] && tenant.rows[0]) {
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
}));

// Get a single lease
router.get('/:id', asyncHandler(async (req, res) => {
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
    if (lease.landlord_id !== req.user.id && lease.tenant_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    res.json(lease);
}));

// Update lease status
router.patch('/:id/status', asyncHandler(async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['requested', 'approved', 'active', 'completed', 'cancelled', 'release_requested', 'under dispute'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const leaseRes = await query('SELECT * FROM leases WHERE id = $1', [req.params.id]);
    if (leaseRes.rows.length === 0) return res.status(404).json({ error: 'Lease not found' });

    const lease = leaseRes.rows[0];
    if (lease.landlord_id !== req.user.id && lease.tenant_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    // Safety Protocol: Prevent multiple active leases unless Intentional (e.g. co-tenancy, but for this MVP, 1 lease per property)
    if (status === 'active') {
        const activeCheck = await query(
            'SELECT id FROM leases WHERE property_id = $1 AND status = $2 AND id != $3',
            [lease.property_id, 'active', req.params.id]
        );
        if (activeCheck.rows.length > 0) {
            return res.status(409).json({ error: 'System Error: This asset already possesses an active underlying lease.' });
        }
    }

    await query('UPDATE leases SET status = $1 WHERE id = $2', [status, req.params.id]);

    // Side Effects: Auto-update property status
    if (status === 'active') {
        await query('UPDATE properties SET status = $1 WHERE id = $2', ['leased', lease.property_id]);
    } else if (status === 'completed' || status === 'cancelled') {
        await query('UPDATE properties SET status = $1 WHERE id = $2', ['available', lease.property_id]);
    }

    await logAction(req.user.id, 'LEASE_STATUS_CHANGED', req.params.id, { status });

    const updated = await query('SELECT * FROM leases WHERE id = $1', [req.params.id]);
    res.json(updated.rows[0]);
}));

export default router;

