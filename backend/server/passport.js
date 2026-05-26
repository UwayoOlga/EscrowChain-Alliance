import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { query } from './db.js';

// Check email + password on login
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) return done(null, false, { message: 'No user found with this email.' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return done(null, false, { message: 'Incorrect password.' });

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// Save user ID to session
passport.serializeUser((user, done) => done(null, user.id));

// Load user from session using ID
passport.deserializeUser(async (id, done) => {
    try {
        const result = await query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]);
    } catch (error) {
        done(error);
    }
});

export default passport;
