from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Anchor Place - Client Placement API")

# Root-level health check for Kubernetes probes
@app.get("/health")
async def root_health_check():
    return {"status": "healthy"}

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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    return {"message": "Welcome to Anchor Place - Client Placement API"}

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
async def create_placement_request(input_data: PlacementRequestCreate):
    request = PlacementRequest(**input_data.model_dump())
    doc = request.model_dump()
    serialize_doc(doc)
    await db.placement_requests.insert_one(doc)
    return request

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
