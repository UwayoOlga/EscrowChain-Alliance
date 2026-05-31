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
            `SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    const { title, fileUrl, type } = req.body;
    if (!title || !fileUrl) return res.status(400).json({ error: 'title and fileUrl required' });

    try {
        const id = uuidv4();
        await query(
            'INSERT INTO documents (id, user_id, title, file_url, type) VALUES ($1, $2, $3, $4, $5)',
            [id, req.user.id, title, fileUrl, type || 'lease']
        );
        res.json({ id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
