"""
AnchorPoint Compliance Toolkit - Backend API Tests
Tests for: Auth, Policies, Staff, Training, Supervision, Incidents, Emergency, OnCall, Reports
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data prefix for cleanup
TEST_PREFIX = "TEST_"

class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["app"] == "AnchorPoint Compliance Toolkit"
        assert data["mode"] == "NON-PHI"
        print("✓ Health check passed")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_email = f"{TEST_PREFIX}user_{uuid.uuid4().hex[:8]}@test.com"
        self.test_password = "TestPass123!"
        self.test_name = f"{TEST_PREFIX}Test User"
    
    def test_register_admin_user(self):
        """Test user registration with admin role"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "fullName": self.test_name,
            "role": "admin"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == self.test_email
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin registration passed: {self.test_email}")
    
    def test_register_qp_user(self):
        """Test user registration with QP role"""
        qp_email = f"{TEST_PREFIX}qp_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": qp_email,
            "password": self.test_password,
            "fullName": f"{TEST_PREFIX}QP User",
            "role": "qp"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "qp"
        print(f"✓ QP registration passed: {qp_email}")
    
    def test_register_staff_user(self):
        """Test user registration with staff role"""
        staff_email = f"{TEST_PREFIX}staff_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": staff_email,
            "password": self.test_password,
            "fullName": f"{TEST_PREFIX}Staff User",
            "role": "staff"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "staff"
        print(f"✓ Staff registration passed: {staff_email}")
    
    def test_register_duplicate_email(self):
        """Test registration with duplicate email fails"""
        # First registration
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "fullName": self.test_name,
            "role": "staff"
        })
        # Second registration with same email
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "fullName": self.test_name,
            "role": "staff"
        })
        assert response.status_code == 400
        print("✓ Duplicate email rejection passed")
    
    def test_register_invalid_role(self):
        """Test registration with invalid role fails"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"{TEST_PREFIX}invalid_{uuid.uuid4().hex[:8]}@test.com",
            "password": self.test_password,
            "fullName": self.test_name,
            "role": "invalid_role"
        })
        assert response.status_code == 400
        print("✓ Invalid role rejection passed")
    
    def test_login_success(self):
        """Test successful login"""
        # First register
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "fullName": self.test_name,
            "role": "admin"
        })
        # Then login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == self.test_email
        print("✓ Login success passed")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials fails"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials rejection passed")
    
    def test_get_current_user(self):
        """Test getting current user info"""
        # Register and get token
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "fullName": self.test_name,
            "role": "admin"
        })
        token = reg_response.json()["token"]
        
        # Get current user
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == self.test_email
        print("✓ Get current user passed")


class TestDashboard:
    """Dashboard stats endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin user for testing"""
        self.test_email = f"{TEST_PREFIX}dashboard_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": "TestPass123!",
            "fullName": f"{TEST_PREFIX}Dashboard User",
            "role": "admin"
        })
        self.token = reg_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "totalPolicies" in data
        assert "totalStaff" in data
        assert "activeStaff" in data
        assert "pendingIncidents" in data
        assert "totalIncidents" in data
        assert "totalEmergencyLogs" in data
        assert "totalSupervisionLogs" in data
        assert "compliantStaff" in data
        assert "pendingCompliance" in data
        assert "todayOnCall" in data
        print("✓ Dashboard stats passed")


class TestPolicies:
    """Policy management endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin user for testing"""
        self.test_email = f"{TEST_PREFIX}policy_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": "TestPass123!",
            "fullName": f"{TEST_PREFIX}Policy Admin",
            "role": "admin"
        })
        self.token = reg_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_create_policy(self):
        """Test policy creation (admin only)"""
        unique_name = f"{TEST_PREFIX}Test Policy {uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/policies", headers=self.headers, json={
            "policyName": unique_name,
            "category": "administrative",
            "effectiveDate": "2025-01-01"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["policyName"] == unique_name
        assert data["category"] == "administrative"
        assert data["version"] >= 1  # Version can be 1 or higher
        print("✓ Policy creation passed")
    
    def test_get_policies(self):
        """Test getting all policies"""
        response = requests.get(f"{BASE_URL}/api/policies", headers=self.headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("✓ Get policies passed")
    
    def test_get_policies_by_category(self):
        """Test filtering policies by category"""
        # Create a policy first
        requests.post(f"{BASE_URL}/api/policies", headers=self.headers, json={
            "policyName": f"{TEST_PREFIX}Admin Policy",
            "category": "administrative",
            "effectiveDate": "2025-01-01"
        })
        
        response = requests.get(f"{BASE_URL}/api/policies?category=administrative", headers=self.headers)
        assert response.status_code == 200
        print("✓ Get policies by category passed")
    
    def test_acknowledge_policy(self):
        """Test policy acknowledgement"""
        # Create policy
        create_response = requests.post(f"{BASE_URL}/api/policies", headers=self.headers, json={
            "policyName": f"{TEST_PREFIX}Ack Policy",
            "category": "safety",
            "effectiveDate": "2025-01-01"
        })
        policy_id = create_response.json()["id"]
        
        # Acknowledge
        response = requests.post(f"{BASE_URL}/api/policies/{policy_id}/acknowledge", headers=self.headers)
        assert response.status_code == 200
        print("✓ Policy acknowledgement passed")
    
    def test_get_my_acknowledgements(self):
        """Test getting user's acknowledgements"""
        response = requests.get(f"{BASE_URL}/api/my-acknowledgements", headers=self.headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("✓ Get my acknowledgements passed")
    
    def test_delete_policy(self):
        """Test policy deletion (admin only)"""
        # Create policy
        create_response = requests.post(f"{BASE_URL}/api/policies", headers=self.headers, json={
            "policyName": f"{TEST_PREFIX}Delete Policy",
            "category": "hr",
            "effectiveDate": "2025-01-01"
        })
        policy_id = create_response.json()["id"]
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/policies/{policy_id}", headers=self.headers)
        assert response.status_code == 200
        print("✓ Policy deletion passed")
    
    def test_staff_cannot_create_policy(self):
        """Test that staff role cannot create policies"""
        # Create staff user
        staff_email = f"{TEST_PREFIX}staff_policy_{uuid.uuid4().hex[:8]}@test.com"
        staff_reg = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": staff_email,
            "password": "TestPass123!",
            "fullName": f"{TEST_PREFIX}Staff User",
            "role": "staff"
        })
        staff_token = staff_reg.json()["token"]
        
        response = requests.post(f"{BASE_URL}/api/policies", 
            headers={"Authorization": f"Bearer {staff_token}"}, 
            json={
                "policyName": f"{TEST_PREFIX}Unauthorized Policy",
                "category": "administrative",
                "effectiveDate": "2025-01-01"
            })
        assert response.status_code == 403
        print("✓ Staff policy creation rejection passed")


class TestStaff:
    """Staff management endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin user for testing"""
        self.test_email = f"{TEST_PREFIX}staffmgmt_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": "TestPass123!",
            "fullName": f"{TEST_PREFIX}Staff Admin",
            "role": "admin"
        })
        self.token = reg_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_create_staff(self):
        """Test staff member creation"""
        response = requests.post(f"{BASE_URL}/api/staff", headers=self.headers, json={
            "fullName": f"{TEST_PREFIX}New Staff Member",
            "role": "staff",
            "email": f"{TEST_PREFIX}newstaff_{uuid.uuid4().hex[:8]}@test.com",
            "phone": "(555) 123-4567",
            "hireDate": "2025-01-01",
            "status": "active"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["fullName"] == f"{TEST_PREFIX}New Staff Member"
        assert data["complianceStatus"] == "pending"
        print("✓ Staff creation passed")
        return data["id"]
    
    def test_get_staff(self):
        """Test getting all staff members"""
        response = requests.get(f"{BASE_URL}/api/staff", headers=self.headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("✓ Get staff passed")
    
    def test_get_staff_by_status(self):
        """Test filtering staff by status"""
        response = requests.get(f"{BASE_URL}/api/staff?status=active", headers=self.headers)
        assert response.status_code == 200
        print("✓ Get staff by status passed")
    
    def test_update_staff(self):
        """Test staff member update"""
        # Create staff
        create_response = requests.post(f"{BASE_URL}/api/staff", headers=self.headers, json={
            "fullName": f"{TEST_PREFIX}Update Staff",
            "role": "staff",
            "hireDate": "2025-01-01",
            "status": "active"
        })
        staff_id = create_response.json()["id"]
        
        # Update
        response = requests.put(f"{BASE_URL}/api/staff/{staff_id}", headers=self.headers, json={
            "status": "inactive"
        })
        assert response.status_code == 200
        print("✓ Staff update passed")
    
    def test_delete_staff(self):
        """Test staff member deletion"""
        # Create staff
        create_response = requests.post(f"{BASE_URL}/api/staff", headers=self.headers, json={
            "fullName": f"{TEST_PREFIX}Delete Staff",
            "role": "staff",
            "hireDate": "2025-01-01",
            "status": "active"
        })
        staff_id = create_response.json()["id"]
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/staff/{staff_id}", headers=self.headers)
        assert response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/staff/{staff_id}", headers=self.headers)
        assert get_response.status_code == 404
        print("✓ Staff deletion passed")


class TestTraining:
    """Training records endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin user and staff for testing"""
        self.test_email = f"{TEST_PREFIX}training_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": "TestPass123!",
            "fullName": f"{TEST_PREFIX}Training Admin",
            "role": "admin"
        })
        self.token = reg_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Create a staff member for training
        staff_response = requests.post(f"{BASE_URL}/api/staff", headers=self.headers, json={
            "fullName": f"{TEST_PREFIX}Training Staff",
            "role": "staff",
            "hireDate": "2025-01-01",
            "status": "active"
        })
        self.staff_id = staff_response.json()["id"]
    
    def test_create_training_record(self):
        """Test training record creation"""
        response = requests.post(f"{BASE_URL}/api/training", headers=self.headers, json={
            "staffId": self.staff_id,
            "trainingType": "orientation",
            "completed": True,
            "completionDate": "2025-01-15"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["trainingType"] == "orientation"
        assert data["completed"] == True
        print("✓ Training record creation passed")
    
    def test_get_training_records(self):
        """Test getting all training records"""
        response = requests.get(f"{BASE_URL}/api/training", headers=self.headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("✓ Get training records passed")
    
    def test_get_training_by_staff(self):
        """Test filtering training by staff ID"""
        response = requests.get(f"{BASE_URL}/api/training?staffId={self.staff_id}", headers=self.headers)
        assert response.status_code == 200
        print("✓ Get training by staff passed")


class TestSupervision:
    """QP Supervision logs endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup QP user and staff for testing"""
        # Create QP user
        self.qp_email = f"{TEST_PREFIX}qp_super_{uuid.uuid4().hex[:8]}@test.com"
        qp_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.qp_email,
            "password": "TestPass123!",
            "fullName": f"{TEST_PREFIX}QP Supervisor",
            "role": "qp"
        })
        self.qp_token = qp_response.json()["token"]
        self.qp_headers = {"Authorization": f"Bearer {self.qp_token}"}
        
        # Create admin for staff creation
        admin_email = f"{TEST_PREFIX}admin_super_{uuid.uuid4().hex[:8]}@test.com"
        admin_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": admin_email,
            "password": "TestPass123!",
            "fullName": f"{TEST_PREFIX}Admin",
            "role": "admin"
        })
        admin_token = admin_response.json()["token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create staff member
        staff_response = requests.post(f"{BASE_URL}/api/staff", headers=admin_headers, json={
            "fullName": f"{TEST_PREFIX}Supervised Staff",
            "role": "staff",
            "hireDate": "2025-01-01",
            "status": "active"
        })
        self.staff_id = staff_response.json()["id"]
    
    def test_create_supervision_log(self):
        """Test supervision log creation (QP only)"""
        response = requests.post(f"{BASE_URL}/api/supervision-logs", headers=self.qp_headers, json={
            "staffId": self.staff_id,
            "date": "2025-01-15",
            "type": "individual",
            "topics": ["Case Consultation", "Documentation Review"],
            "notes": "Test supervision session notes",
            "signedName": f"{TEST_PREFIX}QP Supervisor"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "individual"
        assert len(data["topics"]) == 2
        print("✓ Supervision log creation passed")
    
    def test_get_supervision_logs(self):
        """Test getting supervision logs"""
        response = requests.get(f"{BASE_URL}/api/supervision-logs", headers=self.qp_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("✓ Get supervision logs passed")
    
    def test_staff_cannot_create_supervision(self):
        """Test that staff role cannot create supervision logs"""
        staff_email = f"{TEST_PREFIX}staff_super_{uuid.uuid4().hex[:8]}@test.com"
        staff_reg = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": staff_email,
            "password": "TestPass123!",
            "fullName": f"{TEST_PREFIX}Staff User",
            "role": "staff"
        })
        staff_token = staff_reg.json()["token"]
        
        response = requests.post(f"{BASE_URL}/api/supervision-logs", 
            headers={"Authorization": f"Bearer {staff_token}"}, 
            json={
                "staffId": self.staff_id,
                "date": "2025-01-15",
                "type": "individual",
                "topics": ["Test"],
                "notes": "Unauthorized",
                "signedName": "Staff"
            })
        assert response.status_code == 403
        print("✓ Staff supervision creation rejection passed")


class TestIncidents:
    """Incident reports endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup user for testing"""
        self.test_email = f"{TEST_PREFIX}incident_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": "TestPass123!",
            "fullName": f"{TEST_PREFIX}Incident Reporter",
            "role": "staff"
        })
        self.token = reg_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_create_incident(self):
        """Test incident report creation"""
        response = requests.post(f"{BASE_URL}/api/incidents", headers=self.headers, json={
            "date": "2025-01-15",
            "time": "14:30",
            "incidentType": "safety",
            "location": "Main Office",
            "clientRef": "JD",  # Non-PHI: initials only
            "description": "Test incident description",
            "actionsTaken": "Test actions taken",
            "supervisorNotified": True,
            "followUpRequired": False
        })
        assert response.status_code == 200
        data = response.json()
        assert data["incidentType"] == "safety"
        assert data["clientRef"] == "JD"
        assert data["status"] == "pending"
        print("✓ Incident creation passed")
        return data["id"]
    
    def test_get_incidents(self):
        """Test getting all incidents"""
        response = requests.get(f"{BASE_URL}/api/incidents", headers=self.headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("✓ Get incidents passed")
    
    def test_get_incidents_by_status(self):
        """Test filtering incidents by status"""
        response = requests.get(f"{BASE_URL}/api/incidents?status=pending", headers=self.headers)
        assert response.status_code == 200
        print("✓ Get incidents by status passed")
    
    def test_update_incident_status(self):
        """Test incident status update (admin/qp only)"""
        # Create admin
        admin_email = f"{TEST_PREFIX}admin_inc_{uuid.uuid4().hex[:8]}@test.com"
        admin_reg = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": admin_email,
            "password": "TestPass123!",
            "fullName": f"{TEST_PREFIX}Admin",
            "role": "admin"
        })
        admin_token = admin_reg.json()["token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create incident
        create_response = requests.post(f"{BASE_URL}/api/incidents", headers=self.headers, json={
            "date": "2025-01-15",
            "time": "14:30",
            "incidentType": "behavioral",
            "location": "Community Site",
            "clientRef": "AB",
            "description": "Test incident",
            "actionsTaken": "Test actions",
            "supervisorNotified": False,
            "followUpRequired": True
        })
        incident_id = create_response.json()["id"]
        
        # Update status
        response = requests.put(f"{BASE_URL}/api/incidents/{incident_id}", headers=admin_headers, json={
            "status": "reviewed"
        })
        assert response.status_code == 200
        print("✓ Incident status update passed")


class TestEmergencyLogs:
    """Emergency logs endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup user for testing"""
        self.test_email = f"{TEST_PREFIX}emergency_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": "TestPass123!",
            "fullName": f"{TEST_PREFIX}Emergency Logger",
            "role": "staff"
        })
        self.token = reg_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_create_emergency_log(self):
        """Test emergency log creation"""
        response = requests.post(f"{BASE_URL}/api/emergency-logs", headers=self.headers, json={
            "date": "2025-01-15",
            "time": "22:30",
            "emergencyType": "medical",
            "clientRef": "CD",  # Non-PHI: initials only
            "responseTaken": "Called 911, provided first aid",
            "outcome": "Client transported to hospital",
            "followUp": "Schedule follow-up meeting"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["emergencyType"] == "medical"
        assert data["clientRef"] == "CD"
        print("✓ Emergency log creation passed")
    
    def test_get_emergency_logs(self):
        """Test getting all emergency logs"""
        response = requests.get(f"{BASE_URL}/api/emergency-logs", headers=self.headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("✓ Get emergency logs passed")


class TestOnCall:
    """On-call assignments endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin user and staff for testing"""
        self.test_email = f"{TEST_PREFIX}oncall_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": "TestPass123!",
            "fullName": f"{TEST_PREFIX}OnCall Admin",
            "role": "admin"
        })
        self.token = reg_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Create staff member
        staff_response = requests.post(f"{BASE_URL}/api/staff", headers=self.headers, json={
            "fullName": f"{TEST_PREFIX}OnCall Staff",
            "role": "staff",
            "hireDate": "2025-01-01",
            "status": "active"
        })
        self.staff_id = staff_response.json()["id"]
    
    def test_create_oncall_assignment(self):
        """Test on-call assignment creation"""
        response = requests.post(f"{BASE_URL}/api/oncall", headers=self.headers, json={
            "staffId": self.staff_id,
            "coverageDate": "2025-02-01",
            "timeRange": "8:00 AM - 8:00 PM",
            "backupContact": "Jane Doe (555) 987-6543",
            "notes": "Test on-call assignment"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["coverageDate"] == "2025-02-01"
        assert data["timeRange"] == "8:00 AM - 8:00 PM"
        print("✓ On-call assignment creation passed")
        return data["id"]
    
    def test_get_oncall_assignments(self):
        """Test getting all on-call assignments"""
        response = requests.get(f"{BASE_URL}/api/oncall", headers=self.headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("✓ Get on-call assignments passed")
    
    def test_delete_oncall_assignment(self):
        """Test on-call assignment deletion"""
        # Create assignment
        create_response = requests.post(f"{BASE_URL}/api/oncall", headers=self.headers, json={
            "staffId": self.staff_id,
            "coverageDate": "2025-03-01",
            "timeRange": "24 Hours"
        })
        assignment_id = create_response.json()["id"]
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/oncall/{assignment_id}", headers=self.headers)
        assert response.status_code == 200
        print("✓ On-call assignment deletion passed")


class TestReports:
    """Reports export endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin user for testing"""
        self.test_email = f"{TEST_PREFIX}reports_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": "TestPass123!",
            "fullName": f"{TEST_PREFIX}Reports Admin",
            "role": "admin"
        })
        self.token = reg_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_incidents_report_json(self):
        """Test incidents report export as JSON"""
        response = requests.get(f"{BASE_URL}/api/reports/incidents?format=json", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data or "count" in data
        print("✓ Incidents report JSON passed")
    
    def test_incidents_report_csv(self):
        """Test incidents report export as CSV"""
        response = requests.get(f"{BASE_URL}/api/reports/incidents?format=csv", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "csv" in data or "count" in data
        print("✓ Incidents report CSV passed")
    
    def test_supervision_report(self):
        """Test supervision report export"""
        response = requests.get(f"{BASE_URL}/api/reports/supervision?format=json", headers=self.headers)
        assert response.status_code == 200
        print("✓ Supervision report passed")
    
    def test_staff_compliance_report(self):
        """Test staff compliance report export"""
        response = requests.get(f"{BASE_URL}/api/reports/staff-compliance?format=json", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data or "count" in data
        print("✓ Staff compliance report passed")
    
    def test_reports_with_date_range(self):
        """Test reports with date range filter"""
        response = requests.get(
            f"{BASE_URL}/api/reports/incidents?format=json&startDate=2025-01-01&endDate=2025-12-31", 
            headers=self.headers
        )
        assert response.status_code == 200
        print("✓ Reports with date range passed")


class TestUserManagement:
    """User management endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin user for testing"""
        self.test_email = f"{TEST_PREFIX}usermgmt_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": "TestPass123!",
            "fullName": f"{TEST_PREFIX}User Admin",
            "role": "admin"
        })
        self.token = reg_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_users(self):
        """Test getting all users (admin only)"""
        response = requests.get(f"{BASE_URL}/api/users", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify password is not returned
        for user in data:
            assert "password" not in user
        print("✓ Get users passed")
    
    def test_update_user_role(self):
        """Test updating user role"""
        # Create a staff user
        staff_email = f"{TEST_PREFIX}role_change_{uuid.uuid4().hex[:8]}@test.com"
        staff_reg = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": staff_email,
            "password": "TestPass123!",
            "fullName": f"{TEST_PREFIX}Role Change User",
            "role": "staff"
        })
        user_id = staff_reg.json()["user"]["id"]
        
        # Update role to QP
        response = requests.put(f"{BASE_URL}/api/users/{user_id}/role?role=qp", headers=self.headers)
        assert response.status_code == 200
        print("✓ Update user role passed")
    
    def test_update_user_invalid_role(self):
        """Test updating user with invalid role fails"""
        # Create a staff user
        staff_email = f"{TEST_PREFIX}invalid_role_{uuid.uuid4().hex[:8]}@test.com"
        staff_reg = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": staff_email,
            "password": "TestPass123!",
            "fullName": f"{TEST_PREFIX}Invalid Role User",
            "role": "staff"
        })
        user_id = staff_reg.json()["user"]["id"]
        
        # Try invalid role
        response = requests.put(f"{BASE_URL}/api/users/{user_id}/role?role=superadmin", headers=self.headers)
        assert response.status_code == 400
        print("✓ Invalid role update rejection passed")
    
    def test_staff_cannot_access_users(self):
        """Test that staff role cannot access user management"""
        staff_email = f"{TEST_PREFIX}staff_users_{uuid.uuid4().hex[:8]}@test.com"
        staff_reg = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": staff_email,
            "password": "TestPass123!",
            "fullName": f"{TEST_PREFIX}Staff User",
            "role": "staff"
        })
        staff_token = staff_reg.json()["token"]
        
        response = requests.get(f"{BASE_URL}/api/users", headers={"Authorization": f"Bearer {staff_token}"})
        assert response.status_code == 403
        print("✓ Staff user management access rejection passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
