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

// ── Multer setup for image uploads ──
const uploadsDir = path.resolve(__dirname, '..', 'uploads', 'properties');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${unique}${ext}`);
    }
});

const fileFilter = (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB limit

// ── Auth middleware ──
const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

// ── GET all properties (with tenant + lease info) ──
router.get('/', async (req, res) => {
    try {
        const result = await query(`
            SELECT p.*, 
                   u.name as current_tenant, 
                   l.end_date as lease_expiry,
                   l.id as active_lease_id
            FROM properties p
            LEFT JOIN leases l ON p.id = l.property_id AND l.status = 'active'
            LEFT JOIN users u ON l.tenant_id = u.id
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── GET single property details ──
router.get('/:id', async (req, res) => {
    try {
        const result = await query(`
            SELECT p.*, u.name as landlord_name 
            FROM properties p 
            JOIN users u ON p.landlord_id = u.id 
            WHERE p.id = $1`, [req.params.id]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Property not found' });

        // Also fetch active lease if exists
        const lease = await query("SELECT * FROM leases WHERE property_id = $1 AND status = 'active'", [req.params.id]);

        res.json({
            ...result.rows[0],
            active_lease: lease.rows[0] || null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── POST create a new property (with image upload) ──
router.post('/', requireAuth, upload.array('images', 6), async (req, res) => {
    const {
        title, address, description, rentAmount, depositAmount,
        bedrooms, bathrooms, size, amenities, leaseTemplate
    } = req.body;

    if (!address || !rentAmount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const id = uuidv4();

        // Build image paths array from uploaded files
        const imagePaths = req.files
            ? req.files.map(f => `/uploads/properties/${f.filename}`)
            : [];

        await query(
            `INSERT INTO properties (
                id, landlord_id, title, address, description, rent_amount, deposit_amount, 
                bedrooms, bathrooms, size, amenities, images, lease_template, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [
                id, req.user.id, title, address, description,
                Number(rentAmount) || 0,
                Number(depositAmount) || 0,
                Number(bedrooms) || 0,
                Number(bathrooms) || 0,
                size, amenities,
                JSON.stringify(imagePaths), leaseTemplate, 'available'
            ]
        );

        const result = await query('SELECT * FROM properties WHERE id = $1', [id]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── PATCH update a property (with optional new images) ──
router.patch('/:id', requireAuth, upload.array('images', 6), async (req, res) => {
    const {
        title, description, rentAmount, depositAmount,
        status, bedrooms, bathrooms, size, amenities, leaseTemplate, existingImages
    } = req.body;

    try {
        const property = await query('SELECT * FROM properties WHERE id = $1', [req.params.id]);
        if (property.rows.length === 0) return res.status(404).json({ error: 'Property not found' });
        if (property.rows[0].landlord_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

        // Merge existing images with new uploads
        let kept = [];
        if (existingImages) {
            try { kept = JSON.parse(existingImages); } catch { kept = []; }
        }

        const newPaths = req.files
            ? req.files.map(f => `/uploads/properties/${f.filename}`)
            : [];

        const allImages = [...kept, ...newPaths];

        // Clean up removed images from disk
        let oldImages = [];
        try { oldImages = JSON.parse(property.rows[0].images || '[]'); } catch { oldImages = []; }
        const removed = oldImages.filter(img => !kept.includes(img));
        for (const img of removed) {
            const fullPath = path.resolve(__dirname, '..', img.replace(/^\//, ''));
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }

        await query(
            `UPDATE properties SET 
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                rent_amount = COALESCE($3, rent_amount),
                deposit_amount = COALESCE($4, deposit_amount),
                status = COALESCE($5, status),
                bedrooms = COALESCE($6, bedrooms),
                bathrooms = COALESCE($7, bathrooms),
                size = COALESCE($8, size),
                amenities = COALESCE($9, amenities),
                lease_template = COALESCE($10, lease_template),
                images = $11
            WHERE id = $12`,
            [
                title, description,
                Number(rentAmount) || null,
                Number(depositAmount) || null,
                status,
                Number(bedrooms) || null,
                Number(bathrooms) || null,
                size, amenities, leaseTemplate,
                JSON.stringify(allImages),
                req.params.id
            ]
        );

        const updated = await query('SELECT * FROM properties WHERE id = $1', [req.params.id]);
        res.json(updated.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── DELETE a property (also removes images from disk) ──
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const property = await query('SELECT * FROM properties WHERE id = $1', [req.params.id]);
        if (property.rows.length === 0) return res.status(404).json({ error: 'Property not found' });
        if (property.rows[0].landlord_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

        // Remove associated image files
        let images = [];
        try { images = JSON.parse(property.rows[0].images || '[]'); } catch { images = []; }
        for (const img of images) {
            const fullPath = path.resolve(__dirname, '..', img.replace(/^\//, ''));
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }

        await query('DELETE FROM properties WHERE id = $1', [req.params.id]);
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
