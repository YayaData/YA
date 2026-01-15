import requests
import sys
from datetime import datetime
import json

class PeerSupportAPITester:
    def __init__(self, base_url="https://peerlaunch.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, expected_keys=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json={}, headers=headers, timeout=10)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Check response structure if expected_keys provided
                if expected_keys:
                    try:
                        response_data = response.json()
                        for key in expected_keys:
                            if key not in response_data:
                                print(f"⚠️  Warning: Expected key '{key}' not found in response")
                            else:
                                print(f"   ✓ Found expected key: {key}")
                        
                        # Print sample data for verification
                        if 'states' in response_data and isinstance(response_data['states'], list):
                            print(f"   📊 Found {len(response_data['states'])} states")
                            if response_data['states']:
                                sample_state = response_data['states'][0]
                                print(f"   📝 Sample state: {sample_state}")
                        
                        if 'templates' in response_data and isinstance(response_data['templates'], list):
                            print(f"   📊 Found {len(response_data['templates'])} templates")
                            
                        if 'state_name' in response_data:
                            print(f"   📍 State: {response_data.get('state_name')} ({response_data.get('state_code')})")
                            print(f"   🏷️  Fully populated: {response_data.get('is_fully_populated')}")
                            
                    except json.JSONDecodeError:
                        print(f"   ⚠️  Warning: Response is not valid JSON")
                        
                return True, response.json() if response.content else {}
            else:
                self.tests_passed += 0
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'url': url,
                    'response': response.text[:200] if response.text else 'No response body'
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:200]}...")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            self.failed_tests.append({'name': name, 'error': 'Timeout', 'url': url})
            return False, {}
        except requests.exceptions.ConnectionError:
            print(f"❌ Failed - Connection error")
            self.failed_tests.append({'name': name, 'error': 'Connection error', 'url': url})
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({'name': name, 'error': str(e), 'url': url})
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200, ["status"])

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200, ["message"])

    def test_get_all_states(self):
        """Test getting all 50 states"""
        success, response = self.run_test("Get All States", "GET", "states", 200, ["states"])
        if success and 'states' in response:
            states = response['states']
            if len(states) == 50:
                print(f"   ✅ Correct number of states: {len(states)}")
            else:
                print(f"   ⚠️  Expected 50 states, got {len(states)}")
            
            # Check if NC is marked as fully populated
            nc_state = next((s for s in states if s['code'] == 'NC'), None)
            if nc_state and nc_state.get('is_fully_populated'):
                print(f"   ✅ NC is marked as fully populated")
            else:
                print(f"   ⚠️  NC should be marked as fully populated")
        return success, response

    def test_get_nc_state_data(self):
        """Test getting North Carolina state data (fully populated)"""
        success, response = self.run_test(
            "Get NC State Data", 
            "GET", 
            "states/NC", 
            200, 
            ["state_code", "state_name", "certification", "business_setup", "medicaid_enrollment", "checklist"]
        )
        if success:
            # Verify NC specific data
            if response.get('state_code') == 'NC' and response.get('is_fully_populated'):
                print(f"   ✅ NC data is fully populated")
            if 'checklist' in response and len(response['checklist']) >= 10:
                print(f"   ✅ NC has complete checklist with {len(response['checklist'])} steps")
        return success, response

    def test_get_other_state_data(self):
        """Test getting other state data (placeholder)"""
        return self.run_test(
            "Get CA State Data", 
            "GET", 
            "states/CA", 
            200, 
            ["state_code", "state_name", "certification", "business_setup"]
        )

    def test_invalid_state(self):
        """Test invalid state code"""
        return self.run_test("Invalid State Code", "GET", "states/XX", 404)

    def test_get_templates(self):
        """Test getting all templates"""
        success, response = self.run_test("Get Templates", "GET", "templates", 200, ["templates"])
        if success and 'templates' in response:
            templates = response['templates']
            if len(templates) >= 6:
                print(f"   ✅ Found {len(templates)} templates")
                # Check template structure
                if templates:
                    template = templates[0]
                    required_fields = ['id', 'title', 'description', 'category', 'download_url']
                    for field in required_fields:
                        if field in template:
                            print(f"   ✓ Template has {field}")
                        else:
                            print(f"   ⚠️  Template missing {field}")
        return success, response

    def test_get_specific_template(self):
        """Test getting specific template"""
        return self.run_test(
            "Get Specific Template", 
            "GET", 
            "templates/policies-procedures", 
            200, 
            ["id", "title", "description"]
        )

    def test_template_download(self):
        """Test template download endpoint (should return PDF)"""
        url = f"{self.base_url}/api/templates/download/policies-procedures"
        self.tests_run += 1
        print(f"\n🔍 Testing Template PDF Download...")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, timeout=10)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                # Check if it's a PDF
                content_type = response.headers.get('content-type', '')
                if 'application/pdf' in content_type:
                    self.tests_passed += 1
                    print(f"✅ Passed - PDF download working, size: {len(response.content)} bytes")
                    return True, {}
                else:
                    print(f"❌ Failed - Expected PDF, got content-type: {content_type}")
                    self.failed_tests.append({
                        'name': 'Template PDF Download',
                        'error': f'Wrong content type: {content_type}',
                        'url': url
                    })
                    return False, {}
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                self.failed_tests.append({
                    'name': 'Template PDF Download',
                    'expected': 200,
                    'actual': response.status_code,
                    'url': url
                })
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({'name': 'Template PDF Download', 'error': str(e), 'url': url})
            return False, {}

    def test_national_overview(self):
        """Test national overview endpoint"""
        success, response = self.run_test(
            "National Overview", 
            "GET", 
            "national-overview", 
            200, 
            ["what_is_peer_support", "what_is_medicaid_billable", "universal_requirements", "best_practices"]
        )
        if success:
            # Check content quality
            if 'universal_requirements' in response and len(response['universal_requirements']) >= 10:
                print(f"   ✅ Found {len(response['universal_requirements'])} universal requirements")
            if 'best_practices' in response and len(response['best_practices']) >= 10:
                print(f"   ✅ Found {len(response['best_practices'])} best practices")
        return success, response

    def test_products_api(self):
        """Test products API for Stripe integration"""
        success, response = self.run_test("Get Products", "GET", "products", 200, ["products"])
        if success and 'products' in response:
            products = response['products']
            if len(products) == 4:
                print(f"   ✅ Found exactly 4 products as expected")
                # Check product structure
                expected_products = ["pdf-guide", "templates-bundle", "full-course", "consultation"]
                for product_id in expected_products:
                    if product_id in products:
                        product = products[product_id]
                        if all(key in product for key in ['name', 'price', 'description']):
                            print(f"   ✓ Product {product_id}: {product['name']} - ${product['price']}")
                        else:
                            print(f"   ⚠️  Product {product_id} missing required fields")
                    else:
                        print(f"   ⚠️  Missing expected product: {product_id}")
            else:
                print(f"   ⚠️  Expected 4 products, got {len(products)}")
        return success, response

    def test_email_capture(self):
        """Test email capture endpoint"""
        url = f"{self.base_url}/api/email-capture"
        headers = {'Content-Type': 'application/json'}
        test_data = {
            "email": "test@example.com",
            "name": "Test User",
            "source": "template_download",
            "template_id": "policies-procedures"
        }

        self.tests_run += 1
        print(f"\n🔍 Testing Email Capture...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, json=test_data, headers=headers, timeout=10)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                self.tests_passed += 1
                print(f"✅ Passed - Email capture working")
                try:
                    response_data = response.json()
                    if response_data.get('success'):
                        print(f"   ✓ Success response received")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                self.failed_tests.append({
                    'name': 'Email Capture',
                    'expected': 200,
                    'actual': response.status_code,
                    'url': url,
                    'response': response.text[:200] if response.text else 'No response'
                })
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({'name': 'Email Capture', 'error': str(e), 'url': url})
            return False, {}

    def test_consultation_request(self):
        """Test consultation request endpoint"""
        url = f"{self.base_url}/api/consultation-request"
        headers = {'Content-Type': 'application/json'}
        test_data = {
            "name": "Test User",
            "email": "test@example.com",
            "state": "North Carolina",
            "phone": "555-123-4567",
            "message": "I need help starting my peer support agency"
        }

        self.tests_run += 1
        print(f"\n🔍 Testing Consultation Request...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, json=test_data, headers=headers, timeout=10)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                self.tests_passed += 1
                print(f"✅ Passed - Consultation request working")
                try:
                    response_data = response.json()
                    if response_data.get('success'):
                        print(f"   ✓ Success response received")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                self.failed_tests.append({
                    'name': 'Consultation Request',
                    'expected': 200,
                    'actual': response.status_code,
                    'url': url,
                    'response': response.text[:200] if response.text else 'No response'
                })
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({'name': 'Consultation Request', 'error': str(e), 'url': url})
            return False, {}

    def test_checkout_session_creation(self):
        """Test Stripe checkout session creation"""
        url = f"{self.base_url}/api/checkout/create-session"
        headers = {'Content-Type': 'application/json'}
        test_data = {
            "product_id": "pdf-guide",
            "origin_url": "https://peerlaunch.preview.emergentagent.com"
        }

        self.tests_run += 1
        print(f"\n🔍 Testing Checkout Session Creation...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, json=test_data, headers=headers, timeout=10)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                self.tests_passed += 1
                print(f"✅ Passed - Checkout session creation working")
                try:
                    response_data = response.json()
                    if 'url' in response_data and 'session_id' in response_data:
                        print(f"   ✓ Stripe URL generated: {response_data['url'][:50]}...")
                        print(f"   ✓ Session ID: {response_data['session_id']}")
                        return True, response_data
                    else:
                        print(f"   ⚠️  Missing url or session_id in response")
                        return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                self.failed_tests.append({
                    'name': 'Checkout Session Creation',
                    'expected': 200,
                    'actual': response.status_code,
                    'url': url,
                    'response': response.text[:200] if response.text else 'No response'
                })
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({'name': 'Checkout Session Creation', 'error': str(e), 'url': url})
            return False, {}

    def test_fully_populated_states(self):
        """Test that all 5 states (NC, TX, CA, FL, NY) are fully populated"""
        fully_populated_states = ["NC", "TX", "CA", "FL", "NY"]
        all_passed = True
        
        for state_code in fully_populated_states:
            success, response = self.run_test(
                f"Get {state_code} State Data", 
                "GET", 
                f"states/{state_code}", 
                200, 
                ["state_code", "state_name", "is_fully_populated"]
            )
            if success:
                if response.get('is_fully_populated'):
                    print(f"   ✅ {state_code} is fully populated")
                else:
                    print(f"   ❌ {state_code} should be fully populated but isn't")
                    all_passed = False
            else:
                all_passed = False
        
        return all_passed, {}

def main():
    print("🚀 Starting Peer Support Agency API Tests")
    print("=" * 60)
    
    tester = PeerSupportAPITester()
    
    # Run all tests
    test_results = []
    
    # Basic connectivity tests
    test_results.append(tester.test_health_check())
    test_results.append(tester.test_root_endpoint())
    
    # States API tests
    test_results.append(tester.test_get_all_states())
    test_results.append(tester.test_get_nc_state_data())
    test_results.append(tester.test_get_other_state_data())
    test_results.append(tester.test_invalid_state())
    
    # Templates API tests
    test_results.append(tester.test_get_templates())
    test_results.append(tester.test_get_specific_template())
    test_results.append(tester.test_template_download())
    
    # National overview test
    test_results.append(tester.test_national_overview())
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ FAILED TESTS:")
        for failed in tester.failed_tests:
            error_msg = failed.get('error', f"Expected {failed.get('expected')}, got {failed.get('actual')}")
            print(f"   • {failed['name']}: {error_msg}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())