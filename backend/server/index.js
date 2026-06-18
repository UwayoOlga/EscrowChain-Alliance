import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import pgSession from 'connect-pg-simple';
import SQLiteStore from 'connect-sqlite3';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import passport from './passport.js';
import { pool, dbType } from './db.js';
import { errorHandler } from './utils/errors.js';

import authRouter from './auth.js';
import propertiesRouter from './properties.js';
import leasesRouter from './leases.js';
import escrowRouter from './escrow.js';
import usersRouter from './users.js';
import disputesRouter from './disputes.js';
import maintenanceRouter from './maintenance.js';
import documentsRouter from './documents.js';
import messagesRouter from './messages.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Enforce required environment variables
if (!process.env.SESSION_SECRET) {
    console.error('CRITICAL: SESSION_SECRET is not defined in environment.');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true
}));

// Rate Limiting — Protect sensitive auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts, please try again later.'
});

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
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authLimiter, authRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/leases', leasesRouter);
app.use('/api/escrow', escrowRouter);
app.use('/api/users', usersRouter);
app.use('/api/disputes', disputesRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/messages', messagesRouter);

// Centralized Error Handling (MUST be last)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
