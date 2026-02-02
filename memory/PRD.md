# BanquetOS - Banquet Management Software PRD

## Original Problem Statement
Build a comprehensive Banquet Management Software (BanquetOS) for banquet hall owners. The system manages bookings, customers, halls, menus, vendors, payments, and expenses with role-based access control (Admin vs Reception).

## Core Requirements
- **Landing Page**: Public-facing venue showcase with enquiry form
- **Authentication**: JWT-based with Admin and Reception roles
- **Booking Management**: Day/Night slots, double-booking prevention, GST calculations
- **Menu Management**: Veg/Non-Veg items with custom categories
- **Vendor Management**: Track vendor payments, outstanding balances
- **Expense Management**: Party expenses, vendor payments, profit calculations
- **Reports & Analytics**: Financial reports, hall utilization, revenue charts

---

## What's Been Implemented

### ✅ Core Features (Complete)
- Landing page with venue showcase and enquiry form
- JWT authentication with role-based access (Admin/Reception)
- Booking system with Day/Night slots
- Hall management
- Menu management with custom categories
- Customer management
- Payment tracking with payment modes (cash/UPI/credit)
- Calendar view with slot indicators
- Dashboard with stats and charts
- PDF invoice generation

### ✅ Landing Page Redesign (January 12, 2026)
- Converted to modern SaaS-style website for "BanquetOS"
- **Hero Section**: Bold headline "Run Your Banquet Like a Pro", dashboard preview, trust indicators
- **Features Section**: 6 feature cards (Booking, Payment Tracking, Vendor Payments, Profit Calculation, Staff Permissions, Invoices)
- **How It Works**: 5-step visual flow (Booking → Invoice → Payment → Expense → Profit)
- **Roles & Permissions**: Admin vs Reception role cards with feature lists
- **Final CTA**: Gradient CTA section with "Start Free Trial"
- Clean, minimal design with violet/purple gradient theme
- Smooth scroll animations, rounded cards, soft shadows

### ✅ Advanced Features (January 12, 2026)
1. **Expenses Module - Booking Lock Flow**
   - Lock booking selection to prevent accidental changes
   - Show booking details (ID, Customer, Date, Amount) when locked
   - Inline expense entry with category, amount, notes
   - "Unsaved Expenses" list with batch "Save All" functionality
   - No page reload required when adding multiple expenses

2. **Menu Categories**
   - "Add Category" button on Menu page
   - Create custom categories (e.g., "Punjabi Special", "Chinese")
   - Categories reusable across menu items
   - Delete custom categories

3. **Vendor Payments - Advanced**
   - "Add Payable" to add payable amount to vendor
   - "Record Payment" with:
     - Payment type: Advance, Partial, Final
     - Payment mode: Cash, UPI, Credit Card
   - Vendor Ledger table showing:
     - Vendor name, Type, Phone
     - Parties linked count
     - Total Payable, Total Paid, Outstanding
     - Status (Cleared/Partial/Pending)
   - Auto-calculated outstanding balances

4. **Outstanding Balances Tab**
   - Vendors with dues sorted by outstanding amount
   - Summary: Total Outstanding, Vendors with Dues, Cleared Vendors

---

## Tech Stack
- **Backend**: FastAPI, MongoDB (motor), Pydantic, JWT, bcrypt
- **Frontend**: React, React Router, Tailwind CSS, Shadcn UI, Framer Motion
- **Database**: MongoDB

## API Endpoints
- `/api/auth/*` - Authentication (login, register, me)
- `/api/bookings/*` - Booking CRUD
- `/api/halls/*` - Hall management
- `/api/menu/*` - Menu items
- `/api/menu-categories/*` - Menu categories (NEW)
- `/api/customers/*` - Customer management
- `/api/payments/*` - Payment recording
- `/api/party-expenses/*` - Party expenses (Admin only)
- `/api/vendor-payments/*` - Vendor payments
- `/api/vendor-balance-sheet` - Vendor ledger
- `/api/vendors/*` - Vendor CRUD
- `/api/dashboard/*` - Dashboard stats
- `/api/calendar` - Calendar events
- `/api/enquiries/*` - Public enquiries

## Data Models
- **Users**: id, name, email, phone, role (admin/reception)
- **Bookings**: booking_number, customer_id, hall_id, event_date, slot (day/night), guest_count, menu_items, addons, charges, GST, payments
- **MenuItems**: name, category, menu_type (veg/non_veg), price_per_plate, is_addon
- **MenuCategories**: name, description (NEW)
- **Vendors**: name, vendor_type, phone, total_payable, total_paid, outstanding_balance
- **VendorPayments**: vendor_id, booking_id, amount, payment_mode, description
- **PartyExpenses**: booking_id, expense_name, amount, notes

## Credentials
- **Admin**: admin@mayurbanquet.com / admin123
- **Reception**: reception@mayurbanquet.com / reception123

---

## Pending/Backlog

### P1 - High Priority
- WhatsApp/SMS notification integration
- Export to PDF/Excel for vendor ledgers and reports

### P2 - Future
- Customer Login Portal
- Google Calendar sync for bookings
- Multi-language support (English/Punjabi)

### Refactoring Needed
- Split `/app/backend/server.py` into separate route files for maintainability:
  - `routes/bookings.py`
  - `routes/vendors.py`
  - `routes/expenses.py`
  - `routes/menu.py`
