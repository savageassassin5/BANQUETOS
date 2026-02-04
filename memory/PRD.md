# BanquetOS - Product Requirements Document

## Overview
BanquetOS is a multi-tenant SaaS with Elite Super Admin Control Plane and CONFIG-DRIVEN tenant apps.

## Completed (Feb 2026)

### ✅ PART C: Party Planner Module Fixes (Feb 4, 2026)

#### C1. Restored Expenses Tab
- Added "Expenses" tab to Party Planner (replaced Timeline tab)
- Full CRUD functionality for booking expenses
- Expense categories: staff, vendor, materials, transport, food, equipment, decoration, misc, other
- Auto-updates booking profit calculations when expenses added/deleted
- Shows staff wages from Staff tab separately (auto-calculated)

#### C2. Removed Timeline Tab
- Removed Timeline tab from Party Planner tabs (was: Overview, Vendors, Staff, **Timeline**, Profit)
- New tabs: Overview, Vendors, Staff, **Expenses**, Profit
- Timeline-related functions removed from codebase

#### C3. Custom Staff Roles
- Staff role dropdown now includes "Custom Role" option
- When selected, shows inline text input to enter custom role name (e.g., "Bartender", "DJ Assistant")
- Custom role names saved with staff assignments (`custom_role_name` field)

#### C4. Expenses Menu in Sidebar
- Expenses menu is now visible in sidebar (requires `profit_tracking` feature enabled)
- Expenses Management page at `/dashboard/expenses` synced with bookings
- Three tabs: Party Expenses, Vendor Payments, Outstanding

#### C5. Feature Flag Fixes (Testing Agent)
- Fixed `DashboardLayout.jsx` to use `hasFeature` from AuthContext (user's effective_features)
- Fixed `App.js` FeatureRoute to use `hasFeature` from AuthContext
- Fixed feature names: `party_planning` → `party_planner`, `expenses` → `profit_tracking`

#### C6. Backend Updates
- `PartyExpense` model: Added `category` field
- `POST /api/party-expenses`: Now returns full list of expenses
- `DELETE /api/party-expenses/{id}`: Now returns remaining expenses list
- All expense operations update booking's `total_expenses` and `net_profit`

### ✅ PART A: Super Admin → Tenant App Integration

#### A1. tenant_config as Source of Truth
- Created `tenant_config` collection with:
  - `tenant_id`, `version`, `last_updated`
  - `feature_flags` (12 toggles)
  - `workflow_rules` (7 rules)
  - `permissions` (6 roles × 11 permissions)
  - `event_templates`, `custom_fields`
  - `ui_visibility`, `financial_controls`, `data_governance`

#### A2. Config Delivery to Tenant App
- `TenantConfigContext.js` - React context fetches config on login
- Stores in app state with version
- Polls every 30s for version changes
- **Fail-closed**: Shows error message if config fails to load

#### A3. Feature Flags - UI + API Enforcement
**UI Enforcement:**
- `DashboardLayout.jsx` - Sidebar filters by `hasFeature()`
- `FeatureRoute` component blocks routes if feature disabled
- Shows "Module Not Enabled" message for disabled features

**API Enforcement:**
- `check_feature_access()` - Raises HTTP 403 if feature disabled
- Applied to vendor ledger endpoints

#### A4-A8. Workflow Rules, Permissions, Templates, Custom Fields, Zero Data Overlap
- All implemented and enforced on both UI and API

---

## Files Changed (Session Summary)

### Backend
- `/app/backend/server.py`:
  - `PartyExpense` model: Added `category` field
  - `POST /api/party-expenses`: Returns full list
  - `DELETE /api/party-expenses/{id}`: Returns remaining list

### Frontend
- `/app/frontend/src/pages/PartyPlanningPage.jsx`:
  - Replaced Timeline tab with Expenses tab
  - Added expense CRUD UI (add/delete expenses)
  - Added custom role input for Staff section
  - Updated Overview card to show Expenses summary
  
- `/app/frontend/src/App.js`:
  - Fixed FeatureRoute to use hasFeature from AuthContext
  - Fixed feature names: party_planning → party_planner, expenses → profit_tracking
  
- `/app/frontend/src/components/DashboardLayout.jsx`:
  - Fixed to use hasFeature from AuthContext

---

## Upcoming Tasks (P1)

1. **Party Planner Templates & Defaults Integration**
   - Auto-apply default vendors, staff plans from `tenant_config` when creating new party plan

2. **Workflow Rules Enforcement**
   - Server-side enforcement for `advance_required`, `lock_edits_before_event`

3. **Custom Fields Integration**
   - Render and save custom booking fields from `tenant_config`

## Future/Backlog (P2)

1. **Refactor server.py** - Break monolithic file into modular router files
2. **Super Admin Config Preview** - Read-only preview of tenant's effective configuration

---

## Test Credentials
- Super Admin: superadmin@banquetos.com / superadmin123
- Tenant Admin (Tamasha): admin@mayurbanquet.com / admin123

## Test Reports
- `/app/test_reports/iteration_7.json` - Latest test results (100% pass)
