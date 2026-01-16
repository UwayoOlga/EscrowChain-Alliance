import express from 'express';
import session from 'express-session';
import passport from './passport.js';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import SQLiteStore from 'connect-sqlite3';
import { generateOTP, sendOTPEmail, hashPassword, comparePassword } from './auth.js';
import db from './db.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQLite = SQLiteStore(session);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: 'http://localhost:5173', // Vite default port
    credentials: true
}));

app.use(express.json());
app.use(session({
    store: new SQLite({ db: 'sessions.db', dir: './server' }),
    secret: process.env.SESSION_SECRET || 'escrowchain-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: false // Set to true if using HTTPS
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// --- Authentication Routes ---

// 1. Email/Password Registration (Phase A: Send OTP)
app.post('/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'All fields are required' });

    try {
        const hashedPassword = await hashPassword(password);
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (user && user.is_verified) return res.status(400).json({ error: 'User already exists' });

            db.run('INSERT OR REPLACE INTO otps (email, otp, expires_at) VALUES (?, ?, ?)', [email, otp, expiresAt.toISOString()], async (err) => {
                if (err) return res.status(500).json({ error: err.message });

                const userId = user ? user.id : uuidv4();
                db.run('INSERT OR REPLACE INTO users (id, name, email, password, provider, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
                    [userId, name, email, hashedPassword, 'email', 0], async (err) => {
                        if (err) return res.status(500).json({ error: err.message });

                        try {
                            await sendOTPEmail(email, otp);
                            res.json({ success: true, message: 'OTP sent to your email' });
                        } catch (emailErr) {
                            res.status(500).json({ error: 'Failed to send verification email' });
                        }
                    });
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Verify OTP
app.post('/auth/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    db.get('SELECT * FROM otps WHERE email = ?', [email], (err, record) => {
        if (err || !record) return res.status(400).json({ error: 'Invalid or expired OTP' });
        if (record.otp !== otp) return res.status(400).json({ error: 'Incorrect code' });
        if (new Date() > new Date(record.expires_at)) return res.status(400).json({ error: 'OTP expired' });

        db.run('UPDATE users SET is_verified = 1 WHERE email = ?', [email], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            db.run('DELETE FROM otps WHERE email = ?', [email]);
            db.get('SELECT id, name, email, avatar FROM users WHERE email = ?', [email], (err, user) => {
                req.login(user, (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ success: true, user });
                });
            });
        });
    });
});

// 3. Email/Password Login
app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Invalid credentials' });
        if (!user.is_verified) return res.status(400).json({ error: 'Please verify your email first' });

        const match = await comparePassword(password, user.password);
        if (!match) return res.status(400).json({ error: 'Invalid credentials' });

        req.login(user, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } });
        });
    });
});

// 4. Google OAuth
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: 'http://localhost:5173' }),
    (req, res) => {
        res.redirect('http://localhost:5173');
    }
);

// 5. Apple OAuth
app.get('/auth/apple', passport.authenticate('apple'));
app.post('/auth/apple/callback',
    passport.authenticate('apple', { failureRedirect: 'http://localhost:5173' }),
    (req, res) => {
        res.redirect('http://localhost:5173');
    }
);

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
