"""
Test Multi-Tenant CRUD Operations
Tests that Create Hall, Create Customer, Create Booking all set tenant_id correctly.
Tests that GET operations return only tenant's data.
Tests data isolation between MAYUR and TAMASHA tenants.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
MAYUR_TENANT = {"email": "admin@mayur.banquetos.com", "password": "admin123"}
TAMASHA_TENANT = {"email": "admin@mayurbanquet.com", "password": "admin123"}


class TestMayurTenantCRUD:
    """Test CRUD operations for MAYUR tenant - Create Hall, Customer, Booking with tenant_id"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as MAYUR tenant"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MAYUR_TENANT)
        assert response.status_code == 200, f"MAYUR login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.tenant_id = response.json()["user"].get("tenant_id")
        print(f"\nMAYUR tenant_id: {self.tenant_id}")
    
    def test_01_create_hall_with_tenant_id(self):
        """Test creating a hall sets tenant_id correctly"""
        hall_data = {
            "name": f"TEST_Hall_{uuid.uuid4().hex[:6]}",
            "capacity": 200,
            "price_per_day": 50000,
            "price_per_event": 75000,
            "price_per_plate": 500,
            "description": "Test hall for MAYUR tenant",
            "amenities": ["AC", "Parking"],
            "color": "#6366f1"
        }
        
        response = requests.post(f"{BASE_URL}/api/halls", json=hall_data, headers=self.headers)
        print(f"Create hall response: {response.status_code}")
        print(f"Response body: {response.text[:500]}")
        
        assert response.status_code in [200, 201], f"Failed to create hall: {response.text}"
        
        created_hall = response.json()
        assert "id" in created_hall, "Hall should have an ID"
        assert created_hall.get("tenant_id") == self.tenant_id, f"Hall tenant_id should be {self.tenant_id}, got {created_hall.get('tenant_id')}"
        assert created_hall.get("name") == hall_data["name"], "Hall name should match"
        
        # Store for later tests
        self.__class__.created_hall_id = created_hall["id"]
        print(f"Created hall ID: {created_hall['id']}, tenant_id: {created_hall.get('tenant_id')}")
        
    def test_02_create_customer_with_tenant_id(self):
        """Test creating a customer sets tenant_id correctly"""
        customer_data = {
            "name": f"TEST_Customer_{uuid.uuid4().hex[:6]}",
            "email": f"test_{uuid.uuid4().hex[:6]}@example.com",
            "phone": "9876543210",
            "address": "Test Address"
        }
        
        response = requests.post(f"{BASE_URL}/api/customers", json=customer_data, headers=self.headers)
        print(f"Create customer response: {response.status_code}")
        print(f"Response body: {response.text[:500]}")
        
        assert response.status_code in [200, 201], f"Failed to create customer: {response.text}"
        
        created_customer = response.json()
        assert "id" in created_customer, "Customer should have an ID"
        assert created_customer.get("tenant_id") == self.tenant_id, f"Customer tenant_id should be {self.tenant_id}, got {created_customer.get('tenant_id')}"
        assert created_customer.get("name") == customer_data["name"], "Customer name should match"
        
        # Store for later tests
        self.__class__.created_customer_id = created_customer["id"]
        print(f"Created customer ID: {created_customer['id']}, tenant_id: {created_customer.get('tenant_id')}")
    
    def test_03_create_booking_with_tenant_id(self):
        """Test creating a booking sets tenant_id correctly - requires customer_id and hall_id"""
        # Use the hall and customer created in previous tests
        hall_id = getattr(self.__class__, 'created_hall_id', None)
        customer_id = getattr(self.__class__, 'created_customer_id', None)
        
        if not hall_id or not customer_id:
            # If previous tests didn't run, get existing data
            halls_response = requests.get(f"{BASE_URL}/api/halls", headers=self.headers)
            customers_response = requests.get(f"{BASE_URL}/api/customers", headers=self.headers)
            
            halls = halls_response.json()
            customers = customers_response.json()
            
            if not halls or not customers:
                pytest.skip("No halls or customers available for booking test")
            
            hall_id = halls[0]["id"]
            customer_id = customers[0]["id"]
        
        booking_data = {
            "customer_id": customer_id,
            "hall_id": hall_id,
            "event_type": "wedding",
            "event_date": "2025-03-15",
            "slot": "day",
            "guest_count": 150,
            "menu_items": [],
            "addons": [],
            "special_requests": "Test booking for MAYUR tenant"
        }
        
        response = requests.post(f"{BASE_URL}/api/bookings", json=booking_data, headers=self.headers)
        print(f"Create booking response: {response.status_code}")
        print(f"Response body: {response.text[:500]}")
        
        assert response.status_code in [200, 201], f"Failed to create booking: {response.text}"
        
        created_booking = response.json()
        assert "id" in created_booking, "Booking should have an ID"
        assert created_booking.get("tenant_id") == self.tenant_id, f"Booking tenant_id should be {self.tenant_id}, got {created_booking.get('tenant_id')}"
        assert created_booking.get("customer_id") == customer_id, "Booking customer_id should match"
        assert created_booking.get("hall_id") == hall_id, "Booking hall_id should match"
        
        # Store for later tests
        self.__class__.created_booking_id = created_booking["id"]
        print(f"Created booking ID: {created_booking['id']}, tenant_id: {created_booking.get('tenant_id')}")
    
    def test_04_get_halls_returns_only_tenant_halls(self):
        """Test GET /api/halls returns only MAYUR tenant's halls"""
        response = requests.get(f"{BASE_URL}/api/halls", headers=self.headers)
        assert response.status_code == 200
        
        halls = response.json()
        print(f"MAYUR halls count: {len(halls)}")
        
        # All halls should belong to MAYUR tenant
        for hall in halls:
            assert hall.get("tenant_id") == self.tenant_id, f"Hall {hall.get('name')} has wrong tenant_id: {hall.get('tenant_id')}"
        
        print(f"All {len(halls)} halls belong to MAYUR tenant")
    
    def test_05_get_customers_returns_only_tenant_customers(self):
        """Test GET /api/customers returns only MAYUR tenant's customers"""
        response = requests.get(f"{BASE_URL}/api/customers", headers=self.headers)
        assert response.status_code == 200
        
        customers = response.json()
        print(f"MAYUR customers count: {len(customers)}")
        
        # All customers should belong to MAYUR tenant
        for customer in customers:
            assert customer.get("tenant_id") == self.tenant_id, f"Customer {customer.get('name')} has wrong tenant_id: {customer.get('tenant_id')}"
        
        print(f"All {len(customers)} customers belong to MAYUR tenant")
    
    def test_06_get_bookings_returns_only_tenant_bookings(self):
        """Test GET /api/bookings returns only MAYUR tenant's bookings"""
        response = requests.get(f"{BASE_URL}/api/bookings", headers=self.headers)
        assert response.status_code == 200
        
        bookings = response.json()
        print(f"MAYUR bookings count: {len(bookings)}")
        
        # All bookings should belong to MAYUR tenant
        for booking in bookings:
            assert booking.get("tenant_id") == self.tenant_id, f"Booking {booking.get('booking_number')} has wrong tenant_id: {booking.get('tenant_id')}"
        
        print(f"All {len(bookings)} bookings belong to MAYUR tenant")


class TestTamashaTenantCRUD:
    """Test CRUD operations for TAMASHA tenant - verify data isolation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as TAMASHA tenant"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TAMASHA_TENANT)
        assert response.status_code == 200, f"TAMASHA login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.tenant_id = response.json()["user"].get("tenant_id")
        print(f"\nTAMASHA tenant_id: {self.tenant_id}")
    
    def test_01_tamasha_cannot_see_mayur_halls(self):
        """TAMASHA tenant should not see MAYUR's halls"""
        response = requests.get(f"{BASE_URL}/api/halls", headers=self.headers)
        assert response.status_code == 200
        
        halls = response.json()
        print(f"TAMASHA halls count: {len(halls)}")
        
        # All halls should belong to TAMASHA tenant
        for hall in halls:
            assert hall.get("tenant_id") == self.tenant_id, f"Hall {hall.get('name')} has wrong tenant_id: {hall.get('tenant_id')}"
            # Should not see TEST_ halls from MAYUR
            assert not hall.get("name", "").startswith("TEST_"), f"TAMASHA should not see MAYUR's TEST_ hall: {hall.get('name')}"
        
        print(f"All {len(halls)} halls belong to TAMASHA tenant")
    
    def test_02_tamasha_cannot_see_mayur_customers(self):
        """TAMASHA tenant should not see MAYUR's customers"""
        response = requests.get(f"{BASE_URL}/api/customers", headers=self.headers)
        assert response.status_code == 200
        
        customers = response.json()
        print(f"TAMASHA customers count: {len(customers)}")
        
        # All customers should belong to TAMASHA tenant
        for customer in customers:
            assert customer.get("tenant_id") == self.tenant_id, f"Customer {customer.get('name')} has wrong tenant_id: {customer.get('tenant_id')}"
            # Should not see TEST_ customers from MAYUR
            assert not customer.get("name", "").startswith("TEST_"), f"TAMASHA should not see MAYUR's TEST_ customer: {customer.get('name')}"
        
        print(f"All {len(customers)} customers belong to TAMASHA tenant")
    
    def test_03_tamasha_cannot_see_mayur_bookings(self):
        """TAMASHA tenant should not see MAYUR's bookings"""
        response = requests.get(f"{BASE_URL}/api/bookings", headers=self.headers)
        assert response.status_code == 200
        
        bookings = response.json()
        print(f"TAMASHA bookings count: {len(bookings)}")
        
        # All bookings should belong to TAMASHA tenant
        for booking in bookings:
            assert booking.get("tenant_id") == self.tenant_id, f"Booking {booking.get('booking_number')} has wrong tenant_id: {booking.get('tenant_id')}"
        
        print(f"All {len(bookings)} bookings belong to TAMASHA tenant")


class TestCalendarTenantIsolation:
    """Test calendar shows bookings for current tenant only"""
    
    def test_mayur_calendar_shows_only_mayur_bookings(self):
        """MAYUR tenant calendar should show only MAYUR's bookings"""
        # Login as MAYUR
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MAYUR_TENANT)
        assert response.status_code == 200
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        tenant_id = response.json()["user"].get("tenant_id")
        
        # Get calendar data (bookings endpoint is used for calendar)
        response = requests.get(f"{BASE_URL}/api/bookings", headers=headers)
        assert response.status_code == 200
        
        bookings = response.json()
        print(f"MAYUR calendar bookings: {len(bookings)}")
        
        # All bookings should belong to MAYUR tenant
        for booking in bookings:
            assert booking.get("tenant_id") == tenant_id, f"Calendar booking has wrong tenant_id"
    
    def test_tamasha_calendar_shows_only_tamasha_bookings(self):
        """TAMASHA tenant calendar should show only TAMASHA's bookings"""
        # Login as TAMASHA
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TAMASHA_TENANT)
        assert response.status_code == 200
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        tenant_id = response.json()["user"].get("tenant_id")
        
        # Get calendar data
        response = requests.get(f"{BASE_URL}/api/bookings", headers=headers)
        assert response.status_code == 200
        
        bookings = response.json()
        print(f"TAMASHA calendar bookings: {len(bookings)}")
        
        # All bookings should belong to TAMASHA tenant
        for booking in bookings:
            assert booking.get("tenant_id") == tenant_id, f"Calendar booking has wrong tenant_id"


class TestAllFeaturesEnabled:
    """Test that all features are enabled (no Module Not Enabled errors)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as MAYUR tenant"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MAYUR_TENANT)
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.effective_features = response.json()["user"].get("effective_features", {})
        print(f"\nMAYUR effective_features: {self.effective_features}")
    
    def test_bookings_feature_enabled(self):
        """Test bookings feature is enabled"""
        assert self.effective_features.get("bookings") == True, "Bookings feature should be enabled"
        
        # Test endpoint works
        response = requests.get(f"{BASE_URL}/api/bookings", headers=self.headers)
        assert response.status_code == 200, f"Bookings endpoint failed: {response.text}"
        print("Bookings feature: ENABLED")
    
    def test_halls_feature_enabled(self):
        """Test halls feature is enabled"""
        assert self.effective_features.get("halls") == True, "Halls feature should be enabled"
        
        response = requests.get(f"{BASE_URL}/api/halls", headers=self.headers)
        assert response.status_code == 200, f"Halls endpoint failed: {response.text}"
        print("Halls feature: ENABLED")
    
    def test_customers_feature_enabled(self):
        """Test customers feature is enabled"""
        assert self.effective_features.get("customers") == True, "Customers feature should be enabled"
        
        response = requests.get(f"{BASE_URL}/api/customers", headers=self.headers)
        assert response.status_code == 200, f"Customers endpoint failed: {response.text}"
        print("Customers feature: ENABLED")
    
    def test_vendors_feature_enabled(self):
        """Test vendors feature is enabled"""
        assert self.effective_features.get("vendors") == True, "Vendors feature should be enabled"
        
        response = requests.get(f"{BASE_URL}/api/vendors", headers=self.headers)
        assert response.status_code == 200, f"Vendors endpoint failed: {response.text}"
        print("Vendors feature: ENABLED")
    
    def test_calendar_feature_enabled(self):
        """Test calendar feature is enabled"""
        assert self.effective_features.get("calendar") == True, "Calendar feature should be enabled"
        print("Calendar feature: ENABLED")
    
    def test_party_planner_feature_enabled(self):
        """Test party_planner feature is enabled"""
        assert self.effective_features.get("party_planner") == True, "Party Planner feature should be enabled"
        
        response = requests.get(f"{BASE_URL}/api/confirmed-bookings", headers=self.headers)
        assert response.status_code == 200, f"Confirmed bookings endpoint failed: {response.text}"
        print("Party Planner feature: ENABLED")


class TestCrossDataIsolation:
    """Test that tenants cannot access each other's specific resources"""
    
    def test_mayur_cannot_access_tamasha_booking_by_id(self):
        """MAYUR tenant should not be able to access TAMASHA's booking by ID"""
        # Login as TAMASHA to get a booking ID
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TAMASHA_TENANT)
        assert response.status_code == 200
        tamasha_token = response.json()["token"]
        tamasha_headers = {"Authorization": f"Bearer {tamasha_token}"}
        
        # Get TAMASHA's bookings
        response = requests.get(f"{BASE_URL}/api/bookings", headers=tamasha_headers)
        assert response.status_code == 200
        tamasha_bookings = response.json()
        
        if len(tamasha_bookings) == 0:
            pytest.skip("TAMASHA has no bookings to test")
        
        tamasha_booking_id = tamasha_bookings[0]["id"]
        print(f"TAMASHA booking ID: {tamasha_booking_id}")
        
        # Login as MAYUR
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MAYUR_TENANT)
        assert response.status_code == 200
        mayur_token = response.json()["token"]
        mayur_headers = {"Authorization": f"Bearer {mayur_token}"}
        
        # Try to access TAMASHA's booking as MAYUR
        response = requests.get(f"{BASE_URL}/api/bookings/{tamasha_booking_id}", headers=mayur_headers)
        print(f"MAYUR accessing TAMASHA booking: {response.status_code}")
        
        # Should return 404 (not found) due to tenant isolation
        assert response.status_code == 404, f"MAYUR should not see TAMASHA's booking, got {response.status_code}"
        print("Cross-tenant booking access: BLOCKED")
    
    def test_mayur_cannot_access_tamasha_hall_by_id(self):
        """MAYUR tenant should not be able to access TAMASHA's hall by ID"""
        # Login as TAMASHA to get a hall ID
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TAMASHA_TENANT)
        assert response.status_code == 200
        tamasha_token = response.json()["token"]
        tamasha_headers = {"Authorization": f"Bearer {tamasha_token}"}
        
        # Get TAMASHA's halls
        response = requests.get(f"{BASE_URL}/api/halls", headers=tamasha_headers)
        assert response.status_code == 200
        tamasha_halls = response.json()
        
        if len(tamasha_halls) == 0:
            pytest.skip("TAMASHA has no halls to test")
        
        tamasha_hall_id = tamasha_halls[0]["id"]
        print(f"TAMASHA hall ID: {tamasha_hall_id}")
        
        # Login as MAYUR
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MAYUR_TENANT)
        assert response.status_code == 200
        mayur_token = response.json()["token"]
        mayur_headers = {"Authorization": f"Bearer {mayur_token}"}
        
        # Try to access TAMASHA's hall as MAYUR
        response = requests.get(f"{BASE_URL}/api/halls/{tamasha_hall_id}", headers=mayur_headers)
        print(f"MAYUR accessing TAMASHA hall: {response.status_code}")
        
        # Should return 404 (not found) due to tenant isolation
        assert response.status_code == 404, f"MAYUR should not see TAMASHA's hall, got {response.status_code}"
        print("Cross-tenant hall access: BLOCKED")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
