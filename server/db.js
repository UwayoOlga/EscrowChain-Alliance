import pkg from 'pg';
const { Pool } = pkg;
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbType = 'sqlite'; // Default
let pool = null;
let sqliteDb = null;

// Try to connect to PostgreSQL if URL is provided and not a placeholder
const pgUrl = process.env.DATABASE_URL;
const isPlaceholder = pgUrl && (pgUrl.includes('user:password') || pgUrl.includes('your_username'));

if (pgUrl && !isPlaceholder) {
    try {
        pool = new Pool({
            connectionString: pgUrl,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        dbType = 'postgres';
        console.log('PostgreSQL configuration detected.');
    } catch (err) {
        console.error('Failed to configure PostgreSQL pool, falling back to SQLite:', err);
        dbType = 'sqlite';
    }
} else {
    console.log('Using SQLite (No valid DATABASE_URL found).');
    dbType = 'sqlite';
}

if (dbType === 'sqlite') {
    const dbPath = path.resolve(__dirname, 'users.db');
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) console.error('Error opening SQLite database:', err);
        else console.log('Connected to local SQLite database.');
    });
}

// Universal Query Wrapper
export const query = async (text, params) => {
    if (dbType === 'postgres') {
        try {
            return await pool.query(text, params);
        } catch (err) {
            console.error('PostgreSQL Query Error:', err);
            // If PG fails critically, we could potentially try to sync to SQLite here, 
            // but for now we just throw so the app knows it failed.
            throw err;
        }
    } else {
        return new Promise((resolve, reject) => {
            // Convert $1, $2 to ?, ? for SQLite Compatibility
            const sqliteQuery = text.replace(/\$(\d+)/g, '?');
            sqliteDb.all(sqliteQuery, params, (err, rows) => {
                if (err) reject(err);
                else resolve({ rows });
            });
        });
    }
};

// Initialization Logic
const initDb = async () => {
    try {
        if (dbType === 'postgres') {
            await query(`
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    email TEXT UNIQUE,
                    avatar TEXT,
                    provider TEXT,
                    is_verified INTEGER DEFAULT 0,
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
