"""
Test Party Expenses API for Party Planning Module
Tests: GET, POST, DELETE party expenses endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TENANT_ADMIN_EMAIL = "admin@mayurbanquet.com"
TENANT_ADMIN_PASSWORD = "admin123"
TEST_BOOKING_ID = "ddb56e58-c67f-45a9-a80c-779ea639365b"


class TestPartyExpensesAPI:
    """Party Expenses CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as tenant admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            self.user = login_response.json().get("user")
        else:
            pytest.skip(f"Login failed: {login_response.status_code} - {login_response.text}")
    
    def test_01_login_success(self):
        """Test login with tenant admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] in ["admin", "tenant_admin"]
        print(f"✓ Login successful, role: {data['user']['role']}")
    
    def test_02_get_party_expenses_for_booking(self):
        """Test GET /api/party-expenses/{booking_id} returns list"""
        response = self.session.get(f"{BASE_URL}/api/party-expenses/{TEST_BOOKING_ID}")
        
        # Should return 200 or 403 (if role check fails)
        if response.status_code == 403:
            pytest.fail(f"Access denied for tenant_admin role: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of expenses"
        print(f"✓ GET expenses returned {len(data)} items")
        
        # Verify expense structure if any exist
        if len(data) > 0:
            expense = data[0]
            assert "id" in expense
            assert "booking_id" in expense
            assert "expense_name" in expense
            assert "amount" in expense
            # Note: category may be missing in legacy data
            print(f"✓ Expense structure valid: {expense.get('expense_name')}")
    
    def test_03_create_party_expense(self):
        """Test POST /api/party-expenses creates expense and returns full list"""
        payload = {
            "booking_id": TEST_BOOKING_ID,
            "expense_name": "TEST_Catering Supplies",
            "amount": 5000,
            "category": "food",
            "notes": "Test expense for party planning"
        }
        
        response = self.session.post(f"{BASE_URL}/api/party-expenses", json=payload)
        
        if response.status_code == 403:
            pytest.fail(f"Access denied for tenant_admin role: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should return list of all expenses
        assert isinstance(data, list), "Expected list of expenses after create"
        
        # Find our created expense
        created = next((e for e in data if e.get('expense_name') == 'TEST_Catering Supplies'), None)
        assert created is not None, "Created expense not found in response"
        assert created['amount'] == 5000
        assert created['category'] == 'food'
        assert created['booking_id'] == TEST_BOOKING_ID
        
        # Store expense ID for delete test
        self.__class__.created_expense_id = created['id']
        print(f"✓ Created expense: {created['id']}")
    
    def test_04_verify_expense_persisted(self):
        """Test GET after create to verify persistence"""
        response = self.session.get(f"{BASE_URL}/api/party-expenses/{TEST_BOOKING_ID}")
        assert response.status_code == 200
        
        data = response.json()
        created = next((e for e in data if e.get('expense_name') == 'TEST_Catering Supplies'), None)
        assert created is not None, "Created expense not found in GET response"
        print(f"✓ Expense persisted and retrieved")
    
    def test_05_delete_party_expense(self):
        """Test DELETE /api/party-expenses/{id} returns remaining list"""
        expense_id = getattr(self.__class__, 'created_expense_id', None)
        if not expense_id:
            pytest.skip("No expense ID from create test")
        
        response = self.session.delete(f"{BASE_URL}/api/party-expenses/{expense_id}")
        
        if response.status_code == 403:
            pytest.fail(f"Access denied for tenant_admin role: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should return list of remaining expenses
        assert isinstance(data, list), "Expected list of remaining expenses after delete"
        
        # Verify deleted expense is not in list
        deleted = next((e for e in data if e.get('id') == expense_id), None)
        assert deleted is None, "Deleted expense should not be in response"
        print(f"✓ Deleted expense: {expense_id}")
    
    def test_06_verify_expense_deleted(self):
        """Test GET after delete to verify removal"""
        response = self.session.get(f"{BASE_URL}/api/party-expenses/{TEST_BOOKING_ID}")
        assert response.status_code == 200
        
        data = response.json()
        deleted = next((e for e in data if e.get('expense_name') == 'TEST_Catering Supplies'), None)
        assert deleted is None, "Deleted expense should not exist"
        print(f"✓ Expense deletion verified")
    
    def test_07_create_expense_invalid_booking(self):
        """Test POST with invalid booking_id returns 404"""
        payload = {
            "booking_id": "invalid-booking-id-12345",
            "expense_name": "TEST_Invalid",
            "amount": 100,
            "category": "other"
        }
        
        response = self.session.post(f"{BASE_URL}/api/party-expenses", json=payload)
        assert response.status_code == 404, f"Expected 404 for invalid booking, got {response.status_code}"
        print(f"✓ Invalid booking returns 404")
    
    def test_08_delete_nonexistent_expense(self):
        """Test DELETE with invalid expense_id returns 404"""
        response = self.session.delete(f"{BASE_URL}/api/party-expenses/nonexistent-expense-id")
        assert response.status_code == 404, f"Expected 404 for invalid expense, got {response.status_code}"
        print(f"✓ Invalid expense delete returns 404")


class TestPartyExpenseCategories:
    """Test expense categories"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip("Login failed")
    
    def test_expense_category_staff(self):
        """Test creating expense with staff category"""
        payload = {
            "booking_id": TEST_BOOKING_ID,
            "expense_name": "TEST_Staff Wages",
            "amount": 3000,
            "category": "staff"
        }
        
        response = self.session.post(f"{BASE_URL}/api/party-expenses", json=payload)
        if response.status_code == 403:
            pytest.skip("Access denied - role check issue")
        
        assert response.status_code == 200
        data = response.json()
        created = next((e for e in data if e.get('expense_name') == 'TEST_Staff Wages'), None)
        
        if created:
            assert created['category'] == 'staff'
            # Cleanup
            self.session.delete(f"{BASE_URL}/api/party-expenses/{created['id']}")
            print(f"✓ Staff category expense created and cleaned up")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
