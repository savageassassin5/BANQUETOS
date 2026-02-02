# BanquetOS - Product Requirements Document

## Overview
BanquetOS is a multi-tenant SaaS platform for banquet hall management with an Elite Super Admin Control Plane.

## Completed Work (Feb 2026)

### ✅ Elite Super Admin Control Plane - COMPLETE

#### 1. Tenant Management
- Create/edit tenants with country selection (12 countries)
- Auto-configured timezone, currency, tax type per country

#### 2. Feature Flags (12 toggles)
- Bookings, Party Planner, Operations Checklist
- Vendors, Vendor Ledger, Staff Planning
- Profit Tracking, Reports, Advanced Reports
- Event Day Mode, Multi-Hall, Custom Fields

#### 3. Workflow Rules (7 rules)
- Advance Required (%)
- Vendors Mandatory Before Confirm
- Staff Mandatory Before Event
- Lock Editing Hours Before Event
- Discount Approval Required
- Profit Margin Warning (%)
- Vendor Unpaid Warning (Days)

#### 4. Role Permissions Matrix
- 6 roles: Owner, Manager, Reception, Accountant, Ops, Custom
- 11 permissions per role (view/edit bookings, profit, vendors, etc.)
- Grant All / Revoke All shortcuts

#### 5. Event Templates
- Default settings per event type (Wedding, Birthday, Corporate, etc.)
- Default advance %, profit target %

#### 6. Custom Fields (No-Code)
- Field types: Text, Number, Date, Dropdown
- Required/optional flag
- Role-based visibility

#### 7. UI Controls
- Tab visibility (Profit, Staff, Vendors, Checklist)
- Label customization (rename modules)
- Read-only modules

#### 8. Financial Controls
- Payment methods (Cash, UPI, Bank, Cheque, Card)
- Tax type & rate
- Discount limits per role
- Vendor advance requirements
- Rounding rules

#### 9. Data Governance
- Audit logs toggle
- Soft delete option
- Data export permissions
- Demo mode
- Data retention period
- Reset tenant data (with confirmation)

#### 10. Config Versioning
- Version tracking per config change
- Rollback to previous versions
- Last 10 versions stored

### Backend Schema: `tenant_config`
```javascript
{
  tenant_id: string,
  version: number,
  last_updated: datetime,
  country: string,
  timezone: string,
  currency: string,
  feature_flags: { bookings: bool, ... },
  workflow_rules: { advance_required_percent: int, ... },
  permissions: { owner: {...}, manager: {...}, ... },
  event_templates: [...],
  custom_fields: [...],
  ui_visibility: {...},
  financial_controls: {...},
  data_governance: {...},
  previous_versions: [...]
}
```

### API Endpoints Added
- `GET /api/superadmin/countries` - Country configs
- `GET /api/superadmin/tenants/:id/config` - Get tenant config
- `PUT /api/superadmin/tenants/:id/config` - Update config
- `PUT /api/superadmin/tenants/:id/config/feature-flags` - Quick flag update
- `PUT /api/superadmin/tenants/:id/config/workflow-rules` - Quick rules update
- `PUT /api/superadmin/tenants/:id/config/permissions` - Update permissions
- `GET /api/superadmin/tenants/:id/config/versions` - Version history
- `POST /api/superadmin/tenants/:id/config/rollback` - Rollback config
- `POST /api/superadmin/tenants/:id/reset-data` - Reset tenant data
- `GET /api/config/sync` - Tenant app config sync
- `GET /api/config/check-version` - Check for updates

### Frontend Pages Created
- `/superadmin/feature-flags`
- `/superadmin/workflow-rules`
- `/superadmin/permissions`
- `/superadmin/templates`
- `/superadmin/custom-fields`
- `/superadmin/ui-controls`
- `/superadmin/financial`
- `/superadmin/data-governance`

### Key Principles Enforced
✅ Super Admin NEVER edits tenant data directly
✅ All changes are CONFIG-DRIVEN
✅ Version-based sync for instant propagation
✅ Complete tenant isolation (tenant_id in every query)
✅ Rollback support for safety

---

## Test Credentials
- Super Admin: superadmin@banquetos.com / superadmin123
- Tenant Admin: admin@mayurbanquet.com / admin123

## Country Configurations (12 Supported)
| Country | Timezone | Currency | Tax Type |
|---------|----------|----------|----------|
| India | Asia/Kolkata | INR (₹) | GST 18% |
| UAE | Asia/Dubai | AED | VAT 5% |
| USA | America/New_York | USD ($) | None |
| UK | Europe/London | GBP (£) | VAT 20% |
| Canada | America/Toronto | CAD ($) | GST 5% |
| Australia | Australia/Sydney | AUD ($) | GST 10% |
| Singapore | Asia/Singapore | SGD ($) | GST 9% |
| Saudi Arabia | Asia/Riyadh | SAR | VAT 15% |
| Malaysia | Asia/Kuala_Lumpur | MYR (RM) | SST 6% |
| Indonesia | Asia/Jakarta | IDR (Rp) | VAT 11% |
| Philippines | Asia/Manila | PHP (₱) | VAT 12% |
| Qatar | Asia/Qatar | QAR | None |
