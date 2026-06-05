# SandTrack REST API Backend 🚛📈

Welcome to the production-ready REST API backend for **SandTrack** — an enterprise-grade, anti-fraud logistics and receipt tracking console engineered for commercial sand terminal dispatch centers.

This backend enforces a bulletproof **Role-Based Access Control (RBAC)** grid, timed transient gate-check QR validation sessions, conditional cash-flow verifications, and real-time staff audits.

---

## 🛠️ Tech Stack & Key Implementations

- **Runtime Environment:** Node.js 20+ (with native ESModules `"type": "module"`)
- **Web Framework:** Express.js 4+
- **Database Engine:** PostgreSQL (via `pg` Pool connection, strictly utilizing raw SQL queries without sluggish ORMs)
- **Security & Cryptography:** JWT (timed Access Token and httpOnly rotation Refresh Cookies) + `bcryptjs` password hashing
- **File Ingestion:** Multer (capped to 5MB, strict validation for `.png`, `.jpg`, `.jpeg`, and `.pdf`)
- **QR Engine:** `qrcode` generating secure base64 image streams
- **Data Integrity:** `express-validator` request body parsing chains
- **Logging Audits:** Automated `activityLogger` interception middleware

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Navigate to the `backend/` directory and install all node packages:
```bash
npm install
```

### 2. Configure Environment `.env`
Create a `.env` file based on the `.env.example` template:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/sandtrack
JWT_ACCESS_SECRET=your_access_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
FRONTEND_URL=http://localhost:5173
UPLOAD_DIR=./uploads
```

### 3. Run Database Migrations
We have integrated a custom ESModules runner script that applies all schema migrations and seeds standard staff credentials sequentially:
```bash
npm run migrate
```

### 4. Boot Up Development Server
Launches the server in watch-mode:
```bash
npm run dev
```
The REST API will be active and listening at `http://localhost:5000`.

---

## 🏛️ Database Tables & Schema

We use **9 raw SQL migrations** located inside `db/migrations/`:

1. **`users`:** Holds user profiles, hashed credentials, and specific RBAC role assignments.
2. **`drivers`:** Profile tracking for anti-fraud driver registries including visual face sheets and cnic verification.
3. **`trucks`:** Configuration of authorized trucks and mechanical wheel counts (8-22 wheelers).
4. **`consignments`:** Consignment dispatches, weights, destinations, transient QR token, and current trip status.
5. **`payments`:** Billing and ledger confirmations (supports Cash bypass, preventing bank slip uploads).
6. **`expenses`:** Ledger bookkeeping of general operational outflows (Salaries, Petty Cash, Maintenance).
7. **`gate_logs`:** Audits exit gate scanner scans performed by watchmen.
8. **`activity_logs`:** Audit feed tracking staff actions (excludes Super Admins).
9. **`seed_users`:** Standard developer test credentials (hashed with cost factor 10).

---

## 🔑 Predefined Tester Accounts (Hashed Seed Passwords)

All seed passwords match the account's username.

| Username | Password | Role | Permissions Profile |
| :--- | :--- | :--- | :--- |
| **admin** | `admin` | `SUPER_ADMIN` | Global analytics, staff status toggling, approvals for new drivers/trucks, audit feeds. |
| **operator** | `operator` | `OPERATOR` | Registers vehicles/drivers, dispatches sand consignments, generates 5-minute QR links, flags mismatches. |
| **driver** | `driver` | `DRIVER` | Accesses active assigned dispatches, previews trip timelines. |
| **watchman** | `watchman` | `WATCHMAN` | Scans driver QR codes to verify cargo exit scans and release trucks. |
| **accountant** | `accountant` | `accountant` | Ledger balance books, office expenses, logs salary logs, clears or flags driver payments. |

---

## 📡 Primary REST API Endpoints Map

All requests must send the Access Token in the Authorization header: `Bearer <JWT_TOKEN>` (or will fall back to reading cookie sessions).

### 1. Authentication (`/api/auth`)
- `POST /login` - Returns JWT + sets HttpOnly `refreshToken` cookie.
- `POST /logout` - Clears HttpOnly refresh cookie.
- `POST /refresh` - Generates a fresh access token from rotation cookie.
- `POST /forgot-password` - Prepares a password reset token without exposing it in logs or responses.
- `POST /reset-password` - Consumes token and hashes new password.

### 2. Users Staff (`/api/users`) *[SUPER_ADMIN only]*
- `GET /` - Queries all logged staff members.
- `POST /` - Onboards new staff user.
- `PATCH /:id/status` - Suspends or activates user access.

### 3. Driver Registry (`/api/drivers`)
- `GET /` - Queries all registered drivers.
- `POST /` - *[OPERATOR only]* Multipart file upload (`facePhoto`) registering driver profile.
- `PATCH /:id/approve` - *[SUPER_ADMIN only]* Approves driver registration.
- `PATCH /:id` - Updates driver properties.

### 4. Truck Registry (`/api/trucks`)
- `GET /` - Lists all trucks in fleet.
- `POST /` - *[OPERATOR only]* Registers new Mazda, Suzuki, Truck, or Damper (8 to 22 wheel count).
- `PATCH /:id/approve` - *[SUPER_ADMIN only]* Approves truck for operational dispatches.

### 5. Consignments Dispatch (`/api/consignments`)
- `GET /` - Queries consignments (Drivers only see their own, Operators/Admins see all).
- `POST /` - *[OPERATOR only]* Creates and schedules consignment.
- `PATCH /:id/status` - Updates consignment trip status.
- `PATCH /:id/flag` - *[OPERATOR only]* Manually flags detail mismatches.
- `POST /:id/qr` - *[OPERATOR only]* Generates a 5-minute transient QR session code and returns base64 image.
- `GET /verify-qr/:token` - *[WATCHMAN only]* Validates QR scanned token, auto-clears cargo, sets token null, logs gate_log.

### 6. Payments Verification (`/api/payments`)
- `GET /` - Lists billing ledger queues.
- `POST /` - Submits a payment (Multipart file `receiptImage` optional for Cash payments, strictly required for Bank payments).
- `PATCH /:id/verify` - *[ACCOUNTANT only]* Confirms payment and automatically marks consignment status as BILLED.
- `PATCH /:id/flag` - *[ACCOUNTANT only]* Flags receipt discrepancies.

### 7. Office Expenses (`/api/expenses`) *[ACCOUNTANT only]*
- `GET /` - Retrieves operational ledger entries.
- `POST /` - Logs Salaries, Petty Cash, Maintenance, and Miscellaneous.
- `DELETE /:id` - Removes expense log.

### 8. Analytics Console (`/api/analytics`) *[SUPER_ADMIN only]*
- `GET /summary` - Summary of total dispatches, gross revenue, pending payments, and flagged items.
- `GET /payments-by-method` - Aggregated Cash vs. Bank income.
- `GET /daily-revenue` - Last 30 days daily sales history grid.

---

## 🛡️ Anti-Fraud Validation Features Built-in

1. **Lazy DB Pool Injection:** The PG Pool initialization runs on demand, allowing the server to boot successfully and serve clean error states even if the local database connection experiences credential lockouts.
2. **Atomic QR verification:** Checks session expiry, state mismatches (`IN_TRANSIT`), and clears the cargo exit gates using safe multi-row transaction blocks.
3. **Automatic Invalidation:** Nullifies QR tokens immediately upon first successful Watchman scan, preventing duplicate ticket reuses.
4. **Conditional Ingestion:** Cash payments bypass mandatory digital receipts upload requirements, preventing fake receipt slip submissions.
5. **Staff Activity Audit Logs:** Captures all operations, but automatically filters out SUPER_ADMIN (CEO) actions from the log pool to maintain executive tracking isolation.
