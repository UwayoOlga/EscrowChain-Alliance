import pkg from 'pg';
const { Pool } = pkg;
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Decide which database to use
const pgUrl = process.env.DATABASE_URL;
const usePostgres = pgUrl && !pgUrl.includes('your_username') && !pgUrl.includes('username:password');

export let dbType = 'sqlite';
export let pool = null;
let sqliteDb = null;

if (usePostgres) {
    pool = new Pool({
        connectionString: pgUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    dbType = 'postgres';
    console.log('✅ Using PostgreSQL database.');
} else {
    const dbPath = path.resolve(__dirname, 'users.db');
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) console.error('❌ SQLite error:', err);
        else console.log('✅ Using SQLite database.');
    });
}

// Universal query — always use $1/$2 style, SQLite auto-converts
export const query = async (text, params = []) => {
    if (dbType === 'postgres') {
        return await pool.query(text, params);
    } else {
        const sql = text.replace(/\$\d+/g, '?');
        return new Promise((resolve, reject) => {
            sqliteDb.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve({ rows });
            });
        });
    }
};

// Create tables on startup
const initDb = async () => {
    await query(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'tenant',
            wallet_address TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS properties (
            id TEXT PRIMARY KEY,
            landlord_id TEXT NOT NULL,
            address TEXT NOT NULL,
            rent_amount REAL NOT NULL,
            deposit_amount REAL NOT NULL,
            status TEXT DEFAULT 'available',
            images TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (landlord_id) REFERENCES users(id)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS leases (
            id TEXT PRIMARY KEY,
            property_id TEXT NOT NULL,
            landlord_id TEXT NOT NULL,
            tenant_id TEXT NOT NULL,
            rent_amount REAL NOT NULL,
            deposit_amount REAL NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (property_id) REFERENCES properties(id),
            FOREIGN KEY (landlord_id) REFERENCES users(id),
            FOREIGN KEY (tenant_id) REFERENCES users(id)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS escrow_transactions (
            id TEXT PRIMARY KEY,
            lease_id TEXT NOT NULL,
            action TEXT NOT NULL,
            amount REAL NOT NULL,
            tx_hash TEXT,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lease_id) REFERENCES leases(id)
        )
    `);

    console.log('✅ Database tables ready.');
};

initDb().catch(console.error);