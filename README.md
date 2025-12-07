## EscrowChain-Alliance

Project name: EscrowChain-Alliance
Platform: Rental & Landlord Management with Cardano-powered escrow for trust, transparency, and automation.

ASCII‑style project folder structure with purpose for each folder / file is shown below, followed by project overview, features, installation, contribution guide, and license placeholder.

```
EscrowChain-Alliance  
│  
├── backend                     # server-side PHP backend and API  
│   ├── app                      # core application code (controllers, models, services, helpers)  
│   │   ├── Controllers  
│   │   │   └── Controller.php  
│   │   ├── Helpers  
│   │   │   └── helpers.php  
│   │   ├── Models  
│   │   │   └── Model.php  
│   │   └── Services  
│   │       ├── PaymentService.php  
│   │       ├── MaintenanceService.php  
│   │       └── SmartContractService.php  
│   │  
│   ├── config                   # configuration files (app settings, DB settings)  
│   │   ├── app.php  
│   │   └── database.php  
│   │  
│   ├── public                   # web‑accessible assets and entry point  
│   │   ├── css  
│   │   ├── images  
│   │   ├── js  
│   │   └── index.php  
│   │  
│   ├── routes                   # API & web routes definitions  
│   │   ├── api.php  
│   │   └── web.php  
│   │  
│   ├── storage                  # for uploads, logs, cache, etc.  
│   │   ├── cache  
│   │   ├── logs  
│   │   └── uploads  
│   │  
│   └── tests                    # unit/integration tests for backend  
│  
├── blockchain                  # Cardano blockchain integration scripts & keys  
│   └── cardano  
│       ├── keys                # private/public keys or instructions (read-only)  
│       │   └── README.md  
│       ├── scripts             # scripts to build/sign/submit Cardano transactions  
│       │   ├── build-tx.sh  
│       │   ├── sign-tx.sh  
│       │   └── submit-tx.sh  
│       └── transactions        # track example transactions or logs  
│           └── README.md  
│  
├── database                    # database structure, migrations, sample seed data  
│   ├── migrations              # SQL scripts to create database tables  
│   │   ├── 001_create_users_table.sql  
│   │   ├── 002_create_properties_table.sql  
│   │   ├── 003_create_rent_payments_table.sql  
│   │   ├── 004_create_maintenance_table.sql  
│   │   ├── 005_create_lease_contracts_table.sql  
│   │   └── 006_create_transactions_table.sql  
│   │  
│   ├── schemas                 # full schema definitions / ERD  
│   │   └── rental_schema.sql  
│   │  
│   └── seeds                   # optional sample data for testing  
│       ├── seed_users.sql  
│       ├── seed_properties.sql  
│       └── seed_rents.sql  
│  
├── docs                        # documentation: API, requirements, UI, pitch deck  
│   ├── api                     # API endpoint definitions and specs  
│   │   └── endpoints.md  
│   ├── pitchdeck               # slides or content for investors / judges  
│   │   └── pitch_deck.md  
│   ├── requirements            # system / user requirements, user stories  
│   │   ├── system_requirements.md  
│   │   └── user_stories.md  
│   └── ui                      # UI structure, wireframes, mockups description  
│       └── ui_structure.md  
│  
├── frontend                    # client‑side web app (static + dynamic)  
│   ├── assets                  # css, js, images  
│   │   ├── css  
│   │   │   └── tailwind.css  
│   │   ├── images  
│   │   └── js  
│   │       └── app.js  
│   │  
│   ├── components              # reusable UI components (React, Vue, or plain)  
│   │   └── README.md  
│   │  
│   ├── pages                   # HTML pages per role: tenant, landlord, admin, auth  
│   │   ├── admin  
│   │   │   ├── dashboard.html  
│   │   │   ├── inspections.html  
│   │   │   └── users.html  
│   │   ├── auth  
│   │   │   ├── login.html  
│   │   │   └── register.html  
│   │   ├── landlord  
│   │   │   ├── dashboard.html  
│   │   │   ├── properties.html  
│   │   │   └── reports.html  
│   │   └── tenant  
│   │       ├── dashboard.html  
│   │       ├── maintenance.html  
│   │       └── payments.html  
│   │  
│   ├── partials                # shared UI parts like header/footer  
│   │   ├── header.html  
│   │   └── footer.html  
│   │  
│   └── index.html             # main landing page  
│  
└── smart-contracts             # Aiken smart contracts for escrow, leasing, payments  
    └── aiken  
        ├── contracts          # source .ak contract files: escrow_contract.ak, rental_contract.ak  
        └── build              # compiled contract output / build artifacts / README.md  
            └── README.md  
```

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

