import express from 'express';
import { query } from './db.js';
import { asyncHandler } from './utils/errors.js';

const router = express.Router();

const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

router.use(requireAuth);

// Get audit logs (Landlord only)
router.get('/audit-logs', asyncHandler(async (req, res) => {
    if (req.user.role !== 'landlord') return res.status(403).json({ error: 'Access denied' });

    const result = await query(
        'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100'
    );
    res.json(result.rows);
}));

// Get current user's profile
router.get('/me', asyncHandler(async (req, res) => {
    const result = await query('SELECT id, name, email, role, wallet_address, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
}));

// Update profile
router.patch('/me', asyncHandler(async (req, res) => {
    const { name, walletAddress } = req.body;
    if (name) {
        await query('UPDATE users SET name = $1 WHERE id = $2', [name, req.user.id]);
    }
    if (walletAddress) {
        await query('UPDATE users SET wallet_address = $1 WHERE id = $2', [walletAddress, req.user.id]);
    }
    const result = await query('SELECT id, name, email, role, wallet_address, created_at FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
}));

// Get tenants associated with the current landlord's properties
router.get('/tenants', asyncHandler(async (req, res) => {
    if (req.user.role !== 'landlord') return res.status(403).json({ error: 'Access denied' });

    const result = await query(`
        SELECT DISTINCT u.id, u.name, u.email, u.wallet_address 
        FROM users u
        JOIN leases l ON u.id = l.tenant_id
        WHERE u.role = $1 AND l.landlord_id = $2
    `, ['tenant', req.user.id]);
    res.json(result.rows);
}));

// Search for a tenant by email
router.get('/prospects', asyncHandler(async (req, res) => {
    const { email } = req.query;
    if (req.user.role !== 'landlord') return res.status(403).json({ error: 'Access denied' });
    if (!email) return res.status(400).json({ error: 'Email query parameter is required' });

    const result = await query(`
        SELECT id, name, email, wallet_address 
        FROM users 
        WHERE role = 'tenant' AND email = $1
    `, [email]);
    res.json(result.rows);
}));

// GET global search results
router.get('/search', asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim() === '') return res.json([]);
    const queryStr = `%${q.trim()}%`;
    const results = [];

    // Search properties
    let propResult;
    if (req.user.role === 'landlord') {
        propResult = await query(
            'SELECT id, title, address FROM properties WHERE landlord_id = $1 AND (title LIKE $2 OR address LIKE $2)',
            [req.user.id, queryStr]
        );
    } else {
        propResult = await query(
            'SELECT id, title, address FROM properties WHERE title LIKE $1 OR address LIKE $1',
            [queryStr]
        );
    }
    for (const row of propResult.rows) {
        results.push({
            type: 'property',
            id: row.id,
            title: row.title || 'Residential Property',
            subtitle: row.address,
            link: `/properties/${row.id}`
        });
    }

    // Search leases
    let leaseResult;
    if (req.user.role === 'landlord') {
        leaseResult = await query(`
            SELECT l.id, p.title as property_title, u.name as tenant_name, l.status 
            FROM leases l
            JOIN properties p ON l.property_id = p.id
            JOIN users u ON l.tenant_id = u.id
            WHERE l.landlord_id = $1 AND (l.id LIKE $2 OR p.title LIKE $2 OR u.name LIKE $2)
        `, [req.user.id, queryStr]);
    } else {
        leaseResult = await query(`
            SELECT l.id, p.title as property_title, u.name as landlord_name, l.status 
            FROM leases l
            JOIN properties p ON l.property_id = p.id
            JOIN users u ON l.landlord_id = u.id
            WHERE l.tenant_id = $1 AND (l.id LIKE $2 OR p.title LIKE $2 OR u.name LIKE $2)
        `, [req.user.id, queryStr]);
    }
    for (const row of leaseResult.rows) {
        results.push({
            type: 'lease',
            id: row.id,
            title: `Lease CT-${row.id.substring(0, 8).toUpperCase()}`,
            subtitle: `${row.property_title} (${row.status})`,
            link: `/leases`
        });
    }

    res.json(results);
}));

// GET pending alerts/notifications
router.get('/alerts', asyncHandler(async (req, res) => {
    const alerts = [];

    // 1. Check leases requiring actions
    if (req.user.role === 'landlord') {
        // Pending lease applications
        const pendingLeases = await query(`
            SELECT l.id, p.title, u.name as tenant_name 
            FROM leases l
            JOIN properties p ON l.property_id = p.id
            JOIN users u ON l.tenant_id = u.id
            WHERE l.landlord_id = $1 AND l.status = 'requested'
        `, [req.user.id]);
        
        for (const row of pendingLeases.rows) {
            alerts.push({
                id: `lease-req-${row.id}`,
                message: `New lease request for "${row.title}" from ${row.tenant_name}`,
                link: `/leases`,
                type: 'info'
            });
        }
    } else {
        // Leases approved but not locked/signed yet
        const approvedLeases = await query(`
            SELECT l.id, p.title 
            FROM leases l
            JOIN properties p ON l.property_id = p.id
            WHERE l.tenant_id = $1 AND l.status = 'approved'
        `, [req.user.id]);

        for (const row of approvedLeases.rows) {
            alerts.push({
                id: `lease-appr-${row.id}`,
                message: `Lease for "${row.title}" approved! Click to sign contract.`,
                link: `/leases`,
                type: 'warning'
            });
        }

        // Leases where release is requested (needs co-signature)
        const releaseRequested = await query(`
            SELECT l.id, p.title 
            FROM leases l
            JOIN properties p ON l.property_id = p.id
            WHERE l.tenant_id = $1 AND l.status = 'release_requested'
        `, [req.user.id]);

        for (const row of releaseRequested.rows) {
            alerts.push({
                id: `lease-release-${row.id}`,
                message: `Landlord requested release. Co-signature required to unlock.`,
                link: `/leases`,
                type: 'danger'
            });
        }
    }

    // 2. Active disputes
    const activeDisputes = await query(`
        SELECT d.id, d.lease_id, d.status 
        FROM disputes d
        JOIN leases l ON d.lease_id = l.id
        WHERE (l.landlord_id = $1 OR l.tenant_id = $1) AND d.status IN ('pending', 'arbitration')
    `, [req.user.id]);

    for (const row of activeDisputes.rows) {
        alerts.push({
            id: `dispute-${row.id}`,
            message: `Dispute on lease CT-${row.lease_id.substring(0,8).toUpperCase()} is currently in ${row.status.toUpperCase()}.`,
            link: `/disputes`,
            type: 'danger'
        });
    }

    res.json(alerts);
}));

export default router;
