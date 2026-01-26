"""
Document Shop Feature Tests
Tests for the Document Shop à-la-carte purchase feature including:
- Document Shop API endpoint
- Location Status API endpoint
- Document checkout endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDocumentShopAPI:
    """Tests for /api/document-shop endpoint"""
    
    def test_document_shop_returns_200(self):
        """Document shop endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/document-shop")
        assert response.status_code == 200
        
    def test_document_shop_returns_6_products(self):
        """Document shop should return exactly 6 products"""
        response = requests.get(f"{BASE_URL}/api/document-shop")
        data = response.json()
        assert "products" in data
        assert len(data["products"]) == 6
        
    def test_document_shop_product_structure(self):
        """Each product should have required fields"""
        response = requests.get(f"{BASE_URL}/api/document-shop")
        data = response.json()
        
        required_fields = ["id", "name", "price", "description", "includes", "format", "scope", "scope_label", "scope_note"]
        
        for product in data["products"]:
            for field in required_fields:
                assert field in product, f"Product missing field: {field}"
                
    def test_document_shop_product_prices(self):
        """Verify correct prices for each product"""
        response = requests.get(f"{BASE_URL}/api/document-shop")
        data = response.json()
        
        expected_prices = {
            "doc-pp-manual": 47.00,
            "doc-hiring-packet": 37.00,
            "doc-employee-handbook": 37.00,
            "doc-supervision-packet": 29.00,
            "doc-documentation-pack": 29.00,
            "doc-site-visit-binder": 24.00
        }
        
        for product in data["products"]:
            assert product["id"] in expected_prices, f"Unknown product: {product['id']}"
            assert product["price"] == expected_prices[product["id"]], f"Wrong price for {product['id']}"
            
    def test_document_shop_scope_labels(self):
        """Verify products have correct scope labels"""
        response = requests.get(f"{BASE_URL}/api/document-shop")
        data = response.json()
        
        core_products = ["doc-pp-manual", "doc-hiring-packet", "doc-employee-handbook", "doc-site-visit-binder"]
        addendum_products = ["doc-supervision-packet", "doc-documentation-pack"]
        
        for product in data["products"]:
            if product["id"] in core_products:
                assert product["scope"] == "core"
                assert product["scope_label"] == "Core (works in all states)"
            elif product["id"] in addendum_products:
                assert product["scope"] == "addendum"
                assert product["scope_label"] == "State addendum may be required"
                
    def test_document_shop_categories(self):
        """Verify products are categorized correctly"""
        response = requests.get(f"{BASE_URL}/api/document-shop")
        data = response.json()
        
        assert "categories" in data
        assert "core" in data["categories"]
        assert "addendum" in data["categories"]
        assert len(data["categories"]["core"]) == 4
        assert len(data["categories"]["addendum"]) == 2
        
    def test_document_shop_total_price(self):
        """Verify total individual price is $203"""
        response = requests.get(f"{BASE_URL}/api/document-shop")
        data = response.json()
        
        total = sum(p["price"] for p in data["products"])
        assert total == 203.00, f"Total should be $203, got ${total}"


class TestLocationStatusAPI:
    """Tests for /api/location-status/{state_code} endpoint"""
    
    def test_location_status_nc_allowed(self):
        """NC should return 'allowed' status"""
        response = requests.get(f"{BASE_URL}/api/location-status/NC")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "allowed"
        assert data["label"] == "Allowed"
        assert data["state_code"] == "NC"
        
    def test_location_status_ca_conditions(self):
        """CA should return 'allowed_conditions' status"""
        response = requests.get(f"{BASE_URL}/api/location-status/CA")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "allowed_conditions"
        assert data["label"] == "Allowed with conditions"
        
    def test_location_status_tx_allowed(self):
        """TX should return 'allowed' status"""
        response = requests.get(f"{BASE_URL}/api/location-status/TX")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "allowed"
        
    def test_location_status_ny_conditions(self):
        """NY should return 'allowed_conditions' status"""
        response = requests.get(f"{BASE_URL}/api/location-status/NY")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "allowed_conditions"
        
    def test_location_status_unknown_state(self):
        """Unknown state should return 404"""
        response = requests.get(f"{BASE_URL}/api/location-status/ZZ")
        assert response.status_code == 404
        
    def test_location_status_response_structure(self):
        """Location status should have required fields"""
        response = requests.get(f"{BASE_URL}/api/location-status/NC")
        data = response.json()
        
        required_fields = ["state_code", "state_name", "status", "label", "note"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"


class TestDocumentCheckoutAPI:
    """Tests for /api/checkout/document endpoint"""
    
    def test_checkout_document_valid_product(self):
        """Checkout with valid product should return checkout URL"""
        response = requests.post(
            f"{BASE_URL}/api/checkout/document",
            params={
                "product_id": "doc-pp-manual",
                "origin_url": "https://example.com"
            }
        )
        # Should return 200 with checkout URL (Stripe test mode)
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        
    def test_checkout_document_invalid_product(self):
        """Checkout with invalid product should return 404"""
        response = requests.post(
            f"{BASE_URL}/api/checkout/document",
            params={
                "product_id": "invalid-product",
                "origin_url": "https://example.com"
            }
        )
        assert response.status_code == 404


class TestDashboardDocumentShopCTA:
    """Tests for Document Shop CTA on Dashboard"""
    
    def test_magic_link_request(self):
        """Request magic link for test user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/magic-link",
            json={"email": "docshop_test@example.com"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        # In dev mode, token is returned
        if "dev_token" in data:
            return data["dev_token"]
        return None
        
    def test_user_dashboard_accessible(self):
        """Dashboard should be accessible with valid token"""
        # First get a magic link token
        magic_response = requests.post(
            f"{BASE_URL}/api/auth/magic-link",
            json={"email": "docshop_test@example.com"}
        )
        
        if magic_response.status_code == 200 and "dev_token" in magic_response.json():
            token = magic_response.json()["dev_token"]
            
            # Verify the token
            verify_response = requests.post(
                f"{BASE_URL}/api/auth/verify",
                json={"token": token}
            )
            
            if verify_response.status_code == 200:
                auth_token = verify_response.json().get("token")
                
                # Access dashboard
                dashboard_response = requests.get(
                    f"{BASE_URL}/api/user/dashboard",
                    headers={"Authorization": f"Bearer {auth_token}"}
                )
                assert dashboard_response.status_code == 200


class TestTemplatesPageDocumentShopCTA:
    """Tests for Document Shop CTA on Templates page"""
    
    def test_templates_endpoint(self):
        """Templates endpoint should be accessible"""
        response = requests.get(f"{BASE_URL}/api/templates")
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
