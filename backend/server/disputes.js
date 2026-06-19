import express from 'express';
import { query } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { asyncHandler } from './utils/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ── Multer setup ──
const evidenceDir = path.resolve(__dirname, '..', 'uploads', 'evidence');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, evidenceDir),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.use((req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    next();
});

// GET disputes visible to user
router.get('/', asyncHandler(async (req, res) => {
    let result;
    if (req.user.role === 'arbitrator') {
        result = await query(`
            SELECT d.*, 
                    u.name as raised_by_name,
                    l.id as lease_uid, 
                    p.address as property_address,
                    p.title as property_title
                FROM disputes d
                JOIN leases l ON d.lease_id = l.id
                JOIN properties p ON l.property_id = p.id
                JOIN users u ON d.raised_by = u.id
                ORDER BY d.created_at DESC
        `);
    } else {
        result = await query(`
            SELECT d.*, 
                    u.name as raised_by_name,
                    l.id as lease_uid, 
                    p.address as property_address,
                    p.title as property_title
                FROM disputes d
                JOIN leases l ON d.lease_id = l.id
                JOIN properties p ON l.property_id = p.id
                JOIN users u ON d.raised_by = u.id
                WHERE l.landlord_id = $1 OR l.tenant_id = $1
                ORDER BY d.created_at DESC
        `, [req.user.id]);
    }
    res.json(result.rows);
}));

// POST create dispute
router.post('/', upload.array('evidence', 5), asyncHandler(async (req, res) => {
    const { leaseId, transactionId, reason } = req.body;

    if (!leaseId || !reason?.trim()) return res.status(400).json({ error: 'leaseId and reason are required.' });

    // Security: Only parties to the lease
    const leaseRes = await query('SELECT * FROM leases WHERE id = $1', [leaseId]);
    if (leaseRes.rows.length === 0) return res.status(404).json({ error: 'Lease not found.' });

    const l = leaseRes.rows[0];
    if (l.landlord_id !== req.user.id && l.tenant_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied: not a party to this lease.' });
    }

    const evidencePaths = req.files ? req.files.map(f => `/uploads/evidence/${f.filename}`) : [];
    const id = uuidv4();

    await query(
        'INSERT INTO disputes (id, lease_id, transaction_id, raised_by, reason, evidence) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, leaseId, transactionId || null, req.user.id, reason.trim(), JSON.stringify(evidencePaths)]
    );

    // Freeze lease
    await query("UPDATE leases SET status = 'under dispute' WHERE id = $1", [leaseId]);

    // Optional: If transactionId provided, mark transaction as disputed
    if (transactionId) {
        await query("UPDATE escrow_transactions SET status = 'disputed' WHERE id = $1", [transactionId]);
    }

    const result = await query('SELECT * FROM disputes WHERE id = $1', [id]);
    res.json(result.rows[0]);
}));

// PATCH update status & resolution
router.patch('/:id/status', asyncHandler(async (req, res) => {
    const { status, resolutionNotes } = req.body;
    const validStatuses = ['pending', 'resolved', 'arbitration', 'dismissed'];

    if (status && !validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const disputeRes = await query('SELECT * FROM disputes WHERE id = $1', [req.params.id]);
    if (disputeRes.rows.length === 0) return res.status(404).json({ error: 'Dispute not found.' });

    await query(
        'UPDATE disputes SET status = COALESCE($1, status), resolution_notes = COALESCE($2, resolution_notes) WHERE id = $3',
        [status || null, resolutionNotes || null, req.params.id]
    );

    // Handle Lease Unfreeze
    if (status === 'resolved' || status === 'dismissed') {
        await query("UPDATE leases SET status = 'active' WHERE id = $1", [disputeRes.rows[0].lease_id]);
    }

    const result = await query('SELECT * FROM disputes WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
}));

export default router;
