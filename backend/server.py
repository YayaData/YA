from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, ListFlowable, ListItem
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Brand colors for PDF
NAVY = colors.HexColor('#0F172A')
GOLD = colors.HexColor('#B45309')
LIGHT_GOLD = colors.HexColor('#FEF3C7')

# Models
class CertificationRequirements(BaseModel):
    name: str
    who_qualifies: str
    training_hours: str
    certification_authority: str
    certification_link: str

class BusinessSetup(BaseModel):
    entity_type: str
    in_state_required: bool
    physical_office_required: bool
    notes: str

class MedicaidEnrollment(BaseModel):
    agency_name: str
    portal_link: str
    required_documents: List[str]
    npi_type2_required: bool

class ManagedCareOrg(BaseModel):
    name: str
    credentialing_link: str
    phone: Optional[str] = None

class SupervisionRules(BaseModel):
    licensed_supervisor_required: bool
    accepted_licenses: List[str]
    notes: str

class BillingOverview(BaseModel):
    common_codes: List[str]
    units_of_service: str
    documentation_basics: str
    reimbursement_notes: str

class ChecklistItem(BaseModel):
    step: int
    title: str
    description: str
    completed: bool = False

class StateData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    state_code: str
    state_name: str
    certification: CertificationRequirements
    business_setup: BusinessSetup
    medicaid_enrollment: MedicaidEnrollment
    managed_care_orgs: List[ManagedCareOrg]
    supervision_rules: SupervisionRules
    billing_overview: BillingOverview
    checklist: List[ChecklistItem]
    is_fully_populated: bool = False

class Template(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    category: str
    preview_text: str
    download_url: str

class NationalOverview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    what_is_peer_support: str
    what_is_medicaid_billable: str
    universal_requirements: List[str]
    best_practices: List[str]
    multi_state_strategy: str

class EmailCapture(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    source: str  # template_download, consultation, newsletter
    template_id: Optional[str] = None
    state: Optional[str] = None
    message: Optional[str] = None

class ConsultationRequest(BaseModel):
    name: str
    email: EmailStr
    state: str
    phone: Optional[str] = None
    message: str

class CheckoutRequest(BaseModel):
    product_id: str
    origin_url: str

class PaymentStatusRequest(BaseModel):
    session_id: str

# Product Packages (prices in USD)
PRODUCTS = {
    "pdf-guide": {"name": "Complete PDF Guide", "price": 47.00, "description": "Full 50-state guide in downloadable PDF"},
    "templates-bundle": {"name": "Editable Templates Bundle", "price": 97.00, "description": "All templates in Word/Excel format"},
    "full-course": {"name": "Full Launch Course", "price": 297.00, "description": "Video course + templates + support"},
    "consultation": {"name": "Strategy Consultation", "price": 197.00, "description": "1-hour strategy call with expert"}
}

# All 50 States
ALL_STATES = [
    {"code": "AL", "name": "Alabama"}, {"code": "AK", "name": "Alaska"}, 
    {"code": "AZ", "name": "Arizona"}, {"code": "AR", "name": "Arkansas"},
    {"code": "CA", "name": "California"}, {"code": "CO", "name": "Colorado"},
    {"code": "CT", "name": "Connecticut"}, {"code": "DE", "name": "Delaware"},
    {"code": "FL", "name": "Florida"}, {"code": "GA", "name": "Georgia"},
    {"code": "HI", "name": "Hawaii"}, {"code": "ID", "name": "Idaho"},
    {"code": "IL", "name": "Illinois"}, {"code": "IN", "name": "Indiana"},
    {"code": "IA", "name": "Iowa"}, {"code": "KS", "name": "Kansas"},
    {"code": "KY", "name": "Kentucky"}, {"code": "LA", "name": "Louisiana"},
    {"code": "ME", "name": "Maine"}, {"code": "MD", "name": "Maryland"},
    {"code": "MA", "name": "Massachusetts"}, {"code": "MI", "name": "Michigan"},
    {"code": "MN", "name": "Minnesota"}, {"code": "MS", "name": "Mississippi"},
    {"code": "MO", "name": "Missouri"}, {"code": "MT", "name": "Montana"},
    {"code": "NE", "name": "Nebraska"}, {"code": "NV", "name": "Nevada"},
    {"code": "NH", "name": "New Hampshire"}, {"code": "NJ", "name": "New Jersey"},
    {"code": "NM", "name": "New Mexico"}, {"code": "NY", "name": "New York"},
    {"code": "NC", "name": "North Carolina"}, {"code": "ND", "name": "North Dakota"},
    {"code": "OH", "name": "Ohio"}, {"code": "OK", "name": "Oklahoma"},
    {"code": "OR", "name": "Oregon"}, {"code": "PA", "name": "Pennsylvania"},
    {"code": "RI", "name": "Rhode Island"}, {"code": "SC", "name": "South Carolina"},
    {"code": "SD", "name": "South Dakota"}, {"code": "TN", "name": "Tennessee"},
    {"code": "TX", "name": "Texas"}, {"code": "UT", "name": "Utah"},
    {"code": "VT", "name": "Vermont"}, {"code": "VA", "name": "Virginia"},
    {"code": "WA", "name": "Washington"}, {"code": "WV", "name": "West Virginia"},
    {"code": "WI", "name": "Wisconsin"}, {"code": "WY", "name": "Wyoming"}
]

FULLY_POPULATED_STATES = ["NC", "TX", "CA", "FL", "NY"]

# State Data Definitions
STATE_DATA = {
    "NC": StateData(
        state_code="NC",
        state_name="North Carolina",
        is_fully_populated=True,
        certification=CertificationRequirements(
            name="Certified Peer Support Specialist (CPSS)",
            who_qualifies="Individuals with lived experience of mental health challenges, substance use disorders, or both who are in recovery",
            training_hours="40 hours of initial training + 20 hours of continuing education annually",
            certification_authority="NC Division of Mental Health, Developmental Disabilities and Substance Abuse Services (DMH/DD/SAS)",
            certification_link="https://www.ncdhhs.gov/divisions/mental-health-developmental-disabilities-and-substance-abuse/peer-support"
        ),
        business_setup=BusinessSetup(
            entity_type="LLC or Corporation required. Non-profit or for-profit allowed.",
            in_state_required=True,
            physical_office_required=False,
            notes="Virtual operations permitted but must have NC registered agent and business address. Must register with NC Secretary of State."
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name="NC Medicaid (NC Department of Health and Human Services)",
            portal_link="https://medicaid.ncdhhs.gov/providers/provider-enrollment",
            required_documents=["NPI Type 2 (Organization)", "NC Business License", "Articles of Incorporation/Organization", "W-9 Form", "Liability Insurance Certificate", "Ownership Disclosure Form", "Provider Agreement Application"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name="Alliance Health", credentialing_link="https://www.alliancehealthplan.org/providers/", phone="1-800-510-9132"),
            ManagedCareOrg(name="Eastpointe", credentialing_link="https://www.eastpointe.net/providers/", phone="1-800-913-6109"),
            ManagedCareOrg(name="Partners Health Management", credentialing_link="https://www.partnersbhm.org/providers/", phone="1-888-235-4673"),
            ManagedCareOrg(name="Sandhills Center", credentialing_link="https://www.sandhillscenter.org/providers/", phone="1-800-256-2452"),
            ManagedCareOrg(name="Trillium Health Resources", credentialing_link="https://www.trilliumhealthresources.org/providers/", phone="1-877-685-2415"),
            ManagedCareOrg(name="Vaya Health", credentialing_link="https://www.vayahealth.com/providers/", phone="1-800-962-9003")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["Licensed Clinical Social Worker (LCSW)", "Licensed Professional Counselor (LPC)", "Licensed Clinical Mental Health Counselor (LCMHC)", "Qualified Professional (QP)"],
            notes="Peer Support Specialists must work under supervision of a Qualified Professional. Supervisors must meet DMH/DD/SAS requirements."
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Self-help/peer services, per 15 minutes", "H0025 - Behavioral health prevention education service"],
            units_of_service="15-minute increments. Documentation required for each unit billed.",
            documentation_basics="Must include: date of service, start/end time, service location, description of activities, consumer progress notes, signature of PSS and supervisor.",
            reimbursement_notes="Rates vary by LME/MCO. Typically $4-8 per 15-minute unit. Contact individual MCO for current rates."
        ),
        checklist=[
            ChecklistItem(step=1, title="Form Your Business Entity", description="Register LLC or Corporation with NC Secretary of State. Obtain EIN from IRS."),
            ChecklistItem(step=2, title="Get Your NPI Numbers", description="Apply for NPI Type 1 (individual) and Type 2 (organization) through NPPES."),
            ChecklistItem(step=3, title="Obtain Business Insurance", description="Secure general liability and professional liability insurance coverage."),
            ChecklistItem(step=4, title="Enroll as NC Medicaid Provider", description="Complete provider enrollment application through NCTracks portal."),
            ChecklistItem(step=5, title="Credential with LME/MCOs", description="Apply for credentialing with each Managed Care Organization in your service area."),
            ChecklistItem(step=6, title="Hire Certified Peer Support Specialists", description="Recruit and hire staff with current CPSS certification from NC."),
            ChecklistItem(step=7, title="Establish Supervision Structure", description="Contract with or hire a Qualified Professional to provide required supervision."),
            ChecklistItem(step=8, title="Develop Policies & Procedures", description="Create comprehensive P&P manual meeting NC Medicaid and LME/MCO requirements."),
            ChecklistItem(step=9, title="Set Up Billing Systems", description="Implement electronic health records and billing software compatible with NCTracks."),
            ChecklistItem(step=10, title="Start Accepting Referrals", description="Network with referral sources and begin providing billable services.")
        ]
    ),
    "TX": StateData(
        state_code="TX",
        state_name="Texas",
        is_fully_populated=True,
        certification=CertificationRequirements(
            name="Mental Health Peer Specialist (MHPS) / Peer Recovery Support Specialist (PRSS)",
            who_qualifies="Individuals with personal lived experience of recovery from mental illness and/or substance use disorder",
            training_hours="MHPS: 40 hours training. PRSS: 46 hours training + supervision hours",
            certification_authority="Texas Health and Human Services Commission (HHSC) via Via Hope",
            certification_link="https://viahope.org/programs/peer-specialist-training/"
        ),
        business_setup=BusinessSetup(
            entity_type="LLC, Corporation, or Professional Association. For-profit and non-profit allowed.",
            in_state_required=True,
            physical_office_required=False,
            notes="Texas allows virtual operations. Must register with Texas Secretary of State. Consider registering in county of primary operations."
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name="Texas Medicaid & Healthcare Partnership (TMHP)",
            portal_link="https://www.tmhp.com/programs/medicaid",
            required_documents=["NPI Type 2", "Texas Sales Tax Permit (if applicable)", "W-9", "Proof of Liability Insurance", "HHSC Provider Application", "Ownership/Control Interest Form"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name="Superior HealthPlan", credentialing_link="https://www.superiorhealthplan.com/providers/", phone="1-877-391-5921"),
            ManagedCareOrg(name="Molina Healthcare of Texas", credentialing_link="https://www.molinahealthcare.com/providers/tx/", phone="1-888-562-5442"),
            ManagedCareOrg(name="UnitedHealthcare Community Plan", credentialing_link="https://www.uhccommunityplan.com/tx/", phone="1-888-887-9003"),
            ManagedCareOrg(name="Amerigroup Texas", credentialing_link="https://providers.amerigroup.com/texas", phone="1-800-454-3730"),
            ManagedCareOrg(name="Blue Cross Blue Shield of Texas", credentialing_link="https://www.bcbstx.com/provider/", phone="1-800-749-0966")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["Licensed Professional Counselor (LPC)", "Licensed Clinical Social Worker (LCSW)", "Licensed Marriage and Family Therapist (LMFT)", "Licensed Psychologist", "Qualified Mental Health Professional (QMHP)"],
            notes="Supervision ratios and requirements vary by service type. MHPS requires supervision by QMHP or licensed professional."
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Peer support services", "H2014 - Skills training and development", "H0025 - Behavioral health prevention"],
            units_of_service="15-minute increments for most services.",
            documentation_basics="Service notes must include: date, time, duration, location, activities performed, progress toward goals, and signatures.",
            reimbursement_notes="Texas Medicaid rates available through TMHP fee schedules. MCO rates negotiated individually."
        ),
        checklist=[
            ChecklistItem(step=1, title="Form Your Business Entity", description="Register with Texas Secretary of State. File for LLC or Corporation. Obtain EIN."),
            ChecklistItem(step=2, title="Get Your NPI Numbers", description="Apply for NPI Type 1 and Type 2 through NPPES."),
            ChecklistItem(step=3, title="Obtain Business Insurance", description="Secure general liability and professional liability insurance."),
            ChecklistItem(step=4, title="Enroll as Texas Medicaid Provider", description="Complete TMHP provider enrollment application."),
            ChecklistItem(step=5, title="Credential with MCOs", description="Apply to each Managed Care Organization in your service area."),
            ChecklistItem(step=6, title="Hire Certified Peer Specialists", description="Recruit MHPS or PRSS certified staff."),
            ChecklistItem(step=7, title="Establish Supervision Structure", description="Set up supervision with QMHP or licensed professional."),
            ChecklistItem(step=8, title="Develop Policies & Procedures", description="Create P&P manual meeting Texas HHSC requirements."),
            ChecklistItem(step=9, title="Set Up Billing Systems", description="Implement EHR compatible with TMHP claims submission."),
            ChecklistItem(step=10, title="Start Services", description="Begin accepting referrals and providing billable services.")
        ]
    ),
    "CA": StateData(
        state_code="CA",
        state_name="California",
        is_fully_populated=True,
        certification=CertificationRequirements(
            name="Medi-Cal Peer Support Specialist Certification",
            who_qualifies="Individuals with lived experience of mental health condition, substance use disorder, or both. Must be self-identified as being in recovery.",
            training_hours="75 hours of training + supervision hours. CalMHSA oversees the certification process.",
            certification_authority="California Department of Health Care Services (DHCS) through CalMHSA",
            certification_link="https://www.calmhsa.org/peer-certification/"
        ),
        business_setup=BusinessSetup(
            entity_type="LLC, Corporation, or Non-profit. California requires specific entity types for Medi-Cal providers.",
            in_state_required=True,
            physical_office_required=False,
            notes="California has complex county-based Medi-Cal systems. Consider registering in counties where you plan to operate. Telehealth allowed."
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name="California Department of Health Care Services (DHCS)",
            portal_link="https://www.dhcs.ca.gov/provgovpart/Pages/default.aspx",
            required_documents=["NPI Type 2", "California Business License", "Articles of Organization", "W-9", "Liability Insurance", "DHCS Provider Application", "Disclosure of Ownership"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name="LA Care Health Plan", credentialing_link="https://www.lacare.org/providers/", phone="1-866-522-2736"),
            ManagedCareOrg(name="Health Net", credentialing_link="https://www.healthnet.com/content/healthnet/en_us/providers.html", phone="1-800-641-7761"),
            ManagedCareOrg(name="Kaiser Permanente", credentialing_link="https://providers.kaiserpermanente.org/", phone="1-800-464-4000"),
            ManagedCareOrg(name="Molina Healthcare of California", credentialing_link="https://www.molinahealthcare.com/providers/ca/", phone="1-888-665-4621"),
            ManagedCareOrg(name="Anthem Blue Cross", credentialing_link="https://www.anthem.com/ca/provider/", phone="1-800-407-4627")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["Licensed Clinical Social Worker (LCSW)", "Licensed Marriage and Family Therapist (LMFT)", "Licensed Professional Clinical Counselor (LPCC)", "Licensed Psychologist", "Registered Nurse (RN) with psychiatric experience"],
            notes="Supervision requirements determined by county Mental Health Plan. Peer services typically supervised by licensed clinician or clinical supervisor."
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Peer support services", "H0025 - Behavioral health prevention", "H2014 - Skills training"],
            units_of_service="15-minute increments. Some counties may have different unit structures.",
            documentation_basics="Documentation must meet county MHP standards. Include: date, time, service type, interventions, progress notes, and signatures.",
            reimbursement_notes="Rates vary significantly by county. Contact your local county Mental Health Plan for specific fee schedules."
        ),
        checklist=[
            ChecklistItem(step=1, title="Form Your Business Entity", description="Register with California Secretary of State. File LLC or Corporation. Obtain EIN."),
            ChecklistItem(step=2, title="Get Your NPI Numbers", description="Apply for NPI Type 1 and Type 2 through NPPES."),
            ChecklistItem(step=3, title="Obtain Business Insurance", description="Secure general liability and professional liability insurance."),
            ChecklistItem(step=4, title="Connect with County MHP", description="Contact the Mental Health Plan in each county where you'll operate."),
            ChecklistItem(step=5, title="Enroll as Medi-Cal Provider", description="Complete DHCS provider enrollment and county MHP applications."),
            ChecklistItem(step=6, title="Credential with Health Plans", description="Apply to Medi-Cal managed care plans in your area."),
            ChecklistItem(step=7, title="Hire Certified Peer Specialists", description="Recruit staff with CalMHSA peer certification."),
            ChecklistItem(step=8, title="Establish Supervision Structure", description="Set up clinical supervision meeting county requirements."),
            ChecklistItem(step=9, title="Develop Policies & Procedures", description="Create P&P manual meeting DHCS and county MHP requirements."),
            ChecklistItem(step=10, title="Start Services", description="Begin accepting referrals and providing services.")
        ]
    ),
    "FL": StateData(
        state_code="FL",
        state_name="Florida",
        is_fully_populated=True,
        certification=CertificationRequirements(
            name="Certified Recovery Peer Specialist (CRPS)",
            who_qualifies="Individuals in recovery from mental health and/or substance use conditions with at least 2 years of recovery",
            training_hours="75 hours of training + examination. Florida Certification Board administers certification.",
            certification_authority="Florida Certification Board (FCB)",
            certification_link="https://flcertificationboard.org/certifications/crps/"
        ),
        business_setup=BusinessSetup(
            entity_type="LLC, Corporation, or Non-profit required for Medicaid enrollment.",
            in_state_required=True,
            physical_office_required=False,
            notes="Florida allows virtual operations. Must register with Florida Division of Corporations. Consider AHCA licensure requirements."
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name="Florida Agency for Health Care Administration (AHCA)",
            portal_link="https://ahca.myflorida.com/medicaid/",
            required_documents=["NPI Type 2", "Florida Business Registration", "Articles of Incorporation", "W-9", "Liability Insurance", "AHCA Provider Application", "Medicaid Provider Agreement"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name="Sunshine Health", credentialing_link="https://www.sunshinehealth.com/providers/", phone="1-866-796-0530"),
            ManagedCareOrg(name="Humana Healthy Horizons", credentialing_link="https://www.humana.com/provider/", phone="1-800-477-6931"),
            ManagedCareOrg(name="Simply Healthcare", credentialing_link="https://www.simplyhealthcareplans.com/florida-medicaid/providers/", phone="1-877-440-7963"),
            ManagedCareOrg(name="Molina Healthcare of Florida", credentialing_link="https://www.molinahealthcare.com/providers/fl/", phone="1-866-472-4585"),
            ManagedCareOrg(name="Aetna Better Health of Florida", credentialing_link="https://www.aetnabetterhealth.com/florida/providers/", phone="1-800-441-5501")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["Licensed Clinical Social Worker (LCSW)", "Licensed Mental Health Counselor (LMHC)", "Licensed Marriage and Family Therapist (LMFT)", "Licensed Psychologist", "Qualified Professional"],
            notes="CRPS must work under supervision of a licensed behavioral health professional. Supervision requirements per FCB standards."
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Peer support services", "H0025 - Prevention education", "H2014 - Skills training"],
            units_of_service="15-minute increments for most peer services.",
            documentation_basics="Documentation must include: service date/time, location, interventions used, progress toward treatment goals, and required signatures.",
            reimbursement_notes="Florida Medicaid fee schedules available through AHCA. MCO rates negotiated per contract."
        ),
        checklist=[
            ChecklistItem(step=1, title="Form Your Business Entity", description="Register with Florida Division of Corporations. File LLC or Corporation. Obtain EIN."),
            ChecklistItem(step=2, title="Get Your NPI Numbers", description="Apply for NPI Type 1 and Type 2 through NPPES."),
            ChecklistItem(step=3, title="Obtain Business Insurance", description="Secure general liability and professional liability insurance."),
            ChecklistItem(step=4, title="Apply for AHCA Licensure", description="Determine if behavioral health licensure is required for your services."),
            ChecklistItem(step=5, title="Enroll as Florida Medicaid Provider", description="Complete AHCA Medicaid provider enrollment."),
            ChecklistItem(step=6, title="Credential with MCOs", description="Apply to Managed Medical Assistance plans in your region."),
            ChecklistItem(step=7, title="Hire Certified Recovery Peer Specialists", description="Recruit staff with FCB CRPS certification."),
            ChecklistItem(step=8, title="Establish Supervision Structure", description="Set up supervision with licensed behavioral health professional."),
            ChecklistItem(step=9, title="Develop Policies & Procedures", description="Create P&P manual meeting Florida Medicaid requirements."),
            ChecklistItem(step=10, title="Start Services", description="Begin accepting referrals and billing services.")
        ]
    ),
    "NY": StateData(
        state_code="NY",
        state_name="New York",
        is_fully_populated=True,
        certification=CertificationRequirements(
            name="Certified Peer Specialist / Certified Recovery Peer Advocate",
            who_qualifies="Individuals with lived experience of mental health recovery or substance use recovery",
            training_hours="Peer Specialist: OMH-approved training. CRPA: OASAS-approved 46-hour training + 500 hours experience + exam.",
            certification_authority="NYS Office of Mental Health (OMH) / Office of Addiction Services and Supports (OASAS)",
            certification_link="https://omh.ny.gov/omhweb/peer_specialist/"
        ),
        business_setup=BusinessSetup(
            entity_type="Corporation or LLC. Non-profit recommended for OMH-funded programs.",
            in_state_required=True,
            physical_office_required=False,
            notes="New York has complex regulatory requirements. Consider OMH or OASAS operating certificate requirements. Telehealth permitted."
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name="New York State Department of Health (DOH) / eMedNY",
            portal_link="https://www.emedny.org/",
            required_documents=["NPI Type 2", "NY Business Certificate", "Articles of Incorporation", "W-9", "Liability Insurance", "Medicaid Provider Application", "OMH/OASAS Operating Certificate (if required)"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name="Healthfirst", credentialing_link="https://healthfirst.org/providers/", phone="1-888-250-2220"),
            ManagedCareOrg(name="Fidelis Care", credentialing_link="https://www.fideliscare.org/Providers", phone="1-888-343-3547"),
            ManagedCareOrg(name="MetroPlus Health Plan", credentialing_link="https://www.metroplus.org/providers/", phone="1-800-303-9626"),
            ManagedCareOrg(name="Emblem Health", credentialing_link="https://www.emblemhealth.com/providers/", phone="1-877-842-3633"),
            ManagedCareOrg(name="UnitedHealthcare Community Plan NY", credentialing_link="https://www.uhccommunityplan.com/ny/", phone="1-888-617-8979")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["Licensed Clinical Social Worker (LCSW)", "Licensed Mental Health Counselor (LMHC)", "Licensed Psychologist", "Licensed Creative Arts Therapist", "Psychiatrist", "CASAC (for CRPA)"],
            notes="Supervision requirements vary by service type and funding source. OMH and OASAS have specific supervision standards."
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Peer services", "H0025 - Prevention services", "PSR - Psychosocial Rehabilitation"],
            units_of_service="Varies by service type. Many services use 15-minute units.",
            documentation_basics="Documentation must meet OMH/OASAS standards. Include: date, time, service description, progress notes, treatment plan linkage, signatures.",
            reimbursement_notes="NY Medicaid rates published by DOH. Managed care rates negotiated with individual health plans."
        ),
        checklist=[
            ChecklistItem(step=1, title="Form Your Business Entity", description="Register with NY Department of State. File Corporation or LLC. Obtain EIN."),
            ChecklistItem(step=2, title="Get Your NPI Numbers", description="Apply for NPI Type 1 and Type 2 through NPPES."),
            ChecklistItem(step=3, title="Obtain Business Insurance", description="Secure general liability and professional liability insurance."),
            ChecklistItem(step=4, title="Determine OMH/OASAS Requirements", description="Contact OMH or OASAS to determine if operating certificate is required."),
            ChecklistItem(step=5, title="Enroll as NY Medicaid Provider", description="Complete eMedNY provider enrollment application."),
            ChecklistItem(step=6, title="Credential with Health Plans", description="Apply to Medicaid Managed Care plans in your service area."),
            ChecklistItem(step=7, title="Hire Certified Peer Specialists", description="Recruit staff with OMH or OASAS certification."),
            ChecklistItem(step=8, title="Establish Supervision Structure", description="Set up supervision meeting NYS regulatory requirements."),
            ChecklistItem(step=9, title="Develop Policies & Procedures", description="Create P&P manual meeting NY Medicaid and OMH/OASAS requirements."),
            ChecklistItem(step=10, title="Start Services", description="Begin accepting referrals and providing services.")
        ]
    )
}

def get_placeholder_state_data(state_code: str, state_name: str) -> StateData:
    return StateData(
        state_code=state_code,
        state_name=state_name,
        is_fully_populated=False,
        certification=CertificationRequirements(
            name=f"{state_name} Peer Support Certification",
            who_qualifies="Individuals with lived experience in recovery from mental health or substance use challenges",
            training_hours="Training requirements vary by state - contact your state authority",
            certification_authority=f"{state_name} Department of Health or equivalent",
            certification_link="Contact state health department for certification information"
        ),
        business_setup=BusinessSetup(
            entity_type="LLC or Corporation typically required",
            in_state_required=True,
            physical_office_required=False,
            notes=f"Requirements vary - contact {state_name} Secretary of State for business registration"
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name=f"{state_name} Medicaid",
            portal_link=f"Search: {state_name} Medicaid provider enrollment",
            required_documents=["NPI Type 2 (Organization)", "State Business License", "Articles of Incorporation/Organization", "W-9 Form", "Liability Insurance", "Provider Application"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name=f"{state_name} Managed Care - Contact State Medicaid", credentialing_link="Contact state Medicaid for MCO information", phone="Contact state Medicaid")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["Licensed Clinical Social Worker (LCSW)", "Licensed Professional Counselor (LPC)"],
            notes="Supervision requirements vary by state - verify with your state certification authority"
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Self-help/peer services", "H0025 - Prevention education"],
            units_of_service="Typically 15-minute increments",
            documentation_basics="Date, time, location, services provided, progress notes, signatures required",
            reimbursement_notes="Rates vary by state and MCO - contact your state Medicaid for current rates"
        ),
        checklist=[
            ChecklistItem(step=1, title="Form Your Business Entity", description="Register LLC or Corporation with Secretary of State. Obtain EIN from IRS."),
            ChecklistItem(step=2, title="Get Your NPI Numbers", description="Apply for NPI Type 1 and Type 2 through NPPES."),
            ChecklistItem(step=3, title="Obtain Business Insurance", description="Secure liability and professional insurance coverage."),
            ChecklistItem(step=4, title="Enroll as Medicaid Provider", description="Complete provider enrollment with state Medicaid."),
            ChecklistItem(step=5, title="Credential with MCOs", description="Apply for credentialing with Managed Care Organizations."),
            ChecklistItem(step=6, title="Hire Certified Peer Support Specialists", description="Recruit staff with state certification."),
            ChecklistItem(step=7, title="Establish Supervision Structure", description="Set up required supervision with licensed professional."),
            ChecklistItem(step=8, title="Develop Policies & Procedures", description="Create P&P manual meeting state requirements."),
            ChecklistItem(step=9, title="Set Up Billing Systems", description="Implement EHR and billing software."),
            ChecklistItem(step=10, title="Start Services", description="Begin accepting referrals and providing services.")
        ]
    )

# Templates Data
TEMPLATES = {
    "policies-procedures": {
        "id": "policies-procedures",
        "title": "Policies & Procedures Template",
        "description": "Comprehensive outline for your agency's policy manual",
        "category": "Operations",
        "preview_text": "This template includes sections for: Mission Statement, Service Descriptions, Staff Qualifications, Supervision Protocols, Documentation Standards, Emergency Procedures, Confidentiality Policies, and Compliance Guidelines.",
        "content": [
            {"section": "Mission Statement", "text": "Your agency's mission statement should clearly articulate your commitment to providing peer support services that empower individuals in their recovery journey."},
            {"section": "Service Descriptions", "text": "Define each peer support service you offer, including individual peer support, group facilitation, wellness coaching, and recovery planning assistance."},
            {"section": "Staff Qualifications", "text": "All Peer Support Specialists must maintain current state certification, complete required background checks, and participate in ongoing professional development."},
            {"section": "Supervision Protocols", "text": "Clinical supervision shall be provided by a licensed professional meeting state requirements. Supervision sessions occur weekly, with documentation maintained."},
            {"section": "Documentation Standards", "text": "All services must be documented within 24 hours of delivery. Documentation includes: date, time, duration, activities, progress notes, and signatures."},
            {"section": "Emergency Procedures", "text": "Staff must complete crisis intervention training. Emergency contacts and protocols for mental health crises, medical emergencies, and safety concerns are maintained."},
            {"section": "Confidentiality Policies", "text": "All client information is protected under HIPAA regulations. Information is only shared with written consent or as required by law."},
            {"section": "Compliance Guidelines", "text": "The agency maintains compliance with all federal, state, and local regulations including Medicaid requirements and MCO contracts."}
        ]
    },
    "job-posting": {
        "id": "job-posting",
        "title": "Peer Support Specialist Job Posting",
        "description": "Ready-to-use job description template",
        "category": "Hiring",
        "preview_text": "Position: Certified Peer Support Specialist. Qualifications: Current state certification, lived experience in recovery, valid driver's license...",
        "content": [
            {"section": "Position Title", "text": "Certified Peer Support Specialist"},
            {"section": "Reports To", "text": "Clinical Supervisor / Program Director"},
            {"section": "Position Summary", "text": "The Peer Support Specialist provides recovery-oriented services to individuals with mental health and/or substance use challenges, using their own lived experience to inspire hope and support recovery."},
            {"section": "Essential Duties", "text": "• Provide individual and group peer support services\n• Assist with recovery planning and goal setting\n• Connect individuals to community resources\n• Model recovery and wellness\n• Document services according to agency standards\n• Participate in team meetings and supervision"},
            {"section": "Qualifications", "text": "• Current state Peer Support Specialist certification\n• Personal lived experience in mental health and/or substance use recovery\n• Valid driver's license and reliable transportation\n• High school diploma or equivalent\n• Ability to pass background check"},
            {"section": "Preferred Qualifications", "text": "• Experience providing peer support services\n• Bilingual abilities\n• Knowledge of local community resources\n• Experience with electronic health records"},
            {"section": "Compensation", "text": "Competitive hourly rate based on experience. Benefits include health insurance, paid time off, and professional development opportunities."}
        ]
    },
    "supervisor-contract": {
        "id": "supervisor-contract",
        "title": "Clinical Supervisor Contract",
        "description": "Agreement template for supervision arrangements",
        "category": "Contracts",
        "preview_text": "This agreement establishes the terms of clinical supervision between [Supervisor Name] and [Agency Name] for the purpose of...",
        "content": [
            {"section": "Parties", "text": "This Clinical Supervision Agreement is entered into between [SUPERVISOR NAME] ('Supervisor') and [AGENCY NAME] ('Agency')."},
            {"section": "Purpose", "text": "The Supervisor agrees to provide clinical supervision services for the Agency's Peer Support Specialists in accordance with state requirements."},
            {"section": "Scope of Services", "text": "• Weekly individual or group supervision sessions\n• Review and co-sign documentation as required\n• Provide guidance on clinical matters\n• Support professional development\n• Ensure compliance with ethical standards"},
            {"section": "Supervisor Qualifications", "text": "Supervisor holds current [LICENSE TYPE] license in [STATE], license number [NUMBER], and meets all state requirements for supervising peer support services."},
            {"section": "Compensation", "text": "Agency shall compensate Supervisor at a rate of $[AMOUNT] per hour/session. Payment terms: [NET 30, etc.]"},
            {"section": "Term", "text": "This agreement begins on [DATE] and continues until terminated by either party with 30 days written notice."},
            {"section": "Confidentiality", "text": "Supervisor agrees to maintain confidentiality of all client and agency information in accordance with HIPAA and state regulations."},
            {"section": "Insurance", "text": "Supervisor maintains professional liability insurance with minimum coverage of $[AMOUNT]."}
        ]
    },
    "provider-agreement": {
        "id": "provider-agreement",
        "title": "Provider Services Agreement",
        "description": "Contract template for client services",
        "category": "Contracts",
        "preview_text": "Provider Services Agreement defining the scope of peer support services, payment terms, and mutual obligations...",
        "content": [
            {"section": "Introduction", "text": "This Provider Services Agreement outlines the terms under which [AGENCY NAME] will provide peer support services."},
            {"section": "Services Provided", "text": "• Individual peer support sessions\n• Group peer support facilitation\n• Recovery planning assistance\n• Community resource navigation\n• Wellness coaching and support"},
            {"section": "Client Rights", "text": "Clients have the right to:\n• Receive services in a respectful, dignified manner\n• Participate in treatment planning\n• Access their records\n• File grievances\n• Terminate services at any time"},
            {"section": "Agency Responsibilities", "text": "The Agency agrees to:\n• Employ qualified, certified peer support specialists\n• Maintain appropriate supervision\n• Protect client confidentiality\n• Bill services accurately\n• Respond to client concerns"},
            {"section": "Payment Terms", "text": "Services are billed to [Medicaid/MCO/Private Pay] at approved rates. Client responsibility for any copays or non-covered services will be discussed prior to service delivery."},
            {"section": "Termination", "text": "Either party may terminate this agreement with [30] days written notice. In cases of safety concerns, immediate termination may be necessary."}
        ]
    },
    "medicaid-scripts": {
        "id": "medicaid-scripts",
        "title": "Medicaid Call Scripts",
        "description": "Phone scripts for Medicaid enrollment inquiries",
        "category": "Communications",
        "preview_text": "Script for calling Medicaid Provider Enrollment: 'Hello, my name is [Name] and I'm calling to inquire about enrolling as a behavioral health provider...'",
        "content": [
            {"section": "Initial Enrollment Inquiry", "text": "Hello, my name is [YOUR NAME] from [AGENCY NAME]. I'm calling to inquire about enrolling as a behavioral health provider to deliver peer support services.\n\nI'd like to understand:\n1. What are the requirements for peer support provider enrollment?\n2. What application forms are needed?\n3. What is the typical timeline for approval?\n4. Is there an online portal for application submission?"},
            {"section": "Application Status Follow-up", "text": "Hello, my name is [YOUR NAME] from [AGENCY NAME]. I'm calling to check on the status of our provider enrollment application.\n\nOur application reference number is [NUMBER].\nWe submitted on [DATE].\n\nCould you tell me:\n1. What is the current status?\n2. Are any additional documents needed?\n3. What is the expected completion date?"},
            {"section": "MCO Credentialing Inquiry", "text": "Hello, my name is [YOUR NAME] from [AGENCY NAME]. I'm calling about credentialing as a peer support provider with your health plan.\n\nWe are currently enrolled with [STATE] Medicaid and would like to become a participating provider.\n\n1. What is your credentialing process?\n2. What documents do you require?\n3. How long does credentialing typically take?\n4. Who should I contact for application materials?"},
            {"section": "Billing Question Script", "text": "Hello, my name is [YOUR NAME] from [AGENCY NAME], Provider NPI [NUMBER]. I'm calling with a billing question.\n\n[Describe specific billing issue]\n\nI've reviewed the fee schedule and documentation requirements. Could you help me understand [specific question]?"}
        ]
    },
    "startup-budget": {
        "id": "startup-budget",
        "title": "Startup Budget Checklist",
        "description": "Financial planning template for new agencies",
        "category": "Finance",
        "preview_text": "Startup Costs: Business Registration ($___), Insurance ($___), Office Setup ($___), Software/EHR ($___), Marketing ($___), Working Capital ($___)...",
        "content": [
            {"section": "One-Time Startup Costs", "text": "• Business Registration/LLC Filing: $100-500\n• NPI Application: Free\n• Initial Insurance Premium: $2,000-5,000\n• Office Equipment (computer, phone, printer): $1,500-3,000\n• EHR/Practice Management Software Setup: $500-2,000\n• Website Development: $500-3,000\n• Initial Marketing Materials: $500-1,500\n• Legal/Consulting Fees: $1,000-5,000"},
            {"section": "Monthly Operating Costs", "text": "• Office Rent (if applicable): $500-2,000\n• Insurance (monthly): $200-500\n• EHR/Software Subscriptions: $100-400\n• Phone/Internet: $100-200\n• Supervision Fees: $200-600\n• Marketing/Advertising: $100-500\n• Professional Development: $50-200\n• Supplies: $50-150"},
            {"section": "Staffing Costs", "text": "• Peer Support Specialist Wages: $15-25/hour\n• Clinical Supervisor: $75-150/hour\n• Administrative Support: $15-20/hour\n• Payroll Taxes/Benefits: Add 20-30% to wages"},
            {"section": "Revenue Projections", "text": "• Average Peer Support Rate: $4-15 per 15-minute unit\n• Billable Hours per FTE: 20-25 per week\n• Monthly Revenue per FTE: $2,000-6,000\n• Break-even typically: 6-12 months"},
            {"section": "Working Capital Recommendations", "text": "• Minimum 3 months operating expenses in reserve\n• Consider 60-90 day delay in initial Medicaid payments\n• Plan for credentialing period before billing begins\n• Recommended starting capital: $25,000-50,000"}
        ]
    }
}

# National Overview Content
NATIONAL_OVERVIEW_DATA = NationalOverview(
    what_is_peer_support="""Peer Support is a recovery-oriented service provided by individuals with lived experience of mental health challenges, substance use disorders, or co-occurring conditions. Peer Support Specialists use their personal recovery journey to inspire hope, model recovery, and provide guidance to others currently facing similar challenges.

Peer Support is recognized as an evidence-based practice that complements traditional clinical services. It emphasizes empowerment, self-determination, and community connection rather than a medical model approach.""",
    
    what_is_medicaid_billable="""Medicaid-billable peer support services are those that meet state and federal requirements for reimbursement through the Medicaid program. This means your agency can receive payment for providing peer support services to Medicaid-enrolled individuals.

To bill Medicaid, your agency must:
• Be enrolled as an approved Medicaid provider
• Employ certified Peer Support Specialists
• Meet all state documentation and supervision requirements
• Provide services under an approved treatment plan
• Submit claims through proper billing channels""",
    
    universal_requirements=[
        "National Provider Identifier (NPI) - Both Type 1 (individual) and Type 2 (organization)",
        "State business registration (LLC, Corporation, or approved entity type)",
        "Employer Identification Number (EIN) from the IRS",
        "General liability and professional liability insurance",
        "State-certified Peer Support Specialists on staff",
        "Qualified supervision by licensed mental health professional",
        "Written policies and procedures meeting state standards",
        "Compliant electronic health records and billing systems",
        "Criminal background checks for all staff",
        "HIPAA compliance program"
    ],
    
    best_practices=[
        "Start with one state and master the requirements before expanding",
        "Build relationships with local MCOs before seeking credentialing",
        "Invest in quality training beyond minimum certification requirements",
        "Develop robust documentation systems from day one",
        "Create a strong referral network with clinical providers",
        "Focus on quality over quantity in your initial service delivery",
        "Stay current with regulatory changes and policy updates",
        "Join state and national peer support professional associations",
        "Consider starting with a smaller service area to build expertise",
        "Maintain detailed records for audits and quality reviews"
    ],
    
    multi_state_strategy="""Expanding your peer support agency to multiple states requires careful planning and compliance with each state's unique requirements.

**Foreign Qualification Model:**
When you operate in a state other than where you incorporated, you typically need to 'foreign qualify' your business. This involves:

1. **Register as a Foreign Entity** - File with the new state's Secretary of State
2. **Obtain a Registered Agent** - Required in states where you don't have a physical presence
3. **Meet State-Specific Licensing** - Each state has different provider licensing requirements
4. **Credential with Local MCOs** - Build relationships with managed care organizations in each new state
5. **Hire Local Staff** - Peer Support Specialists must typically be certified in the state where they provide services
6. **Understand Rate Differences** - Reimbursement rates vary significantly between states

**Key Considerations:**
• Some states have reciprocity agreements for peer support certification
• Virtual services may have different requirements than in-person
• Multi-state operations require robust compliance tracking systems
• Consider starting with neighboring states that have similar regulatory frameworks"""
)

# PDF Generation Function
def generate_template_pdf(template_id: str) -> BytesIO:
    template = TEMPLATES.get(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=NAVY,
        spaceAfter=20,
        alignment=TA_CENTER
    )
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=GOLD,
        spaceBefore=20,
        spaceAfter=10
    )
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.black,
        spaceAfter=12,
        leading=16
    )
    
    story = []
    
    # Header
    story.append(Paragraph(f"<b>{template['title']}</b>", title_style))
    story.append(Paragraph(f"<i>{template['description']}</i>", body_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Divider line
    divider_data = [['']]
    divider_table = Table(divider_data, colWidths=[6*inch])
    divider_table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 2, GOLD),
    ]))
    story.append(divider_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Content sections
    for item in template.get("content", []):
        story.append(Paragraph(item["section"], section_style))
        text = item["text"].replace('\n', '<br/>')
        story.append(Paragraph(text, body_style))
    
    # Footer
    story.append(Spacer(1, 0.5*inch))
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, textColor=colors.gray, alignment=TA_CENTER)
    story.append(Paragraph("Launch Your Peer Support Agency™ | www.peersupportlaunch.com", footer_style))
    story.append(Paragraph("This template is for educational purposes only. Consult legal and professional advisors before use.", footer_style))
    
    doc.build(story)
    buffer.seek(0)
    return buffer

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Peer Support Agency Launch API", "version": "2.0"}

@api_router.get("/states")
async def get_all_states():
    states_with_status = []
    for state in ALL_STATES:
        states_with_status.append({
            "code": state["code"],
            "name": state["name"],
            "is_fully_populated": state["code"] in FULLY_POPULATED_STATES
        })
    return {"states": states_with_status}

@api_router.get("/states/{state_code}")
async def get_state_data(state_code: str):
    state_code = state_code.upper()
    state_info = next((s for s in ALL_STATES if s["code"] == state_code), None)
    
    if not state_info:
        raise HTTPException(status_code=404, detail="State not found")
    
    if state_code in STATE_DATA:
        return STATE_DATA[state_code].model_dump()
    else:
        return get_placeholder_state_data(state_code, state_info["name"]).model_dump()

@api_router.get("/templates")
async def get_templates():
    template_list = []
    for tid, t in TEMPLATES.items():
        template_list.append({
            "id": t["id"],
            "title": t["title"],
            "description": t["description"],
            "category": t["category"],
            "preview_text": t["preview_text"],
            "download_url": f"/api/templates/download/{t['id']}"
        })
    return {"templates": template_list}

@api_router.get("/templates/{template_id}")
async def get_template(template_id: str):
    template = TEMPLATES.get(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return {
        "id": template["id"],
        "title": template["title"],
        "description": template["description"],
        "category": template["category"],
        "preview_text": template["preview_text"],
        "download_url": f"/api/templates/download/{template['id']}"
    }

@api_router.get("/templates/download/{template_id}")
async def download_template(template_id: str):
    """Download template as PDF"""
    template = TEMPLATES.get(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    pdf_buffer = generate_template_pdf(template_id)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={template_id}.pdf"
        }
    )

@api_router.post("/email-capture")
async def capture_email(data: EmailCapture):
    """Capture email for lead generation"""
    doc = {
        "id": str(uuid.uuid4()),
        "email": data.email,
        "name": data.name,
        "source": data.source,
        "template_id": data.template_id,
        "state": data.state,
        "message": data.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.email_captures.insert_one(doc)
    return {"success": True, "message": "Thank you! We'll be in touch soon."}

@api_router.post("/consultation-request")
async def submit_consultation(data: ConsultationRequest):
    """Submit consultation request"""
    doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "email": data.email,
        "state": data.state,
        "phone": data.phone,
        "message": data.message,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.consultation_requests.insert_one(doc)
    return {"success": True, "message": "Your consultation request has been submitted. We'll contact you within 24-48 hours."}

@api_router.get("/national-overview")
async def get_national_overview():
    return NATIONAL_OVERVIEW_DATA.model_dump()

@api_router.get("/products")
async def get_products():
    """Get available products for purchase"""
    return {"products": PRODUCTS}

@api_router.post("/checkout/create-session")
async def create_checkout_session(request: CheckoutRequest, http_request: Request):
    """Create Stripe checkout session"""
    if request.product_id not in PRODUCTS:
        raise HTTPException(status_code=400, detail="Invalid product")
    
    product = PRODUCTS[request.product_id]
    api_key = os.environ.get('STRIPE_API_KEY')
    
    host_url = request.origin_url.rstrip('/')
    webhook_url = f"{str(http_request.base_url).rstrip('/')}/api/webhook/stripe"
    
    success_url = f"{host_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/payment-cancel"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=product["price"],
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "product_id": request.product_id,
            "product_name": product["name"]
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "product_id": request.product_id,
        "product_name": product["name"],
        "amount": product["price"],
        "currency": "usd",
        "status": "pending",
        "payment_status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, http_request: Request):
    """Get checkout session status"""
    api_key = os.environ.get('STRIPE_API_KEY')
    webhook_url = f"{str(http_request.base_url).rstrip('/')}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction in database
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "status": status.status,
            "payment_status": status.payment_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
        "metadata": status.metadata
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    api_key = os.environ.get('STRIPE_API_KEY')
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.session_id:
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "status": webhook_response.event_type,
                    "payment_status": webhook_response.payment_status,
                    "webhook_event_id": webhook_response.event_id,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
