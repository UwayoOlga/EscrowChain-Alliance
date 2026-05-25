import express from 'express';
import session from 'express-session';
import passport from './passport.js';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pgSession from 'connect-pg-simple';
import SQLiteStore from 'connect-sqlite3';
import { query, pool, dbType } from './db.js';
import propertiesRouter from './properties.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PostgresStore = pgSession(session);
const SQLite = SQLiteStore(session);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());

// Conditional Session Store based on database type
const sessionStore = dbType === 'postgres'
    ? new PostgresStore({ pool: pool, tableName: 'session' })
    : new SQLite({ db: 'sessions.db', dir: './server' });

app.use(session({
    store: sessionStore,
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

// Register Route
app.post('/auth/register', async (req, res) => {
    const { name, email, password, role = 'tenant' } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    try {
        // Check if user already exists
        const paramSyntax = dbType === 'postgres' ? '$1' : '?';
        const existingUser = await query(`SELECT * FROM users WHERE email = ${paramSyntax}`, [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        // Create user with appropriate parameter syntax
        if (dbType === 'postgres') {
            await query(
                'INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)',
                [userId, name, email, hashedPassword, role]
            );
        } else {
            await query(
                'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
                [userId, name, email, hashedPassword, role]
            );
        }

        const newUser = {
            id: userId,
            name,
            email,
            role,
            is_verified: 1
        };

        // Log user in
        req.login(newUser, (err) => {
            if (err) {
                console.error('Login error:', err);
                return res.status(500).json({ error: 'Registration successful but login failed' });
            }
            res.json({ user: newUser, message: 'Registration successful' });
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login Route
app.post('/auth/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ error: 'Authentication error' });
        }
        if (!user) {
            return res.status(401).json({ error: info.message || 'Invalid credentials' });
        }
        
        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Login failed' });
            }
            
            const userResponse = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                is_verified: user.is_verified
            };
            
            res.json({ user: userResponse, message: 'Login successful' });
        });
    })(req, res, next);
});

// Get Auth Status
app.get('/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        const user = {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            is_verified: req.user.is_verified
        };
        res.json({ authenticated: true, user });
    } else {
        res.json({ authenticated: false, user: null });
    }
});

// Logout Route
app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

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
