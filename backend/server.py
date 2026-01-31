from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import io
import csv
import shutil
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
from enum import Enum
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')

# Payment Configuration (fixed amounts - DO NOT accept from frontend)
PLACEMENT_REQUEST_FEE = 20.00  # $20.00 USD per placement
SUBSCRIPTION_FEE = 49.00  # $49.00 USD per month

# Admin email for notifications (optional)
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', '')
SMTP_CONFIGURED = bool(os.environ.get('SMTP_HOST', ''))

# File uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads' / 'credentials'
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Allowed file types for document uploads
ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Create the main app
app = FastAPI(title="Anchor Placement - Client Placement API")

# Root-level health check for Kubernetes probes (required for deployment)
@app.get("/health")
async def root_health_check():
    """Health check endpoint for Kubernetes liveness/readiness probes"""
    return {"status": "healthy"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Anchor Placement API", "health": "/health", "api": "/api"}

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class PlacementType(str, Enum):
    IDD = "IDD"
    MENTAL_HEALTH = "Mental Health"
    BEHAVIORAL_HEALTH = "Behavioral Health"
    REENTRY = "Reentry"
    POST_HOSPITAL = "Post-Hospital Discharge"
    HOUSING = "Housing"

class AvailabilityStatus(str, Enum):
    AVAILABLE = "Available"
    LIMITED = "Limited"
    FULL = "Full"

class UrgencyLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    URGENT = "Urgent"

# Models
class Placement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    facility_name: str
    facility_type: PlacementType
    location: str
    description: str
    capacity: int
    current_occupancy: int
    availability_status: AvailabilityStatus
    contact_email: str
    contact_phone: str
    services_offered: List[str] = []
    accepts_medicaid: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PlacementCreate(BaseModel):
    facility_name: str
    facility_type: PlacementType
    location: str
    description: str
    capacity: int
    current_occupancy: int = 0
    contact_email: str
    contact_phone: str
    services_offered: List[str] = []
    accepts_medicaid: bool = True

class PlacementRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    referral_source: str  # Hospital, Social Worker, LME, Jail, etc.
    contact_name: str
    contact_email: str
    contact_phone: str
    placement_type_needed: PlacementType
    location_preference: str
    urgency: UrgencyLevel
    services_needed: List[str] = []
    additional_notes: str = ""
    accepts_medicaid_required: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "Pending"

class PlacementRequestCreate(BaseModel):
    referral_source: str
    contact_name: str
    contact_email: str
    contact_phone: str
    placement_type_needed: PlacementType
    location_preference: str
    urgency: UrgencyLevel
    services_needed: List[str] = []
    additional_notes: str = ""
    accepts_medicaid_required: bool = False

class ProviderInquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_name: str
    contact_name: str
    contact_email: str
    contact_phone: str
    inquiry_type: str  # "Start New Placement", "Expand Services", "Partnership"
    description: str
    services_interested: List[str] = []
    status: str = "pending"  # pending, approved, suspended
    admin_notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class ProviderInquiryCreate(BaseModel):
    organization_name: str
    contact_name: str
    contact_email: str
    contact_phone: str
    inquiry_type: str
    description: str
    services_interested: List[str] = []

# Helper function to serialize datetime
def serialize_doc(doc: dict) -> dict:
    if 'created_at' in doc and isinstance(doc['created_at'], datetime):
        doc['created_at'] = doc['created_at'].isoformat()
    return doc

def deserialize_doc(doc: dict) -> dict:
    if 'created_at' in doc and isinstance(doc['created_at'], str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    return doc

# Routes
@api_router.get("/")
async def root():
    return {"message": "Welcome to Anchor Placement - Client Placement API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Placement Types
@api_router.get("/placement-types")
async def get_placement_types():
    return {
        "types": [
            {"value": "IDD", "label": "Intellectual/Developmental Disabilities (IDD)"},
            {"value": "Mental Health", "label": "Mental Health"},
            {"value": "Behavioral Health", "label": "Behavioral Health"},
            {"value": "Reentry", "label": "Reentry Program"},
            {"value": "Post-Hospital Discharge", "label": "Post-Hospital Discharge"},
            {"value": "Housing", "label": "Housing/Shelter"}
        ]
    }

@api_router.get("/referral-sources")
async def get_referral_sources():
    return {
        "sources": [
            "Hospital",
            "Social Worker",
            "LME/MCO",
            "Jail/Corrections",
            "Reentry Program",
            "Housing Authority",
            "Case Manager",
            "Family Member",
            "Other"
        ]
    }

@api_router.get("/services-list")
async def get_services_list():
    return {
        "services": [
            "24/7 Supervision",
            "Medication Management",
            "Behavioral Support",
            "Life Skills Training",
            "Transportation",
            "Meals Provided",
            "Day Programs",
            "Job Training",
            "Counseling Services",
            "Case Management",
            "Crisis Intervention",
            "Substance Abuse Support"
        ]
    }

# Placements CRUD
@api_router.get("/placements", response_model=List[Placement])
async def get_placements(
    placement_type: Optional[str] = None,
    availability: Optional[str] = None,
    location: Optional[str] = None
):
    query = {}
    if placement_type:
        query["facility_type"] = placement_type
    if availability:
        query["availability_status"] = availability
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    placements = await db.placements.find(query, {"_id": 0}).to_list(100)
    for p in placements:
        deserialize_doc(p)
    return placements

@api_router.get("/placements/{placement_id}", response_model=Placement)
async def get_placement(placement_id: str):
    placement = await db.placements.find_one({"id": placement_id}, {"_id": 0})
    if not placement:
        raise HTTPException(status_code=404, detail="Placement not found")
    return deserialize_doc(placement)

@api_router.post("/placements", response_model=Placement)
async def create_placement(input_data: PlacementCreate):
    placement = Placement(**input_data.model_dump())
    
    # Set availability status based on occupancy
    if placement.current_occupancy >= placement.capacity:
        placement.availability_status = AvailabilityStatus.FULL
    elif placement.current_occupancy >= placement.capacity * 0.8:
        placement.availability_status = AvailabilityStatus.LIMITED
    else:
        placement.availability_status = AvailabilityStatus.AVAILABLE
    
    doc = placement.model_dump()
    serialize_doc(doc)
    await db.placements.insert_one(doc)
    return placement

# Placement Requests
@api_router.get("/placement-requests", response_model=List[PlacementRequest])
async def get_placement_requests():
    requests = await db.placement_requests.find({}, {"_id": 0}).to_list(100)
    for r in requests:
        deserialize_doc(r)
    return requests

@api_router.post("/placement-requests", response_model=PlacementRequest)
async def create_placement_request(input_data: PlacementRequestCreate, payment_session_id: str = None):
    """Create a placement request - requires valid payment session"""
    # Verify payment was completed
    if not payment_session_id:
        raise HTTPException(status_code=402, detail="Payment required to submit placement request")
    
    # Check if payment was successful
    payment = await db.payment_transactions.find_one({"session_id": payment_session_id})
    if not payment:
        raise HTTPException(status_code=402, detail="Invalid payment session")
    
    if payment.get("payment_status") != "paid":
        raise HTTPException(status_code=402, detail="Payment not completed")
    
    # Check if this payment was already used
    if payment.get("used_for_request"):
        raise HTTPException(status_code=400, detail="This payment has already been used for a request")
    
    # Create the placement request
    request = PlacementRequest(**input_data.model_dump())
    request_doc = request.model_dump()
    serialize_doc(request_doc)
    request_doc["payment_session_id"] = payment_session_id
    await db.placement_requests.insert_one(request_doc)
    
    # Mark payment as used
    await db.payment_transactions.update_one(
        {"session_id": payment_session_id},
        {"$set": {"used_for_request": request.id, "used_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return request

# Stripe Payment Endpoints
class CreateCheckoutRequest(BaseModel):
    origin_url: str = Field(..., description="Frontend origin URL for success/cancel redirects")
    metadata: Optional[Dict[str, str]] = None

@api_router.post("/payments/checkout/create")
async def create_payment_checkout(request: CreateCheckoutRequest, http_request: Request):
    """Create a Stripe checkout session for placement request payment"""
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    # Build webhook URL
    host_url = str(http_request.base_url).rstrip('/')
    webhook_url = f"{host_url}api/webhook/stripe"
    
    # Initialize Stripe checkout
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Build success and cancel URLs from frontend origin
    success_url = f"{request.origin_url}/place-client/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{request.origin_url}/place-client"
    
    # Create checkout session with fixed amount (NEVER accept amount from frontend)
    checkout_request = CheckoutSessionRequest(
        amount=PLACEMENT_REQUEST_FEE,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=request.metadata or {"type": "placement_request"}
    )
    
    try:
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        transaction_doc = {
            "id": str(uuid.uuid4()),
            "session_id": session.session_id,
            "amount": PLACEMENT_REQUEST_FEE,
            "currency": "usd",
            "payment_status": "pending",
            "metadata": request.metadata or {"type": "placement_request"},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction_doc)
        
        logging.info(f"Created checkout session: {session.session_id}")
        
        return {
            "checkout_url": session.url,
            "session_id": session.session_id,
            "amount": PLACEMENT_REQUEST_FEE
        }
    except Exception as e:
        logging.error(f"Stripe checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")

@api_router.get("/payments/checkout/status/{session_id}")
async def get_payment_status(session_id: str, http_request: Request):
    """Check the status of a payment session"""
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    # Build webhook URL
    host_url = str(http_request.base_url).rstrip('/')
    webhook_url = f"{host_url}api/webhook/stripe"
    
    # Initialize Stripe checkout
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update payment transaction in database
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": status.payment_status,
                "status": status.status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "session_id": session_id,
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
    except Exception as e:
        logging.error(f"Error checking payment status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to check payment status: {str(e)}")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update payment transaction based on webhook event
        if webhook_response.session_id:
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": webhook_response.payment_status,
                    "event_type": webhook_response.event_type,
                    "event_id": webhook_response.event_id,
                    "webhook_received_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        logging.info(f"Webhook processed: {webhook_response.event_type} for session {webhook_response.session_id}")
        return {"status": "received"}
    except Exception as e:
        logging.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/payments/fee")
async def get_placement_fee():
    """Get the current placement request fee"""
    return {
        "amount": PLACEMENT_REQUEST_FEE,
        "currency": "usd",
        "description": "Placement Request Fee"
    }

# Provider Inquiries
@api_router.get("/provider-inquiries", response_model=List[ProviderInquiry])
async def get_provider_inquiries():
    inquiries = await db.provider_inquiries.find({}, {"_id": 0}).to_list(100)
    for i in inquiries:
        deserialize_doc(i)
    return inquiries

@api_router.post("/provider-inquiries", response_model=ProviderInquiry)
async def create_provider_inquiry(input_data: ProviderInquiryCreate):
    inquiry = ProviderInquiry(**input_data.model_dump())
    doc = inquiry.model_dump()
    serialize_doc(doc)
    await db.provider_inquiries.insert_one(doc)
    return inquiry

@api_router.patch("/provider-inquiries/{inquiry_id}")
async def update_provider_inquiry(inquiry_id: str, status: str = None, admin_notes: str = None):
    """Admin endpoint to update provider inquiry status (approve/suspend)"""
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if status:
        if status not in ["pending", "approved", "suspended"]:
            raise HTTPException(status_code=400, detail="Invalid status. Must be: pending, approved, or suspended")
        update_data["status"] = status
    if admin_notes is not None:
        update_data["admin_notes"] = admin_notes
    
    if len(update_data) == 1:  # Only updated_at
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.provider_inquiries.update_one(
        {"id": inquiry_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Provider inquiry not found")
    
    return {"message": f"Provider inquiry {status or 'updated'} successfully", "id": inquiry_id}

@api_router.get("/provider-inquiries/{inquiry_id}")
async def get_provider_inquiry(inquiry_id: str):
    """Get a single provider inquiry by ID"""
    inquiry = await db.provider_inquiries.find_one({"id": inquiry_id}, {"_id": 0})
    if not inquiry:
        raise HTTPException(status_code=404, detail="Provider inquiry not found")
    return serialize_doc(inquiry)

# Seed data endpoint for demo
@api_router.post("/seed-data")
async def seed_demo_data():
    # Check if data already exists
    existing = await db.placements.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded", "count": existing}
    
    demo_placements = [
        {
            "id": str(uuid.uuid4()),
            "facility_name": "Sunrise Care Home",
            "facility_type": "IDD",
            "location": "Raleigh, NC",
            "description": "A warm, supportive residential facility specializing in care for adults with intellectual and developmental disabilities.",
            "capacity": 12,
            "current_occupancy": 8,
            "availability_status": "Available",
            "contact_email": "intake@sunrisecare.example.com",
            "contact_phone": "(919) 555-0101",
            "services_offered": ["24/7 Supervision", "Life Skills Training", "Day Programs", "Transportation"],
            "accepts_medicaid": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "facility_name": "Serenity Mental Health Residence",
            "facility_type": "Mental Health",
            "location": "Durham, NC",
            "description": "Transitional housing with comprehensive mental health support services for adults recovering from psychiatric care.",
            "capacity": 20,
            "current_occupancy": 18,
            "availability_status": "Limited",
            "contact_email": "admissions@serenityresidence.example.com",
            "contact_phone": "(919) 555-0202",
            "services_offered": ["Medication Management", "Counseling Services", "Case Management", "Crisis Intervention"],
            "accepts_medicaid": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "facility_name": "New Horizons Reentry Center",
            "facility_type": "Reentry",
            "location": "Charlotte, NC",
            "description": "Supportive housing and job training for individuals transitioning from incarceration back into the community.",
            "capacity": 30,
            "current_occupancy": 22,
            "availability_status": "Available",
            "contact_email": "intake@newhorizons.example.com",
            "contact_phone": "(704) 555-0303",
            "services_offered": ["Job Training", "Life Skills Training", "Substance Abuse Support", "Case Management"],
            "accepts_medicaid": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "facility_name": "Harbor House Recovery",
            "facility_type": "Behavioral Health",
            "location": "Greensboro, NC",
            "description": "A structured living environment for adults with behavioral health needs, offering comprehensive support services.",
            "capacity": 16,
            "current_occupancy": 16,
            "availability_status": "Full",
            "contact_email": "info@harborhouse.example.com",
            "contact_phone": "(336) 555-0404",
            "services_offered": ["Behavioral Support", "Medication Management", "Counseling Services", "Meals Provided"],
            "accepts_medicaid": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "facility_name": "Community Care Apartments",
            "facility_type": "Post-Hospital Discharge",
            "location": "Raleigh, NC",
            "description": "Short-term transitional housing for patients discharged from hospitals who need additional support before independent living.",
            "capacity": 24,
            "current_occupancy": 15,
            "availability_status": "Available",
            "contact_email": "placement@communitycare.example.com",
            "contact_phone": "(919) 555-0505",
            "services_offered": ["24/7 Supervision", "Medication Management", "Transportation", "Meals Provided"],
            "accepts_medicaid": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.placements.insert_many(demo_placements)
    return {"message": "Demo data seeded successfully", "count": len(demo_placements)}

# Provider Credentials Model
class ProviderCredentials(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_name: str
    state: str
    org_type: str
    checklist_completed: List[str] = []
    documents_uploaded: List[dict] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProviderCredentialsCreate(BaseModel):
    organization_name: str
    state: str
    org_type: str
    checklist_completed: List[str] = []
    documents_uploaded: List[dict] = []
    updated_at: Optional[str] = None

# Provider Credentials Endpoints
@api_router.get("/provider-credentials")
async def get_provider_credentials():
    credentials = await db.provider_credentials.find({}, {"_id": 0}).to_list(100)
    return [serialize_doc(c) for c in credentials]

@api_router.get("/provider-credentials/{org_name}")
async def get_provider_credentials_by_org(org_name: str):
    credential = await db.provider_credentials.find_one(
        {"organization_name": org_name}, 
        {"_id": 0}
    )
    if not credential:
        raise HTTPException(status_code=404, detail="Credentials not found")
    return serialize_doc(credential)

@api_router.post("/provider-credentials")
async def save_provider_credentials(credentials: ProviderCredentialsCreate):
    # Upsert - update if exists, insert if not
    existing = await db.provider_credentials.find_one(
        {"organization_name": credentials.organization_name}
    )
    
    doc = credentials.model_dump()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if existing:
        await db.provider_credentials.update_one(
            {"organization_name": credentials.organization_name},
            {"$set": doc}
        )
        return {"message": "Credentials updated", "organization": credentials.organization_name}
    else:
        doc["id"] = str(uuid.uuid4())
        doc["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.provider_credentials.insert_one(doc)
        return {"message": "Credentials created", "organization": credentials.organization_name}

# Credential Document Upload Endpoints
@api_router.post("/credentials/upload")
async def upload_credential_document(
    file: UploadFile = File(...),
    organization_name: str = Form(...),
    document_type: str = Form(...),
    document_id: str = Form(...)
):
    """Upload a credentialing document"""
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file to check size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Create organization directory
    org_dir = UPLOADS_DIR / organization_name.replace(' ', '_').replace('/', '_')
    org_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    safe_filename = f"{document_id}_{file_id}{file_ext}"
    file_path = org_dir / safe_filename
    
    # Save file
    with open(file_path, 'wb') as f:
        f.write(contents)
    
    # Store file metadata in database
    file_doc = {
        "id": file_id,
        "organization_name": organization_name,
        "document_type": document_type,
        "document_id": document_id,
        "original_filename": file.filename,
        "stored_filename": safe_filename,
        "file_path": str(file_path),
        "file_size": len(contents),
        "file_type": file.content_type,
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.credential_documents.insert_one(file_doc)
    
    logging.info(f"Document uploaded: {file.filename} for {organization_name}")
    
    return {
        "message": "File uploaded successfully",
        "file_id": file_id,
        "filename": file.filename,
        "document_id": document_id,
        "size": len(contents)
    }

@api_router.get("/credentials/documents/{organization_name}")
async def get_organization_documents(organization_name: str):
    """Get all uploaded documents for an organization"""
    documents = await db.credential_documents.find(
        {"organization_name": organization_name},
        {"_id": 0, "file_path": 0}  # Don't expose internal path
    ).to_list(100)
    return documents

@api_router.get("/credentials/download/{file_id}")
async def download_credential_document(file_id: str):
    """Download a specific document"""
    doc = await db.credential_documents.find_one({"id": file_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = Path(doc["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FileResponse(
        path=str(file_path),
        filename=doc["original_filename"],
        media_type=doc.get("file_type", "application/octet-stream")
    )

@api_router.delete("/credentials/documents/{file_id}")
async def delete_credential_document(file_id: str):
    """Delete a credential document"""
    doc = await db.credential_documents.find_one({"id": file_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete physical file
    file_path = Path(doc["file_path"])
    if file_path.exists():
        file_path.unlink()
    
    # Delete from database
    await db.credential_documents.delete_one({"id": file_id})
    
    return {"message": "Document deleted successfully"}

# Housing Interest Model (Public Form - No PHI)
class HousingInterest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # Can be initials
    phone: str
    location: str
    has_disability_income: Optional[bool] = None
    can_pay: Optional[bool] = None
    description: str = ""
    status: str = "pending"  # pending, reviewed, contacted, closed
    admin_notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HousingInterestCreate(BaseModel):
    name: str
    phone: str
    location: str
    has_disability_income: Optional[bool] = None
    can_pay: Optional[bool] = None
    description: str = ""

# Housing Interest Endpoints (Public submission, Admin review)
@api_router.post("/housing-interest")
async def submit_housing_interest(interest: HousingInterestCreate):
    """Public endpoint for individuals to submit housing interest"""
    doc = interest.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "pending"
    doc["admin_notes"] = ""
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.housing_interest.insert_one(doc)
    
    # Store for digest notification (twice per week, not real-time)
    # Admin will see pending count in dashboard - no real-time alerts
    logging.info(f"New housing interest submission from {interest.location} - Added to digest queue")
    
    return {"message": "Housing interest submitted", "id": doc["id"]}

@api_router.get("/housing-interest")
async def get_housing_interest_list():
    """Admin endpoint to list all housing interest submissions"""
    interests = await db.housing_interest.find({}, {"_id": 0}).to_list(100)
    return [serialize_doc(i) for i in interests]

@api_router.get("/housing-interest/digest-summary")
async def get_housing_interest_digest():
    """Admin endpoint to get digest summary for notifications (twice per week)"""
    # Get submissions from the last 3-4 days for bi-weekly digest
    from datetime import timedelta
    cutoff = (datetime.now(timezone.utc) - timedelta(days=4)).isoformat()
    
    recent = await db.housing_interest.find(
        {"created_at": {"$gte": cutoff}, "status": "pending"},
        {"_id": 0, "name": 0, "phone": 0, "description": 0}  # No personal info in digest
    ).to_list(100)
    
    summary = {
        "period": "Last 4 days",
        "total_new_submissions": len(recent),
        "locations": list(set(r.get("location", "Unknown") for r in recent)),
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
    
    return summary

@api_router.get("/housing-interest/export")
async def export_housing_interest_csv():
    """Admin endpoint to export housing interest submissions as CSV"""
    interests = await db.housing_interest.find({}, {"_id": 0}).to_list(1000)
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header row
    writer.writerow([
        "ID", "Name", "Phone", "Location", "Disability Income", 
        "Can Pay", "Description", "Status", "Admin Notes", "Created At"
    ])
    
    # Data rows
    for item in interests:
        writer.writerow([
            item.get("id", ""),
            item.get("name", ""),
            item.get("phone", ""),
            item.get("location", ""),
            "Yes" if item.get("has_disability_income") else "No" if item.get("has_disability_income") is False else "Unknown",
            "Yes" if item.get("can_pay") else "No" if item.get("can_pay") is False else "Unknown",
            item.get("description", ""),
            item.get("status", "pending"),
            item.get("admin_notes", ""),
            item.get("created_at", "")
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=housing-interest-{datetime.now().strftime('%Y%m%d')}.csv"}
    )

# Admin Notifications Endpoints
@api_router.get("/admin/notifications")
async def get_admin_notifications():
    """Get unread admin notifications"""
    notifications = await db.admin_notifications.find(
        {"read": False}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return [serialize_doc(n) for n in notifications]

@api_router.post("/admin/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a notification as read"""
    await db.admin_notifications.update_one(
        {"id": notification_id},
        {"$set": {"read": True}}
    )
    return {"message": "Notification marked as read"}

@api_router.patch("/housing-interest/{interest_id}")
async def update_housing_interest(interest_id: str, status: str = None, admin_notes: str = None):
    """Admin endpoint to update housing interest status"""
    update_data = {}
    if status:
        update_data["status"] = status
    if admin_notes is not None:
        update_data["admin_notes"] = admin_notes
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.housing_interest.update_one(
        {"id": interest_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Housing interest not found")
    
    return {"message": "Updated successfully"}

# Placement Board Models (Public Request Board)
class PlacementBoardRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    display_name: str
    county: str
    state: str = "NC"
    income_type: str
    can_contribute: bool = False
    contribution_amount: Optional[str] = None
    housing_type: Optional[str] = None
    general_notes: str = ""
    contact_phone: str = ""
    contact_email: str = ""
    preferred_contact: str = "phone"

class ConnectionRequest(BaseModel):
    organization_name: str
    contact_name: str
    contact_email: str
    org_type: str

# Placement Board Endpoints
@api_router.post("/placement-board")
async def submit_placement_board_request(request: PlacementBoardRequest):
    """Public endpoint for individuals to submit placement requests"""
    doc = request.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "pending"  # pending, approved, connected, closed
    doc["connection_requests"] = []
    doc["approved_connector"] = None
    doc["admin_notes"] = ""
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["approved_at"] = None
    
    await db.placement_board.insert_one(doc)
    return {"message": "Request submitted for review", "id": doc["id"]}

@api_router.get("/placement-board")
async def get_all_placement_board_requests():
    """Admin endpoint to get all placement board requests"""
    requests = await db.placement_board.find({}, {"_id": 0}).to_list(100)
    return [serialize_doc(r) for r in requests]

@api_router.get("/placement-board/approved")
async def get_approved_placement_requests():
    """Public endpoint to get approved requests (without contact info)"""
    requests = await db.placement_board.find(
        {"status": {"$in": ["approved", "connected"]}},
        {"_id": 0, "contact_phone": 0, "contact_email": 0, "preferred_contact": 0}
    ).to_list(100)
    
    # Add flags for UI
    for req in requests:
        req["has_pending_connection"] = len(req.get("connection_requests", [])) > 0
        req["is_connected"] = req.get("status") == "connected"
    
    return [serialize_doc(r) for r in requests]

@api_router.post("/placement-board/{request_id}/request-connection")
async def request_connection(request_id: str, connection: ConnectionRequest):
    """Agency endpoint to request connection with an individual"""
    # Find the request
    request = await db.placement_board.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request.get("status") not in ["approved"]:
        raise HTTPException(status_code=400, detail="Request is not available for connection")
    
    # Check if already requested
    existing_requests = request.get("connection_requests", [])
    for cr in existing_requests:
        if cr.get("organization_name") == connection.organization_name:
            raise HTTPException(status_code=400, detail="Connection already requested")
    
    # Add connection request
    conn_doc = connection.model_dump()
    conn_doc["requested_at"] = datetime.now(timezone.utc).isoformat()
    conn_doc["status"] = "pending"
    
    await db.placement_board.update_one(
        {"id": request_id},
        {"$push": {"connection_requests": conn_doc}}
    )
    
    return {"message": "Connection request submitted for admin approval"}

@api_router.patch("/placement-board/{request_id}")
async def update_placement_board_request(request_id: str, status: str = None, admin_notes: str = None):
    """Admin endpoint to update request status"""
    update_data = {}
    if status:
        update_data["status"] = status
        if status == "approved":
            update_data["approved_at"] = datetime.now(timezone.utc).isoformat()
    if admin_notes is not None:
        update_data["admin_notes"] = admin_notes
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.placement_board.update_one(
        {"id": request_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {"message": "Updated successfully"}

@api_router.post("/placement-board/{request_id}/approve-connection")
async def approve_connection(request_id: str, organization_name: str):
    """Admin endpoint to approve a connection request"""
    request = await db.placement_board.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Find the connection request
    connection_requests = request.get("connection_requests", [])
    approved_conn = None
    for cr in connection_requests:
        if cr.get("organization_name") == organization_name:
            approved_conn = cr
            break
    
    if not approved_conn:
        raise HTTPException(status_code=404, detail="Connection request not found")
    
    # Update the request
    await db.placement_board.update_one(
        {"id": request_id},
        {
            "$set": {
                "status": "connected",
                "approved_connector": approved_conn,
                "connected_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {
        "message": "Connection approved",
        "contact_info": {
            "phone": request.get("contact_phone"),
            "email": request.get("contact_email"),
            "preferred": request.get("preferred_contact")
        }
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
