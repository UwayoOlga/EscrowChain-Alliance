# BlockRent Escrow - Decentralized Rental Platform

A full-stack decentralized rental property management platform that combines traditional web technologies with Cardano blockchain for secure escrow payments.

## 🏗️ Project Structure

```
blockrent-escrow/
├── frontend/           # React + TypeScript frontend
├── backend/            # Node.js + Express API
├── package.json        # Root package.json for managing both
└── README.md          # This file
```

## 🚀 Quick Start

1. **Install all dependencies:**
```bash
npm run install:all
```

2. **Start development servers:**
```bash
npm run dev
```

That's it! No external services or complex setup required.

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000
- **Database:** SQLite (created automatically)

## 🔐 Authentication

Simple email/password authentication:
- **No Firebase setup needed**
- **No external database required**
- **SQLite database created automatically**
- **Secure password hashing with bcryptjs**
- **Session-based authentication**

## 🛠️ Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only the frontend
- `npm run dev:backend` - Start only the backend
- `npm run build` - Build the frontend for production
- `npm run install:all` - Install dependencies for root, frontend, and backend

## 🏛️ Architecture

### Frontend (React + TypeScript)
- **Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS
- **Build Tool:** Vite
- **Blockchain:** Mesh SDK for Cardano wallet integration
- **Auth:** Firebase Authentication

### Backend (Node.js + Express)
- **Runtime:** Node.js with Express framework
- **Database:** SQLite (automatic setup)
- **Auth:** Simple email/password with bcryptjs
- **Smart Contracts:** Aiken (Cardano)

### Blockchain (Cardano)
- **Smart Contracts:** Written in Aiken
- **Wallets:** Support for Nami, Eternl, Lace, Vespr
- **Features:** Multi-signature escrow, immutable transaction history

## 🎯 Key Features

- **Secure Rent Payments:** Blockchain-based escrow with multi-signature requirements
- **Property Management:** List properties, upload condition reports, track status
- **Multi-Role System:** Different dashboards for tenants, landlords, and admins
- **Dispute Resolution:** Built-in system for handling rental disputes
- **Wallet Integration:** Native Cardano wallet support
- **Responsive Design:** Mobile-friendly interface

## 🔧 Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
cd backend
npm run dev
```

### Smart Contract Development
```bash
cd backend/contracts
aiken build
```

## 📁 Detailed Documentation

- [Frontend README](./frontend/README.md) - React app setup and components
- [Backend README](./backend/README.md) - API endpoints and database setup

## 🌐 Environment Setup

### Frontend (.env)
```
# No environment variables needed
```

### Backend (.env)
```
SESSION_SECRET=your_long_random_session_secret
PORT=5000
NODE_ENV=development
```

## 🚀 Deployment

### Frontend
```bash
cd frontend
npm run build
# Deploy the dist/ folder to your hosting service
```

### Backend
```bash
cd backend
npm start
# Deploy to your server or cloud platform
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private and proprietary.