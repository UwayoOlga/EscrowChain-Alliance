import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'users.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            avatar TEXT,
            provider TEXT,
            is_verified INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating users table', err.message);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS otps (
            email TEXT PRIMARY KEY,
            otp TEXT,
            expires_at DATETIME
        )`, (err) => {
            if (err) {
                console.error('Error creating otps table', err.message);
            }
        });
    }
});

export default db;
