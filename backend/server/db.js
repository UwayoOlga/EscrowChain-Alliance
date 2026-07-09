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
    console.log('Using PostgreSQL database.');
} else {
    const dbPath = path.resolve(__dirname, 'users.db');
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) console.error('SQLite error:', err);
        else console.log('Using SQLite database.');
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
            title TEXT,
            address TEXT NOT NULL,
            description TEXT,
            rent_amount REAL NOT NULL,
            deposit_amount REAL NOT NULL,
            bedrooms INTEGER DEFAULT 0,
            bathrooms INTEGER DEFAULT 0,
            size TEXT,
            amenities TEXT,
            status TEXT DEFAULT 'available',
            images TEXT,
            lease_template TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (landlord_id) REFERENCES users(id)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS property_images (
            id TEXT PRIMARY KEY,
            property_id TEXT NOT NULL,
            image_url TEXT NOT NULL,
            is_primary BOOLEAN DEFAULT FALSE,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
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
            landlord_id TEXT NOT NULL,
            tenant_id TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'RWF',
            tx_hash TEXT,
            status TEXT CHECK(status IN ('pending', 'locked', 'released', 'refunded', 'disputed', 'confirmed')) DEFAULT 'pending',
            action TEXT NOT NULL,
            metadata TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lease_id) REFERENCES leases(id),
            FOREIGN KEY (landlord_id) REFERENCES users(id),
            FOREIGN KEY (tenant_id) REFERENCES users(id)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS disputes (
            id TEXT PRIMARY KEY,
            lease_id TEXT NOT NULL,
            transaction_id TEXT,
            raised_by TEXT NOT NULL,
            reason TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            resolution_notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lease_id) REFERENCES leases(id),
            FOREIGN KEY (transaction_id) REFERENCES escrow_transactions(id),
            FOREIGN KEY (raised_by) REFERENCES users(id)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS maintenance_requests (
            id TEXT PRIMARY KEY,
            property_id TEXT NOT NULL,
            tenant_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending',
            image_url TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (property_id) REFERENCES properties(id),
            FOREIGN KEY (tenant_id) REFERENCES users(id)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            uploader_id TEXT NOT NULL,
            property_id TEXT,
            lease_id TEXT,
            title TEXT NOT NULL,
            file_url TEXT NOT NULL,
            file_type TEXT DEFAULT 'pdf',
            document_type TEXT DEFAULT 'document',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (uploader_id) REFERENCES users(id),
            FOREIGN KEY (property_id) REFERENCES properties(id),
            FOREIGN KEY (lease_id) REFERENCES leases(id)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            participant_one TEXT NOT NULL,
            participant_two TEXT NOT NULL,
            last_message TEXT,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (participant_one) REFERENCES users(id),
            FOREIGN KEY (participant_two) REFERENCES users(id),
            UNIQUE(participant_one, participant_two)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            sender_id TEXT NOT NULL,
            content TEXT NOT NULL,
            read BOOLEAN DEFAULT FALSE,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id),
            FOREIGN KEY (sender_id) REFERENCES users(id)
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            action TEXT NOT NULL,
            resource_id TEXT,
            metadata TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Ensure columns exist (for existing databases)
    const alterTables = [
        ['properties', 'title', 'TEXT'],
        ['properties', 'description', 'TEXT'],
        ['properties', 'images', 'TEXT'],
        ['properties', 'lease_template', 'TEXT'],
        ['properties', 'created_at', 'TEXT DEFAULT CURRENT_TIMESTAMP'],
        ['properties', 'bedrooms', 'INTEGER DEFAULT 0'],
        ['properties', 'bathrooms', 'INTEGER DEFAULT 0'],
        ['properties', 'size', 'TEXT'],
        ['properties', 'amenities', 'TEXT'],
        ['leases', 'created_at', 'TEXT DEFAULT CURRENT_TIMESTAMP'],
        ['disputes', 'evidence', 'TEXT'],
        ['escrow_transactions', 'landlord_id', 'TEXT'],
        ['escrow_transactions', 'tenant_id', 'TEXT'],
        ['escrow_transactions', 'currency', "TEXT DEFAULT 'RWF'"],
        ['escrow_transactions', 'metadata', 'TEXT'],
        ['documents', 'uploader_id', 'TEXT'],
        ['documents', 'property_id', 'TEXT'],
        ['documents', 'lease_id', 'TEXT'],
        ['documents', 'file_type', 'TEXT'],
        ['documents', 'document_type', 'TEXT'],
        ['maintenance_requests', 'image_url', 'TEXT']
    ];

    for (const [table, col, type] of alterTables) {
        try {
            await query(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
        } catch (e) { /* column already exists */ }
    }

    console.log('Database tables ready.');
};

initDb().catch(console.error);