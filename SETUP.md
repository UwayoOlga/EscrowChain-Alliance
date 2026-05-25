# BlockRent Escrow - Simple Setup Guide

## 🚀 Quick Start (No External Services Required!)

Your project now supports both SQLite and PostgreSQL databases with simple email/password authentication - no Firebase or other external services needed!

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Start the Application
```bash
npm run dev
```

That's it! The application will:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Database: SQLite files created automatically in `backend/server/` (default)

## 🗄️ Database Options

### Option 1: SQLite (Default - Recommended for Development)
- ✅ **No setup required** - works immediately
- ✅ **Automatic creation** - database files created in `backend/server/`
- ✅ **Perfect for development** and testing
- ✅ **No external dependencies**

### Option 2: PostgreSQL (Optional - Better for Production)
If you want to use PostgreSQL instead:

1. **Install PostgreSQL** on your system
2. **Create database and user:**
```sql
CREATE DATABASE blockrent_db;
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE blockrent_db TO your_username;
```

3. **Update `backend/.env`:**
```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/blockrent_db
```

4. **Restart the application** - it will automatically detect and use PostgreSQL

## 🔄 Switching Between Databases

The application **automatically detects** which database to use:

- **SQLite**: If no `DATABASE_URL` is set (or it's commented out)
- **PostgreSQL**: If a valid `DATABASE_URL` is provided

**To switch from SQLite to PostgreSQL:**
1. Set up PostgreSQL (steps above)
2. Add `DATABASE_URL` to your `.env` file
3. Restart the app with `npm run dev`

**To switch back to SQLite:**
1. Comment out or remove `DATABASE_URL` from `.env`
2. Restart the app

## 🔧 What Changed

### ✅ Removed Dependencies:
- ❌ Firebase (no more Google OAuth setup needed)
- ❌ Email services (no OTP verification)
- ❌ Complex environment configuration

### ✅ New Simple Authentication:
- 📧 **Email/Password Registration** - Users create accounts with email and password
- 🔐 **Secure Password Hashing** - Passwords hashed with bcryptjs
- 👤 **User Roles** - Choose between Tenant, Landlord during registration
- 🗄️ **Dual Database Support** - SQLite (default) or PostgreSQL
- 🍪 **Session Management** - Secure session-based authentication

## 📱 How to Use

### For Users:
1. **Visit** http://localhost:5173
2. **Click** "Login/Register" 
3. **Choose** "Sign up" for new account
4. **Fill in:**
   - Full Name
   - Email Address  
   - Password (minimum 6 characters)
   - Account Type (Tenant or Landlord)
5. **Click** "Create Account"
6. **You're logged in!** - Start using the platform

### For Developers:
- **No environment setup needed** for SQLite - everything works out of the box
- **Optional PostgreSQL setup** for production-like environment
- **Database files** created in `backend/server/users.db` and `backend/server/sessions.db` (SQLite)
- **User passwords** are automatically hashed and secure
- **Sessions** persist across browser restarts

## 🗄️ Database Schema

Both SQLite and PostgreSQL use the same schema:

### Users Table:
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,           -- UUID
    name TEXT NOT NULL,            -- Full name
    email TEXT UNIQUE NOT NULL,    -- Email (login)
    password TEXT NOT NULL,        -- Hashed password
    role TEXT DEFAULT 'tenant',    -- 'tenant', 'landlord', 'admin'
    is_verified INTEGER DEFAULT 1, -- Always verified (no email verification)
    wallet_address TEXT,           -- Cardano wallet (optional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Properties Table:
```sql
CREATE TABLE properties (
    id TEXT PRIMARY KEY,           -- UUID
    landlord_id TEXT NOT NULL,     -- Foreign key to users.id
    address TEXT NOT NULL,         -- Property address
    rent_amount REAL NOT NULL,     -- Monthly rent in ADA
    deposit_amount REAL NOT NULL,  -- Security deposit in ADA
    status TEXT DEFAULT 'available', -- 'available', 'occupied', 'maintenance'
    images TEXT,                   -- JSON array of image URLs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔐 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **Session Security**: Secure session cookies with database storage
- **SQL Injection Protection**: Parameterized queries for both databases
- **Input Validation**: Email format, password length, required fields
- **Role-Based Access**: Different permissions for tenants/landlords

## 🛠️ Development

### Backend API Endpoints:
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Login with email/password
- `GET /auth/status` - Check authentication status
- `GET /auth/logout` - Logout user
- `GET /api/properties` - Get all properties
- `POST /api/properties` - Create new property (authenticated)

### Frontend Components:
- `AuthModal.tsx` - Simple email/password login/register form
- All other components work the same as before

## 🚀 Production Deployment

For production, you should:

1. **Use PostgreSQL** instead of SQLite:
   ```bash
   # In backend/.env
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   ```

2. **Secure session secret**:
   ```bash
   # Generate a secure random string
   SESSION_SECRET=your_production_secret_here
   ```

3. **Enable HTTPS** for secure cookies
4. **Set NODE_ENV=production**

## 🎯 Next Steps

Your app is now ready to use with flexible database options! You can:
- **Start with SQLite** for immediate development
- **Switch to PostgreSQL** when you need production features
- **Create user accounts** without any external setup
- **Test the property management** features
- **Connect Cardano wallets** for blockchain payments
- **Add more features** as needed

The authentication is completely self-contained and doesn't depend on any external services, while giving you the flexibility to choose your preferred database!