"""
Backend API Tests for Agency Management and Credential Document Upload
Tests P0 (Agency persistence) and P1 (File upload) features
"""
import pytest
import requests
import os
import tempfile
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestAgencyManagement:
    """Tests for Agency Management - Admin approve/suspend/reinstate"""
    
    @pytest.fixture
    def test_agency(self):
        """Create a test agency for testing"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "organization_name": f"TEST_Agency_{unique_id}",
            "contact_name": "Test Contact",
            "contact_email": f"test_{unique_id}@example.com",
            "contact_phone": "(555) 123-4567",
            "inquiry_type": "Start New Placement",
            "description": "Test agency for automated testing",
            "services_interested": ["IDD", "Mental Health"]
        }
        response = requests.post(f"{BASE_URL}/api/provider-inquiries", json=payload)
        assert response.status_code == 200
        data = response.json()
        return data
    
    def test_create_provider_inquiry(self, test_agency):
        """Test creating a new provider inquiry"""
        # Agency created by fixture
        assert "id" in test_agency
        assert test_agency["status"] == "pending"
        assert test_agency["organization_name"].startswith("TEST_Agency_")
    
    def test_approve_agency(self, test_agency):
        """Test approving an agency - P0 feature"""
        agency_id = test_agency["id"]
        
        # Approve the agency
        response = requests.patch(f"{BASE_URL}/api/provider-inquiries/{agency_id}?status=approved")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "approved" in data["message"].lower()
        
        # Verify persistence - GET the agency and check status
        get_response = requests.get(f"{BASE_URL}/api/provider-inquiries/{agency_id}")
        assert get_response.status_code == 200
        agency_data = get_response.json()
        assert agency_data["status"] == "approved"
        assert agency_data["updated_at"] is not None
    
    def test_suspend_agency(self, test_agency):
        """Test suspending an agency - P0 feature"""
        agency_id = test_agency["id"]
        
        # First approve the agency
        requests.patch(f"{BASE_URL}/api/provider-inquiries/{agency_id}?status=approved")
        
        # Then suspend it
        response = requests.patch(f"{BASE_URL}/api/provider-inquiries/{agency_id}?status=suspended")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "suspended" in data["message"].lower()
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/provider-inquiries/{agency_id}")
        assert get_response.status_code == 200
        agency_data = get_response.json()
        assert agency_data["status"] == "suspended"
    
    def test_reinstate_suspended_agency(self, test_agency):
        """Test reinstating a suspended agency"""
        agency_id = test_agency["id"]
        
        # Suspend the agency first
        requests.patch(f"{BASE_URL}/api/provider-inquiries/{agency_id}?status=suspended")
        
        # Reinstate by approving again
        response = requests.patch(f"{BASE_URL}/api/provider-inquiries/{agency_id}?status=approved")
        assert response.status_code == 200
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/provider-inquiries/{agency_id}")
        assert get_response.status_code == 200
        agency_data = get_response.json()
        assert agency_data["status"] == "approved"
    
    def test_invalid_status_update(self, test_agency):
        """Test that invalid status values are rejected"""
        agency_id = test_agency["id"]
        
        response = requests.patch(f"{BASE_URL}/api/provider-inquiries/{agency_id}?status=invalid_status")
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
    
    def test_update_nonexistent_agency(self):
        """Test updating a non-existent agency returns 404"""
        fake_id = str(uuid.uuid4())
        response = requests.patch(f"{BASE_URL}/api/provider-inquiries/{fake_id}?status=approved")
        assert response.status_code == 404
    
    def test_get_all_provider_inquiries(self):
        """Test getting all provider inquiries"""
        response = requests.get(f"{BASE_URL}/api/provider-inquiries")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestCredentialDocumentUpload:
    """Tests for Credential Document Upload - P1 feature"""
    
    @pytest.fixture
    def test_pdf_file(self):
        """Create a temporary PDF-like file for testing"""
        # Create a minimal PDF file
        pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
        temp_file = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
        temp_file.write(pdf_content)
        temp_file.close()
        return temp_file.name
    
    @pytest.fixture
    def test_image_file(self):
        """Create a temporary JPEG file for testing"""
        # Minimal JPEG header
        jpeg_content = bytes([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
        ])
        temp_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        temp_file.write(jpeg_content)
        temp_file.close()
        return temp_file.name
    
    def test_upload_pdf_document(self, test_pdf_file):
        """Test uploading a PDF credential document"""
        unique_id = str(uuid.uuid4())[:8]
        org_name = f"TEST_Org_{unique_id}"
        
        with open(test_pdf_file, 'rb') as f:
            files = {'file': ('test_document.pdf', f, 'application/pdf')}
            data = {
                'organization_name': org_name,
                'document_type': 'Business License',
                'document_id': 'business_license'
            }
            response = requests.post(f"{BASE_URL}/api/credentials/upload", files=files, data=data)
        
        assert response.status_code == 200
        result = response.json()
        assert "file_id" in result
        assert result["filename"] == "test_document.pdf"
        assert result["document_id"] == "business_license"
        assert "message" in result
        
        # Store file_id for cleanup
        return result["file_id"], org_name
    
    def test_upload_image_document(self, test_image_file):
        """Test uploading a JPEG credential document"""
        unique_id = str(uuid.uuid4())[:8]
        org_name = f"TEST_Org_{unique_id}"
        
        with open(test_image_file, 'rb') as f:
            files = {'file': ('license_photo.jpg', f, 'image/jpeg')}
            data = {
                'organization_name': org_name,
                'document_type': 'License Photo',
                'document_id': 'license_photo'
            }
            response = requests.post(f"{BASE_URL}/api/credentials/upload", files=files, data=data)
        
        assert response.status_code == 200
        result = response.json()
        assert "file_id" in result
        assert result["filename"] == "license_photo.jpg"
    
    def test_get_organization_documents(self, test_pdf_file):
        """Test retrieving documents for an organization"""
        unique_id = str(uuid.uuid4())[:8]
        org_name = f"TEST_Org_{unique_id}"
        
        # First upload a document
        with open(test_pdf_file, 'rb') as f:
            files = {'file': ('test_doc.pdf', f, 'application/pdf')}
            data = {
                'organization_name': org_name,
                'document_type': 'Test Document',
                'document_id': 'test_doc'
            }
            upload_response = requests.post(f"{BASE_URL}/api/credentials/upload", files=files, data=data)
        
        assert upload_response.status_code == 200
        
        # Now retrieve documents for the organization
        response = requests.get(f"{BASE_URL}/api/credentials/documents/{org_name}")
        assert response.status_code == 200
        documents = response.json()
        assert isinstance(documents, list)
        assert len(documents) >= 1
        
        # Verify document metadata
        doc = documents[0]
        assert doc["organization_name"] == org_name
        assert "document_type" in doc
        assert "uploaded_at" in doc
    
    def test_upload_invalid_file_type(self):
        """Test that invalid file types are rejected"""
        # Create a temporary text file
        temp_file = tempfile.NamedTemporaryFile(suffix='.txt', delete=False)
        temp_file.write(b"This is a text file")
        temp_file.close()
        
        with open(temp_file.name, 'rb') as f:
            files = {'file': ('test.txt', f, 'text/plain')}
            data = {
                'organization_name': 'Test Org',
                'document_type': 'Test',
                'document_id': 'test'
            }
            response = requests.post(f"{BASE_URL}/api/credentials/upload", files=files, data=data)
        
        assert response.status_code == 400
        assert "not allowed" in response.json()["detail"].lower()
    
    def test_download_document(self, test_pdf_file):
        """Test downloading an uploaded document"""
        unique_id = str(uuid.uuid4())[:8]
        org_name = f"TEST_Org_{unique_id}"
        
        # Upload a document first
        with open(test_pdf_file, 'rb') as f:
            files = {'file': ('download_test.pdf', f, 'application/pdf')}
            data = {
                'organization_name': org_name,
                'document_type': 'Download Test',
                'document_id': 'download_test'
            }
            upload_response = requests.post(f"{BASE_URL}/api/credentials/upload", files=files, data=data)
        
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file_id"]
        
        # Download the document
        response = requests.get(f"{BASE_URL}/api/credentials/download/{file_id}")
        assert response.status_code == 200
        assert len(response.content) > 0
    
    def test_download_nonexistent_document(self):
        """Test downloading a non-existent document returns 404"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/credentials/download/{fake_id}")
        assert response.status_code == 404
    
    def test_delete_document(self, test_pdf_file):
        """Test deleting an uploaded document"""
        unique_id = str(uuid.uuid4())[:8]
        org_name = f"TEST_Org_{unique_id}"
        
        # Upload a document first
        with open(test_pdf_file, 'rb') as f:
            files = {'file': ('delete_test.pdf', f, 'application/pdf')}
            data = {
                'organization_name': org_name,
                'document_type': 'Delete Test',
                'document_id': 'delete_test'
            }
            upload_response = requests.post(f"{BASE_URL}/api/credentials/upload", files=files, data=data)
        
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file_id"]
        
        # Delete the document
        response = requests.delete(f"{BASE_URL}/api/credentials/documents/{file_id}")
        assert response.status_code == 200
        
        # Verify it's deleted
        get_response = requests.get(f"{BASE_URL}/api/credentials/download/{file_id}")
        assert get_response.status_code == 404


class TestHousingInterest:
    """Tests for Housing Interest - Script B closure modal"""
    
    @pytest.fixture
    def test_housing_interest(self):
        """Create a test housing interest submission"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "name": f"TEST_Person_{unique_id}",
            "phone": "(555) 123-4567",
            "location": "Raleigh, NC",
            "has_disability_income": True,
            "can_pay": False,
            "description": "Test housing interest for automated testing"
        }
        response = requests.post(f"{BASE_URL}/api/housing-interest", json=payload)
        assert response.status_code == 200
        data = response.json()
        return data
    
    def test_create_housing_interest(self, test_housing_interest):
        """Test creating a housing interest submission"""
        assert "id" in test_housing_interest
        assert "message" in test_housing_interest
    
    def test_get_housing_interests(self):
        """Test getting all housing interest submissions"""
        response = requests.get(f"{BASE_URL}/api/housing-interest")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_update_housing_interest_status(self, test_housing_interest):
        """Test updating housing interest status (for closure modal)"""
        interest_id = test_housing_interest["id"]
        
        # Update to reviewed
        response = requests.patch(f"{BASE_URL}/api/housing-interest/{interest_id}?status=reviewed")
        assert response.status_code == 200
        
        # Update to contacted
        response = requests.patch(f"{BASE_URL}/api/housing-interest/{interest_id}?status=contacted")
        assert response.status_code == 200
        
        # Close with admin notes (Script B)
        closure_message = "Thank you for submitting a housing interest request. At this time, we are unable to move forward due to availability limitations."
        response = requests.patch(
            f"{BASE_URL}/api/housing-interest/{interest_id}?status=closed&admin_notes={closure_message}"
        )
        assert response.status_code == 200
    
    def test_export_housing_interest_csv(self):
        """Test exporting housing interest as CSV"""
        response = requests.get(f"{BASE_URL}/api/housing-interest/export")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")


class TestProviderCredentials:
    """Tests for Provider Credentials endpoints"""
    
    def test_save_provider_credentials(self):
        """Test saving provider credentials"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "organization_name": f"TEST_Provider_{unique_id}",
            "state": "NC",
            "org_type": "AFL_PROVIDER",
            "checklist_completed": ["business_license", "insurance"],
            "documents_uploaded": []
        }
        response = requests.post(f"{BASE_URL}/api/provider-credentials", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
    
    def test_get_provider_credentials(self):
        """Test getting all provider credentials"""
        response = requests.get(f"{BASE_URL}/api/provider-credentials")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
