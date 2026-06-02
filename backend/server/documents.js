import express from 'express';
import { query } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Unique hash filename to prevent collisions, preserving original extension
        cb(null, uuidv4() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

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

// We accept multipart form data for "file"
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { title, type } = req.body;

        // Route A: Programmatic Dummy Data (e.g. from Leases.jsx ContractSigned event)
        // If it's a JSON request or manually provided fileUrl string
        if (req.body.fileUrl) {
            if (!title) return res.status(400).json({ error: 'title and fileUrl required' });
            const id = uuidv4();
            await query(
                'INSERT INTO documents (id, user_id, title, file_url, type) VALUES ($1, $2, $3, $4, $5)',
                [id, req.user.id, title, req.body.fileUrl, type || 'lease']
            );
            return res.json({ id, fileUrl: req.body.fileUrl });
        }

        // Route B: Genuine Physical File Upload (e.g. Multipart form from Documents.jsx)
        const file = req.file;
        if (!title || !file) {
            return res.status(400).json({ error: 'title and valid physical file upload required' });
        }

        const id = uuidv4();
        // Return the static path we serve in index.js
        const fileUrl = `/uploads/${file.filename}`;

        await query(
            'INSERT INTO documents (id, user_id, title, file_url, type) VALUES ($1, $2, $3, $4, $5)',
            [id, req.user.id, title, fileUrl, type || 'document']
        );

        res.json({ id, fileUrl });
    } catch (error) {
        console.error('File Upload Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
