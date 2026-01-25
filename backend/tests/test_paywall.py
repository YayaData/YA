"""
Test suite for Paywall System features.
Tests: State checkout, user access levels, free vs premium steps, unpopulated states, grandfathering.
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://supportsteps.preview.emergentagent.com').rstrip('/')

# Paywall constants (should match backend)
FREE_STEPS = [1, 2, 3]
PREMIUM_STEPS = [4, 5, 6, 7, 8, 9, 10, 11]
STATE_ACCESS_PRICE = 49.00
POPULATED_STATES = ["NC", "TX", "CA", "FL", "NY", "OH", "PA", "IL", "GA", "NJ", "VA", "WA", "AZ"]
UNPOPULATED_STATES = ["AL", "AK", "AR", "CO", "CT", "DE", "HI", "ID", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NM", "ND", "OK", "OR", "RI", "SC", "SD", "TN", "UT", "VT", "WV", "WI", "WY"]


def create_authenticated_user(state_code="NC"):
    """Helper to create and authenticate a test user with onboarding"""
    unique_email = f"paywall_test_{int(time.time())}_{state_code}@example.com"
    
    # Request magic link
    magic_response = requests.post(f"{BASE_URL}/api/auth/magic-link", json={
        "email": unique_email
    })
    assert magic_response.status_code == 200, f"Magic link failed: {magic_response.text}"
    dev_token = magic_response.json()["dev_token"]
    
    # Verify and get JWT
    verify_response = requests.post(f"{BASE_URL}/api/auth/verify", json={
        "token": dev_token
    })
    assert verify_response.status_code == 200, f"Verify failed: {verify_response.text}"
    jwt_token = verify_response.json()["token"]
    
    # Complete onboarding
    headers = {"Authorization": f"Bearer {jwt_token}"}
    onboard_response = requests.post(f"{BASE_URL}/api/auth/onboarding", json={
        "selected_state": state_code,
        "goal": "start-agency",
        "name": f"Paywall Test User {state_code}"
    }, headers=headers)
    assert onboard_response.status_code == 200, f"Onboarding failed: {onboard_response.text}"
    
    return jwt_token, unique_email


class TestDashboardPaywallInfo:
    """Test that dashboard API returns paywall information"""
    
    def test_dashboard_returns_paywall_info(self):
        """Test dashboard includes free_steps, premium_steps, state_price"""
        jwt_token, email = create_authenticated_user("NC")
        headers = {"Authorization": f"Bearer {jwt_token}"}
        
        response = requests.get(f"{BASE_URL}/api/user/dashboard", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check paywall info is present
        assert "paywall" in data, "Dashboard should include paywall info"
        paywall = data["paywall"]
        
        assert "free_steps" in paywall, "Paywall should include free_steps"
        assert "premium_steps" in paywall, "Paywall should include premium_steps"
        assert "state_price" in paywall, "Paywall should include state_price"
        
        # Verify values
        assert paywall["free_steps"] == FREE_STEPS, f"Expected free_steps {FREE_STEPS}, got {paywall['free_steps']}"
        assert paywall["premium_steps"] == PREMIUM_STEPS, f"Expected premium_steps {PREMIUM_STEPS}, got {paywall['premium_steps']}"
        assert paywall["state_price"] == STATE_ACCESS_PRICE, f"Expected state_price {STATE_ACCESS_PRICE}, got {paywall['state_price']}"
        
        print(f"✓ Dashboard returns paywall info: free_steps={paywall['free_steps']}, price=${paywall['state_price']}")
    
    def test_dashboard_returns_state_access_info(self):
        """Test dashboard includes state_access with access level"""
        jwt_token, email = create_authenticated_user("TX")
        headers = {"Authorization": f"Bearer {jwt_token}"}
        
        response = requests.get(f"{BASE_URL}/api/user/dashboard", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check state_access info
        assert "state_access" in data, "Dashboard should include state_access"
        state_access = data["state_access"]
        
        assert "has_access" in state_access, "state_access should include has_access"
        assert "reason" in state_access, "state_access should include reason"
        assert "access_type" in state_access, "state_access should include access_type"
        
        # New user without purchase should have free tier
        assert state_access["access_type"] == "free", f"New user should have free access_type, got {state_access['access_type']}"
        
        print(f"✓ Dashboard returns state_access: has_access={state_access['has_access']}, type={state_access['access_type']}")
    
    def test_dashboard_returns_selected_state_populated_status(self):
        """Test dashboard shows if selected state is fully populated"""
        jwt_token, email = create_authenticated_user("CA")
        headers = {"Authorization": f"Bearer {jwt_token}"}
        
        response = requests.get(f"{BASE_URL}/api/user/dashboard", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "selected_state" in data
        assert "is_fully_populated" in data["selected_state"]
        assert data["selected_state"]["is_fully_populated"] == True, "CA should be fully populated"
        
        print(f"✓ Dashboard shows state populated status: CA is_fully_populated={data['selected_state']['is_fully_populated']}")


class TestUserAccessEndpoint:
    """Test /user/access/{state_code} endpoint"""
    
    def test_access_endpoint_for_populated_state(self):
        """Test access endpoint returns correct info for populated state"""
        jwt_token, email = create_authenticated_user("NC")
        headers = {"Authorization": f"Bearer {jwt_token}"}
        
        response = requests.get(f"{BASE_URL}/api/user/access/NC", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check all required fields
        assert "has_access" in data
        assert "reason" in data
        assert "access_type" in data
        assert "state_code" in data
        assert "state_name" in data
        assert "is_populated" in data
        assert "price" in data
        assert "free_steps" in data
        assert "premium_steps" in data
        
        # Verify values for populated state
        assert data["state_code"] == "NC"
        assert data["is_populated"] == True
        assert data["price"] == STATE_ACCESS_PRICE
        assert data["free_steps"] == FREE_STEPS
        assert data["premium_steps"] == PREMIUM_STEPS
        
        print(f"✓ Access endpoint for NC: is_populated={data['is_populated']}, price=${data['price']}")
    
    def test_access_endpoint_for_unpopulated_state(self):
        """Test access endpoint returns free access for unpopulated state"""
        jwt_token, email = create_authenticated_user("AL")  # Alabama is unpopulated
        headers = {"Authorization": f"Bearer {jwt_token}"}
        
        response = requests.get(f"{BASE_URL}/api/user/access/AL", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Unpopulated states should have full free access
        assert data["has_access"] == True, "Unpopulated states should have full access"
        assert data["reason"] == "unpopulated_state", f"Expected reason 'unpopulated_state', got {data['reason']}"
        assert data["is_populated"] == False
        assert data["price"] == 0, "Unpopulated states should have price 0"
        
        print(f"✓ Access endpoint for AL (unpopulated): has_access={data['has_access']}, price=${data['price']}")
    
    def test_access_endpoint_requires_auth(self):
        """Test access endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/user/access/NC")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Access endpoint correctly requires authentication")


class TestStateCheckoutEndpoint:
    """Test /checkout/state endpoint for purchasing state access"""
    
    def test_checkout_creates_stripe_session_for_populated_state(self):
        """Test checkout endpoint creates Stripe session for populated state"""
        jwt_token, email = create_authenticated_user("FL")
        headers = {"Authorization": f"Bearer {jwt_token}"}
        
        response = requests.post(f"{BASE_URL}/api/checkout/state", json={
            "state_code": "FL",
            "origin_url": "https://supportsteps.preview.emergentagent.com"
        }, headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check response structure
        assert "url" in data, "Response should include Stripe checkout URL"
        assert "session_id" in data, "Response should include session_id"
        assert "state_code" in data, "Response should include state_code"
        assert "amount" in data, "Response should include amount"
        
        # Verify values
        assert data["state_code"] == "FL"
        assert data["amount"] == STATE_ACCESS_PRICE
        assert "stripe.com" in data["url"] or "checkout" in data["url"].lower(), "URL should be Stripe checkout"
        
        print(f"✓ Checkout creates Stripe session: state={data['state_code']}, amount=${data['amount']}")
    
    def test_checkout_rejects_unpopulated_state(self):
        """Test checkout endpoint rejects purchase of unpopulated state"""
        jwt_token, email = create_authenticated_user("MT")  # Montana is unpopulated
        headers = {"Authorization": f"Bearer {jwt_token}"}
        
        response = requests.post(f"{BASE_URL}/api/checkout/state", json={
            "state_code": "MT",
            "origin_url": "https://supportsteps.preview.emergentagent.com"
        }, headers=headers)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "detail" in data
        assert "not yet available" in data["detail"].lower() or "free" in data["detail"].lower(), \
            f"Error should mention state is free/not available, got: {data['detail']}"
        
        print(f"✓ Checkout correctly rejects unpopulated state: {data['detail']}")
    
    def test_checkout_rejects_invalid_state(self):
        """Test checkout endpoint rejects invalid state code"""
        jwt_token, email = create_authenticated_user("NC")
        headers = {"Authorization": f"Bearer {jwt_token}"}
        
        response = requests.post(f"{BASE_URL}/api/checkout/state", json={
            "state_code": "XX",  # Invalid state
            "origin_url": "https://supportsteps.preview.emergentagent.com"
        }, headers=headers)
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Checkout correctly rejects invalid state code")
    
    def test_checkout_requires_auth(self):
        """Test checkout endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/checkout/state", json={
            "state_code": "NC",
            "origin_url": "https://example.com"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Checkout endpoint correctly requires authentication")


class TestUnpopulatedStatesFreeAccess:
    """Test that unpopulated states have full free access"""
    
    @pytest.mark.parametrize("state_code", ["AL", "AK", "CO", "HI", "MT", "WY"])
    def test_unpopulated_states_have_free_access(self, state_code):
        """Test various unpopulated states return free access"""
        jwt_token, email = create_authenticated_user(state_code)
        headers = {"Authorization": f"Bearer {jwt_token}"}
        
        response = requests.get(f"{BASE_URL}/api/user/access/{state_code}", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["has_access"] == True, f"{state_code} should have full access"
        assert data["reason"] == "unpopulated_state"
        assert data["price"] == 0
        
        print(f"✓ {state_code} (unpopulated) has free access")


class TestPopulatedStatesRequirePurchase:
    """Test that populated states require purchase for premium access"""
    
    @pytest.mark.parametrize("state_code", ["NC", "TX", "CA", "FL", "NY"])
    def test_populated_states_require_purchase(self, state_code):
        """Test various populated states require purchase for premium"""
        jwt_token, email = create_authenticated_user(state_code)
        headers = {"Authorization": f"Bearer {jwt_token}"}
        
        response = requests.get(f"{BASE_URL}/api/user/access/{state_code}", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # New user should not have premium access
        assert data["access_type"] == "free", f"{state_code} new user should have free access_type"
        assert data["is_populated"] == True
        assert data["price"] == STATE_ACCESS_PRICE
        
        print(f"✓ {state_code} (populated) requires purchase: price=${data['price']}")


class TestStatesEndpoint:
    """Test /states endpoint returns populated status"""
    
    def test_states_list_includes_populated_status(self):
        """Test states list includes is_fully_populated for each state"""
        response = requests.get(f"{BASE_URL}/api/states")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "states" in data
        states = data["states"]
        
        # Check structure
        for state in states:
            assert "code" in state
            assert "name" in state
            assert "is_fully_populated" in state
        
        # Verify some populated states
        nc = next((s for s in states if s["code"] == "NC"), None)
        assert nc is not None
        assert nc["is_fully_populated"] == True
        
        # Verify some unpopulated states
        al = next((s for s in states if s["code"] == "AL"), None)
        assert al is not None
        assert al["is_fully_populated"] == False
        
        populated_count = sum(1 for s in states if s["is_fully_populated"])
        print(f"✓ States list includes populated status: {populated_count} populated, {len(states) - populated_count} unpopulated")


class TestFreeStepsAccess:
    """Test that free steps (1-3) are always accessible"""
    
    def test_free_steps_accessible_without_purchase(self):
        """Test user can access steps 1-3 without purchase"""
        jwt_token, email = create_authenticated_user("NC")
        headers = {"Authorization": f"Bearer {jwt_token}"}
        
        # Get dashboard to check access
        response = requests.get(f"{BASE_URL}/api/user/dashboard", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify free steps are defined
        assert data["paywall"]["free_steps"] == [1, 2, 3]
        
        # User should be able to update progress for free steps
        progress_response = requests.post(f"{BASE_URL}/api/user/progress/NC", json={
            "state_code": "NC",
            "completed_steps": [1, 2, 3],  # Free steps
            "bookmarked_links": [],
            "notes": None
        }, headers=headers)
        
        assert progress_response.status_code == 200, f"Should be able to complete free steps: {progress_response.text}"
        print("✓ Free steps (1-3) are accessible without purchase")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
