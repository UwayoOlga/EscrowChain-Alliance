# EscrowChain Alliance — Enterprise Frontend

EscrowChain Alliance is a Web3-powered rental management platform that leverages the **Cardano** blockchain to provide trustless, secure, and transparent escrow services for landlords and tenants.

## 🚀 Key Features

*   **Trustless Escrow**: Security deposits are locked in smart contracts (Plutus/Aiken), not held by landlords.
*   **Cryptographic Leasing**: On-chain approval workflows using **Cardano MeshSDK**.
*   **Asset Management**: Institutional-grade property ledger with deep metadata support.
*   **Secure Communication**: Encrypted-style direct messaging between verified owners and residents.
*   **Resolution Protocol**: Integrated 2-of-3 multi-sig arbitration for rental disputes.

## 🛠 Technical Stack

*   **Core**: React + Vite
*   **State Management**: React Hooks & Context API
*   **Blockchain Integration**: MeshSDK (@meshsdk/react, @meshsdk/core)
*   **Styling**: Pure CSS with Corporate Minimalist aesthetic
*   **API Layer**: Axios with centralized error interceptors

## 📦 Installation & Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Configuration**:
    Create a `.env` file based on the root `.env.example`. Ensure `VITE_BLOCKFROST_PROJECT_ID` is set for Preprod Testnet access.

3.  **Development Mode**:
    ```bash
    npm run dev
    ```

## 🏗 Architecture Diagram (Public)

*   **User Interface**: Clean, functional dashboard for multi-role management.
*   **Wallet Integration**: Connects with Eternl, Vespr, or Lace to authorize on-chain scripts.
*   **Off-Chain Sync**: Communicates with the Express backend for metadata and document vault storage.

---
© 2026 EscrowChain Alliance Protocol. Built for the Decentralized Future.
