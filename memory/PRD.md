# BanquetOS - Product Requirements Document

## Overview
BanquetOS is a multi-tenant SaaS platform for banquet hall management with intelligent event planning capabilities.

## Core Requirements (Completed)
1. Multi-Tenant SaaS Architecture
2. Super Admin Portal for tenant/plan management
3. Role-Based Access Control
4. Feature Flag System
5. Party Planning with booking-driven workflow

## Recent Work (Feb 2026)

### Fixed: Vendors Page Blank Screen Issue
**Root Cause:** Framer Motion animations were stuck at initial `hidden` state (opacity: 0) because variant inheritance wasn't propagating correctly.

**Solution:** Added explicit `initial="hidden"` and `animate="visible"` props to all motion.div elements in VendorsPage.jsx.

**Files Modified:**
- `/app/frontend/src/pages/VendorsPage.jsx`

### Implemented: Elite Vendor System Backend

#### New Data Models
1. **VendorTransaction** - Full ledger with debit/credit/payment entries
   - `tenant_id`, `vendor_id`, `booking_id` (nullable)
   - `transaction_type`: debit | credit | payment
   - `amount`, `payment_method`, `reference_id`, `transaction_date`, `note`

2. **BookingVendor** - Enhanced vendor assignments per booking
   - `tenant_id`, `booking_id`, `vendor_id`
   - `category_snapshot`, `agreed_amount`, `tax`, `advance_expected`
   - `amount_paid`, `balance_due`, `status`, `notes`

#### New API Endpoints
- `GET /api/vendors/directory` - Vendor list with balance summary
- `GET /api/vendors/{id}/ledger` - Full transaction history
- `POST /api/vendors/{id}/transactions` - Record debit/credit/payment
- `GET /api/bookings/{id}/vendors` - Get booking vendor assignments
- `POST /api/bookings/{id}/vendors` - Assign vendor to booking
- `PUT /api/bookings/{id}/vendors/{assignment_id}` - Update assignment
- `DELETE /api/bookings/{id}/vendors/{assignment_id}` - Remove vendor
- `POST /api/bookings/{id}/vendors/{assignment_id}/pay` - Record payment

#### Balance Logic
- **Payable** = Debits - Credits - Payments (positive = you owe vendor)
- **Receivable** = negative balance (vendor owes you)
- **Settled** = balance is 0

#### Frontend API Methods Added
```javascript
vendorAPI.getDirectory()
vendorAPI.getLedger(vendorId)
vendorAPI.createTransaction(vendorId, data)
vendorAPI.getBookingVendors(bookingId)
vendorAPI.assignToBooking(bookingId, data)
vendorAPI.updateBookingVendor(bookingId, assignmentId, data)
vendorAPI.removeFromBooking(bookingId, assignmentId)
vendorAPI.recordPayment(bookingId, assignmentId, amount, paymentMethod, referenceId, note)
```

## Pending Work

### P0: Elite Vendor System Frontend
- [ ] Vendor Directory UI with payable/receivable balances
- [ ] Vendor Ledger Modal with transaction history
- [ ] Transaction entry form (debit/credit/payment)
- [ ] Party Planner vendor tab integration
- [ ] Booking vendor assignment workflow

### P1: Dashboard Intelligence
- [ ] At-risk events widget based on readiness scores
- [ ] Unpaid vendor alerts
- [ ] Understaffing warnings

### P2: Refactoring
- [ ] Split server.py into modular routers
- [ ] Clean up index.css

## Technical Architecture
```
/app/
├── backend/
│   └── server.py              # FastAPI with elite vendor system
└── frontend/
    └── src/
        ├── lib/api.js         # Updated with vendor ledger APIs
        └── pages/
            └── VendorsPage.jsx # Fixed animation issue
```

## Test Credentials
- Super Admin: super_admin@banquetos.com / superadmin123
- Tenant Admin: admin@mayurbanquet.com / admin123
- Reception: reception@mayurbanquet.com / reception123

## API Testing Examples
```bash
# Get vendor directory with balances
GET /api/vendors/directory

# Get vendor ledger
GET /api/vendors/{vendor_id}/ledger

# Record a debit transaction
POST /api/vendors/{vendor_id}/transactions
{
  "vendor_id": "...",
  "transaction_type": "debit",
  "amount": 15000,
  "note": "Event services"
}

# Record a payment
POST /api/vendors/{vendor_id}/transactions
{
  "vendor_id": "...",
  "transaction_type": "payment",
  "amount": 5000,
  "payment_method": "UPI",
  "reference_id": "UTR123456"
}
```
