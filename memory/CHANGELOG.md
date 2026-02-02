# BanquetOS Changelog

## [2.0.0] - 2026-02-02 - Multi-Tenant SaaS Platform

### Added
- **Phase A: Landing + Auth Flow**
  - Role-based login redirects (super_admin → /superadmin, others → /dashboard)
  - Route guards: ProtectedRoute, SuperAdminRoute, FeatureRoute
  - Tenant suspension check

- **Phase B: Multi-Tenant Core**
  - `tenants` collection with business_name, country, timezone, currency, status, plan_id, features_override
  - `plans` collection with feature flags
  - `tenant_id` field on all business collections (bookings, halls, menu_items, customers, vendors, payments, expenses)
  - Database indexes on tenant_id
  - JWT tokens include tenant_id

- **Phase C: Feature Flags**
  - 13 feature flags (bookings, calendar, halls, menu, customers, payments, enquiries, reports, vendors, analytics, notifications, expenses, party_planning)
  - Feature resolution: Plan → Tenant override → Effective features
  - `/api/auth/me` returns effective_features
  - Sidebar dynamically hides disabled features

- **Phase D: Super Admin Portal**
  - SuperAdminLayout component
  - Dashboard with stats cards (tenants, users, plans)
  - Tenants page with search, filter, CRUD
  - Plans page with feature toggles
  - Tenant detail page with feature overrides

- **Phase E: User Management**
  - List users per tenant
  - Create, update, delete tenant users
  - Enable/disable user accounts
  - Password reset functionality

- **Phase F: Party Planning**
  - Tenant-aware party expenses
  - Linked to bookings

- **Phase G: Advanced SaaS Foundations**
  - Audit logs (AuditLog model, /api/audit-logs)
  - Soft delete (is_deleted, deleted_at fields)
  - Restore capability (/api/bookings/:id/restore)
  - Booking conflict prevention (check_booking_conflict function)
  - Permission matrix (PERMISSION_MATRIX constant)
  - CSV exports (/api/export/bookings, /api/export/customers, /api/export/payments)

- **Phase H: Seed & Migration**
  - Seed script creates super_admin, 3 plans, demo tenant
  - Data migration endpoint (/api/superadmin/migrate-data)

### Changed
- User model: Added tenant_id, new roles (super_admin, tenant_admin)
- TokenResponse: Returns UserResponse with effective_features
- DashboardLayout: Filters sidebar by role AND features
- Login redirect logic based on user role

### Fixed
- Existing data migration to new tenant structure
- Old users without tenant_id assigned to demo tenant

---

## [1.5.0] - 2026-01-12 - Expenses & Menu Enhancements

### Added
- Expenses module booking lock flow
- Menu category management
- Advanced payment tracking

---

## [1.0.0] - 2026-01-09 - Initial Release

### Added
- Core booking management
- Hall, menu, customer, vendor management
- Payment tracking
- PDF invoice generation
- Calendar view
- Dashboard with analytics
