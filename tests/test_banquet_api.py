"""
Backend API Tests for Banquet Management System
Tests: Authentication, Bookings, Payments, Expenses, Vendor Payments
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Global token storage
_admin_token = None

def get_admin_token():
    """Get admin auth token - cached"""
    global _admin_token
    if _admin_token:
        return _admin_token
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@mayurbanquet.com",
        "password": "admin123"
    })
    if response.status_code == 200:
        _admin_token = response.json().get("token")
        return _admin_token
    return None


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@mayurbanquet.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert data["user"]["role"] == "admin", "User role should be admin"
        
    def test_reception_login_success(self):
        """Test reception login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "reception@mayurbanquet.com",
            "password": "reception123"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data, "Response should contain token"
        
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestBookingsAPI:
    """Test bookings endpoints"""
        
    def test_get_bookings(self):
        """Test fetching all bookings"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/bookings", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
    def test_bookings_contain_required_fields(self):
        """Test that bookings contain required fields"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/bookings", headers=headers)
        assert response.status_code == 200
        data = response.json()
        if len(data) > 0:
            booking = data[0]
            required_fields = ['id', 'booking_number', 'customer_id', 'hall_id', 'event_date', 'total_amount', 'balance_due']
            for field in required_fields:
                assert field in booking, f"Booking should contain {field}"


class TestCustomersAPI:
    """Test customers endpoints"""
        
    def test_get_customers(self):
        """Test fetching all customers"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/customers", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"


class TestPaymentsAPI:
    """Test payments endpoints - Critical for payment_mode fix verification"""
        
    def test_get_payments(self):
        """Test fetching all payments"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/payments", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
    def test_create_payment_with_cash_mode(self):
        """Test creating payment with cash payment_mode"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        
        # First get a booking with balance due
        bookings_response = requests.get(f"{BASE_URL}/api/bookings", headers=headers)
        assert bookings_response.status_code == 200
        bookings = bookings_response.json()
        
        # Find a booking with balance due
        booking_with_balance = None
        for booking in bookings:
            if booking.get('balance_due', 0) > 0 and booking.get('status') != 'cancelled':
                booking_with_balance = booking
                break
                
        if not booking_with_balance:
            pytest.skip("No booking with balance due found")
            
        # Test payment with cash mode
        payment_data = {
            "booking_id": booking_with_balance['id'],
            "amount": 100,
            "payment_mode": "cash",
            "notes": "TEST_payment_cash"
        }
        response = requests.post(f"{BASE_URL}/api/payments", headers=headers, json=payment_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data['payment_mode'] == 'cash', "Payment mode should be cash"
        
    def test_create_payment_with_upi_mode(self):
        """Test creating payment with UPI payment mode"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get a booking with balance due
        bookings_response = requests.get(f"{BASE_URL}/api/bookings", headers=headers)
        bookings = bookings_response.json()
        
        booking_with_balance = None
        for booking in bookings:
            if booking.get('balance_due', 0) > 0 and booking.get('status') != 'cancelled':
                booking_with_balance = booking
                break
                
        if not booking_with_balance:
            pytest.skip("No booking with balance due found")
            
        payment_data = {
            "booking_id": booking_with_balance['id'],
            "amount": 50,
            "payment_mode": "upi",
            "notes": "TEST_payment_upi"
        }
        response = requests.post(f"{BASE_URL}/api/payments", headers=headers, json=payment_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data['payment_mode'] == 'upi', "Payment mode should be upi"
        
    def test_create_payment_with_credit_mode(self):
        """Test creating payment with credit payment mode"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get a booking with balance due
        bookings_response = requests.get(f"{BASE_URL}/api/bookings", headers=headers)
        bookings = bookings_response.json()
        
        booking_with_balance = None
        for booking in bookings:
            if booking.get('balance_due', 0) > 0 and booking.get('status') != 'cancelled':
                booking_with_balance = booking
                break
                
        if not booking_with_balance:
            pytest.skip("No booking with balance due found")
            
        payment_data = {
            "booking_id": booking_with_balance['id'],
            "amount": 75,
            "payment_mode": "credit",
            "notes": "TEST_payment_credit"
        }
        response = requests.post(f"{BASE_URL}/api/payments", headers=headers, json=payment_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data['payment_mode'] == 'credit', "Payment mode should be credit"


class TestVendorsAPI:
    """Test vendors endpoints"""
        
    def test_get_vendors(self):
        """Test fetching all vendors"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/vendors", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"


class TestVendorPaymentsAPI:
    """Test vendor payments endpoints - Admin only"""
        
    def test_get_vendor_payments(self):
        """Test fetching vendor payments"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/vendor-payments", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
    def test_get_vendor_balance_sheet(self):
        """Test fetching vendor balance sheet"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/vendor-balance-sheet", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
    def test_create_vendor_payment(self):
        """Test creating vendor payment with payment_mode"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        
        # First get vendors
        vendors_response = requests.get(f"{BASE_URL}/api/vendors", headers=headers)
        vendors = vendors_response.json()
        
        if not vendors or len(vendors) == 0:
            pytest.skip("No vendors found")
            
        vendor = vendors[0]
        
        payment_data = {
            "vendor_id": vendor['id'],
            "amount": 100,
            "payment_mode": "cash",
            "description": "TEST_vendor_payment"
        }
        response = requests.post(f"{BASE_URL}/api/vendor-payments", headers=headers, json=payment_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data['payment_mode'] == 'cash', "Payment mode should be cash"


class TestPartyExpensesAPI:
    """Test party expenses endpoints - Admin only"""
        
    def test_create_party_expense(self):
        """Test creating party expense"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get a booking
        bookings_response = requests.get(f"{BASE_URL}/api/bookings", headers=headers)
        bookings = bookings_response.json()
        
        if not bookings or len(bookings) == 0:
            pytest.skip("No bookings found")
            
        booking = bookings[0]
        
        expense_data = {
            "booking_id": booking['id'],
            "expense_name": "TEST_expense",
            "amount": 500,
            "notes": "Test expense for testing"
        }
        response = requests.post(f"{BASE_URL}/api/party-expenses", headers=headers, json=expense_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data['expense_name'] == 'TEST_expense', "Expense name should match"
        
    def test_get_party_expenses(self):
        """Test fetching party expenses for a booking"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get a booking
        bookings_response = requests.get(f"{BASE_URL}/api/bookings", headers=headers)
        bookings = bookings_response.json()
        
        if not bookings or len(bookings) == 0:
            pytest.skip("No bookings found")
            
        booking = bookings[0]
        
        response = requests.get(f"{BASE_URL}/api/party-expenses/{booking['id']}", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"


class TestHallsAPI:
    """Test halls endpoints"""
        
    def test_get_halls(self):
        """Test fetching all halls"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/halls", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"


class TestDashboardAPI:
    """Test dashboard endpoints"""
        
    def test_get_dashboard_stats(self):
        """Test fetching dashboard stats"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert 'total_bookings' in data, "Response should contain total_bookings"
        assert 'monthly_revenue' in data, "Response should contain monthly_revenue"


class TestMenuCategoriesAPI:
    """Test menu categories endpoints - New feature for custom categories"""
    
    def test_get_menu_categories(self):
        """Test fetching all menu categories"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/menu-categories", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
    def test_create_menu_category(self):
        """Test creating a new menu category"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        
        import uuid
        unique_name = f"TEST_Category_{str(uuid.uuid4())[:8]}"
        
        category_data = {
            "name": unique_name,
            "description": "Test category for testing"
        }
        response = requests.post(f"{BASE_URL}/api/menu-categories", headers=headers, json=category_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data['name'] == unique_name, "Category name should match"
        assert 'id' in data, "Response should contain id"
        
    def test_create_duplicate_category_fails(self):
        """Test that creating duplicate category fails"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        
        # First create a category
        import uuid
        unique_name = f"TEST_Duplicate_{str(uuid.uuid4())[:8]}"
        category_data = {"name": unique_name, "description": "First"}
        response1 = requests.post(f"{BASE_URL}/api/menu-categories", headers=headers, json=category_data)
        assert response1.status_code == 200
        
        # Try to create same category again
        response2 = requests.post(f"{BASE_URL}/api/menu-categories", headers=headers, json=category_data)
        assert response2.status_code == 400, f"Expected 400 for duplicate, got {response2.status_code}"


class TestVendorBalanceSheetAPI:
    """Test vendor balance sheet with parties_count - Enhanced feature"""
    
    def test_vendor_balance_sheet_has_parties_count(self):
        """Test that vendor balance sheet includes parties_count field"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/vendor-balance-sheet", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        if len(data) > 0:
            vendor = data[0]
            required_fields = ['vendor_id', 'vendor_name', 'vendor_type', 'total_payable', 'total_paid', 'outstanding_balance', 'parties_count']
            for field in required_fields:
                assert field in vendor, f"Vendor balance sheet should contain {field}"
                
    def test_add_vendor_payable(self):
        """Test adding payable amount to vendor"""
        token = get_admin_token()
        assert token, "Failed to get admin token"
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get first vendor
        vendors_response = requests.get(f"{BASE_URL}/api/vendors", headers=headers)
        vendors = vendors_response.json()
        
        if not vendors or len(vendors) == 0:
            pytest.skip("No vendors found")
            
        vendor_id = vendors[0]['id']
        
        # Add payable amount
        response = requests.put(
            f"{BASE_URL}/api/vendors/{vendor_id}/add-payable?amount=1000&description=TEST_payable",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'new_total_payable' in data, "Response should contain new_total_payable"
        assert 'outstanding' in data, "Response should contain outstanding"
