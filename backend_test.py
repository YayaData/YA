import requests
import sys
import json
from datetime import datetime

class AnchorPlaceAPITester:
    def __init__(self, base_url="https://anchor-placement-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Array with ' + str(len(response_data)) + ' items'}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_size": len(response.text) if response.text else 0
            })

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "error": str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root Endpoint", "GET", "", 200)

    def test_placement_types(self):
        """Test placement types endpoint"""
        success, response = self.run_test("Placement Types", "GET", "placement-types", 200)
        if success and 'types' in response:
            print(f"   Found {len(response['types'])} placement types")
        return success, response

    def test_referral_sources(self):
        """Test referral sources endpoint"""
        success, response = self.run_test("Referral Sources", "GET", "referral-sources", 200)
        if success and 'sources' in response:
            print(f"   Found {len(response['sources'])} referral sources")
        return success, response

    def test_services_list(self):
        """Test services list endpoint"""
        success, response = self.run_test("Services List", "GET", "services-list", 200)
        if success and 'services' in response:
            print(f"   Found {len(response['services'])} services")
        return success, response

    def test_seed_data(self):
        """Test seeding demo data"""
        return self.run_test("Seed Demo Data", "POST", "seed-data", 200)

    def test_get_placements(self):
        """Test getting placements"""
        success, response = self.run_test("Get Placements", "GET", "placements", 200)
        if success:
            print(f"   Found {len(response)} placements")
        return success, response

    def test_get_placements_with_filters(self):
        """Test getting placements with filters"""
        params = {"placement_type": "IDD", "availability": "Available"}
        success, response = self.run_test("Get Placements (Filtered)", "GET", "placements", 200, params=params)
        if success:
            print(f"   Found {len(response)} filtered placements")
        return success, response

    def test_create_placement_request(self):
        """Test creating a placement request"""
        test_data = {
            "referral_source": "Hospital",
            "contact_name": "Test User",
            "contact_email": "test@example.com",
            "contact_phone": "(555) 123-4567",
            "placement_type_needed": "IDD",
            "location_preference": "Raleigh, NC",
            "urgency": "Medium",
            "services_needed": ["24/7 Supervision", "Life Skills Training"],
            "additional_notes": "Test placement request",
            "accepts_medicaid_required": True
        }
        success, response = self.run_test("Create Placement Request", "POST", "placement-requests", 200, data=test_data)
        if success and 'id' in response:
            print(f"   Created request with ID: {response['id']}")
            return success, response
        return success, response

    def test_get_placement_requests(self):
        """Test getting placement requests"""
        success, response = self.run_test("Get Placement Requests", "GET", "placement-requests", 200)
        if success:
            print(f"   Found {len(response)} placement requests")
        return success, response

    def test_create_provider_inquiry(self):
        """Test creating a provider inquiry"""
        test_data = {
            "organization_name": "Test Care Facility",
            "contact_name": "Test Provider",
            "contact_email": "provider@example.com",
            "contact_phone": "(555) 987-6543",
            "inquiry_type": "Start New Placement",
            "description": "Interested in starting a new IDD facility",
            "services_interested": ["24/7 Supervision", "Day Programs"]
        }
        success, response = self.run_test("Create Provider Inquiry", "POST", "provider-inquiries", 200, data=test_data)
        if success and 'id' in response:
            print(f"   Created inquiry with ID: {response['id']}")
        return success, response

    def test_get_provider_inquiries(self):
        """Test getting provider inquiries"""
        success, response = self.run_test("Get Provider Inquiries", "GET", "provider-inquiries", 200)
        if success:
            print(f"   Found {len(response)} provider inquiries")
        return success, response

def main():
    print("🚀 Starting Anchor Place API Tests")
    print("=" * 50)
    
    tester = AnchorPlaceAPITester()
    
    # Test basic endpoints
    tester.test_health_check()
    tester.test_root_endpoint()
    
    # Test data endpoints
    tester.test_placement_types()
    tester.test_referral_sources()
    tester.test_services_list()
    
    # Test data seeding
    tester.test_seed_data()
    
    # Test placements
    tester.test_get_placements()
    tester.test_get_placements_with_filters()
    
    # Test placement requests
    tester.test_create_placement_request()
    tester.test_get_placement_requests()
    
    # Test provider inquiries
    tester.test_create_provider_inquiry()
    tester.test_get_provider_inquiries()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        failed_tests = [test for test in tester.test_results if not test['success']]
        print(f"\nFailed tests:")
        for test in failed_tests:
            error_msg = test.get('error', f'Status {test["actual_status"]} != {test["expected_status"]}')
            print(f"  - {test['name']}: {error_msg}")
        return 1

if __name__ == "__main__":
    sys.exit(main())