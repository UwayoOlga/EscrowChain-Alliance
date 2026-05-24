## EscrowChain-Alliance
### Platform: Rental & Landlord Management with Cardano-powered escrow for trust, transparency, and automation.
---

## PROJECT OVERVIEW

EscrowChain-Alliance is a next‑generation rental and property management platform that merges traditional web application architecture with blockchain-backed escrow. Using the Cardano blockchain and smart contracts written in Aiken, it ensures:

* Secure and transparent escrow of rental payments
* Automatic distribution of funds: rent, platform commission, tax
* Immutable receipts and audit trails
* Maintenance request handling and accountability
* Remote landlord access and full property lifecycle tracking

The platform connects three main user roles: Tenants, Landlords, and Admins.

---

## FEATURES

* Verified property listings with photos, documents, and inspection status
* Tenant search and apply workflow with lease agreement and e‑signature
* Payment options: mobile money, card payments, Cardano escrow
* Smart escrow contract for rent — releases only upon lease conditions or admin approval
* Automatic splitting: landlord payout, platform commission, tax escrow
* Maintenance reporting and contractor assignment
* Admin dashboard for audits, dispute resolution, tax reporting, compliance
* PDF receipts and downloadable tax/commission reports
* Role‑based dashboards (tenant, landlord, admin)
* Seed data support for testing, migration scripts for database setup

---

## INSTALLATION & SETUP

1. Clone the repository

   git clone [https://github.com/Gustaveizabayo/EscrowChain-Alliance.git](https://github.com/Gustaveizabayo/EscrowChain-Alliance.git)
   cd EscrowChain-Alliance

2. Backend setup (PHP)

   cd backend
   Install dependencies (using Composer or your preferred method)
   Copy environment config (example `.env`) and configure database credentials, Cardano node/keys path, payment gateways

3. Run database migrations & optional seed data

   Run migrations to create tables
   Run seed scripts if you want sample data for testing

4. Start backend server

   Use PHP built‑in server or use Apache/Nginx: e.g.,
   php -S localhost:8000 -t public

5. Frontend

   Open `frontend/index.html` in your browser (or host via static server)
   Frontend uses Tailwind CSS and plain JS — you can plug React/Vue if desired

6. Blockchain / Cardano integration

   Place Cardano keys in `blockchain/cardano/keys/` (do not commit real secret keys)
   Use scripts in `blockchain/cardano/scripts/` to build, sign, and submit transactions
   Configure backend or service to call these scripts when needed (e.g., for escrow deposit, release)

---

## CONTRIBUTION GUIDELINES

* Use feature branches for new work; name them clearly (e.g., `feature/escrow-release`)
* Write tests for significant logic (backend services, smart‑contract interactions)
* Document in docs/ when adding new endpoints or UI flows
* Respect security: never commit private keys or secrets; keep `.env`, keys out of version control
* Follow code style consistently; maintain clear comments and README updates

---


# Running EscrowChain-Alliance

EscrowChain-Alliance is a full-stack project with PHP backend, plain JS/HTML frontend, and Cardano/Aiken smart contract integration. To run it, you need:

* PHP backend (with extensions like PDO, mbstring, OpenSSL)
* Composer (PHP dependency manager)
* Web browser for frontend
* SQLite/MySQL/PostgreSQL (depending on configuration)
* Node.js/NPM (optional, if using frontend build tools)
* Cardano node CLI & Aiken compiler (for smart contracts)

---

## 1. Prerequisites (Mac / Windows / Linux)

### PHP & Composer

* PHP 8.x recommended
* Composer installed globally

Check installation:

```
php -v
composer -v
```

### Database

* MySQL / PostgreSQL / SQLite
* Ensure database server is running and accessible

### Cardano CLI & Node

* Install Cardano node according to OS instructions:
  [https://docs.cardano.org/getting-started/running-cardano-node](https://docs.cardano.org/getting-started/running-cardano-node)

Check installation:

```
cardano-cli --version
```

### Aiken Compiler

* Install Aiken to compile smart contracts:
  [https://github.com/AikenDev/aiken](https://github.com/AikenDev/aiken)

Check installation:

```
aiken --version
```

### Optional (Frontend Build)

* Node.js & NPM if using Tailwind build scripts or JS bundlers
* Browser for testing frontend

---

## 2. Installation Steps

### MacOS

1. Clone the repo:

```
git clone https://github.com/Gustaveizabayo/EscrowChain-Alliance.git
cd EscrowChain-Alliance
```

2. Backend setup:

```
cd backend
composer install
cp .env.example .env
```

* Edit `.env` with database credentials, Cardano key paths, and API keys.

3. Run database migrations:

```
php artisan migrate
php artisan db:seed
```

4. Start backend server:

```
php -S localhost:8000 -t public
```

5. Open frontend:

```
open frontend/index.html
```

6. Cardano / Aiken contracts:

```
cd blockchain/cardano/scripts
./build-tx.sh
./sign-tx.sh
./submit-tx.sh
```

---

### Windows

1. Install **PHP**, **Composer**, **MySQL**, **Cardano node**, **Aiken**, and optionally Node.js.

2. Clone the repo using Git Bash / Command Prompt:

```
git clone https://github.com/Gustaveizabayo/EscrowChain-Alliance.git
cd EscrowChain-Alliance
```

3. Backend setup:

```
cd backend
composer install
copy .env.example .env
```

* Update `.env` file

4. Run database migrations:

```
php artisan migrate
php artisan db:seed
```

5. Start backend server (using Git Bash or CMD):

```
php -S localhost:8000 -t public
```

6. Open frontend in browser:

```
start frontend/index.html
```

7. Cardano / Aiken scripts (Git Bash):

```
cd blockchain/cardano/scripts
bash build-tx.sh
bash sign-tx.sh
bash submit-tx.sh
```

---

### Linux (Ubuntu/Debian)

1. Install dependencies:

```
sudo apt update
sudo apt install php-cli php-mbstring php-xml composer git mysql-client
```

* Install Cardano node & Aiken compiler per instructions

2. Clone repo:

```
git clone https://github.com/Gustaveizabayo/EscrowChain-Alliance.git
cd EscrowChain-Alliance
```

3. Backend setup:

```
cd backend
composer install
cp .env.example .env
```

* Configure `.env`

4. Run migrations:

```
php artisan migrate
php artisan db:seed
```

5. Start backend server:

```
php -S localhost:8000 -t public
```

6. Open frontend in browser:

```
xdg-open frontend/index.html
```

7. Run Cardano/Aiken scripts:

```
cd blockchain/cardano/scripts
./build-tx.sh
./sign-tx.sh
./submit-tx.sh
```

---

## Notes

* **Database credentials** must match `.env` configuration.
* **Cardano keys** should be stored safely in `blockchain/cardano/keys/` and **not committed to GitHub**.
* Smart contracts should be **compiled and deployed** before running payment/escrow flows.
* You can optionally run frontend on a live server or use Live Server extension in VSCode.



## LICENSE

Specify your license here MIT License.

