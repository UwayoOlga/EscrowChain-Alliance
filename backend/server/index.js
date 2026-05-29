import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import pgSession from 'connect-pg-simple';
import SQLiteStore from 'connect-sqlite3';
import passport from './passport.js';
import { pool, dbType } from './db.js';
import authRouter from './auth.js';
import propertiesRouter from './properties.js';
import leasesRouter from './leases.js';
import escrowRouter from './escrow.js';
import usersRouter from './users.js';
import disputesRouter from './disputes.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for property images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Session store — PostgreSQL or SQLite depending on config
const PostgresStore = pgSession(session);
const SQLite = SQLiteStore(session);

const sessionStore = dbType === 'postgres'
    ? new PostgresStore({ pool, tableName: 'session', createTableIfMissing: true })
    : new SQLite({ db: 'sessions.db', dir: './server' });

app.use(session({
    // store: sessionStore, // Commented out for debugging
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

// Routes
app.use('/auth', authRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/leases', leasesRouter);
app.use('/api/escrow', escrowRouter);
app.use('/api/users', usersRouter);
app.use('/api/disputes', disputesRouter);

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
