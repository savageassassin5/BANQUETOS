# BanquetOS - Product Requirements Document

## Overview
BanquetOS is a multi-tenant SaaS platform for banquet hall management with intelligent event planning and vendor management capabilities.

## Recent Work (Feb 2026)

### ✅ COMPLETED: Elite Vendor System

#### What Was Built:
1. **Fixed Vendors Page Blank Screen** 
   - Root cause: Framer Motion animations stuck at opacity:0
   - Solution: Added explicit `initial="hidden"` and `animate="visible"` props

2. **Backend - Elite Vendor Ledger System**
   - New `VendorTransaction` model with debit/credit/payment types
   - Full transaction ledger per vendor
   - Balance calculation: Payable = Debits - Credits - Payments
   - Multi-tenant isolation with tenant_id

3. **Frontend - Vendor Directory UI**
   - Balance summary cards (Total Payable, Total Receivable, Net Balance)
   - Balance status badges on vendor cards (Payable/Receivable/Settled)
   - Balance filter dropdown

4. **Frontend - Vendor Ledger Modal**
   - Transaction history table with type icons
   - Summary stats (Debits, Credits, Payments, Balance)
   - Filter tabs (All/Debits/Credits/Payments)
   
5. **Frontend - Transaction Entry Form**
   - Type selector (Debit/Credit/Payment)
   - Payment methods: Cash, UPI, Bank Transfer, Cheque, Card
   - Reference ID field for UTR/Cheque numbers
   - Notes field

#### API Endpoints:
- `GET /api/vendors/directory` - Vendor list with balance info
- `GET /api/vendors/{id}/ledger` - Transaction history
- `POST /api/vendors/{id}/transactions` - Record transaction

#### Testing Status: ✅ PASSED (100%)
- Backend: 12/12 tests passed
- Frontend: All core features verified
- Bug fixed: Vendor model tenant_id for multi-tenant isolation

---

## Pending Tasks

### P0: Party Planner Vendor Tab Integration
- [ ] Select vendor from directory dropdown
- [ ] Set agreed amount & tax
- [ ] Record payments directly from assignment

### P1: Dashboard Intelligence
- [ ] At-risk events widget based on readiness scores
- [ ] Unpaid vendor alerts

### P2: Refactoring
- [ ] Split server.py into modular routers
- [ ] Clean up index.css

---

## Technical Architecture
```
/app/
├── backend/
│   ├── server.py              # FastAPI with elite vendor system
│   └── tests/
│       └── test_elite_vendor_system.py
└── frontend/
    └── src/
        ├── lib/api.js         # Vendor ledger APIs
        └── pages/
            └── VendorsPage.jsx # Elite vendor UI
```

## Test Credentials
- Tenant Admin: admin@mayurbanquet.com / admin123
- Super Admin: super_admin@banquetos.com / superadmin123

## Test Data
- DJ SANJ vendor: ₹15,000 debit, ₹5,000 payment = ₹10,000 payable
