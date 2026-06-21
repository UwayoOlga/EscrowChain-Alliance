import express from 'express';
import { query } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from './utils/errors.js';

const router = express.Router();

router.use((req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    next();
});

// GET all conversations for the user (inbox list)
router.get('/contacts', asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT c.*, 
               u1.name as p1_name, u1.role as p1_role,
               u2.name as p2_name, u2.role as p2_role
        FROM conversations c
        JOIN users u1 ON c.participant_one = u1.id
        JOIN users u2 ON c.participant_two = u2.id
        WHERE c.participant_one = $1 OR c.participant_two = $1
        ORDER BY c.updated_at DESC
    `, [req.user.id]);

    // Format for the frontend: reveal the "other" person
    const threads = result.rows.map(row => {
        const isP1 = row.participant_one === req.user.id;
        return {
            id: row.id,
            other_user_id: isP1 ? row.participant_two : row.participant_one,
            other_user_name: isP1 ? row.p2_name : row.p1_name,
            other_user_role: isP1 ? row.p2_role : row.p1_role,
            last_message: row.last_message,
            updated_at: row.updated_at
        };
    });

    res.json(threads);
}));

// GET messages from a specific conversation
router.get('/:otherUserId', asyncHandler(async (req, res) => {
    const otherId = req.params.otherUserId;
    const p1 = req.user.id < otherId ? req.user.id : otherId;
    const p2 = req.user.id < otherId ? otherId : req.user.id;

    const conversation = await query(
        'SELECT id FROM conversations WHERE participant_one = $1 AND participant_two = $2',
        [p1, p2]
    );

    if (conversation.rows.length === 0) return res.json([]);

    const messages = await query(
        'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
        [conversation.rows[0].id]
    );

    await query(
        'UPDATE messages SET read = TRUE WHERE conversation_id = $1 AND sender_id = $2 AND read = FALSE',
        [conversation.rows[0].id, otherId]
    );

    res.json(messages.rows);
}));

// POST a new message
router.post('/', asyncHandler(async (req, res) => {
    const { receiverId, content } = req.body;
    if (!receiverId || !content?.trim()) {
        return res.status(400).json({ error: 'Receiver and content required' });
    }

    // Security: Check for active lease
    const relationship = await query(`
        SELECT 1 FROM leases 
        WHERE ((landlord_id = $1 AND tenant_id = $2) OR (landlord_id = $2 AND tenant_id = $1))
          AND status IN ('active', 'release_requested', 'pending', 'approved')
    `, [req.user.id, receiverId]);

    if (relationship.rows.length === 0) {
        return res.status(403).json({ error: 'Active lease required to message.' });
    }

    // Find or Create Conversation
    const p1 = req.user.id < receiverId ? req.user.id : receiverId;
    const p2 = req.user.id < receiverId ? receiverId : req.user.id;

    let convResult = await query(
        'SELECT id FROM conversations WHERE participant_one = $1 AND participant_two = $2',
        [p1, p2]
    );

    let conversationId;
    if (convResult.rows.length === 0) {
        conversationId = uuidv4();
        await query(
            'INSERT INTO conversations (id, participant_one, participant_two, last_message) VALUES ($1, $2, $3, $4)',
            [conversationId, p1, p2, content.trim()]
        );
    } else {
        conversationId = convResult.rows[0].id;
        await query(
            'UPDATE conversations SET last_message = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [content.trim(), conversationId]
        );
    }

    const messageId = uuidv4();
    await query(
        'INSERT INTO messages (id, conversation_id, sender_id, content) VALUES ($1, $2, $3, $4)',
        [messageId, conversationId, req.user.id, content.trim()]
    );

    res.json({ id: messageId, conversation_id: conversationId, sender_id: req.user.id, content: content.trim() });
}));

export default router;
