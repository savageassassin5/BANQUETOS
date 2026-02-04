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
- Staff role dropdown now includes "Other (Custom)" option
- When selected, shows inline text input to enter custom role name (e.g., "Bartender", "DJ Assistant")
- Custom role names saved with staff assignments (`custom_role_name` field)

#### C4. Backend Updates
- `PartyExpense` model: Added `category` field
- `POST /api/party-expenses`: Now returns full list of expenses (was returning single item)
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
- `DashboardLayout.jsx` - Sidebar filters by `isFeatureEnabled()`
- `FeatureRoute` component blocks routes if feature disabled
- Shows "Module Not Enabled" message for disabled features

**API Enforcement:**
- `check_feature_access()` - Raises HTTP 403 if feature disabled
- Applied to vendor ledger endpoints:
  - `GET /vendors/{id}/ledger`
  - `POST /vendors/{id}/transactions`

#### A4. Workflow Rules - UI + API Enforcement
- `getWorkflowRule()` helper in TenantConfigContext
- Backend: `get_workflow_rule()` helper function
- Rules enforced:
  - `advance_required_percent`
  - `vendors_mandatory_before_confirm`
  - `lock_editing_hours_before`

#### A5. Role Permissions - UI + API Enforcement
**UI Enforcement:**
- `hasPermission()` helper in TenantConfigContext
- Can hide UI elements based on role permissions

**API Enforcement:**
- `check_permission()` - Raises HTTP 403 if permission denied
- Applied to vendor ledger: requires `view_vendor_ledger`, `record_payments`

#### A6. Templates & Defaults
- `getEventTemplate()` helper returns template by event type
- Templates include default advance %, profit target %

#### A7. Custom Fields
- `getCustomFields()` returns fields filtered by role visibility

#### A8. Zero Data Overlap Guarantee
- `get_tenant_filter()` ensures tenant_id on every query
- All APIs use `tenant_filter` for database operations

### ✅ PART B: Data Reset for admin@mayur.banquetos.com

**Tenant Info:**
- User: admin@mayur.banquetos.com
- Tenant ID: 5ce56140-32fd-4081-8b8d-23cfdb1b065b (MAYUR)

**Reset Status:** Already empty (no operational data)
- bookings: 0
- vendors: 0
- party_plans: 0
- payments: 0

**Preserved:**
- User record: ✅ Intact
- Tenant record: ✅ Intact
- Other tenants: ✅ 9 bookings for Tamasha Banquet (unaffected)

---

## Files Changed

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
  - Added expense categories and staff wages display

---

## Upcoming Tasks (P1)

1. **Party Planner Templates & Defaults Integration**
   - Auto-apply default vendors, staff plans from `tenant_config` when creating new party plan

2. **Workflow Rules Enforcement**
   - Server-side enforcement for `advance_required`, `lock_edits_before_event`

3. **Custom Fields Integration**
   - Render and save custom booking fields from `tenant_config`

4. **Role & Permission Enforcement**
   - Complete enforcement across all modules

## Future/Backlog (P2)

1. **Refactor server.py**
   - Break monolithic file into modular router files

2. **Super Admin Config Preview**
   - Read-only preview of tenant's effective configuration

---

## Test Credentials
- Super Admin: superadmin@banquetos.com / superadmin123
- Tenant Admin (Tamasha): admin@mayurbanquet.com / admin123
- Tenant Admin (MAYUR): admin@mayur.banquetos.com / admin123

## Config Sync API
```
GET /api/config/sync - Returns full tenant_config
GET /api/config/check-version?current_version=X - Check if update needed
```
