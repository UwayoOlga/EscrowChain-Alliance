import passport from 'passport';
import { query } from './db.js';

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const result = await query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]);
    } catch (err) {
        done(err);
    }
});

// Note: Strategies (Google, Apple) can be added here if needed, 
// but we are moving to Firebase-based auth.

export default passport;
