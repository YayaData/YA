from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hashlib
from pathlib import Path
from pydantic import BaseModel, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
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

ADMIN_PASSWORD_HASH = hashlib.sha256("Chris229@@@".encode()).hexdigest()
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
    password: str

# ============== CONSTANTS ==============
PRODUCTS = {
    "pdf-guide": {"name": "Complete PDF Guide", "price": 47.00, "description": "Full 50-state guide in downloadable PDF"},
    "templates-bundle": {"name": "Editable Templates Bundle", "price": 97.00, "description": "All templates in Word/Excel format"},
    "state-bundle": {"name": "5-State Bundle", "price": 147.00, "description": "Complete guides for any 5 states"},
    "consultation": {"name": "Strategy Consultation", "price": 197.00, "description": "1-hour strategy call with expert"},
    "full-course": {"name": "Full Launch Course", "price": 297.00, "description": "Video course + templates + support"}
}

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

FULLY_POPULATED_STATES = ["NC", "TX", "CA", "FL", "NY", "OH", "PA", "IL", "GA", "NJ", "VA", "WA", "AZ"]

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
        {"step": 8, "title": "Develop Policies & Procedures", "description": "Create comprehensive P&P manual meeting state Medicaid and MCO requirements.", "category": "Compliance", "documents": ["P&P Manual", "HIPAA Policies", "Emergency Procedures"], "common_mistakes": ["Using generic templates without customization", "Missing required policies", "No review/update schedule"]},
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
        "last_verified": "2025-01"
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

# ============== API ROUTES ==============
def verify_admin_password(password): return hashlib.sha256(password.encode()).hexdigest() == ADMIN_PASSWORD_HASH

@api_router.get("/")
async def root(): return {"message": "Peer Support Agency Launch API", "version": "4.0"}

@api_router.get("/states")
async def get_all_states(): return {"states": [{"code": s["code"], "name": s["name"], "is_fully_populated": s["code"] in FULLY_POPULATED_STATES} for s in ALL_STATES]}

@api_router.get("/states/{state_code}")
async def get_state_data(state_code: str):
    state_code = state_code.upper()
    state_info = next((s for s in ALL_STATES if s["code"] == state_code), None)
    if not state_info: raise HTTPException(status_code=404, detail="State not found")
    if state_code in STATE_DATA:
        data = STATE_DATA[state_code]
        # Convert Pydantic models to dicts
        result = {**data}
        result["managed_care_orgs"] = [m.model_dump() if hasattr(m, 'model_dump') else m for m in data.get("managed_care_orgs", [])]
        result["official_links"] = [l.model_dump() if hasattr(l, 'model_dump') else l for l in data.get("official_links", [])]
        result["laws_and_rules"] = [l.model_dump() if hasattr(l, 'model_dump') else l for l in data.get("laws_and_rules", [])]
        result["credentialing_requirements"] = [c.model_dump() if hasattr(c, 'model_dump') else c for c in data.get("credentialing_requirements", [])]
        result["zoning_info"] = data.get("zoning_info").model_dump() if hasattr(data.get("zoning_info"), 'model_dump') else data.get("zoning_info")
        return result
    return get_placeholder_state_data(state_code, state_info["name"])

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
async def get_products(): return {"products": PRODUCTS}

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

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        body = await request.body()
        api_key = os.environ.get('STRIPE_API_KEY')
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=f"{str(request.base_url).rstrip('/')}/api/webhook/stripe")
        webhook_response = await stripe_checkout.handle_webhook(body, request.headers.get("Stripe-Signature"))
        if webhook_response.session_id:
            await db.payment_transactions.update_one({"session_id": webhook_response.session_id}, {"$set": {"status": webhook_response.event_type, "payment_status": webhook_response.payment_status, "updated_at": datetime.now(timezone.utc).isoformat()}})
    except Exception as e: logger.error(f"Webhook error: {e}")
    return {"received": True}

@api_router.post("/admin/login")
async def admin_login(data: AdminLogin):
    if verify_admin_password(data.password): return {"success": True}
    raise HTTPException(status_code=401, detail="Invalid password")

@api_router.get("/admin/leads")
async def get_leads(password: str = ""):
    if not verify_admin_password(password): raise HTTPException(status_code=401, detail="Unauthorized")
    return {"leads": await db.email_captures.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)}

@api_router.get("/admin/consultations")
async def get_consultations(password: str = ""):
    if not verify_admin_password(password): raise HTTPException(status_code=401, detail="Unauthorized")
    return {"consultations": await db.consultation_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)}

@api_router.get("/admin/payments")
async def get_payments(password: str = ""):
    if not verify_admin_password(password): raise HTTPException(status_code=401, detail="Unauthorized")
    return {"payments": await db.payment_transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)}

@api_router.get("/admin/stats")
async def get_admin_stats(password: str = ""):
    if not verify_admin_password(password): raise HTTPException(status_code=401, detail="Unauthorized")
    leads = await db.email_captures.count_documents({})
    consultations = await db.consultation_requests.count_documents({})
    payments = await db.payment_transactions.count_documents({})
    paid = await db.payment_transactions.count_documents({"payment_status": "paid"})
    revenue = sum([d.get("amount", 0) for d in await db.payment_transactions.find({"payment_status": "paid"}, {"_id": 0, "amount": 1}).to_list(1000)])
    return {"leads": leads, "consultations": consultations, "payments": payments, "paid_payments": paid, "total_revenue": revenue}

@api_router.get("/health")
async def health_check(): return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client(): client.close()
