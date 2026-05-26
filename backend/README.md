# EscrowChain Alliance - Backend

Node.js + Express API for the EscrowChain rental escrow platform.

## Tech Stack

- **Express** - Web framework
- **SQLite / PostgreSQL** - Database (auto-fallback to SQLite)
- **Passport.js** - Session-based authentication
- **Aiken** - Smart contracts (Cardano)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Copy and configure environment:
```bash
cp .env.example .env
```

3. Start the dev server (auto-restarts on changes):
```bash
npm run dev
```

The API runs at `http://localhost:5000`

## API Endpoints

### Auth (`/auth`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login with email/password |
| GET | `/auth/status` | Check login status |
| GET | `/auth/logout` | Logout |

### Users (`/api/users`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/users/me` | Get your profile |
| PATCH | `/api/users/me` | Update name or wallet address |

### Properties (`/api/properties`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/properties` | List all properties |
| POST | `/api/properties` | Create property (auth required) |
| GET | `/api/properties/:id` | Get single property |

### Leases (`/api/leases`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/leases` | List your leases |
| POST | `/api/leases` | Create a lease (landlord only) |
| GET | `/api/leases/:id` | Get single lease |
| PATCH | `/api/leases/:id/status` | Update lease status |

### Escrow (`/api/escrow`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/escrow/lease/:leaseId` | Get escrow transactions for a lease |
| POST | `/api/escrow` | Create escrow transaction (CollectRent, RefundDeposit, CompleteLease) |
| PATCH | `/api/escrow/:id` | Update transaction status/tx_hash |

## Project Structure

```
backend/
├── server/
│   ├── index.js        # Server setup + middleware
│   ├── auth.js         # Auth routes (register, login, logout)
│   ├── users.js        # User profile + wallet linking
│   ├── properties.js   # Property CRUD
│   ├── leases.js       # Lease management
│   ├── escrow.js       # Escrow transactions
│   ├── passport.js     # Passport local strategy
│   └── db.js           # Database layer (SQLite/PostgreSQL)
├── contracts/
│   └── validators/
│       └── escrow.ak   # Escrow smart contract (Aiken)
├── .env.example
└── package.json
```

## Database

- **SQLite** is used by default (zero config, great for dev)
- **PostgreSQL** is used automatically if `DATABASE_URL` is set in `.env`

Tables are created automatically on startup.