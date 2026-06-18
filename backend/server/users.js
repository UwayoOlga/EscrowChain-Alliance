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

export default router;
