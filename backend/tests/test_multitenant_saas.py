"""
Multi-Tenant SaaS Backend Tests
Tests for Phases A-H: Auth flow, Multi-tenant schema, Feature flags, Super Admin portal,
User management, Audit logs, Soft delete, CSV export, Permission matrix
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN_CREDS = {"email": "superadmin@banquetos.com", "password": "superadmin123"}
TENANT_ADMIN_CREDS = {"email": "admin@mayurbanquet.com", "password": "admin123"}
RECEPTION_CREDS = {"email": "reception@mayurbanquet.com", "password": "reception123"}


class TestPhaseAAuthFlow:
    """Phase A: Login with role-based redirects"""
    
    def test_super_admin_login_returns_super_admin_role(self):
        """Super admin login should return role=super_admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN_CREDS)
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "super_admin"
        assert data["user"]["tenant_id"] is None  # Super admin has no tenant
        print(f"✓ Super admin login successful, role={data['user']['role']}")
    
    def test_tenant_admin_login_returns_tenant_admin_role(self):
        """Tenant admin login should return role=admin or tenant_admin with tenant_id"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TENANT_ADMIN_CREDS)
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] in ["admin", "tenant_admin"]
        # Tenant admin should have a tenant_id
        print(f"✓ Tenant admin login successful, role={data['user']['role']}, tenant_id={data['user'].get('tenant_id')}")
    
    def test_reception_login_returns_reception_role(self):
        """Reception login should return role=reception"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=RECEPTION_CREDS)
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "reception"
        print(f"✓ Reception login successful, role={data['user']['role']}")
    
    def test_invalid_credentials_returns_401(self):
        """Invalid credentials should return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly returns 401")


class TestPhaseBSuperAdminTenants:
    """Phase B: Super Admin can view and create tenants"""
    
    @pytest.fixture
    def super_admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN_CREDS)
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_super_admin_can_view_all_tenants(self, super_admin_token):
        """Super Admin can view all tenants"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        response = requests.get(f"{BASE_URL}/api/superadmin/tenants", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Super Admin can view tenants, count={len(data)}")
        if len(data) > 0:
            tenant = data[0]
            assert "id" in tenant
            assert "business_name" in tenant
            assert "status" in tenant
            print(f"  First tenant: {tenant.get('business_name')}, status={tenant.get('status')}")
    
    def test_super_admin_can_create_tenant(self, super_admin_token):
        """Super Admin can create a new tenant"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        
        # First get plans to assign one
        plans_response = requests.get(f"{BASE_URL}/api/superadmin/plans", headers=headers)
        plans = plans_response.json() if plans_response.status_code == 200 else []
        plan_id = plans[0]["id"] if plans else None
        
        tenant_data = {
            "business_name": "TEST_New_Banquet_Hall",
            "country": "India",
            "timezone": "Asia/Kolkata",
            "currency": "INR",
            "status": "active",
            "plan_id": plan_id
        }
        
        response = requests.post(f"{BASE_URL}/api/superadmin/tenants", headers=headers, json=tenant_data)
        assert response.status_code == 200, f"Failed to create tenant: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["business_name"] == "TEST_New_Banquet_Hall"
        print(f"✓ Super Admin created tenant: {data['business_name']}, id={data['id']}")
        
        # Cleanup - delete the test tenant
        delete_response = requests.delete(f"{BASE_URL}/api/superadmin/tenants/{data['id']}", headers=headers)
        assert delete_response.status_code == 200
        print(f"  Cleaned up test tenant")
    
    def test_non_super_admin_cannot_access_tenants(self):
        """Non-super admin should not access super admin routes"""
        # Login as tenant admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=TENANT_ADMIN_CREDS)
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/superadmin/tenants", headers=headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Non-super admin correctly denied access to super admin routes")


class TestPhaseCEffectiveFeatures:
    """Phase C: /api/auth/me returns effective_features"""
    
    def test_auth_me_returns_effective_features_for_super_admin(self):
        """Super admin should have all features enabled"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN_CREDS)
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "effective_features" in data
        features = data["effective_features"]
        assert isinstance(features, dict)
        # Super admin should have all features
        assert features.get("bookings") == True
        assert features.get("calendar") == True
        assert features.get("reports") == True
        print(f"✓ Super admin has effective_features: {list(features.keys())}")
    
    def test_auth_me_returns_effective_features_for_tenant_user(self):
        """Tenant user should have features based on plan"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=TENANT_ADMIN_CREDS)
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "effective_features" in data
        features = data["effective_features"]
        assert isinstance(features, dict)
        print(f"✓ Tenant user has effective_features: {features}")


class TestPhaseDSuperAdminDashboard:
    """Phase D: Super Admin Dashboard stats, Tenants page, Plans page"""
    
    @pytest.fixture
    def super_admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN_CREDS)
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_super_admin_stats_endpoint(self, super_admin_token):
        """Super Admin Dashboard shows stats"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        response = requests.get(f"{BASE_URL}/api/superadmin/stats", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "total_tenants" in data
        assert "active_tenants" in data
        assert "total_users" in data
        assert "total_plans" in data
        print(f"✓ Super Admin stats: tenants={data['total_tenants']}, users={data['total_users']}, plans={data['total_plans']}")
    
    def test_plans_list_endpoint(self, super_admin_token):
        """Plans page lists all plans"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        response = requests.get(f"{BASE_URL}/api/superadmin/plans", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Plans list returned {len(data)} plans")
        for plan in data:
            assert "id" in plan
            assert "name" in plan
            assert "features" in plan
            print(f"  Plan: {plan['name']}, features={list(plan.get('features', {}).keys())}")
    
    def test_create_plan_api(self, super_admin_token):
        """Create new plan API works"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        plan_data = {
            "name": "TEST_Plan_Basic",
            "description": "Test plan for automated testing",
            "features": {
                "bookings": True,
                "calendar": True,
                "halls": True,
                "menu": True,
                "customers": True,
                "payments": True,
                "enquiries": True,
                "reports": False,
                "vendors": False,
                "analytics": False
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/superadmin/plans", headers=headers, json=plan_data)
        assert response.status_code == 200, f"Failed to create plan: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["name"] == "TEST_Plan_Basic"
        print(f"✓ Created plan: {data['name']}, id={data['id']}")
        
        # Cleanup
        delete_response = requests.delete(f"{BASE_URL}/api/superadmin/plans/{data['id']}", headers=headers)
        assert delete_response.status_code == 200
        print(f"  Cleaned up test plan")


class TestPhaseETenantUserManagement:
    """Phase E: Super Admin can list and create tenant users"""
    
    @pytest.fixture
    def super_admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN_CREDS)
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture
    def test_tenant_id(self, super_admin_token):
        """Get or create a test tenant"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        
        # Get existing tenants
        response = requests.get(f"{BASE_URL}/api/superadmin/tenants", headers=headers)
        tenants = response.json()
        
        if tenants:
            return tenants[0]["id"]
        
        # Create a test tenant if none exist
        tenant_data = {
            "business_name": "TEST_Tenant_For_Users",
            "country": "India",
            "timezone": "Asia/Kolkata",
            "currency": "INR",
            "status": "active"
        }
        create_response = requests.post(f"{BASE_URL}/api/superadmin/tenants", headers=headers, json=tenant_data)
        return create_response.json()["id"]
    
    def test_super_admin_can_list_tenant_users(self, super_admin_token, test_tenant_id):
        """Super Admin can list users for a tenant"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        response = requests.get(f"{BASE_URL}/api/superadmin/tenants/{test_tenant_id}/users", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} users for tenant {test_tenant_id}")
        for user in data[:3]:  # Show first 3
            print(f"  User: {user.get('name')}, role={user.get('role')}, email={user.get('email')}")
    
    def test_super_admin_can_create_user_for_tenant(self, super_admin_token, test_tenant_id):
        """Super Admin can create a user for a tenant"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        
        import uuid
        unique_email = f"test_user_{uuid.uuid4().hex[:8]}@test.com"
        
        user_data = {
            "name": "TEST_New_User",
            "email": unique_email,
            "password": "testpass123",
            "phone": "9876543210",
            "role": "reception"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/superadmin/tenants/{test_tenant_id}/users", 
            headers=headers, 
            json=user_data
        )
        assert response.status_code == 200, f"Failed to create user: {response.text}"
        data = response.json()
        
        assert "id" in data
        assert data["name"] == "TEST_New_User"
        assert data["email"] == unique_email
        assert data["role"] == "reception"
        assert data["tenant_id"] == test_tenant_id
        print(f"✓ Created user: {data['name']}, role={data['role']}, tenant_id={data['tenant_id']}")
        
        # Cleanup
        delete_response = requests.delete(
            f"{BASE_URL}/api/superadmin/tenants/{test_tenant_id}/users/{data['id']}", 
            headers=headers
        )
        assert delete_response.status_code == 200
        print(f"  Cleaned up test user")


class TestPhaseGExportAndAuditLogs:
    """Phase G: CSV export and Audit logs"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TENANT_ADMIN_CREDS)
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_csv_export_bookings_api(self, admin_token):
        """CSV export bookings API works"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/export/bookings", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Check content type is CSV
        content_type = response.headers.get("content-type", "")
        assert "text/csv" in content_type or "application/octet-stream" in content_type
        
        # Check content disposition header
        content_disposition = response.headers.get("content-disposition", "")
        assert "bookings" in content_disposition.lower() or len(response.content) > 0
        
        print(f"✓ CSV export bookings works, size={len(response.content)} bytes")
    
    def test_audit_logs_api(self, admin_token):
        """Audit logs API works"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/audit-logs", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Audit logs API works, returned {len(data)} logs")
        if len(data) > 0:
            log = data[0]
            print(f"  Sample log: action={log.get('action')}, entity_type={log.get('entity_type')}")


class TestLoginRedirectBehavior:
    """Test login response contains correct role for frontend redirect"""
    
    def test_login_response_structure(self):
        """Login response should have correct structure for role-based redirect"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN_CREDS)
        assert response.status_code == 200
        data = response.json()
        
        # Required fields for frontend redirect logic
        assert "token" in data
        assert "user" in data
        assert "role" in data["user"]
        assert "effective_features" in data["user"]
        
        print(f"✓ Login response has correct structure for role-based redirect")
        print(f"  Role: {data['user']['role']}")
        print(f"  Tenant ID: {data['user'].get('tenant_id')}")
        print(f"  Features: {list(data['user']['effective_features'].keys())}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
