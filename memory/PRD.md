# BanquetOS - Product Requirements Document

## Overview
BanquetOS is a multi-tenant SaaS with Elite Super Admin Control Plane and CONFIG-DRIVEN tenant apps.

## Completed (Feb 2026)

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
  - Added `get_tenant_config()` helper (line 918)
  - Updated `get_effective_features()` to use tenant_config (line 925)
  - Added `check_feature_access()` for API enforcement (line 965)
  - Added `check_permission()` for role-based API enforcement (line 980)
  - Added `get_workflow_rule()` helper (line 1000)
  - Renamed duplicate function to `get_tenant_config_api()` (line 4343)
  - Added feature/permission checks to vendor ledger endpoints (lines 3351, 3398)

### Frontend
- `/app/frontend/src/context/TenantConfigContext.js` - NEW
  - Config fetching and caching
  - `isFeatureEnabled()`, `hasPermission()`, `getWorkflowRule()`
  - Version-based polling for sync
  
- `/app/frontend/src/App.js`:
  - Wrapped app with `TenantConfigProvider`
  - Updated `FeatureRoute` to use TenantConfigContext
  
- `/app/frontend/src/components/DashboardLayout.jsx`:
  - Import `useTenantConfig`
  - Filter sidebar by `isFeatureEnabled()`
  - Support for dynamic labels via `getLabel()`

---

## Enforcement Points Summary

| Area | UI Enforcement | API Enforcement |
|------|---------------|-----------------|
| Feature Flags | DashboardLayout sidebar, FeatureRoute | check_feature_access() |
| Permissions | hasPermission() hooks | check_permission() |
| Workflow Rules | getWorkflowRule() | get_workflow_rule() |

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
