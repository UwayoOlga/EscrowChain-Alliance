# BlockRent Escrow - Backend

Node.js + Express backend API for the BlockRent Escrow platform.

## Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **PostgreSQL/SQLite** - Database (dual support)
- **Firebase Admin** - Authentication verification
- **Passport.js** - Authentication middleware
- **Aiken** - Smart contract language (Cardano)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/blockrent_db

# Firebase Admin
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email (for OTP)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password

# Session
SESSION_SECRET=your_session_secret

# Server
PORT=5000
```

4. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Database Setup

The backend supports both PostgreSQL and SQLite:

- **PostgreSQL** (recommended for production): Set `DATABASE_URL` in your `.env`
- **SQLite** (development fallback): Automatically created if no PostgreSQL URL is provided

Tables are automatically created on server startup.

## API Endpoints

### Authentication
- `POST /auth/firebase-login` - Login with Firebase ID token
- `GET /auth/status` - Get current authentication status
- `GET /auth/logout` - Logout user

### Properties
- `GET /api/properties` - Get all properties
- `POST /api/properties` - Create new property (authenticated)
- `GET /api/properties/:id` - Get property by ID

## Smart Contracts

The Aiken smart contracts are located in `contracts/validators/`:

- `escrow.ak` - Main escrow contract for rent payments

### Contract Features
- Multi-signature requirements for fund release
- Rent collection with both parties' approval
- Deposit refund protection
- Lease completion handling

## Project Structure

```
backend/
├── server/
│   ├── index.js          # Express server setup
│   ├── auth.js           # Authentication utilities
│   ├── db.js             # Database abstraction layer
│   ├── firebase-admin.js # Firebase Admin SDK setup
│   ├── passport.js       # Passport configuration
│   ├── properties.js     # Properties API routes
│   ├── users.db          # SQLite database file
│   └── sessions.db       # Session storage
├── contracts/
│   ├── aiken.toml        # Aiken project configuration
│   └── validators/
│       └── escrow.ak     # Escrow smart contract
└── package.json
```

## Development

The server automatically restarts when files change. For production deployment, use:

```bash
npm start
```