import express from 'express';
import { query } from './db.js';

const router = express.Router();

// Get all properties
router.get('/', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                id, 
                landlord_id as "landlordId", 
                address, 
                rent_amount as "rentAmount", 
                deposit_amount as "depositAmount", 
                status, 
                images, 
                created_at as "createdAt" 
            FROM properties 
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new property listing
router.post('/', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });

    const { address, rentAmount, depositAmount, images } = req.body;
    const landlord_id = req.user.id;

    if (!address || !rentAmount || !depositAmount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await query(
            'INSERT INTO properties (landlord_id, address, rent_amount, deposit_amount, images) VALUES ($1, $2, $3, $4, $5) RETURNING id, landlord_id as "landlordId", address, rent_amount as "rentAmount", deposit_amount as "depositAmount", status, images',
            [landlord_id, address, rentAmount, depositAmount, images || []]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get property by ID
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
