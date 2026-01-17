import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
const initDb = async () => {
    try {
        // Users Table
        await pool.query(`
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

        // Properties Table
        await pool.query(`
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

        // Session table for connect-pg-simple
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "session" (
                "sid" varchar NOT NULL COLLATE "default",
                "sess" json NOT NULL,
                "expire" timestamp(6) NOT NULL
            ) WITH (OIDS=FALSE);
            
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey') THEN
                    ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
                END IF;
            END $$;

            CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
        `);

        console.log('PostgreSQL Tables initialized.');
    } catch (err) {
        console.error('Error initializing PostgreSQL tables:', err);
    }
};

initDb();

export const query = (text, params) => pool.query(text, params);

export default pool;
