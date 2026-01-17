import express from 'express';
import session from 'express-session';
import passport from './passport.js';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pgSession from 'connect-pg-simple';
import pool, { query } from './db.js';
import admin from './firebase-admin.js';
import propertiesRouter from './properties.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PostgresStore = pgSession(session);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(session({
    store: new PostgresStore({
        pool: pool,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'escrowchain-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production'
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// --- Routes ---
app.use('/api/properties', propertiesRouter);

// --- Authentication Routes ---

// Firebase Login Route
app.post('/auth/firebase-login', async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'ID Token is required' });

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email, name, picture } = decodedToken;

        // Sync with PostgreSQL
        const userResult = await query('SELECT * FROM users WHERE id = $1', [uid]);
        let user = userResult.rows[0];

        if (!user) {
            const insertResult = await query(
                'INSERT INTO users (id, name, email, avatar, provider, is_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [uid, name || 'Firebase User', email, picture, 'google', 1]
            );
            user = insertResult.rows[0];
        }

        req.login(user, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, user });
        });
    } catch (error) {
        console.error('Firebase Auth Error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

app.get('/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ authenticated: true, user: req.user });
    } else {
        res.json({ authenticated: false });
    }
});

app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
