import pkg from 'pg';
const { Pool } = pkg;
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__dirname);

let dbType = 'sqlite'; // Default to SQLite
let pool = null;
let sqliteDb = null;

// Check if PostgreSQL URL is provided and valid
const pgUrl = process.env.DATABASE_URL;
const isValidPgUrl = pgUrl && !pgUrl.includes('your_username') && !pgUrl.includes('username:password');

if (isValidPgUrl) {
    try {
        pool = new Pool({
            connectionString: pgUrl,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        dbType = 'postgres';
        console.log('✅ PostgreSQL configuration detected and connected.');
    } catch (err) {
        console.error('❌ Failed to configure PostgreSQL, falling back to SQLite:', err.message);
        dbType = 'sqlite';
    }
} else {
    console.log('📁 Using SQLite database (no PostgreSQL URL configured).');
    dbType = 'sqlite';
}

// Initialize SQLite if needed
if (dbType === 'sqlite') {
    const dbPath = path.resolve(__dirname, 'server', 'users.db');
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) console.error('❌ Error opening SQLite database:', err);
        else console.log('✅ Connected to SQLite database.');
    });
}

// Universal Query Wrapper
export const query = async (text, params = []) => {
    if (dbType === 'postgres') {
        try {
            return await pool.query(text, params);
        } catch (err) {
            console.error('PostgreSQL Query Error:', err);
            throw err;
        }
    } else {
        return new Promise((resolve, reject) => {
            // Convert PostgreSQL $1, $2 syntax to SQLite ? syntax
            const sqliteQuery = text.replace(/\$(\d+)/g, '?');
            sqliteDb.all(sqliteQuery, params, (err, rows) => {
                if (err) reject(err);
                else resolve({ rows });
            });
        });
    }
};

// Initialize Database Tables
const initDb = async () => {
    try {
        console.log(`🔧 Initializing ${dbType.toUpperCase()} database tables...`);

        // Users table
        if (dbType === 'postgres') {
            await query(`
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT 'tenant',
                    is_verified INTEGER DEFAULT 1,
                    wallet_address TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } else {
            await query(`
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT 'tenant',
                    is_verified INTEGER DEFAULT 1,
                    wallet_address TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
        }

        // Properties table
        await query(`
            CREATE TABLE IF NOT EXISTS properties (
                id TEXT PRIMARY KEY,
                landlord_id TEXT NOT NULL,
                address TEXT NOT NULL,
                rent_amount REAL NOT NULL,
                deposit_amount REAL NOT NULL,
                status TEXT DEFAULT 'available',
                images TEXT,
                created_at ${dbType === 'postgres' ? 'TIMESTAMP' : 'DATETIME'} DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (landlord_id) REFERENCES users (id)
            )
        `);

        // Sessions table (for express-session)
        if (dbType === 'postgres') {
            await query(`
                CREATE TABLE IF NOT EXISTS session (
                    sid VARCHAR NOT NULL COLLATE "default",
                    sess JSON NOT NULL,
                    expire TIMESTAMP(6) NOT NULL
                )
            `);
            await query(`ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE`).catch(() => {
                // Ignore error if constraint already exists
            });
        } else {
            await query(`
                CREATE TABLE IF NOT EXISTS sessions (
                    sid TEXT PRIMARY KEY,
                    sess TEXT NOT NULL,
                    expire DATETIME NOT NULL
                )
            `);
        }

        console.log('✅ Database tables initialized successfully.');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
};

// Initialize on import
initDb();

export { sqliteDb, pool, dbType };
export default dbType === 'postgres' ? pool : sqliteDb;
                    wallet_address TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            await query(`
                CREATE TABLE IF NOT EXISTS properties (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    landlord_id TEXT REFERENCES users(id),
                    address TEXT NOT NULL,
                    rent_amount NUMERIC NOT NULL,
                    deposit_amount NUMERIC NOT NULL,
                    status TEXT DEFAULT 'available',
                    images TEXT[],
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('PostgreSQL Tables initialized.');
        } else {
            // SQLite Init
            sqliteDb.serialize(() => {
                sqliteDb.run(`
                    CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY,
                        name TEXT,
                        email TEXT UNIQUE,
                        avatar TEXT,
                        provider TEXT,
                        is_verified INTEGER DEFAULT 0,
                        wallet_address TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                sqliteDb.run(`
                    CREATE TABLE IF NOT EXISTS properties (
                        id TEXT PRIMARY KEY,
                        landlord_id TEXT,
                        address TEXT NOT NULL,
                        rent_amount REAL NOT NULL,
                        deposit_amount REAL NOT NULL,
                        status TEXT DEFAULT 'available',
                        images TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
            });
            console.log('SQLite Tables initialized.');
        }
    } catch (err) {
        console.error('Database initialization error:', err);
    }
};

initDb();

export { dbType, pool, sqliteDb };
export default pool || sqliteDb;
