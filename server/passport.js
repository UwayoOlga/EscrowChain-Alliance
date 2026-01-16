import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as AppleStrategy } from 'passport-apple';
import db from './db.js';
import dotenv from 'dotenv';

dotenv.config();

// Passport serialization
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        done(err, row);
    });
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'missing',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'missing',
    callbackURL: "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
    const { id, displayName, emails, photos } = profile;
    const email = emails[0].value;
    const avatar = photos ? photos[0].value : null;

    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) return done(err);
        if (row) {
            return done(null, row);
        } else {
            db.run('INSERT INTO users (id, name, email, avatar, provider, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
                [id, displayName, email, avatar, 'google', 1], (err) => {
                    if (err) return done(err);
                    return done(null, { id, name: displayName, email, avatar, provider: 'google', is_verified: 1 });
                });
        }
    });
}));

// Apple Strategy
passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID || 'missing',
    teamID: process.env.APPLE_TEAM_ID || 'missing',
    keyID: process.env.APPLE_KEY_ID || 'missing',
    privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH || 'missing',
    callbackURL: "/auth/apple/callback"
}, (req, accessToken, refreshToken, idToken, profile, done) => {
    const id = idToken.sub || profile.id;
    const email = profile.email;
    const name = profile.name ? `${profile.firstName} ${profile.lastName}` : 'Apple User';

    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) return done(err);
        if (row) {
            return done(null, row);
        } else {
            db.run('INSERT INTO users (id, name, email, avatar, provider, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
                [id, name, email, null, 'apple', 1], (err) => {
                    if (err) return done(err);
                    return done(null, { id, name, email, avatar: null, provider: 'apple', is_verified: 1 });
                });
        }
    });
}));

export default passport;
