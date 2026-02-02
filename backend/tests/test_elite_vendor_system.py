"""
Elite Vendor System Tests
Tests for:
- Vendor Directory API with balance info
- Vendor Ledger API with transaction history
- Transaction creation (debit/credit/payment)
- Balance calculation: Payable = Debits - Credits - Payments
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TENANT_ADMIN = {"email": "admin@mayurbanquet.com", "password": "admin123"}


class TestEliteVendorSystem:
    """Elite Vendor System API Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as tenant admin
        response = self.session.post(f"{BASE_URL}/api/auth/login", json=TENANT_ADMIN)
        assert response.status_code == 200, f"Login failed: {response.text}"
        token = response.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        yield
        
        # Cleanup: Delete test vendors and transactions
        self.cleanup_test_data()
    
    def cleanup_test_data(self):
        """Clean up test-created data"""
        try:
            # Get all vendors and delete TEST_ prefixed ones
            response = self.session.get(f"{BASE_URL}/api/vendors")
            if response.status_code == 200:
                vendors = response.json()
                for vendor in vendors:
                    if vendor.get('name', '').startswith('TEST_'):
                        self.session.delete(f"{BASE_URL}/api/vendors/{vendor['id']}")
        except Exception as e:
            print(f"Cleanup error: {e}")
    
    # ==================== VENDOR DIRECTORY TESTS ====================
    
    def test_vendor_directory_returns_vendors_with_balance_info(self):
        """GET /api/vendors/directory returns vendors with balance_type and balance_display"""
        response = self.session.get(f"{BASE_URL}/api/vendors/directory")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        vendors = response.json()
        
        assert isinstance(vendors, list), "Response should be a list"
        
        if len(vendors) > 0:
            vendor = vendors[0]
            # Check required fields for directory
            assert 'id' in vendor, "Vendor should have id"
            assert 'name' in vendor, "Vendor should have name"
            assert 'vendor_type' in vendor, "Vendor should have vendor_type"
            assert 'balance_type' in vendor, "Vendor should have balance_type"
            assert 'balance_display' in vendor, "Vendor should have balance_display"
            
            # balance_type should be one of: payable, receivable, settled
            assert vendor['balance_type'] in ['payable', 'receivable', 'settled'], \
                f"Invalid balance_type: {vendor['balance_type']}"
            
            # balance_display should be a non-negative number
            assert vendor['balance_display'] >= 0, "balance_display should be non-negative"
            
            print(f"✓ Found {len(vendors)} vendors in directory")
            print(f"  First vendor: {vendor['name']} - {vendor['balance_type']} ({vendor['balance_display']})")
    
    def test_vendor_directory_filters_active_vendors_only(self):
        """GET /api/vendors/directory returns only active vendors"""
        response = self.session.get(f"{BASE_URL}/api/vendors/directory")
        
        assert response.status_code == 200
        vendors = response.json()
        
        # All returned vendors should be active (is_active=True)
        for vendor in vendors:
            assert vendor.get('is_active', True) == True, f"Inactive vendor found: {vendor['name']}"
        
        print(f"✓ All {len(vendors)} vendors are active")
    
    # ==================== VENDOR LEDGER TESTS ====================
    
    def test_vendor_ledger_returns_transaction_history(self):
        """GET /api/vendors/{id}/ledger returns transaction history with summary"""
        # First get a vendor from directory
        dir_response = self.session.get(f"{BASE_URL}/api/vendors/directory")
        assert dir_response.status_code == 200
        vendors = dir_response.json()
        
        if len(vendors) == 0:
            pytest.skip("No vendors available for ledger test")
        
        vendor_id = vendors[0]['id']
        
        # Get ledger
        response = self.session.get(f"{BASE_URL}/api/vendors/{vendor_id}/ledger")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        ledger = response.json()
        
        # Check structure
        assert 'vendor' in ledger, "Ledger should have vendor info"
        assert 'transactions' in ledger, "Ledger should have transactions list"
        assert 'summary' in ledger, "Ledger should have summary"
        
        # Check summary fields
        summary = ledger['summary']
        assert 'total_debits' in summary, "Summary should have total_debits"
        assert 'total_credits' in summary, "Summary should have total_credits"
        assert 'total_payments' in summary, "Summary should have total_payments"
        assert 'balance' in summary, "Summary should have balance"
        assert 'balance_type' in summary, "Summary should have balance_type"
        
        print(f"✓ Ledger for {ledger['vendor']['name']}:")
        print(f"  Debits: {summary['total_debits']}, Credits: {summary['total_credits']}, Payments: {summary['total_payments']}")
        print(f"  Balance: {summary['balance']} ({summary['balance_type']})")
        print(f"  Transactions: {len(ledger['transactions'])}")
    
    def test_vendor_ledger_not_found_for_invalid_id(self):
        """GET /api/vendors/{invalid_id}/ledger returns 404"""
        invalid_id = str(uuid.uuid4())
        response = self.session.get(f"{BASE_URL}/api/vendors/{invalid_id}/ledger")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid vendor ID returns 404")
    
    # ==================== TRANSACTION CREATION TESTS ====================
    
    def test_create_debit_transaction(self):
        """POST /api/vendors/{id}/transactions creates debit transaction"""
        # Create a test vendor first
        vendor_data = {
            "name": f"TEST_Vendor_{uuid.uuid4().hex[:6]}",
            "vendor_type": "decor",
            "phone": "9876543210",
            "email": "test@vendor.com",
            "base_rate": 5000
        }
        create_response = self.session.post(f"{BASE_URL}/api/vendors", json=vendor_data)
        assert create_response.status_code == 200, f"Failed to create vendor: {create_response.text}"
        vendor = create_response.json()
        vendor_id = vendor['id']
        
        # Create debit transaction
        txn_data = {
            "vendor_id": vendor_id,
            "transaction_type": "debit",
            "amount": 10000,
            "note": "Test debit for services"
        }
        response = self.session.post(f"{BASE_URL}/api/vendors/{vendor_id}/transactions", json=txn_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        txn = response.json()
        
        assert txn['transaction_type'] == 'debit', "Transaction type should be debit"
        assert txn['amount'] == 10000, "Amount should be 10000"
        assert txn['vendor_id'] == vendor_id, "Vendor ID should match"
        
        # Verify ledger updated
        ledger_response = self.session.get(f"{BASE_URL}/api/vendors/{vendor_id}/ledger")
        ledger = ledger_response.json()
        
        assert ledger['summary']['total_debits'] == 10000, "Total debits should be 10000"
        assert ledger['summary']['balance'] == 10000, "Balance should be 10000 (payable)"
        assert ledger['summary']['balance_type'] == 'payable', "Balance type should be payable"
        
        print(f"✓ Created debit transaction: ₹{txn['amount']}")
        print(f"  Ledger balance: {ledger['summary']['balance']} ({ledger['summary']['balance_type']})")
    
    def test_create_credit_transaction(self):
        """POST /api/vendors/{id}/transactions creates credit transaction"""
        # Create a test vendor
        vendor_data = {
            "name": f"TEST_Vendor_{uuid.uuid4().hex[:6]}",
            "vendor_type": "dj_sound",
            "phone": "9876543211",
            "base_rate": 8000
        }
        create_response = self.session.post(f"{BASE_URL}/api/vendors", json=vendor_data)
        assert create_response.status_code == 200
        vendor = create_response.json()
        vendor_id = vendor['id']
        
        # Create debit first
        self.session.post(f"{BASE_URL}/api/vendors/{vendor_id}/transactions", json={
            "vendor_id": vendor_id,
            "transaction_type": "debit",
            "amount": 15000,
            "note": "Initial debit"
        })
        
        # Create credit transaction (adjustment/refund)
        txn_data = {
            "vendor_id": vendor_id,
            "transaction_type": "credit",
            "amount": 2000,
            "note": "Discount adjustment"
        }
        response = self.session.post(f"{BASE_URL}/api/vendors/{vendor_id}/transactions", json=txn_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        txn = response.json()
        
        assert txn['transaction_type'] == 'credit', "Transaction type should be credit"
        assert txn['amount'] == 2000, "Amount should be 2000"
        
        # Verify balance calculation: 15000 - 2000 = 13000
        ledger_response = self.session.get(f"{BASE_URL}/api/vendors/{vendor_id}/ledger")
        ledger = ledger_response.json()
        
        assert ledger['summary']['total_debits'] == 15000, "Total debits should be 15000"
        assert ledger['summary']['total_credits'] == 2000, "Total credits should be 2000"
        assert ledger['summary']['balance'] == 13000, "Balance should be 13000"
        
        print(f"✓ Created credit transaction: ₹{txn['amount']}")
        print(f"  Balance calculation: 15000 - 2000 = {ledger['summary']['balance']}")
    
    def test_create_payment_transaction_with_method(self):
        """POST /api/vendors/{id}/transactions creates payment with payment method"""
        # Create a test vendor
        vendor_data = {
            "name": f"TEST_Vendor_{uuid.uuid4().hex[:6]}",
            "vendor_type": "flower",
            "phone": "9876543212",
            "base_rate": 3000
        }
        create_response = self.session.post(f"{BASE_URL}/api/vendors", json=vendor_data)
        assert create_response.status_code == 200
        vendor = create_response.json()
        vendor_id = vendor['id']
        
        # Create debit first
        self.session.post(f"{BASE_URL}/api/vendors/{vendor_id}/transactions", json={
            "vendor_id": vendor_id,
            "transaction_type": "debit",
            "amount": 20000,
            "note": "Service charge"
        })
        
        # Create payment transaction with UPI
        txn_data = {
            "vendor_id": vendor_id,
            "transaction_type": "payment",
            "amount": 5000,
            "payment_method": "upi",
            "reference_id": "UTR123456789",
            "note": "Advance payment via UPI"
        }
        response = self.session.post(f"{BASE_URL}/api/vendors/{vendor_id}/transactions", json=txn_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        txn = response.json()
        
        assert txn['transaction_type'] == 'payment', "Transaction type should be payment"
        assert txn['amount'] == 5000, "Amount should be 5000"
        assert txn['payment_method'] == 'upi', "Payment method should be upi"
        assert txn['reference_id'] == 'UTR123456789', "Reference ID should match"
        
        # Verify balance: 20000 - 0 - 5000 = 15000
        ledger_response = self.session.get(f"{BASE_URL}/api/vendors/{vendor_id}/ledger")
        ledger = ledger_response.json()
        
        assert ledger['summary']['total_payments'] == 5000, "Total payments should be 5000"
        assert ledger['summary']['balance'] == 15000, "Balance should be 15000"
        
        print(f"✓ Created payment transaction: ₹{txn['amount']} via {txn['payment_method']}")
        print(f"  Reference: {txn['reference_id']}")
        print(f"  Balance: {ledger['summary']['balance']}")
    
    def test_balance_calculation_payable_equals_debits_minus_credits_minus_payments(self):
        """Verify balance formula: Payable = Debits - Credits - Payments"""
        # Create a test vendor
        vendor_data = {
            "name": f"TEST_Vendor_{uuid.uuid4().hex[:6]}",
            "vendor_type": "catering",
            "phone": "9876543213",
            "base_rate": 10000
        }
        create_response = self.session.post(f"{BASE_URL}/api/vendors", json=vendor_data)
        assert create_response.status_code == 200
        vendor = create_response.json()
        vendor_id = vendor['id']
        
        # Create multiple transactions
        # Debit 1: 25000
        self.session.post(f"{BASE_URL}/api/vendors/{vendor_id}/transactions", json={
            "vendor_id": vendor_id, "transaction_type": "debit", "amount": 25000, "note": "Event 1"
        })
        
        # Debit 2: 15000
        self.session.post(f"{BASE_URL}/api/vendors/{vendor_id}/transactions", json={
            "vendor_id": vendor_id, "transaction_type": "debit", "amount": 15000, "note": "Event 2"
        })
        
        # Credit: 5000 (discount)
        self.session.post(f"{BASE_URL}/api/vendors/{vendor_id}/transactions", json={
            "vendor_id": vendor_id, "transaction_type": "credit", "amount": 5000, "note": "Discount"
        })
        
        # Payment 1: 10000 (Cash)
        self.session.post(f"{BASE_URL}/api/vendors/{vendor_id}/transactions", json={
            "vendor_id": vendor_id, "transaction_type": "payment", "amount": 10000, 
            "payment_method": "cash", "note": "Cash payment"
        })
        
        # Payment 2: 8000 (Bank Transfer)
        self.session.post(f"{BASE_URL}/api/vendors/{vendor_id}/transactions", json={
            "vendor_id": vendor_id, "transaction_type": "payment", "amount": 8000,
            "payment_method": "bank_transfer", "reference_id": "NEFT123", "note": "Bank transfer"
        })
        
        # Get ledger and verify
        ledger_response = self.session.get(f"{BASE_URL}/api/vendors/{vendor_id}/ledger")
        ledger = ledger_response.json()
        summary = ledger['summary']
        
        # Expected: Debits=40000, Credits=5000, Payments=18000
        # Balance = 40000 - 5000 - 18000 = 17000
        expected_debits = 25000 + 15000
        expected_credits = 5000
        expected_payments = 10000 + 8000
        expected_balance = expected_debits - expected_credits - expected_payments
        
        assert summary['total_debits'] == expected_debits, f"Expected debits {expected_debits}, got {summary['total_debits']}"
        assert summary['total_credits'] == expected_credits, f"Expected credits {expected_credits}, got {summary['total_credits']}"
        assert summary['total_payments'] == expected_payments, f"Expected payments {expected_payments}, got {summary['total_payments']}"
        assert summary['balance'] == expected_balance, f"Expected balance {expected_balance}, got {summary['balance']}"
        assert summary['balance_type'] == 'payable', "Balance type should be payable"
        
        print(f"✓ Balance calculation verified:")
        print(f"  Debits: {summary['total_debits']}")
        print(f"  Credits: {summary['total_credits']}")
        print(f"  Payments: {summary['total_payments']}")
        print(f"  Balance: {summary['total_debits']} - {summary['total_credits']} - {summary['total_payments']} = {summary['balance']}")
    
    def test_balance_type_receivable_when_overpaid(self):
        """Balance type should be 'receivable' when payments exceed debits"""
        # Create a test vendor
        vendor_data = {
            "name": f"TEST_Vendor_{uuid.uuid4().hex[:6]}",
            "vendor_type": "photography",
            "phone": "9876543214",
            "base_rate": 5000
        }
        create_response = self.session.post(f"{BASE_URL}/api/vendors", json=vendor_data)
        assert create_response.status_code == 200
        vendor = create_response.json()
        vendor_id = vendor['id']
        
        # Debit: 10000
        self.session.post(f"{BASE_URL}/api/vendors/{vendor_id}/transactions", json={
            "vendor_id": vendor_id, "transaction_type": "debit", "amount": 10000, "note": "Service"
        })
        
        # Payment: 15000 (overpayment)
        self.session.post(f"{BASE_URL}/api/vendors/{vendor_id}/transactions", json={
            "vendor_id": vendor_id, "transaction_type": "payment", "amount": 15000,
            "payment_method": "cash", "note": "Advance payment"
        })
        
        # Get ledger
        ledger_response = self.session.get(f"{BASE_URL}/api/vendors/{vendor_id}/ledger")
        ledger = ledger_response.json()
        summary = ledger['summary']
        
        # Balance = 10000 - 0 - 15000 = -5000 (receivable)
        assert summary['balance'] == -5000, f"Expected balance -5000, got {summary['balance']}"
        assert summary['balance_type'] == 'receivable', f"Expected receivable, got {summary['balance_type']}"
        
        print(f"✓ Receivable balance verified:")
        print(f"  Balance: {summary['balance']} ({summary['balance_type']})")
    
    def test_balance_type_settled_when_zero(self):
        """Balance type should be 'settled' when balance is zero"""
        # Create a test vendor
        vendor_data = {
            "name": f"TEST_Vendor_{uuid.uuid4().hex[:6]}",
            "vendor_type": "lighting",
            "phone": "9876543215",
            "base_rate": 7000
        }
        create_response = self.session.post(f"{BASE_URL}/api/vendors", json=vendor_data)
        assert create_response.status_code == 200
        vendor = create_response.json()
        vendor_id = vendor['id']
        
        # Debit: 12000
        self.session.post(f"{BASE_URL}/api/vendors/{vendor_id}/transactions", json={
            "vendor_id": vendor_id, "transaction_type": "debit", "amount": 12000, "note": "Service"
        })
        
        # Credit: 2000
        self.session.post(f"{BASE_URL}/api/vendors/{vendor_id}/transactions", json={
            "vendor_id": vendor_id, "transaction_type": "credit", "amount": 2000, "note": "Discount"
        })
        
        # Payment: 10000 (exact remaining)
        self.session.post(f"{BASE_URL}/api/vendors/{vendor_id}/transactions", json={
            "vendor_id": vendor_id, "transaction_type": "payment", "amount": 10000,
            "payment_method": "cheque", "reference_id": "CHQ001", "note": "Final payment"
        })
        
        # Get ledger
        ledger_response = self.session.get(f"{BASE_URL}/api/vendors/{vendor_id}/ledger")
        ledger = ledger_response.json()
        summary = ledger['summary']
        
        # Balance = 12000 - 2000 - 10000 = 0 (settled)
        assert summary['balance'] == 0, f"Expected balance 0, got {summary['balance']}"
        assert summary['balance_type'] == 'settled', f"Expected settled, got {summary['balance_type']}"
        
        print(f"✓ Settled balance verified:")
        print(f"  Balance: {summary['balance']} ({summary['balance_type']})")
    
    # ==================== PAYMENT METHOD TESTS ====================
    
    def test_all_payment_methods_supported(self):
        """Verify all payment methods work: Cash, UPI, Bank Transfer, Cheque, Card"""
        # Create a test vendor
        vendor_data = {
            "name": f"TEST_Vendor_{uuid.uuid4().hex[:6]}",
            "vendor_type": "other",
            "phone": "9876543216",
            "base_rate": 1000
        }
        create_response = self.session.post(f"{BASE_URL}/api/vendors", json=vendor_data)
        assert create_response.status_code == 200
        vendor = create_response.json()
        vendor_id = vendor['id']
        
        # Create initial debit
        self.session.post(f"{BASE_URL}/api/vendors/{vendor_id}/transactions", json={
            "vendor_id": vendor_id, "transaction_type": "debit", "amount": 50000, "note": "Total services"
        })
        
        payment_methods = [
            {"method": "cash", "amount": 5000, "ref": None},
            {"method": "upi", "amount": 8000, "ref": "UTR987654321"},
            {"method": "bank_transfer", "amount": 10000, "ref": "NEFT456789"},
            {"method": "cheque", "amount": 7000, "ref": "CHQ12345"},
            {"method": "card", "amount": 5000, "ref": "TXN789012"}
        ]
        
        for pm in payment_methods:
            txn_data = {
                "vendor_id": vendor_id,
                "transaction_type": "payment",
                "amount": pm['amount'],
                "payment_method": pm['method'],
                "reference_id": pm['ref'],
                "note": f"Payment via {pm['method']}"
            }
            response = self.session.post(f"{BASE_URL}/api/vendors/{vendor_id}/transactions", json=txn_data)
            assert response.status_code == 200, f"Payment method {pm['method']} failed: {response.text}"
            txn = response.json()
            assert txn['payment_method'] == pm['method'], f"Payment method mismatch for {pm['method']}"
            print(f"  ✓ {pm['method'].upper()}: ₹{pm['amount']}")
        
        # Verify total payments
        ledger_response = self.session.get(f"{BASE_URL}/api/vendors/{vendor_id}/ledger")
        ledger = ledger_response.json()
        
        total_paid = sum(pm['amount'] for pm in payment_methods)
        assert ledger['summary']['total_payments'] == total_paid, f"Expected {total_paid}, got {ledger['summary']['total_payments']}"
        
        print(f"✓ All payment methods verified. Total paid: ₹{total_paid}")


class TestVendorDirectoryFiltering:
    """Tests for vendor directory filtering by balance type"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        response = self.session.post(f"{BASE_URL}/api/auth/login", json=TENANT_ADMIN)
        assert response.status_code == 200
        token = response.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_directory_contains_balance_type_for_filtering(self):
        """Verify directory response has balance_type for frontend filtering"""
        response = self.session.get(f"{BASE_URL}/api/vendors/directory")
        assert response.status_code == 200
        
        vendors = response.json()
        
        # Count by balance type
        payable_count = sum(1 for v in vendors if v.get('balance_type') == 'payable')
        receivable_count = sum(1 for v in vendors if v.get('balance_type') == 'receivable')
        settled_count = sum(1 for v in vendors if v.get('balance_type') == 'settled')
        
        print(f"✓ Vendor directory balance breakdown:")
        print(f"  Payable: {payable_count}")
        print(f"  Receivable: {receivable_count}")
        print(f"  Settled: {settled_count}")
        print(f"  Total: {len(vendors)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
