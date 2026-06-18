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

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.use((req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    next();
});

// GET documents visible to the user
router.get('/', asyncHandler(async (req, res) => {
    // A user can see documents they uploaded, OR documents linked to a lease/property they are part of
    const result = await query(`
        SELECT DISTINCT d.* 
        FROM documents d
        LEFT JOIN leases l ON d.lease_id = l.id
        LEFT JOIN properties p ON d.property_id = p.id
        WHERE d.uploader_id = $1 
           OR l.tenant_id = $1 OR l.landlord_id = $1
           OR p.landlord_id = $1
        ORDER BY d.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
}));

// POST a new document
router.post('/', upload.single('file'), asyncHandler(async (req, res) => {
    const { title, propertyId, leaseId, fileUrl: manualUrl } = req.body;
    const file = req.file;

    if (!title) return res.status(400).json({ error: 'Document title is required' });
    if (!file && !manualUrl) return res.status(400).json({ error: 'Physical file or manual URL required' });

    const finalUrl = file ? `/uploads/${file.filename}` : manualUrl;
    const fileType = file ? path.extname(file.originalname).replace('.', '') : 'pdf';
    const id = uuidv4();

    await query(
        `INSERT INTO documents (id, uploader_id, property_id, lease_id, title, file_url, file_type) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, req.user.id, propertyId || null, leaseId || null, title, finalUrl, fileType]
    );

    res.json({ id, title, fileUrl: finalUrl });
}));

export default router;
