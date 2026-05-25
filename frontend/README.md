# BlockRent Escrow - Frontend

React + TypeScript frontend for the BlockRent Escrow platform.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Mesh SDK** - Cardano wallet integration
- **Firebase** - Authentication
- **Recharts** - Data visualization

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
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Features

- **Multi-role Dashboard** - Different interfaces for tenants, landlords, and admins
- **Cardano Wallet Integration** - Support for Nami, Eternl, Lace, and Vespr wallets
- **Property Management** - List, view, and manage rental properties
- **Secure Payments** - Rent payments through Cardano smart contracts
- **Dispute Resolution** - Built-in dispute handling system
- **Responsive Design** - Mobile-friendly interface

## Project Structure

```
frontend/
├── components/          # React components
│   ├── AdminDashboard.tsx
│   ├── AuthModal.tsx
│   ├── Dashboard.tsx
│   ├── DisputeResolution.tsx
│   ├── LandingPage.tsx
│   ├── Payment.tsx
│   ├── PropertyStatus.tsx
│   ├── Sidebar.tsx
│   ├── WalletConnect.tsx
│   └── assets/         # Images and static assets
├── services/           # API client services
├── App.tsx            # Main application component
├── index.tsx          # React entry point
├── types.ts           # TypeScript type definitions
├── constants.ts       # Application constants
└── firebase-config.js # Firebase configuration
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.