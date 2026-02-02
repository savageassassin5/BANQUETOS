import requests
import sys
from datetime import datetime, timedelta
import json

class BanquetAPITester:
    def __init__(self, base_url="https://event-brain-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.customer_id = None
        self.hall_id = None
        self.booking_id = None
        self.enquiry_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    'test': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'test': name,
                'error': str(e)
            })
            return False, {}

    def test_seed_data(self):
        """Test seeding initial data"""
        success, response = self.run_test(
            "Seed Data",
            "POST",
            "seed",
            200
        )
        return success

    def test_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@mayurbanquet.com", "password": "admin123"}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_halls_crud(self):
        """Test halls CRUD operations with multiple pricing options"""
        # Get halls
        success, response = self.run_test(
            "Get Halls",
            "GET",
            "halls",
            200
        )
        if success and response:
            self.hall_id = response[0]['id'] if response else None
            print(f"   Found {len(response)} halls")
            # Check if halls have multiple pricing options
            for hall in response:
                has_per_day = 'price_per_day' in hall
                has_per_event = 'price_per_event' in hall  
                has_per_plate = 'price_per_plate' in hall
                print(f"   Hall '{hall.get('name', 'N/A')}': per_day={has_per_day}, per_event={has_per_event}, per_plate={has_per_plate}")

        # Create hall with all pricing options
        hall_data = {
            "name": "Test Hall with Multiple Pricing",
            "capacity": 200,
            "price_per_day": 75000,
            "price_per_event": 85000,  # Testing price_per_event field
            "price_per_plate": 450,    # Testing price_per_plate field
            "description": "Test hall with all pricing options",
            "amenities": ["AC", "Stage", "Parking"]
        }
        success, response = self.run_test(
            "Create Hall with Multiple Pricing Options",
            "POST",
            "halls",
            200,
            data=hall_data
        )
        if success:
            test_hall_id = response.get('id')
            print(f"   Created hall ID: {test_hall_id}")
            print(f"   Price per day: ₹{response.get('price_per_day', 0)}")
            print(f"   Price per event: ₹{response.get('price_per_event', 0)}")
            print(f"   Price per plate: ₹{response.get('price_per_plate', 0)}")

        return success

    def test_menu_crud(self):
        """Test menu CRUD operations including add-ons"""
        # Get menu items
        success, response = self.run_test(
            "Get Menu Items",
            "GET",
            "menu",
            200
        )
        if success:
            print(f"   Found {len(response)} menu items")
            # Check for add-ons
            regular_items = [item for item in response if not item.get('is_addon', False)]
            addon_items = [item for item in response if item.get('is_addon', False)]
            print(f"   Regular menu items: {len(regular_items)}")
            print(f"   Add-on items: {len(addon_items)}")

        # Create regular menu item
        menu_data = {
            "name": "Test Main Dish",
            "category": "Main Course",
            "menu_type": "veg",
            "price_per_plate": 120,
            "description": "Test dish for API testing",
            "is_addon": False
        }
        success, response = self.run_test(
            "Create Regular Menu Item",
            "POST",
            "menu",
            200,
            data=menu_data
        )
        
        # Create add-on item
        addon_data = {
            "name": "Test Add-on Service",
            "category": "Add-ons",
            "menu_type": "veg",
            "price_per_plate": 50,
            "description": "Test add-on for API testing",
            "is_addon": True
        }
        success, response = self.run_test(
            "Create Add-on Item",
            "POST",
            "menu",
            200,
            data=addon_data
        )
        
        return success

    def test_customers_crud(self):
        """Test customers CRUD operations"""
        # Get customers
        success, response = self.run_test(
            "Get Customers",
            "GET",
            "customers",
            200
        )
        if success and response:
            self.customer_id = response[0]['id'] if response else None
            print(f"   Found {len(response)} customers")

        # Create customer
        customer_data = {
            "name": "Test Customer",
            "email": "test@example.com",
            "phone": "9876543210",
            "address": "Test Address"
        }
        success, response = self.run_test(
            "Create Customer",
            "POST",
            "customers",
            200,
            data=customer_data
        )
        if success:
            test_customer_id = response.get('id')
            print(f"   Created customer ID: {test_customer_id}")
            if not self.customer_id:
                self.customer_id = test_customer_id

        return success

    def test_enquiry_flow(self):
        """Test public enquiry submission"""
        enquiry_data = {
            "name": "Test Enquirer",
            "email": "enquiry@example.com",
            "phone": "9876543211",
            "event_type": "wedding",
            "event_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "guest_count": 150,
            "message": "Test enquiry message"
        }
        success, response = self.run_test(
            "Create Enquiry (Public)",
            "POST",
            "enquiries",
            200,
            data=enquiry_data
        )
        if success:
            self.enquiry_id = response.get('id')
            print(f"   Created enquiry ID: {self.enquiry_id}")

        # Get enquiries (admin only)
        success, response = self.run_test(
            "Get Enquiries",
            "GET",
            "enquiries",
            200
        )
        if success:
            print(f"   Found {len(response)} enquiries")

        return success

    def test_booking_flow(self):
        """Test booking creation and management with advance_paid field"""
        if not self.customer_id or not self.hall_id:
            print("❌ Cannot test booking - missing customer_id or hall_id")
            return False

        # Get menu items first for testing
        menu_success, menu_response = self.run_test(
            "Get Menu for Booking Test",
            "GET", 
            "menu",
            200
        )
        
        menu_items = []
        addons = []
        if menu_success and menu_response:
            # Get regular menu items (not add-ons)
            menu_items = [item['id'] for item in menu_response if not item.get('is_addon', False)][:2]
            # Get add-ons
            addons = [item['id'] for item in menu_response if item.get('is_addon', False)][:1]

        # Create booking with advance_paid field and menu items
        booking_data = {
            "customer_id": self.customer_id,
            "hall_id": self.hall_id,
            "event_type": "wedding",
            "event_date": (datetime.now() + timedelta(days=60)).strftime("%Y-%m-%d"),  # Different date to avoid conflict
            "start_time": "18:00",
            "end_time": "23:00",
            "guest_count": 200,
            "menu_items": menu_items,
            "addons": addons,
            "special_requests": "Test booking with advance payment",
            "discount_percent": 10,
            "advance_paid": 50000  # Testing advance_paid field
        }
        success, response = self.run_test(
            "Create Booking with Advance Payment",
            "POST",
            "bookings",
            200,
            data=booking_data
        )
        if success:
            self.booking_id = response.get('id')
            print(f"   Created booking ID: {self.booking_id}")
            print(f"   Hall charge: ₹{response.get('hall_charge', 0)}")
            print(f"   Food charge: ₹{response.get('food_charge', 0)}")
            print(f"   Add-on charge: ₹{response.get('addon_charge', 0)}")
            print(f"   Subtotal: ₹{response.get('subtotal', 0)}")
            print(f"   Discount ({response.get('discount_percent', 0)}%): -₹{response.get('discount_amount', 0)}")
            print(f"   Total amount: ₹{response.get('total_amount', 0)}")
            print(f"   Advance paid: ₹{response.get('advance_paid', 0)}")
            print(f"   Balance due: ₹{response.get('balance_due', 0)}")
            print(f"   Payment status: {response.get('payment_status', 'unknown')}")

        # Get bookings to verify financial columns
        success, response = self.run_test(
            "Get Bookings (Financial Columns Test)",
            "GET",
            "bookings",
            200
        )
        if success:
            print(f"   Found {len(response)} bookings")
            # Verify financial data is present
            for booking in response:
                if 'total_amount' in booking and 'advance_paid' in booking and 'balance_due' in booking:
                    print(f"   ✅ Booking {booking.get('booking_number', 'N/A')}: Total=₹{booking['total_amount']}, Paid=₹{booking['advance_paid']}, Due=₹{booking['balance_due']}")
                else:
                    print(f"   ❌ Missing financial columns in booking {booking.get('booking_number', 'N/A')}")

        return success

    def test_payment_flow(self):
        """Test payment recording and balance updates"""
        if not self.booking_id:
            print("❌ Cannot test payment - missing booking_id")
            return False

        # Get booking before payment to check initial balance
        success, booking_response = self.run_test(
            "Get Booking Before Payment",
            "GET",
            f"bookings/{self.booking_id}",
            200
        )
        
        initial_balance = 0
        initial_advance = 0
        if success:
            initial_balance = booking_response.get('balance_due', 0)
            initial_advance = booking_response.get('advance_paid', 0)
            print(f"   Initial balance due: ₹{initial_balance}")
            print(f"   Initial advance paid: ₹{initial_advance}")

        payment_data = {
            "booking_id": self.booking_id,
            "amount": 25000,
            "payment_method": "cash",
            "notes": "Test payment for balance update verification"
        }
        success, response = self.run_test(
            "Record Payment",
            "POST",
            "payments",
            200,
            data=payment_data
        )
        if success:
            print(f"   Recorded payment of ₹{payment_data['amount']}")

        # Get booking after payment to verify balance update
        success, booking_response = self.run_test(
            "Get Booking After Payment",
            "GET",
            f"bookings/{self.booking_id}",
            200
        )
        
        if success:
            new_balance = booking_response.get('balance_due', 0)
            new_advance = booking_response.get('advance_paid', 0)
            payment_status = booking_response.get('payment_status', 'unknown')
            
            print(f"   New balance due: ₹{new_balance}")
            print(f"   New advance paid: ₹{new_advance}")
            print(f"   Payment status: {payment_status}")
            
            # Verify balance calculation
            expected_balance = initial_balance - payment_data['amount']
            expected_advance = initial_advance + payment_data['amount']
            
            if abs(new_balance - expected_balance) < 0.01 and abs(new_advance - expected_advance) < 0.01:
                print(f"   ✅ Balance update verified correctly")
            else:
                print(f"   ❌ Balance update incorrect - Expected balance: ₹{expected_balance}, Got: ₹{new_balance}")

        # Get payments
        success, response = self.run_test(
            "Get Payments",
            "GET",
            "payments",
            200
        )
        if success:
            print(f"   Found {len(response)} payments")

        return success

    def test_calendar_api(self):
        """Test calendar functionality"""
        now = datetime.now()
        success, response = self.run_test(
            "Get Calendar Events",
            "GET",
            f"calendar?month={now.month}&year={now.year}",
            200
        )
        if success:
            print(f"   Found {len(response)} calendar events")
        return success

    def test_dashboard_apis(self):
        """Test dashboard statistics"""
        # Dashboard stats
        success, response = self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            print(f"   Stats: {json.dumps(response, indent=2)}")

        # Revenue chart
        success, response = self.run_test(
            "Get Revenue Chart",
            "GET",
            "dashboard/revenue-chart",
            200
        )
        if success:
            print(f"   Revenue data points: {len(response)}")

        # Event distribution
        success, response = self.run_test(
            "Get Event Distribution",
            "GET",
            "dashboard/event-distribution",
            200
        )
        if success:
            print(f"   Event types: {len(response)}")

        return success

    def test_pdf_invoice(self):
        """Test PDF invoice generation with currency formatting"""
        if not self.booking_id:
            print("❌ Cannot test PDF - missing booking_id")
            return False

        # Test PDF generation
        url = f"{self.base_url}/api/bookings/{self.booking_id}/invoice"
        test_headers = {'Authorization': f'Bearer {self.token}'}
        
        print(f"\n🔍 Testing PDF Invoice Generation...")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, headers=test_headers, timeout=30)
            
            if response.status_code == 200:
                print(f"✅ PDF generated successfully - Status: {response.status_code}")
                print(f"   Content-Type: {response.headers.get('Content-Type', 'N/A')}")
                print(f"   Content-Length: {len(response.content)} bytes")
                
                # Check if it's actually a PDF
                if response.content.startswith(b'%PDF'):
                    print(f"   ✅ Valid PDF format confirmed")
                    
                    # Save PDF for manual inspection if needed
                    with open('/tmp/test_invoice.pdf', 'wb') as f:
                        f.write(response.content)
                    print(f"   PDF saved to /tmp/test_invoice.pdf for inspection")
                    
                    return True
                else:
                    print(f"   ❌ Response is not a valid PDF")
                    return False
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

def main():
    print("🚀 Starting Banquet Management System API Tests")
    print("=" * 60)
    
    tester = BanquetAPITester()
    
    # Test sequence
    tests = [
        ("Seed Data", tester.test_seed_data),
        ("Authentication", tester.test_login),
        ("User Profile", tester.test_get_me),
        ("Halls CRUD", tester.test_halls_crud),
        ("Menu CRUD", tester.test_menu_crud),
        ("Customers CRUD", tester.test_customers_crud),
        ("Enquiry Flow", tester.test_enquiry_flow),
        ("Booking Flow", tester.test_booking_flow),
        ("Payment Flow", tester.test_payment_flow),
        ("Calendar API", tester.test_calendar_api),
        ("Dashboard APIs", tester.test_dashboard_apis),
        ("PDF Invoice", tester.test_pdf_invoice)
    ]
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test suite '{test_name}' failed with error: {str(e)}")
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"📊 Test Summary:")
    print(f"   Total tests: {tester.tests_run}")
    print(f"   Passed: {tester.tests_passed}")
    print(f"   Failed: {len(tester.failed_tests)}")
    print(f"   Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"   - {failure.get('test', 'Unknown')}: {failure}")
    
    return 0 if len(tester.failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())