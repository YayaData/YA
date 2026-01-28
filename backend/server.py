"""
AnchorPoint Compliance Toolkit - Backend Server
Tier 1: Non-PHI Operational Compliance Management
"""

from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from pymongo import MongoClient
import hashlib
import jwt
import os
import uuid
import base64
from io import BytesIO

# PDF Generation imports
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# ============== Configuration ==============
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "anchorpoint_compliance")
JWT_SECRET = os.environ.get("JWT_SECRET", "anchorpoint-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# ============== MongoDB Setup ==============
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
users_collection = db["users"]
policies_collection = db["policy_documents"]
acknowledgements_collection = db["policy_acknowledgements"]
staff_collection = db["staff_members"]
training_collection = db["training_records"]
qp_profiles_collection = db["qp_profiles"]
supervision_logs_collection = db["supervision_logs"]
incidents_collection = db["incident_reports"]
emergency_logs_collection = db["emergency_logs"]
oncall_collection = db["oncall_assignments"]

# Create indexes
users_collection.create_index("email", unique=True)
policies_collection.create_index("category")
# Note: Staff email is optional and doesn't need unique constraint

# ============== FastAPI App ==============
app = FastAPI(
    title="AnchorPoint Compliance Toolkit",
    description="Non-PHI Operational Compliance Management for Peer Support Agencies",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# ============== Pydantic Models ==============

# Auth Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    fullName: str
    role: str = "staff"  # admin, qp, staff

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    fullName: str
    role: str
    createdAt: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

# Policy Models
class PolicyCreate(BaseModel):
    policyName: str
    category: str  # administrative, clinical, hr, safety, privacy
    effectiveDate: str
    fileContent: Optional[str] = None  # Base64 encoded
    fileName: Optional[str] = None

class PolicyResponse(BaseModel):
    id: str
    policyName: str
    category: str
    version: int
    effectiveDate: str
    fileUrl: Optional[str]
    uploadedBy: str
    uploadedAt: str

class PolicyAcknowledge(BaseModel):
    policyId: str

# Staff Models
class StaffCreate(BaseModel):
    fullName: str
    role: str  # admin, qp, staff, supervisor
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    hireDate: str
    status: str = "active"  # active, inactive, onboarding

class StaffUpdate(BaseModel):
    fullName: Optional[str] = None
    role: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[str] = None

class StaffResponse(BaseModel):
    id: str
    fullName: str
    role: str
    email: Optional[str]
    phone: Optional[str]
    hireDate: str
    status: str
    complianceStatus: str
    createdAt: str

# Training Models
class TrainingCreate(BaseModel):
    staffId: str
    trainingType: str  # orientation, hipaa, cpr, crisis, annual_review
    completed: bool = False
    completionDate: Optional[str] = None

class TrainingResponse(BaseModel):
    id: str
    staffId: str
    trainingType: str
    completed: bool
    completionDate: Optional[str]
    createdAt: str

# QP Profile Models
class QPProfileCreate(BaseModel):
    userId: str
    credentialsUrl: Optional[str] = None
    scope: str  # supervision, clinical, both
    active: bool = True

class QPProfileResponse(BaseModel):
    id: str
    userId: str
    userName: Optional[str]
    credentialsUrl: Optional[str]
    scope: str
    active: bool
    createdAt: str

# Supervision Log Models
class SupervisionLogCreate(BaseModel):
    staffId: str
    date: str
    type: str  # individual, group, observation
    topics: List[str]
    notes: str
    signedName: str

class SupervisionLogResponse(BaseModel):
    id: str
    qpUserId: str
    qpName: Optional[str]
    staffId: str
    staffName: Optional[str]
    date: str
    type: str
    topics: List[str]
    notes: str
    signedName: str
    createdAt: str

# Incident Report Models (Non-PHI)
class IncidentCreate(BaseModel):
    date: str
    time: str
    incidentType: str  # safety, behavioral, environmental, other
    location: str
    clientRef: str  # Client initials or non-identifying ID only
    description: str
    actionsTaken: str
    supervisorNotified: bool = False
    followUpRequired: bool = False

class IncidentUpdate(BaseModel):
    reviewedBy: Optional[str] = None
    status: Optional[str] = None  # pending, reviewed, closed
    followUpRequired: Optional[bool] = None

class IncidentResponse(BaseModel):
    id: str
    date: str
    time: str
    incidentType: str
    location: str
    clientRef: str
    description: str
    actionsTaken: str
    supervisorNotified: bool
    followUpRequired: bool
    reviewedBy: Optional[str]
    status: str
    createdAt: str
    createdBy: str

# Emergency Log Models
class EmergencyLogCreate(BaseModel):
    date: str
    time: str
    emergencyType: str  # medical, behavioral, environmental, other
    clientRef: str  # Non-identifying reference only
    responseTaken: str
    outcome: str
    followUp: Optional[str] = None

class EmergencyLogResponse(BaseModel):
    id: str
    date: str
    time: str
    emergencyType: str
    clientRef: str
    responseTaken: str
    onCallStaffId: Optional[str]
    onCallStaffName: Optional[str]
    outcome: str
    followUp: Optional[str]
    createdAt: str
    createdBy: str

# On-Call Assignment Models
class OnCallCreate(BaseModel):
    staffId: str
    coverageDate: str
    timeRange: str  # e.g., "8:00 AM - 8:00 PM"
    backupContact: Optional[str] = None
    notes: Optional[str] = None

class OnCallResponse(BaseModel):
    id: str
    staffId: str
    staffName: Optional[str]
    coverageDate: str
    timeRange: str
    backupContact: Optional[str]
    notes: Optional[str]
    createdAt: str

# ============== Helper Functions ==============

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    user = users_collection.find_one({"_id": ObjectId(payload["user_id"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "fullName": user["fullName"],
        "role": user["role"]
    }

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403, 
                detail=f"Access denied. Required roles: {allowed_roles}"
            )
        return current_user
    return role_checker

def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if key == "_id":
            result["id"] = str(value)
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        else:
            result[key] = value
    return result

# ============== Health Check ==============

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "app": "AnchorPoint Compliance Toolkit", "mode": "NON-PHI"}

# ============== Auth Endpoints ==============

@app.post("/api/auth/register", response_model=TokenResponse)
def register(user: UserCreate):
    # Check if user exists
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate role
    if user.role not in ["admin", "qp", "staff"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Create user
    user_doc = {
        "email": user.email,
        "password": hash_password(user.password),
        "fullName": user.fullName,
        "role": user.role,
        "createdAt": datetime.now(timezone.utc)
    }
    result = users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # If role is QP, create QP profile
    if user.role == "qp":
        qp_profiles_collection.insert_one({
            "userId": user_id,
            "credentialsUrl": None,
            "scope": "supervision",
            "active": True,
            "createdAt": datetime.now(timezone.utc)
        })
    
    token = create_token(user_id, user.role)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user.email,
            "fullName": user.fullName,
            "role": user.role,
            "createdAt": user_doc["createdAt"].isoformat()
        }
    }

@app.post("/api/auth/login", response_model=TokenResponse)
def login(credentials: UserLogin):
    user = users_collection.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"])
    token = create_token(user_id, user["role"])
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user["email"],
            "fullName": user["fullName"],
            "role": user["role"],
            "createdAt": user["createdAt"].isoformat() if isinstance(user["createdAt"], datetime) else user["createdAt"]
        }
    }

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "fullName": current_user["fullName"],
        "role": current_user["role"],
        "createdAt": datetime.now(timezone.utc).isoformat()
    }

# ============== Policy Endpoints ==============

@app.get("/api/policies")
def get_policies(
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if category:
        query["category"] = category
    
    policies = list(policies_collection.find(query).sort("uploadedAt", -1))
    return [serialize_doc(p) for p in policies]

@app.post("/api/policies", response_model=PolicyResponse)
def create_policy(
    policy: PolicyCreate,
    current_user: dict = Depends(require_role(["admin"]))
):
    # Get latest version for this policy name
    existing = policies_collection.find_one(
        {"policyName": policy.policyName},
        sort=[("version", -1)]
    )
    version = (existing["version"] + 1) if existing else 1
    
    # Handle file content
    file_url = None
    if policy.fileContent and policy.fileName:
        # In production, upload to cloud storage
        # For now, store base64 reference
        file_url = f"/uploads/policies/{uuid.uuid4()}_{policy.fileName}"
    
    policy_doc = {
        "policyName": policy.policyName,
        "category": policy.category,
        "version": version,
        "effectiveDate": policy.effectiveDate,
        "fileUrl": file_url,
        "fileContent": policy.fileContent,
        "uploadedBy": current_user["id"],
        "uploadedByName": current_user["fullName"],
        "uploadedAt": datetime.now(timezone.utc)
    }
    result = policies_collection.insert_one(policy_doc)
    
    return {
        "id": str(result.inserted_id),
        "policyName": policy.policyName,
        "category": policy.category,
        "version": version,
        "effectiveDate": policy.effectiveDate,
        "fileUrl": file_url,
        "uploadedBy": current_user["fullName"],
        "uploadedAt": policy_doc["uploadedAt"].isoformat()
    }

@app.get("/api/policies/{policy_id}")
def get_policy(policy_id: str, current_user: dict = Depends(get_current_user)):
    policy = policies_collection.find_one({"_id": ObjectId(policy_id)})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return serialize_doc(policy)

@app.delete("/api/policies/{policy_id}")
def delete_policy(
    policy_id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    result = policies_collection.delete_one({"_id": ObjectId(policy_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"message": "Policy deleted successfully"}

# Policy Acknowledgements
@app.post("/api/policies/{policy_id}/acknowledge")
def acknowledge_policy(
    policy_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Check policy exists
    policy = policies_collection.find_one({"_id": ObjectId(policy_id)})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Check if already acknowledged
    existing = acknowledgements_collection.find_one({
        "policyId": policy_id,
        "userId": current_user["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Policy already acknowledged")
    
    ack_doc = {
        "policyId": policy_id,
        "userId": current_user["id"],
        "userName": current_user["fullName"],
        "acknowledgedAt": datetime.now(timezone.utc)
    }
    acknowledgements_collection.insert_one(ack_doc)
    
    return {"message": "Policy acknowledged successfully"}

@app.get("/api/policies/{policy_id}/acknowledgements")
def get_policy_acknowledgements(
    policy_id: str,
    current_user: dict = Depends(require_role(["admin", "qp"]))
):
    acks = list(acknowledgements_collection.find({"policyId": policy_id}))
    return [serialize_doc(a) for a in acks]

@app.get("/api/my-acknowledgements")
def get_my_acknowledgements(current_user: dict = Depends(get_current_user)):
    acks = list(acknowledgements_collection.find({"userId": current_user["id"]}))
    return [serialize_doc(a) for a in acks]

# ============== Staff Endpoints ==============

@app.get("/api/staff")
def get_staff(
    status: Optional[str] = None,
    current_user: dict = Depends(require_role(["admin", "qp"]))
):
    query = {}
    if status:
        query["status"] = status
    
    staff = list(staff_collection.find(query).sort("fullName", 1))
    return [serialize_doc(s) for s in staff]

@app.post("/api/staff", response_model=StaffResponse)
def create_staff(
    staff: StaffCreate,
    current_user: dict = Depends(require_role(["admin"]))
):
    staff_doc = {
        "fullName": staff.fullName,
        "role": staff.role,
        "email": staff.email,
        "phone": staff.phone,
        "hireDate": staff.hireDate,
        "status": staff.status,
        "complianceStatus": "pending",  # pending, compliant, non-compliant
        "uploads": [],
        "createdAt": datetime.now(timezone.utc)
    }
    result = staff_collection.insert_one(staff_doc)
    
    return {
        "id": str(result.inserted_id),
        "fullName": staff.fullName,
        "role": staff.role,
        "email": staff.email,
        "phone": staff.phone,
        "hireDate": staff.hireDate,
        "status": staff.status,
        "complianceStatus": "pending",
        "createdAt": staff_doc["createdAt"].isoformat()
    }

@app.get("/api/staff/{staff_id}")
def get_staff_member(
    staff_id: str,
    current_user: dict = Depends(require_role(["admin", "qp"]))
):
    staff = staff_collection.find_one({"_id": ObjectId(staff_id)})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return serialize_doc(staff)

@app.put("/api/staff/{staff_id}")
def update_staff(
    staff_id: str,
    update: StaffUpdate,
    current_user: dict = Depends(require_role(["admin"]))
):
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = staff_collection.update_one(
        {"_id": ObjectId(staff_id)},
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    return {"message": "Staff member updated successfully"}

@app.delete("/api/staff/{staff_id}")
def delete_staff(
    staff_id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    result = staff_collection.delete_one({"_id": ObjectId(staff_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return {"message": "Staff member deleted successfully"}

# ============== Training Endpoints ==============

@app.get("/api/training")
def get_training_records(
    staffId: Optional[str] = None,
    current_user: dict = Depends(require_role(["admin", "qp"]))
):
    query = {}
    if staffId:
        query["staffId"] = staffId
    
    records = list(training_collection.find(query))
    return [serialize_doc(r) for r in records]

@app.post("/api/training", response_model=TrainingResponse)
def create_training_record(
    training: TrainingCreate,
    current_user: dict = Depends(require_role(["admin"]))
):
    # Verify staff exists
    staff = staff_collection.find_one({"_id": ObjectId(training.staffId)})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    training_doc = {
        "staffId": training.staffId,
        "staffName": staff["fullName"],
        "trainingType": training.trainingType,
        "completed": training.completed,
        "completionDate": training.completionDate,
        "createdAt": datetime.now(timezone.utc)
    }
    result = training_collection.insert_one(training_doc)
    
    # Update staff compliance status
    update_staff_compliance(training.staffId)
    
    return {
        "id": str(result.inserted_id),
        "staffId": training.staffId,
        "trainingType": training.trainingType,
        "completed": training.completed,
        "completionDate": training.completionDate,
        "createdAt": training_doc["createdAt"].isoformat()
    }

@app.put("/api/training/{training_id}")
def update_training(
    training_id: str,
    completed: bool,
    completionDate: Optional[str] = None,
    current_user: dict = Depends(require_role(["admin"]))
):
    update_dict = {"completed": completed}
    if completionDate:
        update_dict["completionDate"] = completionDate
    
    result = training_collection.update_one(
        {"_id": ObjectId(training_id)},
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Training record not found")
    
    # Get staff ID and update compliance
    record = training_collection.find_one({"_id": ObjectId(training_id)})
    if record:
        update_staff_compliance(record["staffId"])
    
    return {"message": "Training record updated successfully"}

def update_staff_compliance(staff_id: str):
    """Update staff compliance status based on training completion"""
    required_training = ["orientation", "hipaa", "cpr"]
    completed = training_collection.find({
        "staffId": staff_id,
        "trainingType": {"$in": required_training},
        "completed": True
    })
    completed_types = set(r["trainingType"] for r in completed)
    
    if set(required_training).issubset(completed_types):
        status = "compliant"
    else:
        status = "pending"
    
    staff_collection.update_one(
        {"_id": ObjectId(staff_id)},
        {"$set": {"complianceStatus": status}}
    )

# ============== QP Profile Endpoints ==============

@app.get("/api/qp-profiles")
def get_qp_profiles(current_user: dict = Depends(require_role(["admin"]))):
    profiles = list(qp_profiles_collection.find())
    result = []
    for p in profiles:
        doc = serialize_doc(p)
        # Get user name
        user = users_collection.find_one({"_id": ObjectId(p["userId"])})
        doc["userName"] = user["fullName"] if user else "Unknown"
        result.append(doc)
    return result

@app.put("/api/qp-profiles/{profile_id}")
def update_qp_profile(
    profile_id: str,
    scope: Optional[str] = None,
    active: Optional[bool] = None,
    current_user: dict = Depends(require_role(["admin"]))
):
    update_dict = {}
    if scope:
        update_dict["scope"] = scope
    if active is not None:
        update_dict["active"] = active
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = qp_profiles_collection.update_one(
        {"_id": ObjectId(profile_id)},
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="QP profile not found")
    
    return {"message": "QP profile updated successfully"}

# ============== Supervision Log Endpoints ==============

@app.get("/api/supervision-logs")
def get_supervision_logs(
    staffId: Optional[str] = None,
    current_user: dict = Depends(require_role(["admin", "qp"]))
):
    query = {}
    if current_user["role"] == "qp":
        query["qpUserId"] = current_user["id"]
    if staffId:
        query["staffId"] = staffId
    
    logs = list(supervision_logs_collection.find(query).sort("date", -1))
    return [serialize_doc(l) for l in logs]

@app.post("/api/supervision-logs", response_model=SupervisionLogResponse)
def create_supervision_log(
    log: SupervisionLogCreate,
    current_user: dict = Depends(require_role(["qp"]))
):
    # Verify staff exists
    staff = staff_collection.find_one({"_id": ObjectId(log.staffId)})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    log_doc = {
        "qpUserId": current_user["id"],
        "qpName": current_user["fullName"],
        "staffId": log.staffId,
        "staffName": staff["fullName"],
        "date": log.date,
        "type": log.type,
        "topics": log.topics,
        "notes": log.notes,
        "signedName": log.signedName,
        "createdAt": datetime.now(timezone.utc)
    }
    result = supervision_logs_collection.insert_one(log_doc)
    
    return {
        "id": str(result.inserted_id),
        "qpUserId": current_user["id"],
        "qpName": current_user["fullName"],
        "staffId": log.staffId,
        "staffName": staff["fullName"],
        "date": log.date,
        "type": log.type,
        "topics": log.topics,
        "notes": log.notes,
        "signedName": log.signedName,
        "createdAt": log_doc["createdAt"].isoformat()
    }

@app.get("/api/supervision-logs/{log_id}")
def get_supervision_log(
    log_id: str,
    current_user: dict = Depends(require_role(["admin", "qp"]))
):
    log = supervision_logs_collection.find_one({"_id": ObjectId(log_id)})
    if not log:
        raise HTTPException(status_code=404, detail="Supervision log not found")
    return serialize_doc(log)

# ============== Incident Report Endpoints ==============

@app.get("/api/incidents")
def get_incidents(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    
    incidents = list(incidents_collection.find(query).sort("date", -1))
    return [serialize_doc(i) for i in incidents]

@app.post("/api/incidents", response_model=IncidentResponse)
def create_incident(
    incident: IncidentCreate,
    current_user: dict = Depends(get_current_user)
):
    incident_doc = {
        "date": incident.date,
        "time": incident.time,
        "incidentType": incident.incidentType,
        "location": incident.location,
        "clientRef": incident.clientRef,  # Non-PHI: initials or non-identifying ID only
        "description": incident.description,
        "actionsTaken": incident.actionsTaken,
        "supervisorNotified": incident.supervisorNotified,
        "followUpRequired": incident.followUpRequired,
        "reviewedBy": None,
        "status": "pending",
        "createdBy": current_user["id"],
        "createdByName": current_user["fullName"],
        "createdAt": datetime.now(timezone.utc)
    }
    result = incidents_collection.insert_one(incident_doc)
    
    return {
        "id": str(result.inserted_id),
        "date": incident.date,
        "time": incident.time,
        "incidentType": incident.incidentType,
        "location": incident.location,
        "clientRef": incident.clientRef,
        "description": incident.description,
        "actionsTaken": incident.actionsTaken,
        "supervisorNotified": incident.supervisorNotified,
        "followUpRequired": incident.followUpRequired,
        "reviewedBy": None,
        "status": "pending",
        "createdAt": incident_doc["createdAt"].isoformat(),
        "createdBy": current_user["fullName"]
    }

@app.put("/api/incidents/{incident_id}")
def update_incident(
    incident_id: str,
    update: IncidentUpdate,
    current_user: dict = Depends(require_role(["admin", "qp"]))
):
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if "reviewedBy" in update_dict:
        update_dict["reviewedBy"] = current_user["fullName"]
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = incidents_collection.update_one(
        {"_id": ObjectId(incident_id)},
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    return {"message": "Incident updated successfully"}

@app.get("/api/incidents/{incident_id}")
def get_incident(
    incident_id: str,
    current_user: dict = Depends(get_current_user)
):
    incident = incidents_collection.find_one({"_id": ObjectId(incident_id)})
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return serialize_doc(incident)

# ============== Emergency Log Endpoints ==============

@app.get("/api/emergency-logs")
def get_emergency_logs(current_user: dict = Depends(get_current_user)):
    logs = list(emergency_logs_collection.find().sort("date", -1))
    return [serialize_doc(l) for l in logs]

@app.post("/api/emergency-logs", response_model=EmergencyLogResponse)
def create_emergency_log(
    log: EmergencyLogCreate,
    current_user: dict = Depends(get_current_user)
):
    # Get current on-call staff if any
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    oncall = oncall_collection.find_one({"coverageDate": today})
    
    log_doc = {
        "date": log.date,
        "time": log.time,
        "emergencyType": log.emergencyType,
        "clientRef": log.clientRef,  # Non-PHI only
        "responseTaken": log.responseTaken,
        "onCallStaffId": oncall["staffId"] if oncall else None,
        "outcome": log.outcome,
        "followUp": log.followUp,
        "createdBy": current_user["id"],
        "createdByName": current_user["fullName"],
        "createdAt": datetime.now(timezone.utc)
    }
    result = emergency_logs_collection.insert_one(log_doc)
    
    # Get on-call staff name
    oncall_name = None
    if oncall:
        staff = staff_collection.find_one({"_id": ObjectId(oncall["staffId"])})
        oncall_name = staff["fullName"] if staff else None
    
    return {
        "id": str(result.inserted_id),
        "date": log.date,
        "time": log.time,
        "emergencyType": log.emergencyType,
        "clientRef": log.clientRef,
        "responseTaken": log.responseTaken,
        "onCallStaffId": oncall["staffId"] if oncall else None,
        "onCallStaffName": oncall_name,
        "outcome": log.outcome,
        "followUp": log.followUp,
        "createdAt": log_doc["createdAt"].isoformat(),
        "createdBy": current_user["fullName"]
    }

@app.get("/api/emergency-logs/{log_id}")
def get_emergency_log(
    log_id: str,
    current_user: dict = Depends(get_current_user)
):
    log = emergency_logs_collection.find_one({"_id": ObjectId(log_id)})
    if not log:
        raise HTTPException(status_code=404, detail="Emergency log not found")
    return serialize_doc(log)

# ============== On-Call Assignment Endpoints ==============

@app.get("/api/oncall")
def get_oncall_assignments(
    date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if date:
        query["coverageDate"] = date
    
    assignments = list(oncall_collection.find(query).sort("coverageDate", -1))
    result = []
    for a in assignments:
        doc = serialize_doc(a)
        staff = staff_collection.find_one({"_id": ObjectId(a["staffId"])})
        doc["staffName"] = staff["fullName"] if staff else "Unknown"
        result.append(doc)
    return result

@app.post("/api/oncall", response_model=OnCallResponse)
def create_oncall_assignment(
    assignment: OnCallCreate,
    current_user: dict = Depends(require_role(["admin"]))
):
    # Verify staff exists
    staff = staff_collection.find_one({"_id": ObjectId(assignment.staffId)})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    # Check for existing assignment on same date
    existing = oncall_collection.find_one({"coverageDate": assignment.coverageDate})
    if existing:
        # Update existing assignment
        oncall_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "staffId": assignment.staffId,
                "timeRange": assignment.timeRange,
                "backupContact": assignment.backupContact,
                "notes": assignment.notes
            }}
        )
        return {
            "id": str(existing["_id"]),
            "staffId": assignment.staffId,
            "staffName": staff["fullName"],
            "coverageDate": assignment.coverageDate,
            "timeRange": assignment.timeRange,
            "backupContact": assignment.backupContact,
            "notes": assignment.notes,
            "createdAt": existing["createdAt"].isoformat() if isinstance(existing["createdAt"], datetime) else existing["createdAt"]
        }
    
    assignment_doc = {
        "staffId": assignment.staffId,
        "coverageDate": assignment.coverageDate,
        "timeRange": assignment.timeRange,
        "backupContact": assignment.backupContact,
        "notes": assignment.notes,
        "createdAt": datetime.now(timezone.utc)
    }
    result = oncall_collection.insert_one(assignment_doc)
    
    return {
        "id": str(result.inserted_id),
        "staffId": assignment.staffId,
        "staffName": staff["fullName"],
        "coverageDate": assignment.coverageDate,
        "timeRange": assignment.timeRange,
        "backupContact": assignment.backupContact,
        "notes": assignment.notes,
        "createdAt": assignment_doc["createdAt"].isoformat()
    }

@app.delete("/api/oncall/{assignment_id}")
def delete_oncall_assignment(
    assignment_id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    result = oncall_collection.delete_one({"_id": ObjectId(assignment_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"message": "Assignment deleted successfully"}

# ============== Dashboard Stats ==============

@app.get("/api/dashboard/stats")
def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    stats = {
        "totalPolicies": policies_collection.count_documents({}),
        "totalStaff": staff_collection.count_documents({}),
        "activeStaff": staff_collection.count_documents({"status": "active"}),
        "pendingIncidents": incidents_collection.count_documents({"status": "pending"}),
        "totalIncidents": incidents_collection.count_documents({}),
        "totalEmergencyLogs": emergency_logs_collection.count_documents({}),
        "totalSupervisionLogs": supervision_logs_collection.count_documents({}),
        "compliantStaff": staff_collection.count_documents({"complianceStatus": "compliant"}),
        "pendingCompliance": staff_collection.count_documents({"complianceStatus": "pending"})
    }
    
    # Get today's on-call
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    oncall = oncall_collection.find_one({"coverageDate": today})
    if oncall:
        staff = staff_collection.find_one({"_id": ObjectId(oncall["staffId"])})
        stats["todayOnCall"] = staff["fullName"] if staff else None
    else:
        stats["todayOnCall"] = None
    
    return stats

# ============== Reports/Export Endpoints ==============

@app.get("/api/reports/incidents")
def export_incidents_report(
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    format: str = "json",
    current_user: dict = Depends(require_role(["admin", "qp"]))
):
    query = {}
    if startDate:
        query["date"] = {"$gte": startDate}
    if endDate:
        if "date" in query:
            query["date"]["$lte"] = endDate
        else:
            query["date"] = {"$lte": endDate}
    
    incidents = list(incidents_collection.find(query).sort("date", -1))
    data = [serialize_doc(i) for i in incidents]
    
    if format == "csv":
        # Return CSV-formatted string
        if not data:
            return {"csv": "No data", "count": 0}
        headers = list(data[0].keys())
        csv_lines = [",".join(headers)]
        for row in data:
            csv_lines.append(",".join(str(row.get(h, "")) for h in headers))
        return {"csv": "\n".join(csv_lines), "count": len(data)}
    
    return {"data": data, "count": len(data)}

@app.get("/api/reports/supervision")
def export_supervision_report(
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    qpUserId: Optional[str] = None,
    format: str = "json",
    current_user: dict = Depends(require_role(["admin", "qp"]))
):
    query = {}
    if current_user["role"] == "qp":
        query["qpUserId"] = current_user["id"]
    elif qpUserId:
        query["qpUserId"] = qpUserId
    
    if startDate:
        query["date"] = {"$gte": startDate}
    if endDate:
        if "date" in query:
            query["date"]["$lte"] = endDate
        else:
            query["date"] = {"$lte": endDate}
    
    logs = list(supervision_logs_collection.find(query).sort("date", -1))
    data = [serialize_doc(l) for l in logs]
    
    if format == "csv":
        if not data:
            return {"csv": "No data", "count": 0}
        headers = list(data[0].keys())
        csv_lines = [",".join(headers)]
        for row in data:
            csv_lines.append(",".join(str(row.get(h, "")).replace(",", ";") for h in headers))
        return {"csv": "\n".join(csv_lines), "count": len(data)}
    
    return {"data": data, "count": len(data)}

@app.get("/api/reports/staff-compliance")
def export_staff_compliance_report(
    format: str = "json",
    current_user: dict = Depends(require_role(["admin"]))
):
    staff = list(staff_collection.find().sort("fullName", 1))
    data = []
    
    for s in staff:
        # Get training records
        training = list(training_collection.find({"staffId": str(s["_id"])}))
        training_summary = {t["trainingType"]: t["completed"] for t in training}
        
        # Get policy acknowledgements
        acks = acknowledgements_collection.count_documents({"userId": str(s["_id"])})
        
        data.append({
            "id": str(s["_id"]),
            "fullName": s["fullName"],
            "role": s["role"],
            "status": s["status"],
            "complianceStatus": s["complianceStatus"],
            "hireDate": s["hireDate"],
            "orientationComplete": training_summary.get("orientation", False),
            "hipaaComplete": training_summary.get("hipaa", False),
            "cprComplete": training_summary.get("cpr", False),
            "policiesAcknowledged": acks
        })
    
    if format == "csv":
        if not data:
            return {"csv": "No data", "count": 0}
        headers = list(data[0].keys())
        csv_lines = [",".join(headers)]
        for row in data:
            csv_lines.append(",".join(str(row.get(h, "")) for h in headers))
        return {"csv": "\n".join(csv_lines), "count": len(data)}
    
    return {"data": data, "count": len(data)}

# ============== Users Management (Admin Only) ==============

@app.get("/api/users")
def get_users(current_user: dict = Depends(require_role(["admin"]))):
    users = list(users_collection.find({}, {"password": 0}))
    return [serialize_doc(u) for u in users]

@app.put("/api/users/{user_id}/role")
def update_user_role(
    user_id: str,
    role: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    if role not in ["admin", "qp", "staff"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": role}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Handle QP profile
    if role == "qp":
        existing_profile = qp_profiles_collection.find_one({"userId": user_id})
        if not existing_profile:
            qp_profiles_collection.insert_one({
                "userId": user_id,
                "credentialsUrl": None,
                "scope": "supervision",
                "active": True,
                "createdAt": datetime.now(timezone.utc)
            })
    
    return {"message": "User role updated successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
