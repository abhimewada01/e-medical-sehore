# 🏥 E-Medical Sehore (ई-मेडिकल सीहोर)
### Production-Ready Digital Pharmacy & Doctor Connect Platform

A complete, full-stack digital pharmacy and healthcare platform built specifically for Indian regional pharmacies and clinics. Connects **Patients/Customers**, **Registered Doctors/Clinics**, **Pharmacists**, and **Store Administrators**.

---

## 🌟 Tech Stack

* **Frontend:** Svelte 5 (Runes), SvelteKit 2, TypeScript, Tailwind CSS 4, Lucide Icons
* **Backend:** SvelteKit Server Endpoints & Actions, Node 20 / Bun Runtime
* **Database:** PostgreSQL with Drizzle ORM (22 normalized relational tables)
* **Authentication:** Jose / Secure JWT session cookies with RBAC, scrypt password hashing
* **Payments:** Razorpay API (Online UPI/Cards/Netbanking) with HMAC-SHA256 signature verification + Cash on Delivery (COD)
* **Prescription Engine:** Private file storage (Cloudflare R2 in production, local disk in dev) with strict pharmacist verification workflow
* **Loyalty Engine:** Admin-controlled wallet with 30-day coin expiry & double-entry ledger
* **Doctor Referral System:** Unique QR code generation and patient attribution analytics

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v20+
- **pnpm:** `npm install -g pnpm`
- **PostgreSQL:** v15+ running locally or in Docker

### 2. Environment Setup
Copy the example environment configuration:
```bash
cp .env.example .env
```
Fill in your database connection string and secret keys in `.env`:
```env
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```
*(Note: If your password contains `@`, encode it as `%40` in the database URL)*

### 3. Database Migration & Seed
Push the Drizzle schema to PostgreSQL and seed initial categories, medicines, and admin account:
```bash
# Push schema to create all tables
pnpm run db:push

# Seed categories, demo medicines, and super admin
pnpm dlx tsx src/lib/server/db/seed.ts
```

For an existing production database, first apply the checked-in compatibility migration after confirming it is backed up:
```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0001_security_and_auth.sql
```
The migration adds persistent login throttling and password reset storage, and the unique webhook event index. Keep the database URL private.

### 4. Run Development Server
```bash
pnpm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

---

## 🔐 Admin Account

The seed script reads `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` from your private `.env`. Set a unique password before running it. Never commit real credentials or reuse a sample password.

---

## 👥 Role-Based Portals & Key Features

### 1. Customer Portal
* **Storefront (`/` & `/shop`):** Search medicines by name, generic salt, brand, or composition. Filter OTC vs. Prescription-only.
* **Prescription Upload (`/customer/prescriptions`):** Upload doctor prescriptions (PDF, JPG, PNG). Tracks verification status (`PENDING_VERIFICATION`, `APPROVED`, `REJECTED`, `CLARIFICATION_REQUESTED`).
* **Cart & Checkout (`/cart`, `/checkout`):** Automatic prescription warning banners, address selector, COD or Razorpay payment, loyalty coin redemption, and discreet packaging option.
* **Reward Coins (`/customer/wallet`):** Earn 5% back on eligible orders. Coins expire after 30 days. Ledger records every transaction.

### 2. Admin & Pharmacist Portal (`/admin/*`)
* **Dashboard (`/admin/dashboard`):** Real-time analytics, revenue metrics, order pipeline, low-stock alerts, and pending prescription review counters.
* **Order Management (`/admin/orders`):** Update statuses (`CONFIRMED`, `PACKED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`), assign delivery personnel, inspect attached prescriptions.
* **Prescription Verification (`/admin/prescriptions`):** Pharmacist review interface with Approve, Request Clarification, or Reject with reasons.
* **Medicines & Inventory (`/admin/medicines`):** Add, edit, adjust stock, configure minimum stock alert levels, and toggle active status.
* **Doctor Management (`/admin/doctors`):** Verify doctor license numbers and clinic registrations.
* **Reward Controls (`/admin/rewards`):** Configure earn percentage, coin values, minimum order thresholds, and 30-day expiry rules.

### 3. Doctor Portal (`/doctor/*`)
* **Dashboard (`/doctor/dashboard`):** Displays unique downloadable QR code and clinic referral link (`/refer/{referralCode}`).
* **Referral Analytics:** Real-time metrics tracking QR scans, referred patient registrations, and fulfilled orders.
* **Profile (`/doctor/profile`):** Update clinic details, medical qualifications, and specialization.

---

## 💳 Razorpay Test Mode Setup

1. Sign up on [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Switch to **Test Mode**.
3. Navigate to **Settings > API Keys** and generate Test Key ID and Secret.
4. Add them to `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   ```
5. When placing an online order, Razorpay checkout opens. Use official Razorpay test cards or UPI IDs to complete payments. The backend strictly validates HMAC-SHA256 signatures before confirming orders.

---

## 🧪 Testing

Run Vitest unit tests:
```bash
pnpm run test
```
Run type-check:
```bash
pnpm run check
```

---

## 🐳 Docker & Production Deployment

For Vercel, use a hosted PostgreSQL database and configure the environment variables from `.env.example` in the Vercel project settings. Use the provider's pooled connection URL, set `PUBLIC_APP_URL` to the deployed HTTPS URL, and generate a unique `JWT_SECRET`. Configure Cloudflare R2 credentials for private prescription uploads, plus `RAZORPAY_WEBHOOK_SECRET` and Resend `RESEND_API_KEY`/`EMAIL_FROM` if enabling payment webhooks and password reset email. Apply schema changes to the intended hosted database before deploying code that uses them; never point production at your local database. Do not enable prescription uploads until private R2 storage is configured.

### Docker Deployment
```bash
docker compose up -d --build
```
Runs PostgreSQL and the Node.js production container on `http://localhost:3000`.

### Render Deployment
1. Connect this GitHub repository to Render.
2. Create a **PostgreSQL Database** on Render.
3. Create a **Web Service** on Render with:
   - **Environment:** Node
   - **Build Command:** `pnpm install && pnpm run build`
   - **Start Command:** `node build`
4. Set environment variables from `.env.example` in the Render dashboard.

---

## ⚖️ Indian Regulatory & Compliance Notice

* **Prescription Medicines:** Prescription-only (Schedule H & H1) medicines require verification by a registered pharmacist before dispensing. AI is never used as a substitute for pharmacist verification.
* **Doctor Referral Ethics:** Under NMC (National Medical Commission) and MCI Code of Medical Ethics Regulations, doctors cannot receive referral kickbacks or financial commissions for referring patients or prescriptions. Financial commissions are **strictly disabled by default** in this platform.
* **18+ Age Restricted Products:** Sexual wellness and adult hygiene products include compliance banners and optional discreet outer packaging.
