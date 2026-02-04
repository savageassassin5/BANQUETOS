"""
Test Multi-Tenant Data Isolation
Tests that MAYUR tenant sees 0 data (reset) and TAMASHA tenant sees their own data.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
MAYUR_TENANT = {"email": "admin@mayur.banquetos.com", "password": "admin123"}
TAMASHA_TENANT = {"email": "admin@mayurbanquet.com", "password": "admin123"}


class TestTenantAuthentication:
    """Test login for both tenants"""
    
    def test_mayur_tenant_login(self):
        """Test MAYUR tenant login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MAYUR_TENANT)
        print(f"MAYUR login response: {response.status_code}")
        assert response.status_code == 200, f"MAYUR login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == MAYUR_TENANT["email"]
        print(f"MAYUR tenant_id: {data['user'].get('tenant_id')}")
        print(f"MAYUR role: {data['user'].get('role')}")
        
    def test_tamasha_tenant_login(self):
        """Test TAMASHA tenant login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TAMASHA_TENANT)
        print(f"TAMASHA login response: {response.status_code}")
        assert response.status_code == 200, f"TAMASHA login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TAMASHA_TENANT["email"]
        print(f"TAMASHA tenant_id: {data['user'].get('tenant_id')}")
        print(f"TAMASHA role: {data['user'].get('role')}")


class TestMayurTenantDataIsolation:
    """Test MAYUR tenant sees 0 data (reset state)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as MAYUR tenant"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MAYUR_TENANT)
        assert response.status_code == 200, f"MAYUR login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.tenant_id = response.json()["user"].get("tenant_id")
        print(f"MAYUR tenant_id: {self.tenant_id}")
    
    def test_mayur_bookings_empty(self):
        """MAYUR tenant should see 0 bookings"""
        response = requests.get(f"{BASE_URL}/api/bookings", headers=self.headers)
        assert response.status_code == 200
        bookings = response.json()
        print(f"MAYUR bookings count: {len(bookings)}")
        assert len(bookings) == 0, f"MAYUR should have 0 bookings, got {len(bookings)}"
    
    def test_mayur_vendors_empty(self):
        """MAYUR tenant should see 0 vendors"""
        response = requests.get(f"{BASE_URL}/api/vendors", headers=self.headers)
        assert response.status_code == 200
        vendors = response.json()
        print(f"MAYUR vendors count: {len(vendors)}")
        assert len(vendors) == 0, f"MAYUR should have 0 vendors, got {len(vendors)}"
    
    def test_mayur_halls_empty(self):
        """MAYUR tenant should see 0 halls"""
        response = requests.get(f"{BASE_URL}/api/halls", headers=self.headers)
        assert response.status_code == 200
        halls = response.json()
        print(f"MAYUR halls count: {len(halls)}")
        assert len(halls) == 0, f"MAYUR should have 0 halls, got {len(halls)}"
    
    def test_mayur_customers_empty(self):
        """MAYUR tenant should see 0 customers"""
        response = requests.get(f"{BASE_URL}/api/customers", headers=self.headers)
        assert response.status_code == 200
        customers = response.json()
        print(f"MAYUR customers count: {len(customers)}")
        assert len(customers) == 0, f"MAYUR should have 0 customers, got {len(customers)}"


class TestTamashaTenantDataIsolation:
    """Test TAMASHA tenant sees their own data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as TAMASHA tenant"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TAMASHA_TENANT)
        assert response.status_code == 200, f"TAMASHA login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.tenant_id = response.json()["user"].get("tenant_id")
        print(f"TAMASHA tenant_id: {self.tenant_id}")
    
    def test_tamasha_bookings_exist(self):
        """TAMASHA tenant should see their bookings (expected ~9)"""
        response = requests.get(f"{BASE_URL}/api/bookings", headers=self.headers)
        assert response.status_code == 200
        bookings = response.json()
        print(f"TAMASHA bookings count: {len(bookings)}")
        # Should have some bookings (expected 9 based on context)
        assert len(bookings) > 0, f"TAMASHA should have bookings, got {len(bookings)}"
        print(f"TAMASHA booking IDs: {[b.get('booking_number', b.get('id')) for b in bookings[:5]]}")
    
    def test_tamasha_vendors_exist(self):
        """TAMASHA tenant should see their vendors (expected ~8)"""
        response = requests.get(f"{BASE_URL}/api/vendors", headers=self.headers)
        assert response.status_code == 200
        vendors = response.json()
        print(f"TAMASHA vendors count: {len(vendors)}")
        # Should have some vendors (expected 8 based on context)
        assert len(vendors) > 0, f"TAMASHA should have vendors, got {len(vendors)}"
        print(f"TAMASHA vendor names: {[v.get('name') for v in vendors[:5]]}")
    
    def test_tamasha_halls_exist(self):
        """TAMASHA tenant should see their halls (expected ~5)"""
        response = requests.get(f"{BASE_URL}/api/halls", headers=self.headers)
        assert response.status_code == 200
        halls = response.json()
        print(f"TAMASHA halls count: {len(halls)}")
        # Should have some halls (expected 5 based on context)
        assert len(halls) > 0, f"TAMASHA should have halls, got {len(halls)}"
        print(f"TAMASHA hall names: {[h.get('name') for h in halls]}")
    
    def test_tamasha_customers_exist(self):
        """TAMASHA tenant should see their customers"""
        response = requests.get(f"{BASE_URL}/api/customers", headers=self.headers)
        assert response.status_code == 200
        customers = response.json()
        print(f"TAMASHA customers count: {len(customers)}")
        # Should have some customers
        assert len(customers) > 0, f"TAMASHA should have customers, got {len(customers)}"


class TestPartyPlanningAccess:
    """Test Party Planning page access for TAMASHA tenant"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as TAMASHA tenant"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TAMASHA_TENANT)
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_confirmed_bookings_endpoint(self):
        """Test confirmed-bookings endpoint works"""
        response = requests.get(f"{BASE_URL}/api/confirmed-bookings", headers=self.headers)
        print(f"Confirmed bookings response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        bookings = response.json()
        print(f"Confirmed bookings count: {len(bookings)}")
        # Check if bookings have party plan info
        for b in bookings[:3]:
            print(f"  Booking {b.get('booking_number')}: has_party_plan={b.get('has_party_plan')}")
    
    def test_party_plan_by_booking(self):
        """Test getting party plan by booking ID"""
        # First get confirmed bookings
        response = requests.get(f"{BASE_URL}/api/confirmed-bookings", headers=self.headers)
        assert response.status_code == 200
        bookings = response.json()
        
        if len(bookings) > 0:
            booking_id = bookings[0]["id"]
            # Get party plan for this booking
            response = requests.get(f"{BASE_URL}/api/party-plans/by-booking/{booking_id}", headers=self.headers)
            print(f"Party plan response for {booking_id}: {response.status_code}")
            assert response.status_code == 200, f"Failed: {response.text}"
            data = response.json()
            print(f"  has_plan: {data.get('has_plan')}")
            print(f"  booking_number: {data.get('booking', {}).get('booking_number')}")
    
    def test_create_party_plan(self):
        """Test creating a party plan for a booking without one"""
        # First get confirmed bookings
        response = requests.get(f"{BASE_URL}/api/confirmed-bookings", headers=self.headers)
        assert response.status_code == 200
        bookings = response.json()
        
        # Find a booking without a party plan
        booking_without_plan = None
        for b in bookings:
            if not b.get('has_party_plan'):
                booking_without_plan = b
                break
        
        if booking_without_plan:
            print(f"Found booking without plan: {booking_without_plan.get('booking_number')}")
            # Try to create a party plan
            plan_data = {
                "booking_id": booking_without_plan["id"],
                "notes": "Test party plan",
                "staff_assignments": [],
                "vendor_assignments": []
            }
            response = requests.post(f"{BASE_URL}/api/party-plans", json=plan_data, headers=self.headers)
            print(f"Create party plan response: {response.status_code}")
            # Should succeed or already exist
            assert response.status_code in [200, 201, 400], f"Failed: {response.text}"
        else:
            print("All bookings already have party plans - skipping create test")
            # This is expected based on context


class TestCrossDataIsolation:
    """Test that tenants cannot see each other's data"""
    
    def test_mayur_cannot_see_tamasha_data(self):
        """MAYUR tenant should not see TAMASHA's data"""
        # Login as MAYUR
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MAYUR_TENANT)
        assert response.status_code == 200
        mayur_token = response.json()["token"]
        mayur_headers = {"Authorization": f"Bearer {mayur_token}"}
        
        # Login as TAMASHA to get their booking IDs
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TAMASHA_TENANT)
        assert response.status_code == 200
        tamasha_token = response.json()["token"]
        tamasha_headers = {"Authorization": f"Bearer {tamasha_token}"}
        
        # Get TAMASHA's bookings
        response = requests.get(f"{BASE_URL}/api/bookings", headers=tamasha_headers)
        assert response.status_code == 200
        tamasha_bookings = response.json()
        
        if len(tamasha_bookings) > 0:
            tamasha_booking_id = tamasha_bookings[0]["id"]
            # Try to access TAMASHA's booking as MAYUR
            response = requests.get(f"{BASE_URL}/api/bookings/{tamasha_booking_id}", headers=mayur_headers)
            print(f"MAYUR accessing TAMASHA booking: {response.status_code}")
            # Should return 404 (not found) due to tenant isolation
            assert response.status_code == 404, f"MAYUR should not see TAMASHA's booking, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
