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

### Phase 1: Global UI Behaviors
- **State-Driven UI**: StatusBadge component for bookings, payments, vendors, staff
- **Save/Load Confidence**: SaveFeedback component with "Saving...", "Saved ✓" states
- **Intelligence Cues**: Non-intrusive alerts for at-risk events, pending payments, understaffing
- **Skeleton Loading**: Context-aware placeholders for all admin pages
- **Motion Rules**: Subtle Framer Motion animations for page transitions

### Phase 2: Page-Specific Enhancements
- **Dashboard**: Intelligence cues for pending payments, today's events highlight
- **Bookings List**: Status badges, today/upcoming differentiation, sorted by urgency
- **Party Planning**: Enhanced modal with smart suggestions
- **Vendors Page**: Skeleton loading, save feedback
- **Payments Page**: Ledger-style skeletons, overdue detection
- **Reports**: Filter bar skeletons, smooth transitions

### Phase 3: Party Planner Elite Upgrade

#### Vendors Tab
- **Three Assignment Modes**: Select from directory, Add new inline, Custom/Other
- **Vendor Card/Row**: Name, category, contact, status lifecycle, cost tracking
- **Status Lifecycle**: Invited → Confirmed → Arrived → Completed → Paid
- **Vendor Warnings**: Alerts for unconfirmed vendors near event date
- **Auto-Checklist**: Vendor category adds relevant checklist items

#### Staff Tab
- **Smart Suggest**: Generates staffing plan based on guest count + event type + slot
- **Event Type Templates**: Wedding, Birthday, Corporate with different staff ratios
- **Fast Editing**: +/- buttons for count, wage type toggle, shift time pickers
- **Understaffing Detection**: Warnings when staff count below suggested
- **Real-time Cost**: Auto-updating total staff cost

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
            └── ...
```

## Key Data Models
- `tenants`: Business info, plan, features
- `plans`: Feature configurations
- `users`: Multi-tenant with roles
- `bookings`: Event bookings (source of truth)
- `party_plans`: Extended booking with vendor/staff/timeline

## UI Components Created
1. `StatusBadge` - Booking, payment, vendor, staff status
2. `SaveFeedback` - Saving/Saved/Error states
3. `IntelligenceCue` - Warning, info, danger alerts
4. `useSaveState` - Hook for save state management
5. Skeleton components for all page types

## Pending/Backlog
- Phase 4: Dashboard Intelligence widgets
- Phase 5: Quality & Safety validation
- Refactor server.py into modular routers

## Test Credentials
- Super Admin: super_admin@banquetos.com / superadmin123
- Tenant Admin: admin@mayurbanquet.com / admin123
- Reception: reception@mayurbanquet.com / reception123
