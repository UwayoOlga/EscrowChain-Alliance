import express from 'express';
import { query } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { notifyDisputeFiled } from './mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ── Multer setup for evidence uploads ──
const evidenceDir = path.resolve(__dirname, '..', 'uploads', 'evidence');
if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, evidenceDir),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

// ── Auth middleware ──
const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

router.use(requireAuth);

// ── GET all disputes visible to the logged-in user ──
router.get('/', async (req, res) => {
    try {
        const result = await query(
            `SELECT d.*, 
                    u.name as raised_by_name,
                    l.id as lease_uid, 
                    p.address as property_address,
                    p.title as property_title
             FROM disputes d
             JOIN leases l ON d.lease_id = l.id
             JOIN properties p ON l.property_id = p.id
             JOIN users u ON d.raised_by = u.id
             WHERE l.landlord_id = $1 OR l.tenant_id = $1
             ORDER BY d.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── POST create a new dispute with optional evidence files ──
router.post('/', upload.array('evidence', 5), async (req, res) => {
    const { leaseId, reason } = req.body;

    if (!leaseId || !reason?.trim()) {
        return res.status(400).json({ error: 'leaseId and reason are required.' });
    }

    try {
        // Security: Only parties to the lease may raise a dispute
        const lease = await query('SELECT * FROM leases WHERE id = $1', [leaseId]);
        if (lease.rows.length === 0) return res.status(404).json({ error: 'Lease not found.' });

        const l = lease.rows[0];
        if (l.landlord_id !== req.user.id && l.tenant_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied. You are not part of this lease.' });
        }

        // Prevent duplicate open disputes on the same lease
        const existing = await query(
            "SELECT id FROM disputes WHERE lease_id = $1 AND status = 'pending'",
            [leaseId]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'An open dispute already exists for this lease.' });
        }

        const evidencePaths = req.files
            ? req.files.map(f => `/uploads/evidence/${f.filename}`)
            : [];

        const id = uuidv4();
        await query(
            'INSERT INTO disputes (id, lease_id, raised_by, reason, evidence) VALUES ($1, $2, $3, $4, $5)',
            [id, leaseId, req.user.id, reason.trim(), JSON.stringify(evidencePaths)]
        );

        // Freeze the lease status so funds cannot be released during arbitration
        await query("UPDATE leases SET status = 'under dispute' WHERE id = $1", [leaseId]);

        // Notify BOTH parties of the filed dispute
        const raisedBy = await query('SELECT name, email FROM users WHERE id = $1', [req.user.id]);
        const landlord = await query('SELECT name, email FROM users WHERE id = $1', [l.landlord_id]);
        const tenant = await query('SELECT name, email FROM users WHERE id = $1', [l.tenant_id]);
        const property = await query('SELECT title, address FROM properties WHERE id = $1', [l.property_id]);

        const propertyTitle = property.rows[0]?.title || property.rows[0]?.address || 'Unknown Property';
        const raisedByName = raisedBy.rows[0]?.name || 'A party';

        const otherParty = req.user.id === l.landlord_id ? tenant.rows[0] : landlord.rows[0];
        const raisedByParty = req.user.id === l.landlord_id ? landlord.rows[0] : tenant.rows[0];

        if (otherParty) {
            await notifyDisputeFiled({
                recipientEmail: otherParty.email,
                recipientName: otherParty.name,
                raisedByName,
                propertyTitle,
                caseId: id,
                reason: reason.trim()
            });
        }
        if (raisedByParty) {
            await notifyDisputeFiled({
                recipientEmail: raisedByParty.email,
                recipientName: raisedByParty.name,
                raisedByName: 'You',
                propertyTitle,
                caseId: id,
                reason: reason.trim()
            });
        }

        const result = await query('SELECT * FROM disputes WHERE id = $1', [id]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── PATCH update a dispute's status ──
router.patch('/:id/status', async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'resolved', 'arbitration', 'dismissed'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    try {
        const dispute = await query('SELECT * FROM disputes WHERE id = $1', [req.params.id]);
        if (dispute.rows.length === 0) return res.status(404).json({ error: 'Dispute not found.' });

        await query('UPDATE disputes SET status = $1 WHERE id = $2', [status, req.params.id]);

        // If resolved or dismissed, unfreeze the lease
        if (status === 'resolved' || status === 'dismissed') {
            await query("UPDATE leases SET status = 'active' WHERE id = $1", [dispute.rows[0].lease_id]);
        }

        const result = await query('SELECT * FROM disputes WHERE id = $1', [req.params.id]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
