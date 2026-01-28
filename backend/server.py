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
audit_logs_collection = db["audit_logs"]

# Create indexes
users_collection.create_index("email", unique=True)
policies_collection.create_index("category")
audit_logs_collection.create_index([("timestamp", -1)])
audit_logs_collection.create_index([("entityType", 1), ("entityId", 1)])
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

# ============== Audit Log Helper ==============

def create_audit_log(
    action: str,
    entity_type: str,
    entity_id: str,
    user_id: str,
    user_name: str,
    changes: dict = None,
    previous_values: dict = None,
    details: str = None
):
    """
    Create an audit log entry for tracking changes
    
    Actions: CREATE, UPDATE, DELETE, VIEW, ACKNOWLEDGE, EXPORT
    Entity Types: policy, staff, training, supervision, incident, emergency, oncall, user
    """
    audit_entry = {
        "action": action,
        "entityType": entity_type,
        "entityId": entity_id,
        "userId": user_id,
        "userName": user_name,
        "changes": changes,
        "previousValues": previous_values,
        "details": details,
        "timestamp": datetime.now(timezone.utc),
        "ipAddress": None  # Could be captured from request in production
    }
    audit_logs_collection.insert_one(audit_entry)

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

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads", "policies")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.txt', '.rtf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def get_file_extension(filename: str) -> str:
    return os.path.splitext(filename)[1].lower()

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
    
    # Handle file content (base64 encoded)
    file_url = None
    file_path = None
    if policy.fileContent and policy.fileName:
        ext = get_file_extension(policy.fileName)
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"File type {ext} not allowed")
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Decode and save file
        try:
            file_data = base64.b64decode(policy.fileContent)
            if len(file_data) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
            with open(file_path, "wb") as f:
                f.write(file_data)
            file_url = f"/api/policies/files/{unique_filename}"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to save file: {str(e)}")
    
    policy_doc = {
        "policyName": policy.policyName,
        "category": policy.category,
        "version": version,
        "effectiveDate": policy.effectiveDate,
        "fileUrl": file_url,
        "fileName": policy.fileName,
        "filePath": file_path,
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

@app.post("/api/policies/upload")
async def upload_policy_file(
    policyName: str = Form(...),
    category: str = Form(...),
    effectiveDate: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Upload a policy document file directly"""
    # Validate file extension
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # Read file content
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    # Get latest version for this policy name
    existing = policies_collection.find_one(
        {"policyName": policyName},
        sort=[("version", -1)]
    )
    version = (existing["version"] + 1) if existing else 1
    
    # Generate unique filename and save
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    file_url = f"/api/policies/files/{unique_filename}"
    
    policy_doc = {
        "policyName": policyName,
        "category": category,
        "version": version,
        "effectiveDate": effectiveDate,
        "fileUrl": file_url,
        "fileName": file.filename,
        "filePath": file_path,
        "fileSize": len(content),
        "mimeType": file.content_type,
        "uploadedBy": current_user["id"],
        "uploadedByName": current_user["fullName"],
        "uploadedAt": datetime.now(timezone.utc)
    }
    result = policies_collection.insert_one(policy_doc)
    
    return {
        "id": str(result.inserted_id),
        "policyName": policyName,
        "category": category,
        "version": version,
        "effectiveDate": effectiveDate,
        "fileUrl": file_url,
        "fileName": file.filename,
        "fileSize": len(content),
        "uploadedBy": current_user["fullName"],
        "uploadedAt": policy_doc["uploadedAt"].isoformat()
    }

@app.get("/api/policies/files/{filename}")
def download_policy_file(
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Download/view a policy document file"""
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Get policy info for mime type
    policy = policies_collection.find_one({"fileUrl": f"/api/policies/files/{filename}"})
    
    # Determine content type
    ext = get_file_extension(filename)
    content_types = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain',
        '.rtf': 'application/rtf'
    }
    content_type = policy.get('mimeType') if policy else content_types.get(ext, 'application/octet-stream')
    
    # Read file and return
    with open(file_path, "rb") as f:
        content = f.read()
    
    original_filename = policy.get('fileName', filename) if policy else filename
    
    return StreamingResponse(
        BytesIO(content),
        media_type=content_type,
        headers={
            "Content-Disposition": f'inline; filename="{original_filename}"',
            "Content-Length": str(len(content))
        }
    )

@app.get("/api/policies/{policy_id}")
def get_policy(policy_id: str, current_user: dict = Depends(get_current_user)):
    policy = policies_collection.find_one({"_id": ObjectId(policy_id)})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return serialize_doc(policy)

@app.get("/api/policies/{policy_id}/versions")
def get_policy_versions(
    policy_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all versions of a policy by name"""
    policy = policies_collection.find_one({"_id": ObjectId(policy_id)})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Find all versions with same name
    versions = list(policies_collection.find(
        {"policyName": policy["policyName"]}
    ).sort("version", -1))
    
    return [serialize_doc(v) for v in versions]

@app.delete("/api/policies/{policy_id}")
def delete_policy(
    policy_id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    # Get policy to find file path
    policy = policies_collection.find_one({"_id": ObjectId(policy_id)})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Delete file if exists
    if policy.get("filePath") and os.path.exists(policy["filePath"]):
        try:
            os.remove(policy["filePath"])
        except:
            pass  # Ignore file deletion errors
    
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
    # Get previous values for audit log
    staff = staff_collection.find_one({"_id": ObjectId(staff_id)})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Store previous values for audit
    previous_values = {k: staff.get(k) for k in update_dict.keys()}
    
    result = staff_collection.update_one(
        {"_id": ObjectId(staff_id)},
        {"$set": update_dict}
    )
    
    # Create audit log
    create_audit_log(
        action="UPDATE",
        entity_type="staff",
        entity_id=staff_id,
        user_id=current_user["id"],
        user_name=current_user["fullName"],
        changes=update_dict,
        previous_values=previous_values,
        details=f"Updated staff member: {staff.get('fullName', 'Unknown')}"
    )
    
    return {"message": "Staff member updated successfully"}

@app.delete("/api/staff/{staff_id}")
def delete_staff(
    staff_id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    # Get staff info for audit log
    staff = staff_collection.find_one({"_id": ObjectId(staff_id)})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    result = staff_collection.delete_one({"_id": ObjectId(staff_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    # Create audit log
    create_audit_log(
        action="DELETE",
        entity_type="staff",
        entity_id=staff_id,
        user_id=current_user["id"],
        user_name=current_user["fullName"],
        details=f"Deleted staff member: {staff.get('fullName', 'Unknown')}"
    )
    
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
    # Get previous values for audit
    incident = incidents_collection.find_one({"_id": ObjectId(incident_id)})
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if "reviewedBy" in update_dict:
        update_dict["reviewedBy"] = current_user["fullName"]
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Store previous values
    previous_values = {k: incident.get(k) for k in update_dict.keys()}
    
    result = incidents_collection.update_one(
        {"_id": ObjectId(incident_id)},
        {"$set": update_dict}
    )
    
    # Create audit log
    create_audit_log(
        action="UPDATE",
        entity_type="incident",
        entity_id=incident_id,
        user_id=current_user["id"],
        user_name=current_user["fullName"],
        changes=update_dict,
        previous_values=previous_values,
        details=f"Updated incident from {incident.get('date', 'Unknown')} - Status: {update_dict.get('status', 'unchanged')}"
    )
    
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

# ============== PDF Generation Helpers ==============

def create_pdf_styles():
    """Create custom styles for PDF reports"""
    styles = getSampleStyleSheet()
    
    # Header style
    styles.add(ParagraphStyle(
        name='ReportTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=20,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1e3a5f')
    ))
    
    # Subheader style
    styles.add(ParagraphStyle(
        name='ReportSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=20,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#64748b')
    ))
    
    # Section header
    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=15,
        spaceAfter=10,
        textColor=colors.HexColor('#1e3a5f')
    ))
    
    # Warning style
    styles.add(ParagraphStyle(
        name='Warning',
        parent=styles['Normal'],
        fontSize=10,
        spaceBefore=10,
        spaceAfter=10,
        backColor=colors.HexColor('#fef3c7'),
        borderColor=colors.HexColor('#f59e0b'),
        borderWidth=1,
        borderPadding=8,
        textColor=colors.HexColor('#92400e')
    ))
    
    return styles

# Agency settings (could be stored in DB in future)
AGENCY_NAME = "AnchorPoint Peer Support Agency"
AGENCY_TAGLINE = "Non-PHI Compliance Toolkit"

class NumberedCanvas:
    """Canvas class to add page numbers and headers/footers"""
    def __init__(self, doc, agency_name=AGENCY_NAME):
        self.doc = doc
        self.agency_name = agency_name
        self.pages = []
        
    def afterPage(self):
        self.pages.append(dict(self.doc.page.__dict__))
        
    def beforePage(self):
        pass

def add_page_number(canvas, doc):
    """Add page number and footer to each page"""
    canvas.saveState()
    
    # Footer line
    canvas.setStrokeColor(colors.HexColor('#e2e8f0'))
    canvas.line(40, 35, letter[0] - 40, 35)
    
    # Page number
    page_num = canvas.getPageNumber()
    text = f"Page {page_num}"
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(colors.HexColor('#64748b'))
    canvas.drawRightString(letter[0] - 40, 20, text)
    
    # Footer left - Agency name
    canvas.drawString(40, 20, AGENCY_NAME)
    
    # Footer center - NON-PHI notice
    canvas.setFont('Helvetica-Bold', 8)
    canvas.setFillColor(colors.HexColor('#92400e'))
    canvas.drawCentredString(letter[0]/2, 20, "NON-PHI DOCUMENT")
    
    canvas.restoreState()

def add_pdf_header(story, styles, title, subtitle=None, date_range=None):
    """Add standard header to PDF with agency branding"""
    # Agency Name
    story.append(Paragraph(AGENCY_NAME, styles['ReportTitle']))
    story.append(Spacer(1, 5))
    
    # NON-PHI Warning Banner
    warning_text = "⚠ NON-PHI MODE — This report does not contain Protected Health Information. Client references are limited to initials or non-identifying codes only."
    story.append(Paragraph(warning_text, styles['Warning']))
    story.append(Spacer(1, 15))
    
    # Report Title
    story.append(Paragraph(title, styles['SectionHeader']))
    
    # Date range if provided
    if date_range:
        story.append(Paragraph(f"Report Period: {date_range}", styles['ReportSubtitle']))
    
    # Generated timestamp
    generated_text = f"Generated: {datetime.now(timezone.utc).strftime('%B %d, %Y at %I:%M %p UTC')}"
    story.append(Paragraph(generated_text, styles['ReportSubtitle']))
    story.append(Spacer(1, 20))

def create_table_style():
    """Create standard table style"""
    return TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ])

def add_pdf_footer(story, styles):
    """Add standard footer to report"""
    story.append(Spacer(1, 30))
    footer_text = f"{AGENCY_NAME} | {AGENCY_TAGLINE} | Confidential - For Internal Use Only"
    story.append(Paragraph(footer_text, styles['ReportSubtitle']))

# ============== PDF Export Endpoints ==============

@app.get("/api/reports/pdf/incidents")
def export_incidents_pdf(
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(require_role(["admin", "qp"]))
):
    """Generate PDF report of incident reports"""
    # Build query
    query = {}
    if status:
        query["status"] = status
    if startDate:
        query["date"] = {"$gte": startDate}
    if endDate:
        if "date" in query:
            query["date"]["$lte"] = endDate
        else:
            query["date"] = {"$lte": endDate}
    
    incidents = list(incidents_collection.find(query).sort("date", -1))
    
    # Create PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = create_pdf_styles()
    story = []
    
    # Header
    date_range = ""
    if startDate and endDate:
        date_range = f"{startDate} to {endDate}"
    elif startDate:
        date_range = f"From {startDate}"
    elif endDate:
        date_range = f"Through {endDate}"
    
    add_pdf_header(story, styles, "Incident Reports", date_range if date_range else "All Records")
    
    # Summary stats
    total = len(incidents)
    pending = sum(1 for i in incidents if i.get('status') == 'pending')
    reviewed = sum(1 for i in incidents if i.get('status') == 'reviewed')
    closed = sum(1 for i in incidents if i.get('status') == 'closed')
    
    summary_data = [
        ['Total Incidents', 'Pending', 'Reviewed', 'Closed'],
        [str(total), str(pending), str(reviewed), str(closed)]
    ]
    summary_table = Table(summary_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
    summary_table.setStyle(create_table_style())
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    if incidents:
        # Incidents table
        story.append(Paragraph("Incident Details", styles['SectionHeader']))
        
        table_data = [['Date', 'Time', 'Type', 'Location', 'Client Ref', 'Status', 'Follow-up']]
        for incident in incidents:
            table_data.append([
                incident.get('date', 'N/A'),
                incident.get('time', 'N/A'),
                incident.get('incidentType', 'N/A'),
                incident.get('location', 'N/A')[:20],
                incident.get('clientRef', 'N/A'),
                incident.get('status', 'N/A').capitalize(),
                'Yes' if incident.get('followUpRequired') else 'No'
            ])
        
        table = Table(table_data, colWidths=[0.8*inch, 0.6*inch, 0.9*inch, 1.2*inch, 0.8*inch, 0.8*inch, 0.7*inch])
        table.setStyle(create_table_style())
        story.append(table)
        
        # Detailed incident descriptions
        story.append(Spacer(1, 20))
        story.append(Paragraph("Incident Descriptions", styles['SectionHeader']))
        
        for i, incident in enumerate(incidents[:20], 1):  # Limit to 20 for readability
            story.append(Paragraph(
                f"<b>#{i} - {incident.get('date', 'N/A')} ({incident.get('incidentType', 'N/A')})</b>",
                styles['Normal']
            ))
            story.append(Paragraph(
                f"<i>Location:</i> {incident.get('location', 'N/A')} | <i>Client:</i> {incident.get('clientRef', 'N/A')}",
                styles['Normal']
            ))
            story.append(Paragraph(
                f"<i>Description:</i> {incident.get('description', 'N/A')[:300]}",
                styles['Normal']
            ))
            story.append(Paragraph(
                f"<i>Actions Taken:</i> {incident.get('actionsTaken', 'N/A')[:200]}",
                styles['Normal']
            ))
            story.append(Spacer(1, 10))
    else:
        story.append(Paragraph("No incidents found for the selected criteria.", styles['Normal']))
    
    # Footer
    add_pdf_footer(story, styles)
    
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    buffer.seek(0)
    
    filename = f"incidents_report_{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/api/reports/pdf/supervision")
def export_supervision_pdf(
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    qpUserId: Optional[str] = None,
    current_user: dict = Depends(require_role(["admin", "qp"]))
):
    """Generate PDF report of QP supervision logs"""
    # Build query
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
    
    # Create PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = create_pdf_styles()
    story = []
    
    # Header
    date_range = ""
    if startDate and endDate:
        date_range = f"{startDate} to {endDate}"
    elif startDate:
        date_range = f"From {startDate}"
    elif endDate:
        date_range = f"Through {endDate}"
    
    add_pdf_header(story, styles, "QP Supervision Logs", date_range if date_range else "All Records")
    
    # Summary
    total = len(logs)
    individual = sum(1 for l in logs if l.get('type') == 'individual')
    group = sum(1 for l in logs if l.get('type') == 'group')
    observation = sum(1 for l in logs if l.get('type') == 'observation')
    
    summary_data = [
        ['Total Sessions', 'Individual', 'Group', 'Observation'],
        [str(total), str(individual), str(group), str(observation)]
    ]
    summary_table = Table(summary_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
    summary_table.setStyle(create_table_style())
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    if logs:
        # Logs table
        story.append(Paragraph("Supervision Session Summary", styles['SectionHeader']))
        
        table_data = [['Date', 'Staff Member', 'QP Supervisor', 'Type', 'Topics']]
        for log in logs:
            topics = ", ".join(log.get('topics', [])[:3])
            if len(log.get('topics', [])) > 3:
                topics += "..."
            table_data.append([
                log.get('date', 'N/A'),
                log.get('staffName', 'N/A')[:15],
                log.get('qpName', 'N/A')[:15],
                log.get('type', 'N/A').capitalize(),
                topics[:30]
            ])
        
        table = Table(table_data, colWidths=[0.8*inch, 1.2*inch, 1.2*inch, 0.9*inch, 2*inch])
        table.setStyle(create_table_style())
        story.append(table)
        
        # Detailed session notes
        story.append(Spacer(1, 20))
        story.append(Paragraph("Session Details", styles['SectionHeader']))
        
        for i, log in enumerate(logs[:15], 1):  # Limit to 15 for readability
            story.append(Paragraph(
                f"<b>Session #{i} - {log.get('date', 'N/A')}</b>",
                styles['Normal']
            ))
            story.append(Paragraph(
                f"<i>Staff:</i> {log.get('staffName', 'N/A')} | <i>QP:</i> {log.get('qpName', 'N/A')} | <i>Type:</i> {log.get('type', 'N/A').capitalize()}",
                styles['Normal']
            ))
            story.append(Paragraph(
                f"<i>Topics:</i> {', '.join(log.get('topics', []))}",
                styles['Normal']
            ))
            story.append(Paragraph(
                f"<i>Notes:</i> {log.get('notes', 'N/A')[:400]}",
                styles['Normal']
            ))
            story.append(Paragraph(
                f"<i>Signed:</i> {log.get('signedName', 'N/A')}",
                styles['Normal']
            ))
            story.append(Spacer(1, 10))
    else:
        story.append(Paragraph("No supervision logs found for the selected criteria.", styles['Normal']))
    
    # Footer
    story.append(Spacer(1, 30))
    footer_text = "AnchorPoint Compliance Toolkit | NON-PHI Tier 1 Report"
    story.append(Paragraph(footer_text, styles['ReportSubtitle']))
    
    doc.build(story)
    buffer.seek(0)
    
    filename = f"supervision_report_{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/api/reports/pdf/compliance")
def export_compliance_pdf(
    current_user: dict = Depends(require_role(["admin"]))
):
    """Generate PDF report of staff training and compliance status"""
    staff = list(staff_collection.find().sort("fullName", 1))
    
    # Create PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = create_pdf_styles()
    story = []
    
    # Header
    add_pdf_header(story, styles, "Staff Training & Compliance Report", "Complete Staff Compliance Overview")
    
    # Summary stats
    total = len(staff)
    compliant = sum(1 for s in staff if s.get('complianceStatus') == 'compliant')
    pending = sum(1 for s in staff if s.get('complianceStatus') == 'pending')
    active = sum(1 for s in staff if s.get('status') == 'active')
    
    summary_data = [
        ['Total Staff', 'Active', 'Compliant', 'Pending Compliance'],
        [str(total), str(active), str(compliant), str(pending)]
    ]
    summary_table = Table(summary_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
    summary_table.setStyle(create_table_style())
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    if staff:
        # Staff compliance table
        story.append(Paragraph("Staff Compliance Status", styles['SectionHeader']))
        
        table_data = [['Name', 'Role', 'Status', 'Compliance', 'Hire Date']]
        for member in staff:
            table_data.append([
                member.get('fullName', 'N/A')[:20],
                member.get('role', 'N/A').capitalize(),
                member.get('status', 'N/A').capitalize(),
                member.get('complianceStatus', 'N/A').capitalize(),
                member.get('hireDate', 'N/A')
            ])
        
        table = Table(table_data, colWidths=[1.5*inch, 1*inch, 0.9*inch, 1*inch, 0.9*inch])
        table.setStyle(create_table_style())
        story.append(table)
        
        # Training details per staff
        story.append(Spacer(1, 20))
        story.append(Paragraph("Training Records by Staff Member", styles['SectionHeader']))
        
        required_training = ['orientation', 'hipaa', 'cpr']
        training_labels = {
            'orientation': 'New Employee Orientation',
            'hipaa': 'HIPAA Privacy Training',
            'cpr': 'CPR/First Aid Certification',
            'crisis': 'Crisis Intervention',
            'de_escalation': 'De-escalation Training',
            'cultural_competency': 'Cultural Competency',
            'annual_review': 'Annual Compliance Review'
        }
        
        for member in staff:
            staff_id = str(member['_id'])
            training_records = list(training_collection.find({"staffId": staff_id}))
            training_dict = {t['trainingType']: t for t in training_records}
            
            story.append(Paragraph(
                f"<b>{member.get('fullName', 'N/A')}</b> ({member.get('role', 'N/A').capitalize()})",
                styles['Normal']
            ))
            
            training_status = []
            for req in required_training:
                record = training_dict.get(req)
                if record and record.get('completed'):
                    status = f"✓ {training_labels.get(req, req)}"
                    if record.get('completionDate'):
                        status += f" (Completed: {record['completionDate']})"
                else:
                    status = f"✗ {training_labels.get(req, req)} - PENDING"
                training_status.append(status)
            
            for status in training_status:
                story.append(Paragraph(f"    {status}", styles['Normal']))
            
            # Optional training
            optional = [t for t in training_records if t['trainingType'] not in required_training and t.get('completed')]
            if optional:
                story.append(Paragraph("    <i>Additional Training:</i>", styles['Normal']))
                for t in optional:
                    story.append(Paragraph(
                        f"        ✓ {training_labels.get(t['trainingType'], t['trainingType'])}",
                        styles['Normal']
                    ))
            
            story.append(Spacer(1, 10))
    else:
        story.append(Paragraph("No staff members found.", styles['Normal']))
    
    # Footer
    story.append(Spacer(1, 30))
    footer_text = "AnchorPoint Compliance Toolkit | NON-PHI Tier 1 Report"
    story.append(Paragraph(footer_text, styles['ReportSubtitle']))
    
    doc.build(story)
    buffer.seek(0)
    
    filename = f"compliance_report_{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/api/reports/pdf/emergency")
def export_emergency_pdf(
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    current_user: dict = Depends(require_role(["admin", "qp"]))
):
    """Generate PDF report of emergency logs"""
    # Build query
    query = {}
    if startDate:
        query["date"] = {"$gte": startDate}
    if endDate:
        if "date" in query:
            query["date"]["$lte"] = endDate
        else:
            query["date"] = {"$lte": endDate}
    
    logs = list(emergency_logs_collection.find(query).sort("date", -1))
    
    # Create PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = create_pdf_styles()
    story = []
    
    # Header
    date_range = ""
    if startDate and endDate:
        date_range = f"{startDate} to {endDate}"
    elif startDate:
        date_range = f"From {startDate}"
    elif endDate:
        date_range = f"Through {endDate}"
    
    add_pdf_header(story, styles, "Emergency Coverage Logs", date_range if date_range else "All Records")
    
    # Summary by type
    total = len(logs)
    medical = sum(1 for l in logs if l.get('emergencyType') == 'medical')
    behavioral = sum(1 for l in logs if l.get('emergencyType') == 'behavioral')
    environmental = sum(1 for l in logs if l.get('emergencyType') == 'environmental')
    other = sum(1 for l in logs if l.get('emergencyType') == 'other')
    
    summary_data = [
        ['Total', 'Medical', 'Behavioral', 'Environmental', 'Other'],
        [str(total), str(medical), str(behavioral), str(environmental), str(other)]
    ]
    summary_table = Table(summary_data, colWidths=[1.2*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1.2*inch])
    summary_table.setStyle(create_table_style())
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    if logs:
        # Logs table
        story.append(Paragraph("Emergency Log Summary", styles['SectionHeader']))
        
        table_data = [['Date', 'Time', 'Type', 'Client Ref', 'Outcome']]
        for log in logs:
            table_data.append([
                log.get('date', 'N/A'),
                log.get('time', 'N/A'),
                log.get('emergencyType', 'N/A').capitalize(),
                log.get('clientRef', 'N/A'),
                log.get('outcome', 'N/A')[:25]
            ])
        
        table = Table(table_data, colWidths=[0.9*inch, 0.7*inch, 1.1*inch, 0.9*inch, 2.2*inch])
        table.setStyle(create_table_style())
        story.append(table)
        
        # Detailed logs
        story.append(Spacer(1, 20))
        story.append(Paragraph("Emergency Response Details", styles['SectionHeader']))
        
        for i, log in enumerate(logs[:15], 1):
            story.append(Paragraph(
                f"<b>Emergency #{i} - {log.get('date', 'N/A')} at {log.get('time', 'N/A')}</b>",
                styles['Normal']
            ))
            story.append(Paragraph(
                f"<i>Type:</i> {log.get('emergencyType', 'N/A').capitalize()} | <i>Client:</i> {log.get('clientRef', 'N/A')}",
                styles['Normal']
            ))
            story.append(Paragraph(
                f"<i>Response:</i> {log.get('responseTaken', 'N/A')[:300]}",
                styles['Normal']
            ))
            story.append(Paragraph(
                f"<i>Outcome:</i> {log.get('outcome', 'N/A')[:200]}",
                styles['Normal']
            ))
            if log.get('followUp'):
                story.append(Paragraph(
                    f"<i>Follow-up:</i> {log.get('followUp', '')[:150]}",
                    styles['Normal']
                ))
            story.append(Spacer(1, 10))
    else:
        story.append(Paragraph("No emergency logs found for the selected criteria.", styles['Normal']))
    
    # Footer
    story.append(Spacer(1, 30))
    footer_text = "AnchorPoint Compliance Toolkit | NON-PHI Tier 1 Report"
    story.append(Paragraph(footer_text, styles['ReportSubtitle']))
    
    doc.build(story)
    buffer.seek(0)
    
    filename = f"emergency_report_{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ============== Audit Trail Endpoints ==============

@app.get("/api/audit-logs")
def get_audit_logs(
    entityType: Optional[str] = None,
    entityId: Optional[str] = None,
    action: Optional[str] = None,
    userId: Optional[str] = None,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Get audit logs with optional filters"""
    query = {}
    
    if entityType:
        query["entityType"] = entityType
    if entityId:
        query["entityId"] = entityId
    if action:
        query["action"] = action
    if userId:
        query["userId"] = userId
    
    if startDate or endDate:
        query["timestamp"] = {}
        if startDate:
            query["timestamp"]["$gte"] = datetime.fromisoformat(startDate.replace('Z', '+00:00'))
        if endDate:
            query["timestamp"]["$lte"] = datetime.fromisoformat(endDate.replace('Z', '+00:00'))
    
    total = audit_logs_collection.count_documents(query)
    logs = list(audit_logs_collection.find(query).sort("timestamp", -1).skip(skip).limit(limit))
    
    return {
        "logs": [serialize_doc(log) for log in logs],
        "total": total,
        "limit": limit,
        "skip": skip
    }

@app.get("/api/audit-logs/entity/{entity_type}/{entity_id}")
def get_entity_audit_history(
    entity_type: str,
    entity_id: str,
    current_user: dict = Depends(require_role(["admin", "qp"]))
):
    """Get complete audit history for a specific entity"""
    logs = list(audit_logs_collection.find({
        "entityType": entity_type,
        "entityId": entity_id
    }).sort("timestamp", -1))
    
    return [serialize_doc(log) for log in logs]

@app.get("/api/audit-logs/recent")
def get_recent_activity(
    limit: int = 20,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Get recent audit activity across all entities"""
    logs = list(audit_logs_collection.find().sort("timestamp", -1).limit(limit))
    return [serialize_doc(log) for log in logs]

@app.get("/api/audit-logs/summary")
def get_audit_summary(
    days: int = 7,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Get summary of audit activity for the past N days"""
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Get counts by action type
    pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {"_id": "$action", "count": {"$sum": 1}}}
    ]
    action_counts = {doc["_id"]: doc["count"] for doc in audit_logs_collection.aggregate(pipeline)}
    
    # Get counts by entity type
    pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {"_id": "$entityType", "count": {"$sum": 1}}}
    ]
    entity_counts = {doc["_id"]: doc["count"] for doc in audit_logs_collection.aggregate(pipeline)}
    
    # Get most active users
    pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {"_id": {"userId": "$userId", "userName": "$userName"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    top_users = [{"userId": doc["_id"]["userId"], "userName": doc["_id"]["userName"], "count": doc["count"]} 
                 for doc in audit_logs_collection.aggregate(pipeline)]
    
    total_events = audit_logs_collection.count_documents({"timestamp": {"$gte": start_date}})
    
    return {
        "period": f"Last {days} days",
        "totalEvents": total_events,
        "byAction": action_counts,
        "byEntityType": entity_counts,
        "topUsers": top_users
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
