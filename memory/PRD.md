# BanquetOS - Product Requirements Document

## Overview
BanquetOS is a multi-tenant SaaS platform for banquet hall management with intelligent event planning capabilities.

## Core Requirements (Completed)
1. Multi-Tenant SaaS Architecture
2. Super Admin Portal for tenant/plan management
3. Role-Based Access Control
4. Feature Flag System
5. Party Planning with booking-driven workflow

## Recent Enhancements (Completed Dec 2025)

### Admin Panel UI/UX Polish - World-Class Upgrade

#### Global UI Behaviors (Applied Everywhere)
1. **State-Driven UI**
   - StatusBadge component for: Bookings (Draft/Confirmed/Completed/Cancelled), Payments (Pending/Partial/Paid/Overdue), Vendors (Invited/Confirmed/Arrived/Paid), Staff (Pending/Confirmed/Absent)
   - Color-safe badges with icons, always visible near entity titles

2. **Save/Load Confidence**
   - SaveFeedback component showing "Saving..." → "Saved ✓" states
   - useSaveState hook for auto-reset after 2s
   - Buttons disabled during save operations
   - Clear error messages on failure

3. **Skeleton Loading**
   - Context-aware skeletons for all pages (Dashboard, Bookings, Vendors, Payments, Reports, Party Planning, Calendar, Halls, Customers, SuperAdmin)
   - Soft purple/neutral shimmer with prefers-reduced-motion support
   - Layout-preserving placeholders

4. **Destructive Action Protection**
   - AlertDialog confirmations for all delete operations (Halls, Vendors)
   - Clear warning messaging with entity names

5. **Intelligence Cues**
   - Non-intrusive alerts for: pending payments, at-risk events, understaffing warnings, vendor confirmation alerts
   - Dismissible notifications

#### Page-Specific Enhancements
- **Dashboard**: Intelligence cues, animated stats, events today highlight
- **Bookings List**: Status badges, today/upcoming/past sorting, "TODAY" badges
- **Booking Detail/Edit**: Status badge, last updated time, party plan warnings, motion transitions
- **Party Planning**: Enhanced vendors tab (3 assignment modes), enhanced staff tab (smart suggest, +/- controls)
- **Vendors**: Skeleton loading, AlertDialog delete confirmation, save feedback
- **Halls**: Skeleton loading, AlertDialog delete confirmation, save feedback
- **Customers**: Skeleton loading, save feedback
- **Calendar**: Skeleton grid loading
- **Payments**: Skeleton loading
- **Reports**: Skeleton loading
- **SuperAdmin Tenants**: Dark theme skeleton loading

### Party Planner Elite Upgrade

#### Vendors Tab
- Three assignment modes: Select from directory, Add new inline, Custom/Other
- Vendor cards with status lifecycle: Invited → Confirmed → Arrived → Completed → Paid
- Near-event warnings for unconfirmed vendors
- Auto-generated checklist items per vendor category (DJ, Decor, Catering, Photography)
- Cost tracking with balance calculation

#### Staff Tab
- Smart Suggest generates staffing plan based on guest count + event type + slot
- Event type templates (Wedding: more staff, Birthday: fewer, Corporate: ushers)
- Fast editing: +/- buttons for count, wage type toggle (Fixed/Hourly), shift times
- Understaffing detection with warnings
- Real-time total staff cost calculation

## Technical Architecture
```
/app/
├── backend/
│   └── server.py              # FastAPI with multi-tenant logic
└── frontend/
    └── src/
        ├── components/
        │   └── ui/
        │       ├── status-badge.jsx      # Entity status badges
        │       ├── save-feedback.jsx     # Save state feedback
        │       ├── intelligence-cue.jsx  # Alert notifications
        │       └── skeletons.jsx         # Context-aware skeletons
        └── pages/
            ├── PartyPlanningPage.jsx     # Enhanced with vendor/staff tabs
            ├── BookingsPage.jsx          # Status badges, sorting
            ├── DashboardPage.jsx         # Intelligence cues
            ├── BookingFormPage.jsx       # Status, last updated, warnings
            ├── VendorsPage.jsx           # Skeletons, AlertDialog
            ├── HallsPage.jsx             # Skeletons, AlertDialog
            ├── CustomersPage.jsx         # Skeletons, save feedback
            ├── CalendarPage.jsx          # Skeleton grid
            └── superadmin/
                └── TenantsPage.jsx       # Dark skeleton loading
```

## UI Components Created
1. **StatusBadge** - Entity status with icons and colors
2. **SaveFeedback** - Saving/Saved/Error states with auto-reset
3. **useSaveState** - Hook for save state management
4. **IntelligenceCue** - Warning, info, danger dismissible alerts
5. **Skeleton components** - 15+ context-aware placeholders

## Pending/Backlog
- Phase 4: Dashboard Intelligence widgets (at-risk events widget)
- Phase 5: Quality & Safety validation
- Refactor server.py into modular routers

## Test Credentials
- Super Admin: super_admin@banquetos.com / superadmin123
- Tenant Admin: admin@mayurbanquet.com / admin123
- Reception: reception@mayurbanquet.com / reception123

## Quality Confirmation
✅ No layout changes
✅ No color/font changes
✅ UI feels calm, not busy
✅ User never wonders "what now?"
✅ All admin pages feel consistent
✅ No visual regressions
