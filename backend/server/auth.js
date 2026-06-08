import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import passport from './passport.js';
import { query } from './db.js';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
    const { name, email, password, role = 'tenant' } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    try {
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const id = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);

        await query(
            'INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)',
            [id, name, email, hashedPassword, role]
        );

        const user = { id, name, email, role };

        req.login(user, (err) => {
            if (err) return res.status(500).json({ error: 'Registered but login failed' });
            res.json({ user, message: 'Registration successful' });
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return res.status(500).json({ error: 'Authentication error' });
        if (!user) return res.status(401).json({ error: info.message || 'Invalid credentials' });

        req.login(user, (err) => {
            if (err) return res.status(500).json({ error: 'Login failed' });
            const { id, name, email, role } = user;
            res.json({ user: { id, name, email, role }, message: 'Login successful' });
        });
    })(req, res, next);
});

// Check if user is logged in
router.get('/status', (req, res) => {
    if (req.isAuthenticated()) {
        const { id, name, email, role } = req.user;
        res.json({ authenticated: true, user: { id, name, email, role } });
    } else {
        res.json({ authenticated: false, user: null });
    }
});

// Update user profile (e.g. wallet address)
router.patch('/profile', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    const { name, wallet_address } = req.body;

    try {
        await query(
            'UPDATE users SET name = COALESCE($1, name), wallet_address = COALESCE($2, wallet_address) WHERE id = $3',
            [name || null, wallet_address || null, req.user.id]
        );
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.json({ message: 'Logout successful' });
    });
});

export default router;
