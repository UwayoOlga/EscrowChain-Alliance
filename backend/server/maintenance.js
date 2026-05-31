import express from 'express';
import { query } from './db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const result = await query(
            `SELECT m.*, p.address as property_address, u.name as tenant_name 
             FROM maintenance_requests m
             JOIN properties p ON m.property_id = p.id
             JOIN users u ON m.tenant_id = u.id
             WHERE p.landlord_id = $1 OR m.tenant_id = $1
             ORDER BY m.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    const { propertyId, title, description } = req.body;
    if (!propertyId || !title) return res.status(400).json({ error: 'propertyId and title required' });

    try {
        const id = uuidv4();
        await query(
            'INSERT INTO maintenance_requests (id, property_id, tenant_id, title, description) VALUES ($1, $2, $3, $4, $5)',
            [id, propertyId, req.user.id, title, description]
        );
        res.json({ id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await query('UPDATE maintenance_requests SET status = $1 WHERE id = $2', [status, req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
