import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { query, dbType } from './db.js';

// Local Strategy for email/password authentication
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const paramSyntax = dbType === 'postgres' ? '$1' : '?';
        const result = await query(`SELECT * FROM users WHERE email = ${paramSyntax}`, [email]);
        const user = result.rows[0];

        if (!user) {
            return done(null, false, { message: 'No user found with this email.' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return done(null, false, { message: 'Incorrect password.' });
        }

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const paramSyntax = dbType === 'postgres' ? '$1' : '?';
        const result = await query(`SELECT * FROM users WHERE id = ${paramSyntax}`, [id]);
        const user = result.rows[0];
        done(null, user);
    } catch (error) {
        done(error);
    }
});

export default passport;
