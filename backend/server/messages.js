import express from 'express';
import { query } from './db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

router.use(requireAuth);

// Get conversations (who the user has chatted with, or their active leases' counterparts)
router.get('/contacts', async (req, res) => {
    try {
        // Find users that this user has an active lease relationship with
        const result = await query(`
            SELECT DISTINCT u.id, u.name, u.email, u.role
            FROM leases l
            JOIN users u ON (l.landlord_id = u.id OR l.tenant_id = u.id)
            WHERE (l.landlord_id = $1 OR l.tenant_id = $1) AND u.id != $1 AND l.status = 'active'
        `, [req.user.id]);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get messages with a specific user
router.get('/:userId', async (req, res) => {
    try {
        const otherId = req.params.userId;
        const result = await query(`
            SELECT * FROM messages 
            WHERE (sender_id = $1 AND receiver_id = $2) 
               OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY created_at ASC
        `, [req.user.id, otherId]);

        // Mark as read securely
        await query(`
            UPDATE messages SET read = TRUE 
            WHERE sender_id = $1 AND receiver_id = $2 AND read = FALSE
        `, [otherId, req.user.id]);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    const { receiverId, content } = req.body;
    if (!receiverId || !content || content.trim() === '') {
        return res.status(400).json({ error: 'Valid receiverId and content are required' });
    }

    try {
        // Security logic: check if they have an active lease relationship
        const relationship = await query(`
            SELECT 1 FROM leases 
            WHERE ((landlord_id = $1 AND tenant_id = $2) OR (landlord_id = $2 AND tenant_id = $1))
              AND status = 'active'
        `, [req.user.id, receiverId]);

        if (relationship.rows.length === 0) {
            return res.status(403).json({ error: 'You can only message parties you have an active binding with.' });
        }

        const id = uuidv4();
        await query(
            'INSERT INTO messages (id, sender_id, receiver_id, content) VALUES ($1, $2, $3, $4)',
            [id, req.user.id, receiverId, content.trim()]
        );
        res.json({ id, sender_id: req.user.id, receiver_id: receiverId, content: content.trim(), created_at: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
