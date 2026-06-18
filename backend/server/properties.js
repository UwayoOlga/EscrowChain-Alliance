import express from 'express';
import { query } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from './utils/errors.js';
import { logAction } from './utils/logger.js';

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
const requireRole = (role) => (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role !== role) {
        return res.status(403).json({ error: `Forbidden: This action requires the ${role} role.` });
    }
    next();
};

const validateProperty = [
    body('address').notEmpty().trim().withMessage('Address is required'),
    body('rentAmount').isNumeric().withMessage('Rent amount must be a number'),
    body('depositAmount').isNumeric().withMessage('Deposit amount must be a number'),
];

// ── GET all properties ──
router.get('/', asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT p.*, 
               u.name as current_tenant, 
               l.end_date as lease_expiry,
               l.id as active_lease_id,
               (SELECT image_url FROM property_images WHERE property_id = p.id AND is_primary = TRUE LIMIT 1) as primary_image
        FROM properties p
        LEFT JOIN leases l ON p.id = l.property_id AND l.status = 'active'
        LEFT JOIN users u ON l.tenant_id = u.id
        ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
}));

// ── GET single property ──
router.get('/:id', asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT p.*, u.name as landlord_name 
        FROM properties p 
        JOIN users u ON p.landlord_id = u.id 
        WHERE p.id = $1`, [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Property not found' });

    const lease = await query("SELECT * FROM leases WHERE property_id = $1 AND status = 'active'", [req.params.id]);
    const images = await query("SELECT * FROM property_images WHERE property_id = $1", [req.params.id]);

    res.json({
        ...result.rows[0],
        active_lease: lease.rows[0] || null,
        images: images.rows
    });
}));

// ── POST create a new property ──
router.post('/', requireRole('landlord'), upload.array('images', 6), validateProperty, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
        title, address, description, rentAmount, depositAmount,
        bedrooms, bathrooms, size, amenities, leaseTemplate
    } = req.body;

    const id = uuidv4();
    const landlordId = req.user.id;

    await query(
        `INSERT INTO properties (
            id, landlord_id, title, address, description, rent_amount, deposit_amount, 
            bedrooms, bathrooms, size, amenities, lease_template, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
            id, landlordId, title, address, description,
            Number(rentAmount), Number(depositAmount),
            Number(bedrooms) || 0, Number(bathrooms) || 0,
            size, amenities, leaseTemplate, 'available'
        ]
    );

    // Save images to separate table
    if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
            const imgId = uuidv4();
            const path = `/uploads/properties/${req.files[i].filename}`;
            await query(
                'INSERT INTO property_images (id, property_id, image_url, is_primary) VALUES ($1, $2, $3, $4)',
                [imgId, id, path, i === 0]
            );
        }
    }

    await logAction(landlordId, 'PROPERTY_CREATED', id, { address });

    const result = await query('SELECT * FROM properties WHERE id = $1', [id]);
    res.json(result.rows[0]);
}));

// ── PATCH update a property ──
router.patch('/:id', requireRole('landlord'), upload.array('images', 6), asyncHandler(async (req, res) => {
    const property = await query('SELECT * FROM properties WHERE id = $1', [req.params.id]);
    if (property.rows.length === 0) return res.status(404).json({ error: 'Property not found' });

    // Authorization Check
    if (property.rows[0].landlord_id !== req.user.id) return res.status(403).json({ error: 'Forbidden: You do not own this property' });

    const {
        title, description, rentAmount, depositAmount,
        status, bedrooms, bathrooms, size, amenities, leaseTemplate, existingImages
    } = req.body;

    let kept = [];
    if (existingImages) {
        try { kept = JSON.parse(existingImages); } catch { kept = []; }
    }

    const newPaths = req.files ? req.files.map(f => `/uploads/properties/${f.filename}`) : [];
    const allImages = [...kept, ...newPaths];

    // Disk Cleanup
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
            rentAmount ? Number(rentAmount) : null,
            depositAmount ? Number(depositAmount) : null,
            status,
            bedrooms ? Number(bedrooms) : null,
            bathrooms ? Number(bathrooms) : null,
            size, amenities, leaseTemplate,
            JSON.stringify(allImages),
            req.params.id
        ]
    );

    await logAction(req.user.id, 'PROPERTY_UPDATED', req.params.id, { status });

    const updated = await query('SELECT * FROM properties WHERE id = $1', [req.params.id]);
    res.json(updated.rows[0]);
}));

// ── DELETE a property ──
router.delete('/:id', requireRole('landlord'), asyncHandler(async (req, res) => {
    const property = await query('SELECT * FROM properties WHERE id = $1', [req.params.id]);
    if (property.rows.length === 0) return res.status(404).json({ error: 'Property not found' });

    // Authorization Check
    if (property.rows[0].landlord_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    let images = [];
    try { images = JSON.parse(property.rows[0].images || '[]'); } catch { images = []; }
    for (const img of images) {
        const fullPath = path.resolve(__dirname, '..', img.replace(/^\//, ''));
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    await query('DELETE FROM properties WHERE id = $1', [req.params.id]);
    await logAction(req.user.id, 'PROPERTY_DELETED', req.params.id);

    res.json({ message: 'Property deleted successfully' });
}));

export default router;

