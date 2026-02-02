#!/usr/bin/env python3
"""
Test script for the enhanced Party Planning API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8001/api"

def login_and_get_token():
    """Login and get JWT token"""
    login_data = {
        "email": "admin@mayurbanquet.com",
        "password": "admin123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        return response.json()["token"]
    else:
        print(f"Login failed: {response.status_code} - {response.text}")
        return None

def test_party_plans_endpoints():
    """Test the new party planning endpoints"""
    token = login_and_get_token()
    if not token:
        print("❌ Could not get authentication token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("🧪 Testing Party Planning API endpoints...")
    
    # Test 1: Get all party plans
    print("\n1. Testing GET /party-plans")
    response = requests.get(f"{BASE_URL}/party-plans", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        plans = response.json()
        print(f"   ✅ Found {len(plans)} party plans")
    else:
        print(f"   ❌ Error: {response.text}")
    
    # Test 2: Test the new by-booking endpoint (we'll use a dummy booking ID)
    print("\n2. Testing GET /party-plans/by-booking/{booking_id}")
    dummy_booking_id = "test-booking-123"
    response = requests.get(f"{BASE_URL}/party-plans/by-booking/{dummy_booking_id}", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 404:
        print("   ✅ Correctly returns 404 for non-existent booking")
    elif response.status_code == 200:
        result = response.json()
        print(f"   ✅ Response structure: {list(result.keys())}")
    else:
        print(f"   ❌ Unexpected error: {response.text}")
    
    # Test 3: Check if helper functions are working (indirect test)
    print("\n3. Testing helper functions (generate_default_timeline)")
    try:
        # Import the server module to test helper functions
        import sys
        sys.path.append('/app/backend')
        import server
        
        timeline = server.generate_default_timeline('wedding', 'day', 100)
        print(f"   ✅ Generated timeline with {len(timeline)} tasks")
        
        staff_suggestions = server.suggest_staff_requirements('wedding', 100)
        print(f"   ✅ Generated {len(staff_suggestions)} staff suggestions")
        
        # Test readiness score calculation
        dummy_plan = {
            'dj_vendor_id': 'vendor1',
            'staff_assignments': [{'role': 'waiter', 'count': 3}],
            'timeline_tasks': [{'status': 'done'}, {'status': 'pending'}],
            'inventory': {'tables': 10}
        }
        dummy_booking = {}
        dummy_payments = [{'amount': 1000}]
        
        score, breakdown = server.calculate_readiness_score(dummy_plan, dummy_booking, dummy_payments)
        print(f"   ✅ Readiness score: {score}/100")
        print(f"   ✅ Breakdown: {breakdown}")
        
    except Exception as e:
        print(f"   ❌ Helper function test failed: {e}")
    
    print("\n🎉 Party Planning API tests completed!")

if __name__ == "__main__":
    test_party_plans_endpoints()