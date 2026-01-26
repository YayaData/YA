from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hashlib
import jwt
import secrets
from pathlib import Path
from pydantic import BaseModel, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Admin credentials from environment variables
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD_HASH = os.environ.get('ADMIN_PASSWORD_HASH')
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_urlsafe(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Rate limiting configuration
MAX_LOGIN_ATTEMPTS = 3
LOCKOUT_DURATION_MINUTES = 5
login_attempts = {}  # IP -> {count, last_attempt, locked_until}
NAVY = colors.HexColor('#0F172A')
GOLD = colors.HexColor('#B45309')

# ============== MODELS ==============
class OfficialLink(BaseModel):
    name: str
    url: str
    description: Optional[str] = None
    category: str

class MCOInfo(BaseModel):
    name: str
    credentialing_url: str
    contracting_url: Optional[str] = None
    provider_portal_url: Optional[str] = None
    provider_handbook_url: Optional[str] = None
    phone: Optional[str] = None

class LawReference(BaseModel):
    title: str
    category: str
    summary: str
    official_url: str
    last_verified: str

class CredentialingRequirement(BaseModel):
    item: str
    description: str
    required: bool = True
    notes: Optional[str] = None

class ZoningInfo(BaseModel):
    virtual_allowed: bool
    office_required: bool
    home_office_notes: str
    local_requirements: List[str]

class StateDataEnhanced(BaseModel):
    model_config = ConfigDict(extra="ignore")
    state_code: str
    state_name: str
    is_fully_populated: bool = False
    # Certification
    certification_name: str
    certification_authority: str
    certification_url: str
    who_qualifies: str
    training_hours: str
    # Medicaid
    medicaid_agency_name: str
    medicaid_enrollment_url: str
    medicaid_manual_url: Optional[str] = None
    fee_schedule_url: Optional[str] = None
    # Behavioral Health Authority
    behavioral_health_authority: str
    behavioral_health_url: str
    # Supervision
    supervision_required: bool
    supervision_details: str
    accepted_supervisor_licenses: List[str]
    # Virtual/Telehealth
    virtual_allowed: str
    telehealth_notes: Optional[str] = None
    # Business
    business_entity_type: str
    in_state_required: bool
    secretary_of_state_url: str
    # MCOs
    managed_care_orgs: List[MCOInfo]
    # Official Links
    official_links: List[OfficialLink]
    # Laws
    laws_and_rules: List[LawReference]
    # Credentialing
    credentialing_requirements: List[CredentialingRequirement]
    # Zoning
    zoning_info: ZoningInfo
    # Billing
    common_billing_codes: List[str]
    units_of_service: str
    documentation_requirements: str
    reimbursement_notes: str
    # Checklist
    checklist: List[dict]
    # Metadata
    last_verified: str

class EmailCapture(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    source: str
    template_id: Optional[str] = None
    state: Optional[str] = None

class ConsultationRequest(BaseModel):
    name: str
    email: EmailStr
    state: str
    phone: Optional[str] = None
    message: str

class CheckoutRequest(BaseModel):
    product_id: str
    origin_url: str

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminTokenResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    message: Optional[str] = None

# User Account Models
class UserCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class MagicLinkRequest(BaseModel):
    email: EmailStr

class MagicLinkVerify(BaseModel):
    token: str

class UserProgress(BaseModel):
    state_code: str
    completed_steps: List[int] = []
    bookmarked_links: List[str] = []
    notes: Optional[str] = None

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    selected_state: Optional[str] = None
    goal: Optional[str] = None

class OnboardingData(BaseModel):
    selected_state: str
    goal: str
    name: Optional[str] = None

# Broken Link Report Model
class BrokenLinkReport(BaseModel):
    url: str
    page: str
    state_code: Optional[str] = None
    description: Optional[str] = None
    reporter_email: Optional[EmailStr] = None

class StateCheckoutRequest(BaseModel):
    state_code: str
    origin_url: str

# ============== CONSTANTS ==============
PRODUCTS = {
    "premium-access": {"name": "Premium Access", "price": 49.00, "description": "Unlock all steps, templates, and state-specific guidance", "state_specific": True, "grants_premium": True},
    "templates-bundle": {"name": "Editable Templates Bundle", "price": 97.00, "description": "All templates in Word/Excel format", "state_specific": False, "grants_premium": True},
    "consultation": {"name": "Strategy Consultation", "price": 197.00, "description": "1-hour strategy call with expert", "state_specific": False, "grants_premium": False},
    "full-course": {"name": "Full Launch Course", "price": 297.00, "description": "Video course + all templates + premium access", "state_specific": True, "grants_premium": True}
}

# Document Shop - À-la-carte document purchases for experienced users
DOCUMENT_SHOP_PRODUCTS = {
    "doc-pp-manual": {
        "id": "doc-pp-manual",
        "name": "Policies & Procedures Manual (Peer Support)",
        "price": 47.00,
        "description": "A complete operational manual covering service delivery, supervision, training, documentation, confidentiality, and site visit readiness.",
        "includes": ["Service delivery policies", "Supervision requirements", "Training protocols", "Documentation standards", "Confidentiality procedures", "Site visit preparation"],
        "format": "Word (.docx) - fully editable",
        "scope": "core",
        "scope_label": "Core – Works in All States",
        "scope_note": "Universal policies designed to meet standard Medicaid and MCO requirements nationwide."
    },
    "doc-hiring-packet": {
        "id": "doc-hiring-packet",
        "name": "Hiring & Onboarding Packet",
        "price": 37.00,
        "description": "Job descriptions, onboarding checklist, confidentiality agreement, and staff acknowledgment forms.",
        "includes": ["Job descriptions", "Onboarding checklist", "Confidentiality agreement", "Staff acknowledgment forms"],
        "format": "Word (.docx) + Excel (.xlsx)",
        "scope": "core",
        "scope_label": "Core – Works in All States",
        "scope_note": "Standard HR documents suitable for peer support agencies in any state."
    },
    "doc-employee-handbook": {
        "id": "doc-employee-handbook",
        "name": "Staff Rules & Employee Handbook",
        "price": 37.00,
        "description": "Standards of conduct, ethics, attendance, confidentiality, and professional expectations.",
        "includes": ["Standards of conduct", "Ethics guidelines", "Attendance policy", "Confidentiality requirements", "Professional expectations"],
        "format": "Word (.docx) - fully editable",
        "scope": "core",
        "scope_label": "Core – Works in All States",
        "scope_note": "Professional workplace policies applicable to peer support agencies nationwide."
    },
    "doc-supervision-packet": {
        "id": "doc-supervision-packet",
        "name": "Supervision Packet",
        "price": 29.00,
        "description": "Supervisor role description, supervision requirements, supervision logs, and sample supervisor agreement.",
        "includes": ["Supervisor role description", "Supervision requirements", "Supervision logs", "Sample supervisor agreement"],
        "format": "Word (.docx) + Excel (.xlsx)",
        "scope": "core",
        "scope_label": "Core – Works in All States",
        "scope_note": "Core supervision documentation that meets standard clinical oversight requirements."
    },
    "doc-documentation-pack": {
        "id": "doc-documentation-pack",
        "name": "Documentation Pack",
        "price": 29.00,
        "description": "Service note templates, required documentation elements checklist, and record-keeping guidance.",
        "includes": ["Service note templates", "Required documentation elements checklist", "Record-keeping guidance"],
        "format": "Word (.docx) + PDF examples",
        "scope": "core",
        "scope_label": "Core – Works in All States",
        "scope_note": "Documentation templates designed to meet Medicaid billing and compliance requirements."
    },
    "doc-site-visit-binder": {
        "id": "doc-site-visit-binder",
        "name": "Site Visit Readiness Binder",
        "price": 24.00,
        "description": "A checklist of what reviewers typically request, folder organization guidance, and readiness confirmation checklist.",
        "includes": ["Reviewer request checklist", "Folder organization guidance", "Readiness confirmation checklist"],
        "format": "Word (.docx) + PDF printables",
        "scope": "core",
        "scope_label": "Core – Works in All States",
        "scope_note": "Universal organization system for Medicaid and MCO site visits."
    }
}

# Business location status for peer support services by state
# Statuses: allowed, allowed_conditions, verify, not_recommended
LOCATION_STATUS = {
    "NC": {"status": "allowed", "label": "Allowed (Administrative address only)", "note": "North Carolina allows peer support services from home offices, community locations, and traditional office settings. Your administrative address is used for enrollment but services can be delivered in community settings."},
    "TX": {"status": "allowed", "label": "Allowed (Administrative address only)", "note": "Texas permits peer support services in various settings including home offices. Your business address serves as administrative headquarters while services are typically delivered in community locations."},
    "CA": {"status": "allowed_conditions", "label": "Allowed with conditions", "note": "California allows peer support services but requirements vary by county. Contact your county Mental Health Plan for specific location requirements before submitting enrollment."},
    "FL": {"status": "allowed", "label": "Allowed (Administrative address only)", "note": "Florida permits peer support services from multiple locations. Your enrolled address is primarily administrative; services are delivered where clients are located."},
    "NY": {"status": "allowed_conditions", "label": "Allowed with conditions", "note": "New York allows peer support services but OMH has specific site requirements. Verify with your regional office before finalizing your service location."},
    "OH": {"status": "allowed", "label": "Allowed (Administrative address only)", "note": "Ohio permits peer support services from various locations. Your administrative address is used for enrollment while services can be community-based."},
    "PA": {"status": "allowed", "label": "Allowed (Administrative address only)", "note": "Pennsylvania allows peer support services from approved locations. Verify with your managed care organization for specific site requirements during credentialing."},
    "IL": {"status": "allowed", "label": "Allowed (Administrative address only)", "note": "Illinois permits peer support services. Contact HFS for specific location guidance. Services are typically delivered in community settings."},
    "GA": {"status": "allowed", "label": "Allowed (Administrative address only)", "note": "Georgia allows peer support services from various settings. Your administrative address is listed on enrollment while services are community-based."},
    "NJ": {"status": "allowed_conditions", "label": "Allowed with conditions", "note": "New Jersey has specific requirements for service locations. Verify with the Division of Mental Health Services before establishing your site."},
    "VA": {"status": "allowed", "label": "Allowed (Administrative address only)", "note": "Virginia permits peer support services from community and office settings. Your enrollment address is administrative; services are delivered where needed."},
    "WA": {"status": "allowed", "label": "Allowed (Administrative address only)", "note": "Washington allows peer support services. Verify with HCA for specific Medicaid billing location requirements."},
    "AZ": {"status": "allowed", "label": "Allowed (Administrative address only)", "note": "Arizona permits peer support services from various locations. Confirm with AHCCCS for billing-eligible service sites."}
}

# Default location status for states without specific data
DEFAULT_LOCATION_STATUS = {
    "status": "verify",
    "label": "Must verify",
    "note": "Contact your state Medicaid agency to confirm approved service locations before establishing your business address."
}

# Free vs Premium access rules
FREE_STEPS = [1, 2, 3]  # Steps 1-3 are free
PREMIUM_STEPS = [4, 5, 6, 7, 8, 9, 10, 11]  # Steps 4-11 require premium
STATE_ACCESS_PRICE = 49.00  # $49 per state one-time purchase

# Paywall grandfathering cutoff date (users created before this date get free access to their selected state)
# Set to the current date when paywall goes live
PAYWALL_LAUNCH_DATE = "2025-01-15T00:00:00+00:00"

ALL_STATES = [
    {"code": "AL", "name": "Alabama"}, {"code": "AK", "name": "Alaska"}, {"code": "AZ", "name": "Arizona"}, {"code": "AR", "name": "Arkansas"},
    {"code": "CA", "name": "California"}, {"code": "CO", "name": "Colorado"}, {"code": "CT", "name": "Connecticut"}, {"code": "DE", "name": "Delaware"},
    {"code": "FL", "name": "Florida"}, {"code": "GA", "name": "Georgia"}, {"code": "HI", "name": "Hawaii"}, {"code": "ID", "name": "Idaho"},
    {"code": "IL", "name": "Illinois"}, {"code": "IN", "name": "Indiana"}, {"code": "IA", "name": "Iowa"}, {"code": "KS", "name": "Kansas"},
    {"code": "KY", "name": "Kentucky"}, {"code": "LA", "name": "Louisiana"}, {"code": "ME", "name": "Maine"}, {"code": "MD", "name": "Maryland"},
    {"code": "MA", "name": "Massachusetts"}, {"code": "MI", "name": "Michigan"}, {"code": "MN", "name": "Minnesota"}, {"code": "MS", "name": "Mississippi"},
    {"code": "MO", "name": "Missouri"}, {"code": "MT", "name": "Montana"}, {"code": "NE", "name": "Nebraska"}, {"code": "NV", "name": "Nevada"},
    {"code": "NH", "name": "New Hampshire"}, {"code": "NJ", "name": "New Jersey"}, {"code": "NM", "name": "New Mexico"}, {"code": "NY", "name": "New York"},
    {"code": "NC", "name": "North Carolina"}, {"code": "ND", "name": "North Dakota"}, {"code": "OH", "name": "Ohio"}, {"code": "OK", "name": "Oklahoma"},
    {"code": "OR", "name": "Oregon"}, {"code": "PA", "name": "Pennsylvania"}, {"code": "RI", "name": "Rhode Island"}, {"code": "SC", "name": "South Carolina"},
    {"code": "SD", "name": "South Dakota"}, {"code": "TN", "name": "Tennessee"}, {"code": "TX", "name": "Texas"}, {"code": "UT", "name": "Utah"},
    {"code": "VT", "name": "Vermont"}, {"code": "VA", "name": "Virginia"}, {"code": "WA", "name": "Washington"}, {"code": "WV", "name": "West Virginia"},
    {"code": "WI", "name": "Wisconsin"}, {"code": "WY", "name": "Wyoming"}
]

# State coverage tiers
# Tier 1: Full Guidance Available - complete state-specific data, purchasable
FULL_GUIDANCE_STATES = ["NC", "TX", "CA", "FL", "NY", "OH", "PA", "IL", "GA", "NJ", "VA", "WA", "AZ"]

# Tier 2: Core Setup Supported - basic state info, state addendum coming soon, NOT purchasable
CORE_SETUP_STATES = ["TN", "MI", "MO", "IN", "WI", "MN", "CO", "SC", "KY", "OR", "LA", "OK", "CT", "MD", "MA"]

# Tier 3: Planning Tools Only - universal roadmap, documents, cost planning only, NOT purchasable
# (All remaining states not in Tier 1 or 2)

# Legacy alias for backwards compatibility
FULLY_POPULATED_STATES = FULL_GUIDANCE_STATES

def get_state_tier(state_code: str) -> dict:
    """Get the coverage tier for a state"""
    if state_code in FULL_GUIDANCE_STATES:
        return {
            "tier": "full_guidance",
            "label": "Full Guidance Available",
            "description": "Complete state-specific guidance, enrollment steps, and resources",
            "purchasable": True,
            "has_state_addendum": True
        }
    elif state_code in CORE_SETUP_STATES:
        return {
            "tier": "core_setup",
            "label": "Core Setup Supported",
            "description": "Universal roadmap with basic state info. State addendum coming soon.",
            "purchasable": False,
            "has_state_addendum": False,
            "coming_soon": True
        }
    else:
        return {
            "tier": "planning_tools",
            "label": "Planning Tools Only",
            "description": "Access to universal roadmap, documents, and cost planning tools",
            "purchasable": False,
            "has_state_addendum": False
        }

# Federal/Universal Links
FEDERAL_LINKS = {
    "irs_ein": {"name": "IRS EIN Application", "url": "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online", "description": "Apply for federal Employer Identification Number", "category": "Business Formation"},
    "nppes": {"name": "NPPES NPI Registry", "url": "https://nppes.cms.hhs.gov/", "description": "Apply for NPI Type 1 and Type 2", "category": "Credentialing"},
    "cms_medicaid": {"name": "CMS Medicaid Overview", "url": "https://www.medicaid.gov/", "description": "Federal Medicaid program information", "category": "Medicaid"},
    "sam_gov": {"name": "SAM.gov Registration", "url": "https://sam.gov/", "description": "System for Award Management (grants/contracts)", "category": "Business Formation"},
    "hipaa_hhs": {"name": "HHS HIPAA Guidance", "url": "https://www.hhs.gov/hipaa/index.html", "description": "HIPAA compliance resources", "category": "Compliance"},
    "caqh": {"name": "CAQH ProView", "url": "https://proview.caqh.org/", "description": "Universal provider credentialing database", "category": "Credentialing"},
    "samhsa": {"name": "SAMHSA Resources", "url": "https://www.samhsa.gov/", "description": "Substance Abuse and Mental Health Services Administration", "category": "Behavioral Health"}
}

# Universal Credentialing Requirements
UNIVERSAL_CREDENTIALING = [
    CredentialingRequirement(item="Legal Business Entity", description="Form LLC, Corporation, or approved entity type with state", required=True, notes="Required before any enrollment"),
    CredentialingRequirement(item="Employer Identification Number (EIN)", description="Apply through IRS - required for tax purposes and enrollment", required=True),
    CredentialingRequirement(item="NPI Type 2 (Organization)", description="Apply through NPPES - organizational NPI required for billing", required=True),
    CredentialingRequirement(item="Taxonomy Code Selection", description="Select appropriate taxonomy code (e.g., 101YP2500X for Peer Specialist)", required=True, notes="Verify correct code for your services"),
    CredentialingRequirement(item="Medicaid Provider Enrollment", description="Complete state Medicaid provider enrollment application", required=True),
    CredentialingRequirement(item="MCO Credentialing/Contracting", description="Apply to each Managed Care Organization in your service area", required=True, notes="May take 60-120 days"),
    CredentialingRequirement(item="General Liability Insurance", description="Minimum $1M per occurrence recommended", required=True),
    CredentialingRequirement(item="Professional Liability Insurance", description="Errors & omissions coverage for professional services", required=True),
    CredentialingRequirement(item="Background Checks Policy", description="Establish criminal background check policy for all staff", required=True),
    CredentialingRequirement(item="CAQH ProView Registration", description="Universal credentialing database used by many payers", required=False, notes="Recommended but not always required")
]

# Standard Checklist Template
def get_standard_checklist():
    return [
        {"step": 1, "title": "Form Your Business Entity", "description": "Register LLC or Corporation with Secretary of State. Obtain EIN from IRS.", "category": "Business Setup", "documents": ["Articles of Organization/Incorporation", "EIN Confirmation Letter", "Operating Agreement"], "common_mistakes": ["Filing in wrong state", "Missing registered agent", "Incorrect entity type"]},
        {"step": 2, "title": "Get Your NPI Numbers", "description": "Apply for NPI Type 1 (individual staff) and Type 2 (organization) through NPPES.", "category": "Credentialing", "documents": ["NPI Confirmation", "Taxonomy Code Documentation"], "common_mistakes": ["Wrong taxonomy code", "Missing Type 2 NPI", "Incorrect address"]},
        {"step": 3, "title": "Obtain Business Insurance", "description": "Secure general liability and professional liability insurance coverage.", "category": "Business Setup", "documents": ["Certificate of Insurance", "Policy Declarations"], "common_mistakes": ["Insufficient coverage limits", "Wrong policy type", "Missing named insured"]},
        {"step": 4, "title": "Enroll as Medicaid Provider", "description": "Complete state Medicaid provider enrollment application.", "category": "Credentialing", "documents": ["Provider Application", "W-9", "Ownership Disclosure", "License/Certification Copies"], "common_mistakes": ["Incomplete application", "Missing signatures", "Wrong provider type selected"]},
        {"step": 5, "title": "Credential with MCOs", "description": "Apply for credentialing with each Managed Care Organization in your service area.", "category": "Credentialing", "documents": ["Credentialing Application", "CAQH Profile (if applicable)", "Attestations"], "common_mistakes": ["Not applying to all MCOs", "Incomplete CAQH profile", "Missing required documents"]},
        {"step": 6, "title": "Hire Certified Peer Support Specialists", "description": "Recruit and hire staff with current state peer certification.", "category": "Staffing", "documents": ["Certification Verification", "Background Check Results", "Employment Agreement"], "common_mistakes": ["Expired certifications", "Missing background checks", "No credential verification process"]},
        {"step": 7, "title": "Establish Supervision Structure", "description": "Contract with or hire a licensed professional to provide required supervision.", "category": "Staffing", "documents": ["Supervisor Agreement", "License Verification", "Supervision Schedule"], "common_mistakes": ["Wrong license type", "No written agreement", "Inadequate supervision frequency"]},
        {
            "step": 8, 
            "title": "Prepare Policies & Procedures", 
            "description": "Policies & Procedures explain how your agency operates and are required for approval and site visits.",
            "category": "Compliance", 
            "documents": ["P&P Manual", "HIPAA Policies", "Emergency Procedures"],
            "common_mistakes": ["Using generic templates without customization", "Missing required policies", "No review/update schedule"],
            "expanded_text": "At some point before approval or a site visit, agencies are expected to have written Policies & Procedures.\n\nThese documents show reviewers that your agency understands the rules and has a plan to follow them.\n\nYou do not need to complete this step right away. Most agencies work on this closer to the end.",
            "key_areas": [
                "How Peer Support services are provided",
                "Staff roles and supervision",
                "Training and onboarding",
                "Documentation and record keeping",
                "Confidentiality and incident reporting",
                "Site visit readiness"
            ],
            "options": [
                {"id": "upload", "label": "Upload My Policies", "action": "upload"},
                {"id": "purchase", "label": "Get Policies & Procedures Toolkit", "action": "purchase", "price": 47}
            ],
            "reassurance": "There is no deadline for this step. You can come back to it when you feel ready.",
            "non_blocking": True
        },
        {"step": 9, "title": "Set Up Billing Systems", "description": "Implement EHR and billing software compatible with state claims submission.", "category": "Billing", "documents": ["Software Setup Documentation", "Claims Testing Results", "Staff Training Records"], "common_mistakes": ["Incompatible software", "No claims testing", "Staff not trained"]},
        {"step": 10, "title": "Verify Zoning & Location Compliance", "description": "Confirm your service location meets local zoning and occupancy requirements.", "category": "Compliance", "documents": ["Zoning Verification", "Business License", "Occupancy Permit (if applicable)"], "common_mistakes": ["Operating in residential zone without permit", "Missing local business license", "ADA non-compliance"]},
        {"step": 11, "title": "Start Accepting Referrals", "description": "Network with referral sources and begin providing billable services.", "category": "Operations", "documents": ["Referral Agreements", "Marketing Materials", "Go-Live Checklist"], "common_mistakes": ["Starting before credentialing complete", "No referral tracking system", "Missing documentation training"]}
    ]

# Policies & Procedures Framework
PP_FRAMEWORK = {
    "sections": [
        {"title": "Mission, Vision & Values", "required": True, "description": "Agency purpose, recovery-oriented philosophy"},
        {"title": "Organizational Structure", "required": True, "description": "Governance, leadership, reporting structure"},
        {"title": "HIPAA Privacy & Security", "required": True, "description": "PHI handling, breach notification, security safeguards"},
        {"title": "Confidentiality & Consent", "required": True, "description": "Informed consent, release of information, limits of confidentiality"},
        {"title": "Documentation Standards", "required": True, "description": "Service notes, treatment plans, record requirements"},
        {"title": "Service Delivery Standards", "required": True, "description": "Scope of peer support, service definitions, boundaries"},
        {"title": "Staff Credential Verification", "required": True, "description": "Hiring, credentialing, ongoing verification"},
        {"title": "Clinical Supervision", "required": True, "description": "Supervision requirements, frequency, documentation"},
        {"title": "Incident Reporting", "required": True, "description": "Critical incidents, reporting timelines, investigation"},
        {"title": "Grievances & Appeals", "required": True, "description": "Client complaint process, resolution, documentation"},
        {"title": "Cultural Competency", "required": True, "description": "Diversity, equity, inclusion in service delivery"},
        {"title": "Ethics & Boundaries", "required": True, "description": "Professional conduct, dual relationships, gifts"},
        {"title": "Record Retention", "required": True, "description": "Retention periods, secure storage, destruction"},
        {"title": "Fraud, Waste & Abuse", "required": True, "description": "FWA prevention, detection, reporting"},
        {"title": "Emergency & Crisis Response", "required": True, "description": "Crisis protocols, emergency contacts, escalation"},
        {"title": "Telehealth Policy", "required": False, "description": "Virtual service delivery standards (if applicable)"},
        {"title": "Quality Improvement", "required": True, "description": "QI program, outcome measurement, continuous improvement"},
        {"title": "Compliance Program", "required": True, "description": "Compliance officer, auditing, corrective action"}
    ],
    "minimum_policies": ["HIPAA Privacy & Security", "Confidentiality & Consent", "Documentation Standards", "Incident Reporting", "Grievances & Appeals", "Fraud, Waste & Abuse", "Emergency & Crisis Response"]
}

# ============== STATE DATA ==============
def create_state_data(code, name, cert_name, cert_authority, cert_url, medicaid_agency, medicaid_url, medicaid_manual, bh_authority, bh_url, supervision_req, supervision_details, licenses, virtual_status, telehealth_notes, entity_type, sos_url, mcos, laws, specific_creds):
    return {
        "state_code": code,
        "state_name": name,
        "is_fully_populated": True,
        "certification_name": cert_name,
        "certification_authority": cert_authority,
        "certification_url": cert_url,
        "who_qualifies": "Individuals with lived experience of mental health challenges, substance use disorders, or both who are in recovery",
        "training_hours": "40-75 hours initial training + continuing education (varies by state)",
        "medicaid_agency_name": medicaid_agency,
        "medicaid_enrollment_url": medicaid_url,
        "medicaid_manual_url": medicaid_manual,
        "fee_schedule_url": None,
        "behavioral_health_authority": bh_authority,
        "behavioral_health_url": bh_url,
        "supervision_required": supervision_req,
        "supervision_details": supervision_details,
        "accepted_supervisor_licenses": licenses,
        "virtual_allowed": virtual_status,
        "telehealth_notes": telehealth_notes,
        "business_entity_type": entity_type,
        "in_state_required": True,
        "secretary_of_state_url": sos_url,
        "managed_care_orgs": mcos,
        "official_links": [
            OfficialLink(name="Medicaid Provider Enrollment", url=medicaid_url, category="Medicaid", description="Provider enrollment portal"),
            OfficialLink(name="Provider Manual", url=medicaid_manual or medicaid_url, category="Medicaid", description="Medicaid provider handbook"),
            OfficialLink(name="Peer Certification", url=cert_url, category="Certification", description="State peer certification information"),
            OfficialLink(name="Secretary of State", url=sos_url, category="Business Formation", description="Business registration")
        ],
        "laws_and_rules": laws,
        "credentialing_requirements": specific_creds,
        "zoning_info": ZoningInfo(virtual_allowed=("Yes" in virtual_status or "Allowed" in virtual_status), office_required=False, home_office_notes="Check local zoning for home-based business requirements. Some jurisdictions require home occupation permits.", local_requirements=["Verify zoning allows business use at your address", "Check local business license requirements", "Confirm ADA accessibility if clients visit", "Review parking requirements", "Check signage regulations"]),
        "common_billing_codes": ["H0038 - Self-help/peer services, per 15 minutes", "H0025 - Behavioral health prevention education", "H2014 - Skills training and development"],
        "units_of_service": "15-minute increments",
        "documentation_requirements": "Date, start/end time, service location, description of activities, progress toward goals, signatures",
        "reimbursement_notes": "Rates vary by MCO. Contact each plan for current fee schedules.",
        "checklist": get_standard_checklist(),
        "last_verified": "2025-01",
        "last_updated": "January 2025",
        "data_source": "Official state agency websites and Medicaid provider manuals"
    }

STATE_DATA = {
    "NC": create_state_data(
        "NC", "North Carolina", "Certified Peer Support Specialist (CPSS)", "NC DMH/DD/SAS",
        "https://www.ncdhhs.gov/divisions/mental-health-developmental-disabilities-and-substance-abuse/peer-support",
        "NC Medicaid (NC DHHS)", "https://medicaid.ncdhhs.gov/providers/provider-enrollment",
        "https://medicaid.ncdhhs.gov/providers/provider-playbook",
        "NC DMH/DD/SAS", "https://www.ncdhhs.gov/divisions/mental-health-developmental-disabilities-and-substance-abuse",
        True, "Supervision by Qualified Professional (QP) required", ["LCSW", "LPC", "LCMHC", "QP"],
        "Yes - Telehealth peer support allowed", "Follow NC telehealth guidelines for behavioral health",
        "LLC or Corporation", "https://www.sosnc.gov/",
        [MCOInfo(name="Alliance Health", credentialing_url="https://www.alliancehealthplan.org/providers/", phone="1-800-510-9132"),
         MCOInfo(name="Eastpointe", credentialing_url="https://www.eastpointe.net/providers/", phone="1-800-913-6109"),
         MCOInfo(name="Partners Health Management", credentialing_url="https://www.partnersbhm.org/providers/", phone="1-888-235-4673"),
         MCOInfo(name="Trillium Health Resources", credentialing_url="https://www.trilliumhealthresources.org/providers/", phone="1-877-685-2415"),
         MCOInfo(name="Vaya Health", credentialing_url="https://www.vayahealth.com/providers/", phone="1-800-962-9003")],
        [LawReference(title="10A NCAC 27G - MH/DD/SA Community Services", category="Admin Code", summary="Rules governing community-based MH/DD/SA services in NC", official_url="https://www.ncdhhs.gov/divisions/mental-health-developmental-disabilities-and-substance-abuse/rules", last_verified="2025-01"),
         LawReference(title="NC Medicaid Clinical Coverage Policy 8C", category="Medicaid Manual", summary="Enhanced mental health and substance abuse services coverage", official_url="https://medicaid.ncdhhs.gov/", last_verified="2025-01")],
        [CredentialingRequirement(item="LME/MCO Network Application", description="Must apply to Local Management Entity/MCO in service area", required=True),
         CredentialingRequirement(item="NCTracks Enrollment", description="Enroll through NC Medicaid NCTracks system", required=True)]
    ),
    "TX": create_state_data(
        "TX", "Texas", "Mental Health Peer Specialist (MHPS) / Peer Recovery Support Specialist (PRSS)", "Texas HHSC via Via Hope",
        "https://viahope.org/programs/peer-specialist-training/",
        "Texas Medicaid (TMHP)", "https://www.tmhp.com/programs/medicaid",
        "https://www.tmhp.com/resources/provider-manuals",
        "Texas HHSC Behavioral Health", "https://www.hhs.texas.gov/services/mental-health-substance-use",
        True, "Supervision by QMHP or licensed professional required", ["LPC", "LCSW", "LMFT", "Licensed Psychologist", "QMHP"],
        "Yes - Telehealth allowed", "Follow Texas telehealth regulations",
        "LLC, Corporation, or Professional Association", "https://www.sos.state.tx.us/",
        [MCOInfo(name="Superior HealthPlan", credentialing_url="https://www.superiorhealthplan.com/providers/", phone="1-877-391-5921"),
         MCOInfo(name="Molina Healthcare of Texas", credentialing_url="https://www.molinahealthcare.com/providers/tx/", phone="1-888-562-5442"),
         MCOInfo(name="UnitedHealthcare Community Plan", credentialing_url="https://www.uhccommunityplan.com/tx/", phone="1-888-887-9003"),
         MCOInfo(name="Amerigroup Texas", credentialing_url="https://providers.amerigroup.com/texas", phone="1-800-454-3730")],
        [LawReference(title="Texas Administrative Code Title 25 - Health Services", category="Admin Code", summary="Rules governing health services including behavioral health", official_url="https://texreg.sos.state.tx.us/public/readtac$ext.viewtac", last_verified="2025-01"),
         LawReference(title="Texas Medicaid Provider Procedures Manual", category="Medicaid Manual", summary="Billing and service delivery requirements", official_url="https://www.tmhp.com/resources/provider-manuals", last_verified="2025-01")],
        [CredentialingRequirement(item="TMHP Provider Enrollment", description="Enroll through Texas Medicaid & Healthcare Partnership", required=True),
         CredentialingRequirement(item="Via Hope Certification Verification", description="Verify MHPS/PRSS certification through Via Hope", required=True)]
    ),
    "CA": create_state_data(
        "CA", "California", "Medi-Cal Peer Support Specialist Certification", "CalMHSA",
        "https://www.calmhsa.org/peer-certification/",
        "California DHCS", "https://www.dhcs.ca.gov/provgovpart/Pages/default.aspx",
        "https://www.dhcs.ca.gov/services/MH/Pages/MHInfoforProviders.aspx",
        "California DHCS Behavioral Health", "https://www.dhcs.ca.gov/services/MH/",
        True, "Supervision by licensed clinician per county MHP requirements", ["LCSW", "LMFT", "LPCC", "Licensed Psychologist"],
        "Yes - Telehealth allowed per county guidelines", "County-specific telehealth policies may apply",
        "LLC or Corporation", "https://www.sos.ca.gov/business",
        [MCOInfo(name="LA Care Health Plan", credentialing_url="https://www.lacare.org/providers/", phone="1-866-522-2736"),
         MCOInfo(name="Health Net", credentialing_url="https://www.healthnet.com/content/healthnet/en_us/providers.html", phone="1-800-641-7761"),
         MCOInfo(name="Molina Healthcare of CA", credentialing_url="https://www.molinahealthcare.com/providers/ca/", phone="1-888-665-4621")],
        [LawReference(title="California Code of Regulations Title 9 - Rehabilitative and Developmental Services", category="Admin Code", summary="Rules for MH rehabilitation services including peer support", official_url="https://govt.westlaw.com/calregs/", last_verified="2025-01"),
         LawReference(title="DHCS Medi-Cal Provider Manual", category="Medicaid Manual", summary="Medi-Cal billing and service requirements", official_url="https://www.dhcs.ca.gov/", last_verified="2025-01")],
        [CredentialingRequirement(item="County MHP Contracting", description="Contract with County Mental Health Plan in service area", required=True),
         CredentialingRequirement(item="CalMHSA Certification", description="Complete CalMHSA-approved peer certification", required=True)]
    ),
    "FL": create_state_data(
        "FL", "Florida", "Certified Recovery Peer Specialist (CRPS)", "Florida Certification Board (FCB)",
        "https://flcertificationboard.org/certifications/crps/",
        "Florida AHCA", "https://ahca.myflorida.com/medicaid/",
        "https://ahca.myflorida.com/medicaid/review/index.shtml",
        "Florida DCF Substance Abuse and Mental Health", "https://www.myflfamilies.com/services/samh",
        True, "Supervision by licensed behavioral health professional", ["LCSW", "LMHC", "LMFT", "Licensed Psychologist"],
        "Yes - Telehealth allowed", "Follow AHCA telehealth guidelines",
        "LLC or Corporation", "https://dos.myflorida.com/sunbiz/",
        [MCOInfo(name="Sunshine Health", credentialing_url="https://www.sunshinehealth.com/providers/", phone="1-866-796-0530"),
         MCOInfo(name="Humana Healthy Horizons", credentialing_url="https://www.humana.com/provider/", phone="1-800-477-6931"),
         MCOInfo(name="Simply Healthcare", credentialing_url="https://www.simplyhealthcareplans.com/florida-medicaid/providers/", phone="1-877-440-7963"),
         MCOInfo(name="Molina Healthcare of FL", credentialing_url="https://www.molinahealthcare.com/providers/fl/", phone="1-866-472-4585")],
        [LawReference(title="Florida Administrative Code 65E - Mental Health", category="Admin Code", summary="Rules governing community mental health services", official_url="https://www.flrules.org/gateway/department.asp?DeptID=65", last_verified="2025-01"),
         LawReference(title="Florida Medicaid Provider General Handbook", category="Medicaid Manual", summary="General Medicaid provider requirements", official_url="https://ahca.myflorida.com/", last_verified="2025-01")],
        [CredentialingRequirement(item="FCB CRPS Certification", description="Obtain CRPS certification through Florida Certification Board", required=True),
         CredentialingRequirement(item="AHCA Provider Enrollment", description="Enroll through Florida AHCA Medicaid portal", required=True)]
    ),
    "NY": create_state_data(
        "NY", "New York", "Certified Peer Specialist / Certified Recovery Peer Advocate", "NYS OMH / OASAS",
        "https://omh.ny.gov/omhweb/peer_specialist/",
        "NYS DOH / eMedNY", "https://www.emedny.org/",
        "https://www.health.ny.gov/health_care/medicaid/program/provider_guidelines.htm",
        "NYS OMH / OASAS", "https://omh.ny.gov/",
        True, "Supervision per OMH/OASAS regulatory requirements", ["LCSW", "LMHC", "Licensed Psychologist", "CASAC"],
        "Yes - Telehealth allowed", "Follow NYS telehealth regulations",
        "Corporation or LLC", "https://www.dos.ny.gov/corps/",
        [MCOInfo(name="Healthfirst", credentialing_url="https://healthfirst.org/providers/", phone="1-888-250-2220"),
         MCOInfo(name="Fidelis Care", credentialing_url="https://www.fideliscare.org/Providers", phone="1-888-343-3547"),
         MCOInfo(name="MetroPlus Health Plan", credentialing_url="https://www.metroplus.org/providers/", phone="1-800-303-9626")],
        [LawReference(title="14 NYCRR Part 512 - Peer Support Services", category="Admin Code", summary="OMH regulations for peer support services", official_url="https://govt.westlaw.com/nycrr/", last_verified="2025-01"),
         LawReference(title="eMedNY Provider Manual", category="Medicaid Manual", summary="NY Medicaid billing requirements", official_url="https://www.emedny.org/", last_verified="2025-01")],
        [CredentialingRequirement(item="OMH/OASAS Operating Certificate", description="May need operating certificate depending on service model", required=False, notes="Verify requirements with OMH/OASAS"),
         CredentialingRequirement(item="eMedNY Enrollment", description="Enroll through NY Medicaid eMedNY system", required=True)]
    ),
    "OH": create_state_data(
        "OH", "Ohio", "Certified Peer Recovery Supporter (CPRS) / Certified Peer Supporter (CPS)", "Ohio CDPB / Ohio MHA",
        "https://mha.ohio.gov/community-partners/peer-support",
        "Ohio Department of Medicaid", "https://medicaid.ohio.gov/providers",
        "https://medicaid.ohio.gov/resources-for-providers/behavioral-health",
        "Ohio MHAS", "https://mha.ohio.gov/",
        True, "Supervision by Qualified Behavioral Health Professional", ["LISW", "LPCC", "Licensed Psychologist", "LICDC"],
        "Yes - Telehealth allowed", "Follow Ohio telehealth guidelines",
        "LLC or Corporation", "https://www.ohiosos.gov/businesses/",
        [MCOInfo(name="CareSource", credentialing_url="https://www.caresource.com/providers/", phone="1-800-488-0134"),
         MCOInfo(name="Molina Healthcare of Ohio", credentialing_url="https://www.molinahealthcare.com/providers/oh/", phone="1-855-322-4079"),
         MCOInfo(name="Buckeye Health Plan", credentialing_url="https://www.buckeyehealthplan.com/providers/", phone="1-866-246-4358")],
        [LawReference(title="Ohio Administrative Code 5122 - Mental Health", category="Admin Code", summary="Rules governing mental health services", official_url="https://codes.ohio.gov/ohio-administrative-code/chapter-5122", last_verified="2025-01")],
        [CredentialingRequirement(item="Ohio Peer Certification", description="Obtain CPRS or CPS certification", required=True)]
    ),
    "PA": create_state_data(
        "PA", "Pennsylvania", "Certified Peer Specialist (CPS) / Certified Recovery Specialist (CRS)", "PA Certification Board",
        "https://www.pacertboard.org/",
        "PA DHS", "https://www.dhs.pa.gov/providers/Providers/Pages/default.aspx",
        "https://www.dhs.pa.gov/providers/Providers/Pages/PROMISe.aspx",
        "PA OMHSAS", "https://www.dhs.pa.gov/Services/Mental-Health-In-PA/Pages/default.aspx",
        True, "Supervision by licensed clinician or CPS Supervisor", ["LSW", "LPC", "Licensed Psychologist", "CAADC"],
        "Yes - Telehealth allowed", "Follow PA telehealth guidelines",
        "LLC or Corporation", "https://www.dos.pa.gov/BusinessCharities/",
        [MCOInfo(name="AmeriHealth Caritas PA", credentialing_url="https://www.amerihealthcaritaspa.com/provider/", phone="1-800-521-6860"),
         MCOInfo(name="UPMC for You", credentialing_url="https://www.upmchealthplan.com/providers/", phone="1-800-286-4242")],
        [LawReference(title="55 Pa. Code Chapter 5100 - Mental Health Services", category="Admin Code", summary="PA mental health service regulations", official_url="https://www.pacodeandbulletin.gov/", last_verified="2025-01")],
        [CredentialingRequirement(item="PCB Certification", description="Obtain CPS or CRS certification from PA Certification Board", required=True)]
    ),
    "IL": create_state_data(
        "IL", "Illinois", "Certified Recovery Support Specialist (CRSS)", "Illinois Certification Board",
        "https://www.iaodapca.org/",
        "Illinois HFS", "https://www.illinois.gov/hfs/MedicalProviders/",
        "https://www.illinois.gov/hfs/MedicalProviders/Handbooks/",
        "Illinois DHS Division of Mental Health", "https://www.dhs.state.il.us/page.aspx?item=29763",
        True, "Supervision by licensed professional", ["LCSW", "LCPC", "Licensed Psychologist", "CADC"],
        "Yes - Telehealth allowed", "Follow IL telehealth guidelines",
        "LLC or Corporation", "https://www.ilsos.gov/departments/business_services/",
        [MCOInfo(name="Molina Healthcare of Illinois", credentialing_url="https://www.molinahealthcare.com/providers/il/", phone="1-855-866-5462"),
         MCOInfo(name="Meridian Health Plan", credentialing_url="https://corp.mfrm.com/illinois/providers/", phone="1-866-606-3700")],
        [LawReference(title="Illinois Administrative Code Title 59 - Mental Health", category="Admin Code", summary="IL mental health service rules", official_url="https://www.ilga.gov/commission/jcar/admincode/", last_verified="2025-01")],
        [CredentialingRequirement(item="ICB CRSS Certification", description="Obtain CRSS certification through Illinois Certification Board", required=True)]
    ),
    "GA": create_state_data(
        "GA", "Georgia", "Certified Peer Specialist (CPS) / CARES", "Georgia DBHDD",
        "https://dbhdd.georgia.gov/peer-support-services",
        "Georgia DCH", "https://dch.georgia.gov/providers",
        "https://dch.georgia.gov/providers/all-providers/provider-manuals",
        "Georgia DBHDD", "https://dbhdd.georgia.gov/",
        True, "Supervision by DBHDD-approved supervisor", ["LCSW", "LPC", "Licensed Psychologist", "CADC II"],
        "Yes - Telehealth allowed", "Follow GA telehealth guidelines",
        "LLC or Corporation", "https://sos.ga.gov/corporations-division",
        [MCOInfo(name="Amerigroup Georgia", credentialing_url="https://providers.amerigroup.com/georgia", phone="1-800-454-3730"),
         MCOInfo(name="CareSource Georgia", credentialing_url="https://www.caresource.com/providers/", phone="1-855-202-1058")],
        [LawReference(title="Georgia DBHDD Provider Manual", category="Medicaid Manual", summary="DBHDD service requirements", official_url="https://dbhdd.georgia.gov/", last_verified="2025-01")],
        [CredentialingRequirement(item="DBHDD CPS Certification", description="Obtain certification through Georgia DBHDD", required=True)]
    ),
    "NJ": create_state_data(
        "NJ", "New Jersey", "Certified Peer Recovery Specialist (CPRS)", "NJ Certification Board",
        "https://www.njcb.org/",
        "NJ DMAHS", "https://www.state.nj.us/humanservices/dmahs/providers/",
        "https://www.state.nj.us/humanservices/dmahs/info/resources/",
        "NJ DMHAS", "https://www.nj.gov/humanservices/dmhas/",
        True, "Supervision by licensed professional", ["LCSW", "LPC", "Licensed Psychologist", "LCADC"],
        "Yes - Telehealth allowed", "Follow NJ telehealth guidelines",
        "LLC or Corporation", "https://www.njportal.com/DOR/BusinessRegistration/",
        [MCOInfo(name="Horizon NJ Health", credentialing_url="https://www.horizonnjhealth.com/providers/", phone="1-800-682-9091"),
         MCOInfo(name="Amerigroup NJ", credentialing_url="https://providers.amerigroup.com/new-jersey", phone="1-800-454-3730")],
        [LawReference(title="N.J.A.C. Title 10 - Human Services", category="Admin Code", summary="NJ human services regulations", official_url="https://www.state.nj.us/humanservices/", last_verified="2025-01")],
        [CredentialingRequirement(item="NJCB CPRS Certification", description="Obtain CPRS certification through NJ Certification Board", required=True)]
    ),
    "VA": create_state_data(
        "VA", "Virginia", "Certified Peer Recovery Specialist (CPRS)", "Virginia Board of Counseling / DBHDS",
        "https://dbhds.virginia.gov/recovery-services/",
        "VA DMAS", "https://www.dmas.virginia.gov/for-providers/",
        "https://www.dmas.virginia.gov/for-providers/provider-manuals/",
        "VA DBHDS", "https://dbhds.virginia.gov/",
        True, "Supervision by licensed mental health professional", ["LPC", "LCSW", "Licensed Psychologist", "CSAC"],
        "Yes - Telehealth allowed", "Follow VA telehealth guidelines",
        "LLC or Corporation", "https://www.scc.virginia.gov/",
        [MCOInfo(name="Virginia Premier", credentialing_url="https://www.virginiapremier.com/providers/", phone="1-800-727-7536"),
         MCOInfo(name="Anthem HealthKeepers Plus", credentialing_url="https://www.anthem.com/provider/va/", phone="1-800-901-0020")],
        [LawReference(title="12VAC35 - Behavioral Health and Developmental Services", category="Admin Code", summary="VA DBHDS regulations", official_url="https://law.lis.virginia.gov/admincode/title12/agency35/", last_verified="2025-01")],
        [CredentialingRequirement(item="VA CPRS Certification", description="Obtain CPRS certification through Virginia Board of Counseling", required=True)]
    ),
    "WA": create_state_data(
        "WA", "Washington", "Certified Peer Counselor (CPC)", "Washington HCA",
        "https://www.hca.wa.gov/billers-providers-partners/program-information-providers/peer-counseling",
        "Washington HCA", "https://www.hca.wa.gov/billers-providers-partners",
        "https://www.hca.wa.gov/billers-providers-partners/prior-authorization-claims-and-billing",
        "Washington HCA Behavioral Health", "https://www.hca.wa.gov/free-or-low-cost-health-care/i-need-behavioral-health-support",
        True, "Supervision by agency-affiliated counselor supervisor", ["LMHC", "LICSW", "Licensed Psychologist", "CDP"],
        "Yes - Telehealth allowed", "Follow WA HCA telehealth guidelines",
        "LLC or Corporation", "https://www.sos.wa.gov/corps/",
        [MCOInfo(name="Molina Healthcare of WA", credentialing_url="https://www.molinahealthcare.com/providers/wa/", phone="1-800-869-7165"),
         MCOInfo(name="Coordinated Care", credentialing_url="https://www.coordinatedcarehealth.com/providers/", phone="1-877-644-4613")],
        [LawReference(title="WAC 246-341 - Behavioral Health Services", category="Admin Code", summary="WA behavioral health service rules", official_url="https://apps.leg.wa.gov/WAC/", last_verified="2025-01")],
        [CredentialingRequirement(item="HCA CPC Certification", description="Complete HCA-approved peer counselor training and certification", required=True)]
    ),
    "AZ": create_state_data(
        "AZ", "Arizona", "Peer Support Specialist / Recovery Support Specialist", "AHCCCS / AZBHB",
        "https://www.azahcccs.gov/AHCCCS/Initiatives/PeerRecoverySupport/",
        "AHCCCS", "https://www.azahcccs.gov/PlansProviders/ProviderEnrollment/",
        "https://www.azahcccs.gov/PlansProviders/Downloads/RatesAndBilling/",
        "AHCCCS Behavioral Health", "https://www.azahcccs.gov/Members/BehavioralHealthServices/",
        True, "Supervision by licensed behavioral health professional", ["LCSW", "LPC", "Licensed Psychologist", "LISAC"],
        "Yes - Telehealth allowed", "Follow AHCCCS telehealth guidelines",
        "LLC or Corporation", "https://azcc.gov/",
        [MCOInfo(name="Arizona Complete Health", credentialing_url="https://www.azcompletehealth.com/providers/", phone="1-866-304-1836"),
         MCOInfo(name="Mercy Care", credentialing_url="https://www.mercycareaz.org/providers/", phone="1-800-624-3879")],
        [LawReference(title="Arizona Administrative Code Title 9 - Health Services", category="Admin Code", summary="AZ health services regulations", official_url="https://apps.azsos.gov/public_services/Title_09/9-10.htm", last_verified="2025-01")],
        [CredentialingRequirement(item="AHCCCS Provider Registration", description="Register as provider through AHCCCS", required=True)]
    )
}

def get_placeholder_state_data(code, name):
    return {
        "state_code": code, "state_name": name, "is_fully_populated": False,
        "certification_name": f"{name} Peer Support Certification", "certification_authority": f"{name} Health Department",
        "certification_url": f"Search: {name} peer support certification",
        "who_qualifies": "Individuals with lived experience in recovery", "training_hours": "Varies by state - contact state authority",
        "medicaid_agency_name": f"{name} Medicaid", "medicaid_enrollment_url": f"Search: {name} Medicaid provider enrollment",
        "medicaid_manual_url": None, "fee_schedule_url": None,
        "behavioral_health_authority": f"{name} Behavioral Health Authority", "behavioral_health_url": f"Search: {name} behavioral health department",
        "supervision_required": True, "supervision_details": "Verify with state - typically licensed professional required",
        "accepted_supervisor_licenses": ["LCSW", "LPC"], "virtual_allowed": "Verify with state Medicaid", "telehealth_notes": None,
        "business_entity_type": "LLC or Corporation", "in_state_required": True,
        "secretary_of_state_url": f"Search: {name} Secretary of State business registration",
        "managed_care_orgs": [MCOInfo(name=f"{name} MCOs - Contact State Medicaid", credentialing_url=f"Contact {name} Medicaid")],
        "official_links": [], "laws_and_rules": [], "credentialing_requirements": [],
        "zoning_info": ZoningInfo(virtual_allowed=False, office_required=False, home_office_notes="Verify local requirements", local_requirements=["Check local zoning", "Obtain business license"]),
        "common_billing_codes": ["H0038 - Peer services", "H0025 - Prevention"], "units_of_service": "Typically 15-minute increments",
        "documentation_requirements": "Date, time, location, services, progress notes, signatures",
        "reimbursement_notes": "Contact state Medicaid for rates", "checklist": get_standard_checklist(), "last_verified": "Pending"
    }

# ============== TEMPLATES ==============
TEMPLATES = {
    "policies-procedures": {"id": "policies-procedures", "title": "Policies & Procedures Template", "description": "Comprehensive policy manual framework", "category": "Compliance", "preview_text": "Complete P&P framework including HIPAA, documentation, supervision, and compliance policies."},
    "job-posting": {"id": "job-posting", "title": "Peer Support Specialist Job Posting", "description": "Ready-to-use job description", "category": "Hiring", "preview_text": "Position: Certified Peer Support Specialist with qualifications and duties."},
    "supervisor-contract": {"id": "supervisor-contract", "title": "Clinical Supervisor Contract", "description": "Supervision agreement template", "category": "Contracts", "preview_text": "Agreement establishing supervision terms, compensation, and responsibilities."},
    "provider-agreement": {"id": "provider-agreement", "title": "Provider Services Agreement", "description": "Client services contract", "category": "Contracts", "preview_text": "Agreement defining scope of services, client rights, and payment terms."},
    "medicaid-scripts": {"id": "medicaid-scripts", "title": "Medicaid Call Scripts", "description": "Phone scripts for enrollment inquiries", "category": "Communications", "preview_text": "Scripts for calling Medicaid and MCO credentialing departments."},
    "startup-budget": {"id": "startup-budget", "title": "Startup Budget Checklist", "description": "Financial planning template", "category": "Finance", "preview_text": "Startup costs, monthly expenses, staffing costs, and revenue projections."}
}

DISCLAIMERS = {
    "general": "This platform provides educational guidance only and does not constitute legal, financial, medical, or professional advice.",
    "medicaid": "Medicaid approval and reimbursement are not guaranteed. Requirements vary by state and change frequently.",
    "billing": "Billing codes, rates, and coverage vary by state, MCO, and provider type. Always verify with payers.",
    "legal": "Laws, regulations, and administrative rules change. Users must verify current requirements with official agencies.",
    "zoning": "Zoning and occupancy requirements are determined by local (city/county) governments, not state agencies.",
    "professional": "Users should consult qualified professionals (attorneys, compliance specialists, billing experts) as needed.",
    "links": "External links are provided for convenience. We are not responsible for third-party content or website availability."
}

NATIONAL_OVERVIEW = {
    "what_is_peer_support": "Peer Support is a recovery-oriented service provided by individuals with lived experience of mental health challenges, substance use disorders, or co-occurring conditions. It emphasizes empowerment, self-determination, and community connection.",
    "what_is_medicaid_billable": "Medicaid-billable peer support services meet state and federal requirements for reimbursement. Your agency must be enrolled as a Medicaid provider, employ certified specialists, meet documentation/supervision requirements, and submit claims properly.",
    "universal_requirements": [r.model_dump() for r in UNIVERSAL_CREDENTIALING],
    "best_practices": ["Start with one state and master requirements before expanding", "Build MCO relationships before seeking credentialing", "Invest in quality training beyond minimum requirements", "Develop robust documentation systems from day one", "Create strong referral network with clinical providers", "Stay current with regulatory changes", "Join professional associations", "Maintain detailed records for audits"],
    "multi_state_strategy": "Expanding to multiple states requires foreign qualifying your business, obtaining registered agents, meeting state-specific licensing, credentialing with local MCOs, hiring locally-certified staff, and understanding rate differences."
}

# ============== PDF GENERATION ==============
def generate_template_pdf(template_id):
    template = TEMPLATES.get(template_id)
    if not template: raise HTTPException(status_code=404, detail="Template not found")
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    story = [Paragraph(f"<b>{template['title']}</b>", ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, textColor=NAVY, alignment=TA_CENTER)),
             Paragraph(f"<i>{template['description']}</i>", styles['Normal']), Spacer(1, 0.3*inch),
             Paragraph(template['preview_text'], styles['Normal']), Spacer(1, 0.5*inch),
             Paragraph("Launch Your Peer Support Agency™ | Educational purposes only", ParagraphStyle('Footer', fontSize=9, textColor=colors.gray, alignment=TA_CENTER))]
    doc.build(story)
    buffer.seek(0)
    return buffer

def generate_state_roadmap_pdf(state_code: str):
    """Generate a clean, simple PDF roadmap for a state."""
    state_data = STATE_DATA.get(state_code) or create_placeholder_state(state_code, next((s["name"] for s in ALL_STATES if s["code"] == state_code), state_code))
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.6*inch, bottomMargin=0.6*inch, leftMargin=0.75*inch, rightMargin=0.75*inch)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=22, textColor=NAVY, alignment=TA_CENTER, spaceAfter=6)
    subtitle_style = ParagraphStyle('Subtitle', fontSize=11, textColor=colors.gray, alignment=TA_CENTER, spaceAfter=20)
    section_style = ParagraphStyle('Section', parent=styles['Heading2'], fontSize=14, textColor=NAVY, spaceBefore=16, spaceAfter=8)
    body_style = ParagraphStyle('Body', fontSize=10, leading=14, spaceAfter=6)
    step_title_style = ParagraphStyle('StepTitle', fontSize=11, textColor=NAVY, fontName='Helvetica-Bold')
    step_desc_style = ParagraphStyle('StepDesc', fontSize=9, textColor=colors.gray, leftIndent=20)
    footer_style = ParagraphStyle('Footer', fontSize=8, textColor=colors.gray, alignment=TA_CENTER)
    
    story = []
    
    # Header
    story.append(Paragraph(f"{state_data['state_name']} Peer Support Agency Roadmap", title_style))
    story.append(Paragraph(f"Launch Your Peer Support Agency™ | Last updated: {state_data.get('last_updated', 'N/A')}", subtitle_style))
    
    # Quick Info Section
    story.append(Paragraph("Quick Reference", section_style))
    quick_info = [
        f"<b>Certification:</b> {state_data.get('certification_name', 'See state requirements')}",
        f"<b>Certifying Body:</b> {state_data.get('certification_authority', 'Contact state agency')}",
        f"<b>Medicaid Agency:</b> {state_data.get('medicaid_agency_name', 'See state Medicaid')}",
        f"<b>Supervision Required:</b> {state_data.get('supervision_required', 'Yes')}",
        f"<b>Virtual Services:</b> {state_data.get('virtual_allowed', 'Verify with state')}"
    ]
    for info in quick_info:
        story.append(Paragraph(info, body_style))
    
    story.append(Spacer(1, 0.2*inch))
    
    # Checklist Section
    story.append(Paragraph("Your 11-Step Roadmap", section_style))
    
    checklist = state_data.get('checklist', get_standard_checklist())
    for step in checklist:
        story.append(Paragraph(f"☐ Step {step['step']}: {step['title']}", step_title_style))
        story.append(Paragraph(step['description'], step_desc_style))
        story.append(Spacer(1, 0.1*inch))
    
    story.append(Spacer(1, 0.2*inch))
    
    # Key Links Section
    story.append(Paragraph("Key Resources", section_style))
    links = [
        f"• Medicaid Enrollment: {state_data.get('medicaid_enrollment_url', 'Contact state Medicaid')}",
        f"• Certification Info: {state_data.get('certification_url', 'Contact certifying body')}",
        f"• Business Registration: {state_data.get('secretary_of_state_url', 'Secretary of State website')}"
    ]
    for link in links:
        story.append(Paragraph(link, body_style))
    
    story.append(Spacer(1, 0.3*inch))
    
    # Footer/Disclaimer
    story.append(Paragraph("—" * 60, footer_style))
    story.append(Paragraph("This roadmap is for educational purposes only. Requirements change frequently.", footer_style))
    story.append(Paragraph("Always verify current requirements with official state agencies before proceeding.", footer_style))
    story.append(Paragraph("© Launch Your Peer Support Agency™", footer_style))
    
    doc.build(story)
    buffer.seek(0)
    return buffer

# ============== CSV GENERATION ==============
import csv
from io import StringIO

def generate_csv(data: list, fields: list) -> StringIO:
    """Generate a CSV file from a list of dictionaries."""
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction='ignore')
    writer.writeheader()
    for row in data:
        writer.writerow(row)
    output.seek(0)
    return output

# ============== API ROUTES ==============
def verify_admin_password(password: str) -> bool:
    """Verify admin password against stored hash."""
    if not ADMIN_PASSWORD_HASH:
        return False
    return hashlib.sha256(password.encode()).hexdigest() == ADMIN_PASSWORD_HASH

def create_admin_token(username: str) -> str:
    """Create JWT token for admin session."""
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": username,
        "role": "admin",
        "exp": expiration,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_admin_token(token: str) -> Optional[dict]:
    """Verify JWT token and return payload if valid."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("role") != "admin":
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Dependency to verify admin authentication."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    payload = verify_admin_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return payload

def check_rate_limit(client_ip: str) -> tuple[bool, Optional[str]]:
    """Check if login is rate limited. Returns (allowed, error_message)."""
    now = datetime.now(timezone.utc)
    
    if client_ip in login_attempts:
        attempt_info = login_attempts[client_ip]
        
        # Check if currently locked out
        if attempt_info.get("locked_until"):
            if now < attempt_info["locked_until"]:
                remaining = (attempt_info["locked_until"] - now).seconds // 60 + 1
                return False, f"Account locked. Try again in {remaining} minute(s)"
            else:
                # Lockout expired, reset
                login_attempts[client_ip] = {"count": 0, "last_attempt": now}
    
    return True, None

def record_login_attempt(client_ip: str, success: bool):
    """Record login attempt for rate limiting."""
    now = datetime.now(timezone.utc)
    
    if success:
        # Clear attempts on successful login
        if client_ip in login_attempts:
            del login_attempts[client_ip]
        return
    
    # Failed attempt
    if client_ip not in login_attempts:
        login_attempts[client_ip] = {"count": 0, "last_attempt": now}
    
    login_attempts[client_ip]["count"] += 1
    login_attempts[client_ip]["last_attempt"] = now
    
    # Lock out after MAX_LOGIN_ATTEMPTS
    if login_attempts[client_ip]["count"] >= MAX_LOGIN_ATTEMPTS:
        login_attempts[client_ip]["locked_until"] = now + timedelta(minutes=LOCKOUT_DURATION_MINUTES)

# ============== USER AUTHENTICATION ==============
MAGIC_LINK_EXPIRY_MINUTES = 15
USER_JWT_EXPIRATION_HOURS = 72

def generate_magic_token() -> str:
    """Generate a secure magic link token."""
    return secrets.token_urlsafe(32)

def create_user_token(user_id: str, email: str) -> str:
    """Create JWT token for user session."""
    expiration = datetime.now(timezone.utc) + timedelta(hours=USER_JWT_EXPIRATION_HOURS)
    payload = {
        "sub": user_id,
        "email": email,
        "role": "user",
        "exp": expiration,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_user_token(token: str) -> Optional[dict]:
    """Verify user JWT token and return payload if valid."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("role") != "user":
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    """Dependency to get current user (optional - returns None if not authenticated)."""
    if not credentials:
        return None
    
    payload = verify_user_token(credentials.credentials)
    return payload

async def require_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Dependency to require user authentication."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    payload = verify_user_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return payload

def send_magic_link_email(email: str, token: str, frontend_url: str):
    """
    Send magic link email. Currently mocked - logs to console.
    Replace with real SendGrid implementation when ready.
    """
    magic_link = f"{frontend_url}/auth/verify?token={token}"
    
    # MOCK EMAIL - Log to console for development
    logger.info("=" * 60)
    logger.info("📧 MOCK MAGIC LINK EMAIL")
    logger.info(f"To: {email}")
    logger.info(f"Subject: Your Login Link for Peer Support Agency Launch")
    logger.info(f"Magic Link: {magic_link}")
    logger.info(f"Token: {token}")
    logger.info(f"Expires in: {MAGIC_LINK_EXPIRY_MINUTES} minutes")
    logger.info("=" * 60)
    
    # TODO: Replace with real SendGrid implementation:
    # from sendgrid import SendGridAPIClient
    # from sendgrid.helpers.mail import Mail
    # sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
    # message = Mail(from_email=os.environ.get('SENDER_EMAIL'), to_emails=email, ...)
    # sg.send(message)
    
    return True

# ============== PAYWALL HELPERS ==============
def is_user_grandfathered(user_doc: dict) -> bool:
    """Check if user was created before paywall launch and should get free access."""
    created_at = user_doc.get("created_at")
    if not created_at:
        return False
    try:
        user_created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        paywall_date = datetime.fromisoformat(PAYWALL_LAUNCH_DATE)
        return user_created < paywall_date
    except:
        return False

def get_user_state_access(user_doc: dict, state_code: str) -> dict:
    """
    Determine user's access level for a specific state.
    Returns: { has_access: bool, reason: str, is_free_tier: bool }
    """
    state_code = state_code.upper()
    
    # Check if state is fully populated - unpopulated states are free for everyone
    if state_code not in FULLY_POPULATED_STATES:
        return {
            "has_access": True,
            "reason": "unpopulated_state",
            "is_free_tier": True,
            "access_type": "free"
        }
    
    # Check if user has purchased this state
    purchases = user_doc.get("purchases", [])
    purchased_states = [p.get("state_code") for p in purchases if p.get("type") == "state_access"]
    
    if state_code in purchased_states:
        return {
            "has_access": True,
            "reason": "purchased",
            "is_free_tier": False,
            "access_type": "premium"
        }
    
    # Check if user is grandfathered (created before paywall) AND this is their selected state
    if is_user_grandfathered(user_doc):
        selected_state = user_doc.get("selected_state", "").upper()
        if selected_state == state_code:
            return {
                "has_access": True,
                "reason": "grandfathered",
                "is_free_tier": False,
                "access_type": "premium"
            }
    
    # Default: free tier access only (steps 1-3)
    return {
        "has_access": False,
        "reason": "no_purchase",
        "is_free_tier": True,
        "access_type": "free"
    }

@api_router.get("/")
async def root(): return {"message": "Peer Support Agency Launch API", "version": "4.0"}

@api_router.get("/states")
async def get_all_states(): 
    return {
        "states": [
            {
                "code": s["code"], 
                "name": s["name"], 
                "is_fully_populated": s["code"] in FULL_GUIDANCE_STATES,
                **get_state_tier(s["code"])
            } for s in ALL_STATES
        ]
    }

@api_router.get("/states/{state_code}")
async def get_state_data(state_code: str):
    state_code = state_code.upper()
    state_info = next((s for s in ALL_STATES if s["code"] == state_code), None)
    if not state_info: raise HTTPException(status_code=404, detail="State not found")
    
    # Get tier information for this state
    tier_info = get_state_tier(state_code)
    
    if state_code in STATE_DATA:
        data = STATE_DATA[state_code]
        # Convert Pydantic models to dicts
        result = {**data}
        result["managed_care_orgs"] = [m.model_dump() if hasattr(m, 'model_dump') else m for m in data.get("managed_care_orgs", [])]
        result["official_links"] = [l.model_dump() if hasattr(l, 'model_dump') else l for l in data.get("official_links", [])]
        result["laws_and_rules"] = [l.model_dump() if hasattr(l, 'model_dump') else l for l in data.get("laws_and_rules", [])]
        result["credentialing_requirements"] = [c.model_dump() if hasattr(c, 'model_dump') else c for c in data.get("credentialing_requirements", [])]
        result["zoning_info"] = data.get("zoning_info").model_dump() if hasattr(data.get("zoning_info"), 'model_dump') else data.get("zoning_info")
        # Add location status for Business Address & Service Location section
        result["location_status"] = LOCATION_STATUS.get(state_code, DEFAULT_LOCATION_STATUS)
        # Add tier info
        result["tier_info"] = tier_info
        return result
    
    # For unpopulated states, return placeholder with location status and tier info
    placeholder = get_placeholder_state_data(state_code, state_info["name"])
    placeholder["location_status"] = LOCATION_STATUS.get(state_code, DEFAULT_LOCATION_STATUS)
    placeholder["tier_info"] = tier_info
    return placeholder

@api_router.get("/federal-links")
async def get_federal_links(): return {"links": FEDERAL_LINKS}

@api_router.get("/universal-credentialing")
async def get_universal_credentialing(): return {"requirements": [r.model_dump() for r in UNIVERSAL_CREDENTIALING]}

@api_router.get("/pp-framework")
async def get_pp_framework(): return PP_FRAMEWORK

@api_router.get("/disclaimers")
async def get_disclaimers(): return {"disclaimers": DISCLAIMERS}

@api_router.get("/templates")
async def get_templates(): return {"templates": [{"id": t["id"], "title": t["title"], "description": t["description"], "category": t["category"], "preview_text": t["preview_text"], "download_url": f"/api/templates/download/{t['id']}"} for t in TEMPLATES.values()]}

@api_router.get("/templates/download/{template_id}")
async def download_template(template_id: str):
    return StreamingResponse(generate_template_pdf(template_id), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={template_id}.pdf"})

@api_router.get("/states/{state_code}/roadmap-pdf")
async def download_state_roadmap(state_code: str):
    """Download a clean PDF roadmap for a specific state."""
    state_code = state_code.upper()
    state_info = next((s for s in ALL_STATES if s["code"] == state_code), None)
    if not state_info:
        raise HTTPException(status_code=404, detail="State not found")
    
    pdf_buffer = generate_state_roadmap_pdf(state_code)
    filename = f"{state_code.lower()}-peer-support-roadmap.pdf"
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.post("/email-capture")
async def capture_email(data: EmailCapture):
    await db.email_captures.insert_one({"id": str(uuid.uuid4()), "email": data.email, "name": data.name, "source": data.source, "template_id": data.template_id, "state": data.state, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"success": True, "message": "Thank you!"}

@api_router.post("/consultation-request")
async def submit_consultation(data: ConsultationRequest):
    await db.consultation_requests.insert_one({"id": str(uuid.uuid4()), "name": data.name, "email": data.email, "state": data.state, "phone": data.phone, "message": data.message, "status": "pending", "created_at": datetime.now(timezone.utc).isoformat()})
    return {"success": True, "message": "Consultation request submitted."}

@api_router.get("/national-overview")
async def get_national_overview(): return NATIONAL_OVERVIEW

@api_router.get("/products")
async def get_products(): 
    return {
        "products": PRODUCTS,
        "fully_populated_states": FULLY_POPULATED_STATES
    }

# ============== DOCUMENT SHOP ==============
@api_router.get("/document-shop")
async def get_document_shop():
    """Get all available Document Shop products."""
    return {
        "products": list(DOCUMENT_SHOP_PRODUCTS.values()),
        "categories": {
            "core": [p for p in DOCUMENT_SHOP_PRODUCTS.values() if p["scope"] == "core"],
            "addendum": [p for p in DOCUMENT_SHOP_PRODUCTS.values() if p["scope"] == "addendum"]
        }
    }

@api_router.post("/checkout/document")
async def create_document_checkout(product_id: str, origin_url: str, http_request: Request):
    """Create a checkout session for a Document Shop purchase."""
    if product_id not in DOCUMENT_SHOP_PRODUCTS:
        raise HTTPException(status_code=400, detail="Invalid document product")
    
    product = DOCUMENT_SHOP_PRODUCTS[product_id]
    api_key = os.environ.get('STRIPE_API_KEY')
    webhook_url = f"{str(http_request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    session = await stripe_checkout.create_checkout_session(
        CheckoutSessionRequest(
            amount=product["price"],
            currency="usd",
            success_url=f"{origin_url.rstrip('/')}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&type=document&product={product_id}",
            cancel_url=f"{origin_url.rstrip('/')}/document-shop",
            metadata={
                "type": "document_purchase",
                "product_id": product_id,
                "product_name": product["name"]
            }
        )
    )
    
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "product_id": product_id,
        "product_name": product["name"],
        "type": "document_purchase",
        "amount": product["price"],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"url": session.url, "session_id": session.session_id, "product": product}

@api_router.get("/location-status/{state_code}")
async def get_location_status(state_code: str):
    """Get business location/service status for a state."""
    state_code = state_code.upper()
    
    # Check if state exists
    state_info = next((s for s in ALL_STATES if s["code"] == state_code), None)
    if not state_info:
        raise HTTPException(status_code=404, detail="State not found")
    
    # Get state-specific or default location status
    location_info = LOCATION_STATUS.get(state_code, DEFAULT_LOCATION_STATUS)
    
    return {
        "state_code": state_code,
        "state_name": state_info["name"],
        **location_info
    }

@api_router.post("/checkout/create-session")
async def create_checkout_session(request: CheckoutRequest, http_request: Request):
    if request.product_id not in PRODUCTS: raise HTTPException(status_code=400, detail="Invalid product")
    product = PRODUCTS[request.product_id]
    api_key = os.environ.get('STRIPE_API_KEY')
    webhook_url = f"{str(http_request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    session = await stripe_checkout.create_checkout_session(CheckoutSessionRequest(amount=product["price"], currency="usd", success_url=f"{request.origin_url.rstrip('/')}/payment-success?session_id={{CHECKOUT_SESSION_ID}}", cancel_url=f"{request.origin_url.rstrip('/')}/payment-cancel", metadata={"product_id": request.product_id, "product_name": product["name"]}))
    await db.payment_transactions.insert_one({"id": str(uuid.uuid4()), "session_id": session.session_id, "product_id": request.product_id, "product_name": product["name"], "amount": product["price"], "status": "pending", "created_at": datetime.now(timezone.utc).isoformat()})
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, http_request: Request):
    api_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=f"{str(http_request.base_url).rstrip('/')}/api/webhook/stripe")
    status = await stripe_checkout.get_checkout_status(session_id)
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"status": status.status, "payment_status": status.payment_status, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"status": status.status, "payment_status": status.payment_status, "amount_total": status.amount_total, "currency": status.currency, "metadata": status.metadata}

# ============== STATE ACCESS PURCHASE (PAYWALL) ==============
@api_router.post("/checkout/state")
async def create_state_checkout(request: StateCheckoutRequest, http_request: Request, user: dict = Depends(require_current_user)):
    """Create a checkout session for purchasing access to a specific state."""
    state_code = request.state_code.upper()
    
    # Check if state exists
    state_info = next((s for s in ALL_STATES if s["code"] == state_code), None)
    if not state_info:
        raise HTTPException(status_code=404, detail="State not found")
    
    # Check if state is fully populated - can't purchase unpopulated states
    if state_code not in FULLY_POPULATED_STATES:
        raise HTTPException(
            status_code=400, 
            detail="This state's guide is not yet available for purchase. It's currently free to view."
        )
    
    # Check if user already has access
    user_doc = await db.users.find_one({"id": user["sub"]}, {"_id": 0})
    if user_doc:
        access = get_user_state_access(user_doc, state_code)
        if access["has_access"] and access["access_type"] == "premium":
            raise HTTPException(
                status_code=400, 
                detail="You already have full access to this state"
            )
    
    # Create Stripe checkout session
    api_key = os.environ.get('STRIPE_API_KEY')
    webhook_url = f"{str(http_request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    session = await stripe_checkout.create_checkout_session(
        CheckoutSessionRequest(
            amount=STATE_ACCESS_PRICE,
            currency="usd",
            success_url=f"{request.origin_url.rstrip('/')}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&type=state&state={state_code}",
            cancel_url=f"{request.origin_url.rstrip('/')}/dashboard",
            metadata={
                "type": "state_access",
                "state_code": state_code,
                "state_name": state_info["name"],
                "user_id": user["sub"],
                "user_email": user["email"]
            }
        )
    )
    
    # Record the pending transaction
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "product_id": f"state-{state_code}",
        "product_name": f"{state_info['name']} State Access",
        "type": "state_access",
        "state_code": state_code,
        "user_id": user["sub"],
        "user_email": user["email"],
        "amount": STATE_ACCESS_PRICE,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "url": session.url,
        "session_id": session.session_id,
        "state_code": state_code,
        "amount": STATE_ACCESS_PRICE
    }

@api_router.get("/user/access/{state_code}")
async def check_user_state_access(state_code: str, user: dict = Depends(require_current_user)):
    """Check user's access level for a specific state."""
    state_code = state_code.upper()
    
    user_doc = await db.users.find_one({"id": user["sub"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    access = get_user_state_access(user_doc, state_code)
    
    # Add state info
    state_info = next((s for s in ALL_STATES if s["code"] == state_code), None)
    is_populated = state_code in FULLY_POPULATED_STATES
    
    return {
        **access,
        "state_code": state_code,
        "state_name": state_info["name"] if state_info else state_code,
        "is_populated": is_populated,
        "price": STATE_ACCESS_PRICE if is_populated else 0,
        "free_steps": FREE_STEPS,
        "premium_steps": PREMIUM_STEPS
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        body = await request.body()
        api_key = os.environ.get('STRIPE_API_KEY')
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=f"{str(request.base_url).rstrip('/')}/api/webhook/stripe")
        webhook_response = await stripe_checkout.handle_webhook(body, request.headers.get("Stripe-Signature"))
        
        if webhook_response.session_id:
            # Update transaction status
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id}, 
                {"$set": {
                    "status": webhook_response.event_type, 
                    "payment_status": webhook_response.payment_status, 
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # If payment succeeded, grant access for state purchases
            if webhook_response.payment_status == "paid":
                # Find the transaction to get metadata
                transaction = await db.payment_transactions.find_one(
                    {"session_id": webhook_response.session_id}, 
                    {"_id": 0}
                )
                
                if transaction and transaction.get("type") == "state_access":
                    user_id = transaction.get("user_id")
                    state_code = transaction.get("state_code")
                    
                    if user_id and state_code:
                        # Grant state access to user
                        purchase_record = {
                            "type": "state_access",
                            "state_code": state_code,
                            "session_id": webhook_response.session_id,
                            "amount": transaction.get("amount"),
                            "purchased_at": datetime.now(timezone.utc).isoformat()
                        }
                        
                        await db.users.update_one(
                            {"id": user_id},
                            {
                                "$addToSet": {"purchases": purchase_record},
                                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
                            }
                        )
                        logger.info(f"✅ Granted {state_code} access to user {user_id}")
                        
    except Exception as e: 
        logger.error(f"Webhook error: {e}")
    return {"received": True}

@api_router.post("/admin/login")
async def admin_login(data: AdminLogin, request: Request):
    """Secure admin login with rate limiting and JWT tokens."""
    client_ip = request.client.host if request.client else "unknown"
    
    # Check rate limiting
    allowed, error_msg = check_rate_limit(client_ip)
    if not allowed:
        raise HTTPException(status_code=429, detail=error_msg)
    
    # Verify credentials
    if data.username != ADMIN_USERNAME or not verify_admin_password(data.password):
        record_login_attempt(client_ip, success=False)
        attempts_remaining = MAX_LOGIN_ATTEMPTS - login_attempts.get(client_ip, {}).get("count", 0)
        if attempts_remaining > 0:
            raise HTTPException(status_code=401, detail=f"Invalid credentials. {attempts_remaining} attempt(s) remaining")
        else:
            raise HTTPException(status_code=429, detail=f"Account locked for {LOCKOUT_DURATION_MINUTES} minutes")
    
    # Successful login
    record_login_attempt(client_ip, success=True)
    token = create_admin_token(data.username)
    
    return {"success": True, "token": token, "message": "Login successful"}

@api_router.get("/admin/leads")
async def get_leads(admin: dict = Depends(get_current_admin)):
    """Get all captured leads (requires admin authentication)."""
    return {"leads": await db.email_captures.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)}

@api_router.get("/admin/consultations")
async def get_consultations(admin: dict = Depends(get_current_admin)):
    """Get all consultation requests (requires admin authentication)."""
    return {"consultations": await db.consultation_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)}

@api_router.get("/admin/payments")
async def get_payments(admin: dict = Depends(get_current_admin)):
    """Get all payment transactions (requires admin authentication)."""
    return {"payments": await db.payment_transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)}

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_current_admin)):
    """Get dashboard statistics (requires admin authentication)."""
    leads = await db.email_captures.count_documents({})
    consultations = await db.consultation_requests.count_documents({})
    payments = await db.payment_transactions.count_documents({})
    paid = await db.payment_transactions.count_documents({"payment_status": "paid"})
    revenue = sum([d.get("amount", 0) for d in await db.payment_transactions.find({"payment_status": "paid"}, {"_id": 0, "amount": 1}).to_list(1000)])
    broken_links = await db.broken_link_reports.count_documents({"status": "pending"})
    return {"leads": leads, "consultations": consultations, "payments": payments, "paid_payments": paid, "total_revenue": revenue, "broken_links_pending": broken_links}

@api_router.get("/admin/broken-links")
async def get_broken_links(admin: dict = Depends(get_current_admin)):
    """Get all broken link reports (requires admin authentication)."""
    return {"reports": await db.broken_link_reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)}

@api_router.put("/admin/broken-links/{report_id}")
async def update_broken_link_status(report_id: str, status: str, admin: dict = Depends(get_current_admin)):
    """Update broken link report status (requires admin authentication)."""
    if status not in ["pending", "fixed", "dismissed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    await db.broken_link_reports.update_one(
        {"id": report_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "message": f"Report marked as {status}"}

# ============== ADMIN CSV EXPORTS ==============
@api_router.get("/admin/export/leads")
async def export_leads_csv(admin: dict = Depends(get_current_admin)):
    """Export all leads as CSV."""
    leads = await db.email_captures.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    fields = ["email", "name", "source", "state", "template_id", "created_at"]
    csv_data = generate_csv(leads, fields)
    return StreamingResponse(
        iter([csv_data.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads.csv"}
    )

@api_router.get("/admin/export/consultations")
async def export_consultations_csv(admin: dict = Depends(get_current_admin)):
    """Export all consultations as CSV."""
    consultations = await db.consultation_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    fields = ["name", "email", "phone", "state", "message", "status", "created_at"]
    csv_data = generate_csv(consultations, fields)
    return StreamingResponse(
        iter([csv_data.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=consultations.csv"}
    )

@api_router.get("/admin/export/payments")
async def export_payments_csv(admin: dict = Depends(get_current_admin)):
    """Export all payments as CSV."""
    payments = await db.payment_transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    fields = ["product_name", "amount", "payment_status", "session_id", "created_at"]
    csv_data = generate_csv(payments, fields)
    return StreamingResponse(
        iter([csv_data.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=payments.csv"}
    )

@api_router.get("/admin/export/users")
async def export_users_csv(admin: dict = Depends(get_current_admin)):
    """Export all registered users as CSV."""
    users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    # Flatten user data for CSV
    flat_users = []
    for u in users:
        progress_summary = ""
        if u.get("progress"):
            for state, prog in u.get("progress", {}).items():
                completed = len(prog.get("completed_steps", []))
                progress_summary += f"{state}:{completed}/11 "
        flat_users.append({
            "email": u.get("email"),
            "name": u.get("name"),
            "selected_state": u.get("selected_state"),
            "goal": u.get("goal"),
            "onboarding_complete": u.get("onboarding_complete"),
            "progress": progress_summary.strip(),
            "created_at": u.get("created_at")
        })
    fields = ["email", "name", "selected_state", "goal", "onboarding_complete", "progress", "created_at"]
    csv_data = generate_csv(flat_users, fields)
    return StreamingResponse(
        iter([csv_data.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users.csv"}
    )

# ============== PUBLIC BROKEN LINK REPORT ==============
@api_router.post("/report-broken-link")
async def report_broken_link(data: BrokenLinkReport):
    """Submit a broken link report (public endpoint)."""
    report = {
        "id": str(uuid.uuid4()),
        "url": data.url,
        "page": data.page,
        "state_code": data.state_code,
        "description": data.description,
        "reporter_email": data.reporter_email,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.broken_link_reports.insert_one(report)
    return {"success": True, "message": "Thank you for reporting this issue. We'll review it soon."}

# ============== USER ACCOUNT ENDPOINTS ==============
@api_router.post("/auth/magic-link")
async def request_magic_link(data: MagicLinkRequest, request: Request):
    """Request a magic link for passwordless login."""
    email = data.email.lower()
    
    # Check if user exists, if not create one
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = str(uuid.uuid4())
        await db.users.insert_one({
            "id": user_id,
            "email": email,
            "name": None,
            "selected_state": None,
            "goal": None,
            "onboarding_complete": False,
            "progress": {},
            "bookmarks": [],
            "purchases": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    else:
        user_id = user["id"]
    
    # Generate magic token
    token = generate_magic_token()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=MAGIC_LINK_EXPIRY_MINUTES)
    
    # Store magic token
    await db.magic_tokens.insert_one({
        "token": token,
        "user_id": user_id,
        "email": email,
        "expires_at": expires_at.isoformat(),
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Get frontend URL from request origin or use default
    origin = request.headers.get("origin", "http://localhost:3000")
    
    # Send magic link email (mocked for now)
    send_magic_link_email(email, token, origin)
    
    return {
        "success": True,
        "message": "Magic link sent to your email",
        "dev_token": token  # Remove in production - only for development testing
    }

@api_router.post("/auth/verify")
async def verify_magic_link(data: MagicLinkVerify):
    """Verify magic link token and return JWT."""
    # Find token
    token_doc = await db.magic_tokens.find_one({"token": data.token, "used": False}, {"_id": 0})
    
    if not token_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Check expiration
    expires_at = datetime.fromisoformat(token_doc["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Token has expired")
    
    # Mark token as used
    await db.magic_tokens.update_one({"token": data.token}, {"$set": {"used": True}})
    
    # Get user
    user = await db.users.find_one({"id": token_doc["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create JWT
    jwt_token = create_user_token(user["id"], user["email"])
    
    return {
        "success": True,
        "token": jwt_token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name"),
            "selected_state": user.get("selected_state"),
            "goal": user.get("goal"),
            "onboarding_complete": user.get("onboarding_complete", False)
        }
    }

@api_router.get("/auth/me")
async def get_current_user_info(user: dict = Depends(require_current_user)):
    """Get current user's profile with access information."""
    user_doc = await db.users.find_one({"id": user["sub"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate state access for selected state
    state_access = None
    selected_state = user_doc.get("selected_state")
    if selected_state:
        state_access = get_user_state_access(user_doc, selected_state)
        state_access["state_code"] = selected_state
    
    # Get list of all purchased states
    purchases = user_doc.get("purchases", [])
    purchased_states = [p.get("state_code") for p in purchases if p.get("type") == "state_access"]
    
    return {
        "id": user_doc["id"],
        "email": user_doc["email"],
        "name": user_doc.get("name"),
        "selected_state": selected_state,
        "goal": user_doc.get("goal"),
        "onboarding_complete": user_doc.get("onboarding_complete", False),
        "progress": user_doc.get("progress", {}),
        "bookmarks": user_doc.get("bookmarks", []),
        "purchases": purchases,
        "purchased_states": purchased_states,
        "state_access": state_access,
        "is_grandfathered": is_user_grandfathered(user_doc)
    }

@api_router.post("/auth/onboarding")
async def complete_onboarding(data: OnboardingData, user: dict = Depends(require_current_user)):
    """Complete user onboarding with state and goal selection."""
    await db.users.update_one(
        {"id": user["sub"]},
        {"$set": {
            "selected_state": data.selected_state,
            "goal": data.goal,
            "name": data.name,
            "onboarding_complete": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Onboarding complete"}

@api_router.put("/user/profile")
async def update_user_profile(data: UserProfileUpdate, user: dict = Depends(require_current_user)):
    """Update user profile."""
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if data.name is not None:
        update_data["name"] = data.name
    if data.selected_state is not None:
        update_data["selected_state"] = data.selected_state
    if data.goal is not None:
        update_data["goal"] = data.goal
    
    await db.users.update_one({"id": user["sub"]}, {"$set": update_data})
    return {"success": True, "message": "Profile updated"}

@api_router.post("/user/progress/{state_code}")
async def update_state_progress(state_code: str, data: UserProgress, user: dict = Depends(require_current_user)):
    """Update user's progress for a specific state."""
    state_code = state_code.upper()
    
    await db.users.update_one(
        {"id": user["sub"]},
        {"$set": {
            f"progress.{state_code}": {
                "completed_steps": data.completed_steps,
                "bookmarked_links": data.bookmarked_links,
                "notes": data.notes,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": f"Progress updated for {state_code}"}

@api_router.get("/user/progress/{state_code}")
async def get_state_progress(state_code: str, user: dict = Depends(require_current_user)):
    """Get user's progress for a specific state."""
    state_code = state_code.upper()
    user_doc = await db.users.find_one({"id": user["sub"]}, {"_id": 0, "progress": 1})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    progress = user_doc.get("progress", {}).get(state_code, {
        "completed_steps": [],
        "bookmarked_links": [],
        "notes": None
    })
    
    return progress

@api_router.post("/user/bookmark")
async def add_bookmark(link: str, user: dict = Depends(require_current_user)):
    """Add a bookmark."""
    await db.users.update_one(
        {"id": user["sub"]},
        {"$addToSet": {"bookmarks": link}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "message": "Bookmark added"}

@api_router.delete("/user/bookmark")
async def remove_bookmark(link: str, user: dict = Depends(require_current_user)):
    """Remove a bookmark."""
    await db.users.update_one(
        {"id": user["sub"]},
        {"$pull": {"bookmarks": link}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "message": "Bookmark removed"}

@api_router.get("/user/dashboard")
async def get_user_dashboard(user: dict = Depends(require_current_user)):
    """Get user dashboard data including progress, purchases, access info, and recommendations."""
    user_doc = await db.users.find_one({"id": user["sub"]}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's state data if they have one selected
    state_data = None
    state_access = None
    selected_state = user_doc.get("selected_state")
    
    if selected_state:
        state_code = selected_state.upper()
        state_access = get_user_state_access(user_doc, state_code)
        
        if state_code in STATE_DATA:
            state_data = {
                "state_code": state_code,
                "state_name": STATE_DATA[state_code]["state_name"],
                "is_fully_populated": True
            }
        else:
            state_info = next((s for s in ALL_STATES if s["code"] == state_code), None)
            if state_info:
                state_data = {
                    "state_code": state_code,
                    "state_name": state_info["name"],
                    "is_fully_populated": False
                }
    
    # Calculate overall progress
    progress = user_doc.get("progress", {})
    total_steps = 11  # Standard checklist has 11 steps
    overall_progress = {}
    
    for sc, state_progress in progress.items():
        completed = len(state_progress.get("completed_steps", []))
        overall_progress[sc] = {
            "completed": completed,
            "total": total_steps,
            "percentage": round((completed / total_steps) * 100, 1)
        }
    
    # Get purchased states
    purchases = user_doc.get("purchases", [])
    purchased_states = [p.get("state_code") for p in purchases if p.get("type") == "state_access"]
    
    return {
        "user": {
            "id": user_doc["id"],
            "email": user_doc["email"],
            "name": user_doc.get("name"),
            "goal": user_doc.get("goal"),
            "onboarding_complete": user_doc.get("onboarding_complete", False)
        },
        "selected_state": state_data,
        "state_access": state_access,
        "progress": overall_progress,
        "bookmarks": user_doc.get("bookmarks", []),
        "purchases": purchases,
        "purchased_states": purchased_states,
        "is_grandfathered": is_user_grandfathered(user_doc),
        "paywall": {
            "free_steps": FREE_STEPS,
            "premium_steps": PREMIUM_STEPS,
            "state_price": STATE_ACCESS_PRICE
        },
        "recent_activity": []  # Can be expanded later
    }

# ============== FAQ ASSISTANT ==============
# System prompt for the FAQ assistant - constrained to existing app content only
FAQ_SYSTEM_PROMPT = """You are a helpful FAQ assistant for "Launch Your Peer Support Agency™" - a platform that guides users through starting a Medicaid-billable Peer Support Specialist agency.

YOUR ROLE:
- Help users understand content in simple, plain language
- Answer common questions about the app and peer support agencies
- Guide users to the correct sections of the app
- Keep answers SHORT (2-4 sentences max) and reassuring

YOU MAY ANSWER QUESTIONS ABOUT:
- General Peer Support agency questions (what it is, how it works)
- Document explanations (Policies & Procedures, hiring packet, supervision packet, etc.)
- Cost and planning questions (startup costs are $300-$2,000 one-time, $550-$2,500/month)
- Checklist item explanations (the 11 steps to launch)
- App navigation help (what steps mean, why something might be locked)
- State-specific guidance exists for 13 states: NC, TX, CA, FL, NY, OH, PA, IL, GA, NJ, VA, WA, AZ

THE 11 LAUNCH STEPS ARE:
1. Form Your Business Entity (LLC/Corp registration, EIN)
2. Get Your NPI Numbers (Type 1 and Type 2 from NPPES)
3. Obtain Business Insurance (general and professional liability)
4. Enroll as Medicaid Provider
5. Credential with MCOs (Managed Care Organizations)
6. Hire Certified Peer Support Specialists
7. Establish Supervision Structure
8. Prepare Policies & Procedures
9. Set Up Billing Systems
10. Verify Zoning & Location Compliance
11. Start Accepting Referrals

AVAILABLE DOCUMENTS (all "Core - Works in All States"):
- Policies & Procedures Manual ($47) - operational manual for service delivery, supervision, training
- Hiring & Onboarding Packet ($37) - job descriptions, onboarding checklist, agreements
- Staff Rules & Employee Handbook ($37) - conduct, ethics, attendance policies
- Supervision Packet ($29) - supervisor role, logs, agreements
- Documentation Pack ($29) - service note templates, checklists
- Site Visit Readiness Binder ($24) - reviewer request checklist, folder organization

PAYWALL INFO:
- Steps 1-3 are FREE for all users
- Steps 4-11 require paid access ($49 per state) for fully populated states
- Unpopulated states are completely free

YOU MUST NOT:
- Provide legal advice or interpret state laws
- Confirm compliance or approval status for any user
- Invent requirements or steps not in the app
- Answer questions outside the app's existing content
- Give specific Medicaid billing codes or rates (these vary by state)
- Make promises about approval timelines or outcomes

RESPONSE FORMAT:
- Keep answers to 2-4 sentences maximum
- Use plain, non-technical language
- Be encouraging and reassuring
- Point users to relevant pages when helpful (e.g., "/document-shop", "/templates", "/state/NC")
- If you cannot answer, say: "I can only help with questions about the app content. For specific legal or compliance questions, please consult with a qualified professional."

Remember: You are an FAQ helper, not a compliance advisor."""

class FAQRequest(BaseModel):
    question: str
    context: str = ""  # Optional context like current page

@api_router.post("/faq-assistant")
async def faq_assistant(request: FAQRequest):
    """Limited FAQ assistant that answers questions using only existing app content."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="FAQ assistant not configured")
    
    try:
        # Use gpt-4o-mini for cost efficiency (short responses, no complex reasoning needed)
        chat = LlmChat(
            api_key=api_key,
            session_id=f"faq-{uuid.uuid4()}",  # No memory - each request is independent
            system_message=FAQ_SYSTEM_PROMPT
        ).with_model("openai", "gpt-4o-mini")
        
        # Build the user message with optional context
        user_text = request.question
        if request.context:
            user_text = f"[User is on: {request.context}]\n\nQuestion: {request.question}"
        
        user_message = UserMessage(text=user_text)
        
        # Get response
        response = await chat.send_message(user_message)
        
        # Add disclaimer to every response
        disclaimer = "\n\n_This information is for educational purposes only. Always verify with official Medicaid or state guidance._"
        
        return {
            "success": True,
            "answer": response + disclaimer
        }
    except Exception as e:
        logger.error(f"FAQ assistant error: {str(e)}")
        return {
            "success": False,
            "answer": "I'm having trouble right now. Please try again or browse our help pages.\n\n_This information is for educational purposes only. Always verify with official Medicaid or state guidance._"
        }

@api_router.get("/health")
async def health_check(): return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client(): client.close()
