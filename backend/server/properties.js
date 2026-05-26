import express from 'express';
import { query } from './db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all properties
router.get('/', async (req, res) => {
    try {
        const result = await query('SELECT * FROM properties ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new property (must be logged in)
router.post('/', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });

    const { address, rentAmount, depositAmount, images } = req.body;

    if (!address || !rentAmount || !depositAmount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const id = uuidv4();

        await query(
            'INSERT INTO properties (id, landlord_id, address, rent_amount, deposit_amount, images) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, req.user.id, address, rentAmount, depositAmount, images ? JSON.stringify(images) : null]
        );

        const result = await query('SELECT * FROM properties WHERE id = $1', [id]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single property by ID
router.get('/:id', async (req, res) => {
    try {
        const result = await query('SELECT * FROM properties WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Property not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
