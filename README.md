# Rumahku — Condo Management

Admin console for residential property management (JMB/MC style), inspired by
systems like CSS Decisions and Jaga: lot registration, ownership, recurring
billing, utility metering, official receipts with payment allocation, account
ledgers and outstanding/aging — with a warm, modern UI.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (all theme tokens in `app/globals.css` — edit that one file to re-skin)
- In-app demo data store (`lib/store.tsx` + `lib/seed.ts`) persisted to
  `localStorage`. Swap for a real database (Supabase/Prisma) later — every
  mutation already flows through one reducer.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Use **Reset demo data** in the top bar to restore the original seed
(24 lots, 20 owners, Feb–Jul 2026 billing history).

## Modules

| Area | Route | What it does |
| --- | --- | --- |
| Dashboard | `/` | Collections, outstanding, overdue, top debtors |
| Lot Information | `/setup/lots` | Register units: block, level, built-up, share units |
| Billing Codes | `/setup/billing-codes` | GL codes per document type (IV/UB/IA/DN/CN) |
| Billing Rates | `/setup/billing-rates` | Rate per sq ft or flat amount, per code |
| Property Settings | `/setup/settings` | Property details, due days, water tariff, LPI |
| Owners | `/owners` | Ownership entry with contact information |
| Monthly Billing | `/billing/monthly` | Generate service charge / sinking fund run |
| Utility Billing | `/billing/utility` | Water meter readings → consumption → bills |
| General Billing | `/billing/general` | One-off charges (wheel clamp, access card…) |
| Official Receipt | `/receipts` | Payments with FIFO / manual allocation, printable |
| Account Ledger | `/accounts/ledger` | Statement per lot with running balance |
| Outstanding | `/accounts/outstanding` | Aging buckets + apply late payment interest |
| Billing & Settlement | `/accounts/settlement` | Each billed item matched to the receipt that settled it |
| Deposit Statement | `/accounts/deposits` | Deposits billed → received → refunded/retained |
| Announcements | `/community/announcements` | Letters & notices for residents (drafts + published) |
| Parcels | `/community/parcels` | Guardhouse parcel log: arrive → notify → collect |
| Parking | `/community/parking` | Bays, assignments, stickers, visitor parking |
# rumahku
