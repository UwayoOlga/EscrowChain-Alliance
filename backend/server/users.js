import express from 'express';
import { query } from './db.js';

const router = express.Router();

// Must be logged in
const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

router.use(requireAuth);

// Get current user's profile
router.get('/me', async (req, res) => {
    try {
        const result = await query('SELECT id, name, email, role, wallet_address, created_at FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update profile (name, wallet address)
router.patch('/me', async (req, res) => {
    const { name, walletAddress } = req.body;

    try {
        if (name) {
            await query('UPDATE users SET name = $1 WHERE id = $2', [name, req.user.id]);
        }
        if (walletAddress) {
            await query('UPDATE users SET wallet_address = $1 WHERE id = $2', [walletAddress, req.user.id]);
        }

        const result = await query('SELECT id, name, email, role, wallet_address, created_at FROM users WHERE id = $1', [req.user.id]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
