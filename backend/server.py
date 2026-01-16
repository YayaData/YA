from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, Header
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
import hashlib
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
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
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

# Admin credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD_HASH = hashlib.sha256("Chris229@@@".encode()).hexdigest()

# Brand colors for PDF
NAVY = colors.HexColor('#0F172A')
GOLD = colors.HexColor('#B45309')

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

class EmailCapture(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    source: str
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

class AdminLogin(BaseModel):
    password: str

# Product Packages
PRODUCTS = {
    "pdf-guide": {"name": "Complete PDF Guide", "price": 47.00, "description": "Full 50-state guide in downloadable PDF"},
    "templates-bundle": {"name": "Editable Templates Bundle", "price": 97.00, "description": "All templates in Word/Excel format"},
    "state-bundle": {"name": "5-State Bundle", "price": 147.00, "description": "Complete guides for any 5 states of your choice"},
    "consultation": {"name": "Strategy Consultation", "price": 197.00, "description": "1-hour strategy call with expert"},
    "full-course": {"name": "Full Launch Course", "price": 297.00, "description": "Video course + templates + support"}
}

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

FULLY_POPULATED_STATES = ["NC", "TX", "CA", "FL", "NY", "OH", "PA", "IL", "GA", "NJ", "VA", "WA", "AZ"]

# Standard checklist for all states
def get_standard_checklist():
    return [
        ChecklistItem(step=1, title="Form Your Business Entity", description="Register LLC or Corporation with Secretary of State. Obtain EIN from IRS."),
        ChecklistItem(step=2, title="Get Your NPI Numbers", description="Apply for NPI Type 1 (individual) and Type 2 (organization) through NPPES."),
        ChecklistItem(step=3, title="Obtain Business Insurance", description="Secure general liability and professional liability insurance coverage."),
        ChecklistItem(step=4, title="Enroll as Medicaid Provider", description="Complete provider enrollment application through state Medicaid portal."),
        ChecklistItem(step=5, title="Credential with MCOs", description="Apply for credentialing with each Managed Care Organization in your service area."),
        ChecklistItem(step=6, title="Hire Certified Peer Support Specialists", description="Recruit and hire staff with current state peer certification."),
        ChecklistItem(step=7, title="Establish Supervision Structure", description="Contract with or hire a licensed professional to provide required supervision."),
        ChecklistItem(step=8, title="Develop Policies & Procedures", description="Create comprehensive P&P manual meeting state Medicaid and MCO requirements."),
        ChecklistItem(step=9, title="Set Up Billing Systems", description="Implement electronic health records and billing software."),
        ChecklistItem(step=10, title="Start Accepting Referrals", description="Network with referral sources and begin providing billable services.")
    ]

# All State Data
STATE_DATA = {
    "NC": StateData(
        state_code="NC", state_name="North Carolina", is_fully_populated=True,
        certification=CertificationRequirements(
            name="Certified Peer Support Specialist (CPSS)",
            who_qualifies="Individuals with lived experience of mental health challenges, substance use disorders, or both who are in recovery",
            training_hours="40 hours of initial training + 20 hours of continuing education annually",
            certification_authority="NC Division of Mental Health, Developmental Disabilities and Substance Abuse Services (DMH/DD/SAS)",
            certification_link="https://www.ncdhhs.gov/divisions/mental-health-developmental-disabilities-and-substance-abuse/peer-support"
        ),
        business_setup=BusinessSetup(
            entity_type="LLC or Corporation required. Non-profit or for-profit allowed.",
            in_state_required=True, physical_office_required=False,
            notes="Virtual operations permitted but must have NC registered agent and business address."
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name="NC Medicaid (NC DHHS)", portal_link="https://medicaid.ncdhhs.gov/providers/provider-enrollment",
            required_documents=["NPI Type 2", "NC Business License", "Articles of Incorporation", "W-9", "Liability Insurance", "Ownership Disclosure Form"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name="Alliance Health", credentialing_link="https://www.alliancehealthplan.org/providers/", phone="1-800-510-9132"),
            ManagedCareOrg(name="Eastpointe", credentialing_link="https://www.eastpointe.net/providers/", phone="1-800-913-6109"),
            ManagedCareOrg(name="Partners Health Management", credentialing_link="https://www.partnersbhm.org/providers/", phone="1-888-235-4673"),
            ManagedCareOrg(name="Trillium Health Resources", credentialing_link="https://www.trilliumhealthresources.org/providers/", phone="1-877-685-2415"),
            ManagedCareOrg(name="Vaya Health", credentialing_link="https://www.vayahealth.com/providers/", phone="1-800-962-9003")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["LCSW", "LPC", "LCMHC", "Qualified Professional (QP)"],
            notes="Peer Support Specialists must work under supervision of a Qualified Professional."
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Self-help/peer services, per 15 minutes", "H0025 - Behavioral health prevention education"],
            units_of_service="15-minute increments",
            documentation_basics="Date, start/end time, location, activities, progress notes, signatures required.",
            reimbursement_notes="Rates vary by LME/MCO. Typically $4-8 per 15-minute unit."
        ),
        checklist=get_standard_checklist()
    ),
    "TX": StateData(
        state_code="TX", state_name="Texas", is_fully_populated=True,
        certification=CertificationRequirements(
            name="Mental Health Peer Specialist (MHPS) / Peer Recovery Support Specialist (PRSS)",
            who_qualifies="Individuals with personal lived experience of recovery from mental illness and/or substance use disorder",
            training_hours="MHPS: 40 hours training. PRSS: 46 hours training + supervision hours",
            certification_authority="Texas Health and Human Services Commission (HHSC) via Via Hope",
            certification_link="https://viahope.org/programs/peer-specialist-training/"
        ),
        business_setup=BusinessSetup(
            entity_type="LLC, Corporation, or Professional Association allowed.",
            in_state_required=True, physical_office_required=False,
            notes="Texas allows virtual operations. Must register with Texas Secretary of State."
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name="Texas Medicaid & Healthcare Partnership (TMHP)", portal_link="https://www.tmhp.com/programs/medicaid",
            required_documents=["NPI Type 2", "Texas Sales Tax Permit", "W-9", "Liability Insurance", "HHSC Provider Application"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name="Superior HealthPlan", credentialing_link="https://www.superiorhealthplan.com/providers/", phone="1-877-391-5921"),
            ManagedCareOrg(name="Molina Healthcare of Texas", credentialing_link="https://www.molinahealthcare.com/providers/tx/", phone="1-888-562-5442"),
            ManagedCareOrg(name="UnitedHealthcare Community Plan", credentialing_link="https://www.uhccommunityplan.com/tx/", phone="1-888-887-9003"),
            ManagedCareOrg(name="Amerigroup Texas", credentialing_link="https://providers.amerigroup.com/texas", phone="1-800-454-3730")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["LPC", "LCSW", "LMFT", "Licensed Psychologist", "QMHP"],
            notes="MHPS requires supervision by QMHP or licensed professional."
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Peer support services", "H2014 - Skills training", "H0025 - Prevention"],
            units_of_service="15-minute increments",
            documentation_basics="Service notes: date, time, duration, location, activities, progress, signatures.",
            reimbursement_notes="Texas Medicaid rates via TMHP fee schedules. MCO rates negotiated."
        ),
        checklist=get_standard_checklist()
    ),
    "CA": StateData(
        state_code="CA", state_name="California", is_fully_populated=True,
        certification=CertificationRequirements(
            name="Medi-Cal Peer Support Specialist Certification",
            who_qualifies="Individuals with lived experience of mental health condition, substance use disorder, or both",
            training_hours="75 hours of training + supervision hours. CalMHSA oversees certification.",
            certification_authority="California Department of Health Care Services (DHCS) through CalMHSA",
            certification_link="https://www.calmhsa.org/peer-certification/"
        ),
        business_setup=BusinessSetup(
            entity_type="LLC, Corporation, or Non-profit.",
            in_state_required=True, physical_office_required=False,
            notes="California has county-based Medi-Cal systems. Register in counties where you'll operate."
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name="California DHCS", portal_link="https://www.dhcs.ca.gov/provgovpart/Pages/default.aspx",
            required_documents=["NPI Type 2", "CA Business License", "Articles of Organization", "W-9", "Liability Insurance", "DHCS Provider Application"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name="LA Care Health Plan", credentialing_link="https://www.lacare.org/providers/", phone="1-866-522-2736"),
            ManagedCareOrg(name="Health Net", credentialing_link="https://www.healthnet.com/content/healthnet/en_us/providers.html", phone="1-800-641-7761"),
            ManagedCareOrg(name="Kaiser Permanente", credentialing_link="https://providers.kaiserpermanente.org/", phone="1-800-464-4000"),
            ManagedCareOrg(name="Molina Healthcare of CA", credentialing_link="https://www.molinahealthcare.com/providers/ca/", phone="1-888-665-4621")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["LCSW", "LMFT", "LPCC", "Licensed Psychologist", "RN with psychiatric experience"],
            notes="Supervision requirements determined by county Mental Health Plan."
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Peer support", "H0025 - Prevention", "H2014 - Skills training"],
            units_of_service="15-minute increments. Some counties vary.",
            documentation_basics="Documentation must meet county MHP standards.",
            reimbursement_notes="Rates vary significantly by county. Contact local county MHP."
        ),
        checklist=get_standard_checklist()
    ),
    "FL": StateData(
        state_code="FL", state_name="Florida", is_fully_populated=True,
        certification=CertificationRequirements(
            name="Certified Recovery Peer Specialist (CRPS)",
            who_qualifies="Individuals in recovery from mental health and/or substance use with at least 2 years of recovery",
            training_hours="75 hours of training + examination. Florida Certification Board administers.",
            certification_authority="Florida Certification Board (FCB)",
            certification_link="https://flcertificationboard.org/certifications/crps/"
        ),
        business_setup=BusinessSetup(
            entity_type="LLC, Corporation, or Non-profit required.",
            in_state_required=True, physical_office_required=False,
            notes="Florida allows virtual operations. Register with Florida Division of Corporations."
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name="Florida Agency for Health Care Administration (AHCA)", portal_link="https://ahca.myflorida.com/medicaid/",
            required_documents=["NPI Type 2", "FL Business Registration", "Articles of Incorporation", "W-9", "Liability Insurance", "AHCA Provider Application"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name="Sunshine Health", credentialing_link="https://www.sunshinehealth.com/providers/", phone="1-866-796-0530"),
            ManagedCareOrg(name="Humana Healthy Horizons", credentialing_link="https://www.humana.com/provider/", phone="1-800-477-6931"),
            ManagedCareOrg(name="Simply Healthcare", credentialing_link="https://www.simplyhealthcareplans.com/florida-medicaid/providers/", phone="1-877-440-7963"),
            ManagedCareOrg(name="Molina Healthcare of FL", credentialing_link="https://www.molinahealthcare.com/providers/fl/", phone="1-866-472-4585")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["LCSW", "LMHC", "LMFT", "Licensed Psychologist", "Qualified Professional"],
            notes="CRPS must work under supervision of licensed behavioral health professional."
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Peer support", "H0025 - Prevention", "H2014 - Skills training"],
            units_of_service="15-minute increments",
            documentation_basics="Service date/time, location, interventions, progress, signatures.",
            reimbursement_notes="Florida Medicaid fee schedules via AHCA. MCO rates per contract."
        ),
        checklist=get_standard_checklist()
    ),
    "NY": StateData(
        state_code="NY", state_name="New York", is_fully_populated=True,
        certification=CertificationRequirements(
            name="Certified Peer Specialist / Certified Recovery Peer Advocate",
            who_qualifies="Individuals with lived experience of mental health recovery or substance use recovery",
            training_hours="Peer Specialist: OMH-approved training. CRPA: 46-hour training + 500 hours experience + exam.",
            certification_authority="NYS Office of Mental Health (OMH) / OASAS",
            certification_link="https://omh.ny.gov/omhweb/peer_specialist/"
        ),
        business_setup=BusinessSetup(
            entity_type="Corporation or LLC. Non-profit recommended for OMH-funded programs.",
            in_state_required=True, physical_office_required=False,
            notes="New York has complex regulatory requirements. Consider OMH/OASAS operating certificate."
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name="NYS Department of Health / eMedNY", portal_link="https://www.emedny.org/",
            required_documents=["NPI Type 2", "NY Business Certificate", "Articles of Incorporation", "W-9", "Liability Insurance", "OMH/OASAS Operating Certificate (if required)"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name="Healthfirst", credentialing_link="https://healthfirst.org/providers/", phone="1-888-250-2220"),
            ManagedCareOrg(name="Fidelis Care", credentialing_link="https://www.fideliscare.org/Providers", phone="1-888-343-3547"),
            ManagedCareOrg(name="MetroPlus Health Plan", credentialing_link="https://www.metroplus.org/providers/", phone="1-800-303-9626"),
            ManagedCareOrg(name="Emblem Health", credentialing_link="https://www.emblemhealth.com/providers/", phone="1-877-842-3633")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["LCSW", "LMHC", "Licensed Psychologist", "CASAC (for CRPA)", "Psychiatrist"],
            notes="Supervision requirements vary by service type and funding source."
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Peer services", "H0025 - Prevention", "PSR - Psychosocial Rehabilitation"],
            units_of_service="Varies by service type. Many use 15-minute units.",
            documentation_basics="Date, time, service description, progress notes, treatment plan linkage, signatures.",
            reimbursement_notes="NY Medicaid rates published by DOH. MCO rates negotiated."
        ),
        checklist=get_standard_checklist()
    ),
    "OH": StateData(
        state_code="OH", state_name="Ohio", is_fully_populated=True,
        certification=CertificationRequirements(
            name="Certified Peer Recovery Supporter (CPRS) / Certified Peer Supporter (CPS)",
            who_qualifies="Individuals with lived experience in mental health recovery and/or substance use recovery",
            training_hours="CPRS: 40 hours + exam. CPS: 75 hours + exam via Ohio MHA",
            certification_authority="Ohio Chemical Dependency Professionals Board / Ohio Mental Health & Addiction Services",
            certification_link="https://mha.ohio.gov/community-partners/peer-support"
        ),
        business_setup=BusinessSetup(
            entity_type="LLC, Corporation, or Non-profit. Ohio requires specific provider types.",
            in_state_required=True, physical_office_required=False,
            notes="Ohio allows telehealth peer services. Register with Ohio Secretary of State."
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name="Ohio Department of Medicaid", portal_link="https://medicaid.ohio.gov/providers",
            required_documents=["NPI Type 2", "OH Business Registration", "Articles of Incorporation", "W-9", "Liability Insurance", "ODM Provider Application"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name="CareSource", credentialing_link="https://www.caresource.com/providers/", phone="1-800-488-0134"),
            ManagedCareOrg(name="Molina Healthcare of Ohio", credentialing_link="https://www.molinahealthcare.com/providers/oh/", phone="1-855-322-4079"),
            ManagedCareOrg(name="Buckeye Health Plan", credentialing_link="https://www.buckeyehealthplan.com/providers/", phone="1-866-246-4358"),
            ManagedCareOrg(name="UnitedHealthcare Community Plan", credentialing_link="https://www.uhccommunityplan.com/oh/", phone="1-800-895-2017")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["LISW", "LPCC", "Licensed Psychologist", "LICDC", "Qualified Behavioral Health Professional"],
            notes="Supervision requirements per Ohio Administrative Code. Ratio varies by service."
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Peer recovery support", "H0025 - Prevention", "H2014 - Skills training"],
            units_of_service="15-minute increments for most peer services.",
            documentation_basics="Service date, time, location, activities, progress toward goals, signatures.",
            reimbursement_notes="Ohio Medicaid fee schedules available via ODM. MCO rates vary."
        ),
        checklist=get_standard_checklist()
    ),
    "PA": StateData(
        state_code="PA", state_name="Pennsylvania", is_fully_populated=True,
        certification=CertificationRequirements(
            name="Certified Peer Specialist (CPS) / Certified Recovery Specialist (CRS)",
            who_qualifies="Individuals with lived experience of mental health recovery or substance use recovery",
            training_hours="CPS: 75 hours training via PA Certification Board. CRS: 54 hours + exam.",
            certification_authority="PA Certification Board (PCB)",
            certification_link="https://www.pacertboard.org/"
        ),
        business_setup=BusinessSetup(
            entity_type="LLC, Corporation, or Non-profit allowed.",
            in_state_required=True, physical_office_required=False,
            notes="Pennsylvania allows virtual operations. Register with PA Department of State."
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name="PA Department of Human Services", portal_link="https://www.dhs.pa.gov/providers/Providers/Pages/default.aspx",
            required_documents=["NPI Type 2", "PA Business Registration", "Articles of Incorporation", "W-9", "Liability Insurance", "PROMISe Provider Enrollment"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name="AmeriHealth Caritas PA", credentialing_link="https://www.amerihealthcaritaspa.com/provider/", phone="1-800-521-6860"),
            ManagedCareOrg(name="Highmark Wholecare", credentialing_link="https://www.highmarkwholecare.com/providers/", phone="1-800-392-1147"),
            ManagedCareOrg(name="UPMC for You", credentialing_link="https://www.upmchealthplan.com/providers/", phone="1-800-286-4242"),
            ManagedCareOrg(name="PA Health & Wellness", credentialing_link="https://www.pahealthwellness.com/providers/", phone="1-844-626-6813")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["LSW", "LPC", "Licensed Psychologist", "CAADC", "Qualified Mental Health Professional"],
            notes="CPS supervision by licensed clinician or CPS Supervisor. CRS by CAADC or licensed professional."
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Peer support", "H0025 - Prevention", "H2014 - Skills training"],
            units_of_service="15-minute increments typical.",
            documentation_basics="Date, time, service location, activities, progress notes, signatures.",
            reimbursement_notes="PA Medicaid rates via DHS fee schedules. MCO rates negotiated."
        ),
        checklist=get_standard_checklist()
    ),
    "IL": StateData(
        state_code="IL", state_name="Illinois", is_fully_populated=True,
        certification=CertificationRequirements(
            name="Certified Recovery Support Specialist (CRSS) / Certified Peer Recovery Specialist (CPRS)",
            who_qualifies="Individuals with lived experience in mental health and/or substance use recovery",
            training_hours="CRSS: 100 hours training + 500 supervised hours. Via Illinois Certification Board.",
            certification_authority="Illinois Certification Board (ICB)",
            certification_link="https://www.iaodapca.org/"
        ),
        business_setup=BusinessSetup(
            entity_type="LLC, Corporation, or Non-profit.",
            in_state_required=True, physical_office_required=False,
            notes="Illinois allows telehealth. Register with Illinois Secretary of State."
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name="Illinois Department of Healthcare and Family Services (HFS)", portal_link="https://www.illinois.gov/hfs/MedicalProviders/",
            required_documents=["NPI Type 2", "IL Business Registration", "Articles of Incorporation", "W-9", "Liability Insurance", "HFS Provider Enrollment"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name="Molina Healthcare of Illinois", credentialing_link="https://www.molinahealthcare.com/providers/il/", phone="1-855-866-5462"),
            ManagedCareOrg(name="Meridian Health Plan", credentialing_link="https://corp.mfrm.com/illinois/providers/", phone="1-866-606-3700"),
            ManagedCareOrg(name="CountyCare Health Plan", credentialing_link="https://countycare.com/providers/", phone="1-312-864-8200"),
            ManagedCareOrg(name="Blue Cross Blue Shield of Illinois", credentialing_link="https://www.bcbsil.com/provider/", phone="1-800-972-2227")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["LCSW", "LCPC", "Licensed Psychologist", "CADC", "Qualified Mental Health Professional"],
            notes="Supervision per Illinois DHS requirements. CRSS requires ongoing clinical supervision."
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Peer support", "H0025 - Prevention", "H2014 - Skills training"],
            units_of_service="15-minute increments.",
            documentation_basics="Service date/time, location, activities, consumer progress, signatures.",
            reimbursement_notes="Illinois Medicaid rates via HFS. MCO rates per contract."
        ),
        checklist=get_standard_checklist()
    ),
    "GA": StateData(
        state_code="GA", state_name="Georgia", is_fully_populated=True,
        certification=CertificationRequirements(
            name="Certified Peer Specialist (CPS) / Certified Addiction Recovery Empowerment Specialist (CARES)",
            who_qualifies="Individuals with lived experience in mental health and/or addiction recovery",
            training_hours="CPS: 40 hours training via Georgia Mental Health Consumer Network. CARES: 46 hours.",
            certification_authority="Georgia Department of Behavioral Health and Developmental Disabilities (DBHDD)",
            certification_link="https://dbhdd.georgia.gov/peer-support-services"
        ),
        business_setup=BusinessSetup(
            entity_type="LLC, Corporation, or Non-profit allowed.",
            in_state_required=True, physical_office_required=False,
            notes="Georgia allows virtual peer services. Register with Georgia Secretary of State."
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name="Georgia Department of Community Health (DCH)", portal_link="https://dch.georgia.gov/providers",
            required_documents=["NPI Type 2", "GA Business Registration", "Articles of Incorporation", "W-9", "Liability Insurance", "GAMMIS Provider Enrollment"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name="Amerigroup Georgia", credentialing_link="https://providers.amerigroup.com/georgia", phone="1-800-454-3730"),
            ManagedCareOrg(name="CareSource Georgia", credentialing_link="https://www.caresource.com/providers/", phone="1-855-202-1058"),
            ManagedCareOrg(name="Peach State Health Plan", credentialing_link="https://www.pshp.com/providers/", phone="1-866-874-0633")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["LCSW", "LPC", "Licensed Psychologist", "CADC II", "Qualified Behavioral Health Professional"],
            notes="Peer support requires supervision by DBHDD-approved supervisor."
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Peer support", "H0025 - Prevention", "H2014 - Skills training"],
            units_of_service="15-minute increments.",
            documentation_basics="Service date, time, activities, progress notes, signatures.",
            reimbursement_notes="Georgia Medicaid rates via DCH. MCO rates negotiated."
        ),
        checklist=get_standard_checklist()
    ),
    "NJ": StateData(
        state_code="NJ", state_name="New Jersey", is_fully_populated=True,
        certification=CertificationRequirements(
            name="Certified Peer Recovery Specialist (CPRS)",
            who_qualifies="Individuals with personal lived experience in mental health and/or substance use recovery",
            training_hours="72 hours training + 500 hours supervised experience + exam via NJ Certification Board",
            certification_authority="NJ Certification Board / Division of Mental Health and Addiction Services (DMHAS)",
            certification_link="https://www.njcb.org/"
        ),
        business_setup=BusinessSetup(
            entity_type="LLC, Corporation, or Non-profit.",
            in_state_required=True, physical_office_required=False,
            notes="New Jersey allows telehealth peer services. Register with NJ Division of Revenue."
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name="NJ Division of Medical Assistance and Health Services", portal_link="https://www.state.nj.us/humanservices/dmahs/providers/",
            required_documents=["NPI Type 2", "NJ Business Registration", "Articles of Incorporation", "W-9", "Liability Insurance", "NJ Medicaid Provider Enrollment"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name="Horizon NJ Health", credentialing_link="https://www.horizonnjhealth.com/providers/", phone="1-800-682-9091"),
            ManagedCareOrg(name="Amerigroup New Jersey", credentialing_link="https://providers.amerigroup.com/new-jersey", phone="1-800-454-3730"),
            ManagedCareOrg(name="UnitedHealthcare Community Plan NJ", credentialing_link="https://www.uhccommunityplan.com/nj/", phone="1-800-941-4647"),
            ManagedCareOrg(name="WellCare of New Jersey", credentialing_link="https://www.wellcare.com/New-Jersey/Providers/", phone="1-888-453-2534")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["LCSW", "LPC", "Licensed Psychologist", "LCADC", "Qualified Mental Health Professional"],
            notes="CPRS supervision per DMHAS standards. Clinical supervision required."
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Peer support", "H0025 - Prevention", "H2014 - Skills training"],
            units_of_service="15-minute increments.",
            documentation_basics="Date, time, location, service activities, progress, signatures.",
            reimbursement_notes="NJ Medicaid fee schedules via DMAHS. MCO rates per contract."
        ),
        checklist=get_standard_checklist()
    ),
    "VA": StateData(
        state_code="VA", state_name="Virginia", is_fully_populated=True,
        certification=CertificationRequirements(
            name="Certified Peer Recovery Specialist (CPRS)",
            who_qualifies="Individuals with lived experience in mental health and/or substance use recovery",
            training_hours="72 hours training + 500 hours supervised work + certification exam via Virginia Board of Counseling",
            certification_authority="Virginia Board of Counseling / DBHDS",
            certification_link="https://dbhds.virginia.gov/recovery-services/"
        ),
        business_setup=BusinessSetup(
            entity_type="LLC, Corporation, or Non-profit.",
            in_state_required=True, physical_office_required=False,
            notes="Virginia allows virtual peer support. Register with Virginia State Corporation Commission."
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name="Department of Medical Assistance Services (DMAS)", portal_link="https://www.dmas.virginia.gov/for-providers/",
            required_documents=["NPI Type 2", "VA Business Registration", "Articles of Incorporation", "W-9", "Liability Insurance", "DMAS Provider Enrollment"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name="Virginia Premier", credentialing_link="https://www.virginiapremier.com/providers/", phone="1-800-727-7536"),
            ManagedCareOrg(name="Anthem HealthKeepers Plus", credentialing_link="https://www.anthem.com/provider/va/", phone="1-800-901-0020"),
            ManagedCareOrg(name="Molina Healthcare of Virginia", credentialing_link="https://www.molinahealthcare.com/providers/va/", phone="1-800-424-4524"),
            ManagedCareOrg(name="Optima Health", credentialing_link="https://www.optimahealth.com/providers/", phone="1-800-206-1060")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["LPC", "LCSW", "Licensed Psychologist", "CSAC", "Qualified Mental Health Professional"],
            notes="CPRS requires supervision by licensed mental health professional or CPRS Supervisor."
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Peer recovery support", "H0025 - Prevention", "H2014 - Skills training"],
            units_of_service="15-minute increments.",
            documentation_basics="Service date/time, activities, progress toward recovery goals, signatures.",
            reimbursement_notes="Virginia Medicaid rates via DMAS. MCO rates per negotiated contract."
        ),
        checklist=get_standard_checklist()
    ),
    "WA": StateData(
        state_code="WA", state_name="Washington", is_fully_populated=True,
        certification=CertificationRequirements(
            name="Certified Peer Counselor (CPC)",
            who_qualifies="Individuals with lived experience in mental health and/or substance use recovery",
            training_hours="75 hours training via Washington Health Care Authority approved trainers + certification",
            certification_authority="Washington Health Care Authority (HCA)",
            certification_link="https://www.hca.wa.gov/billers-providers-partners/program-information-providers/peer-counseling"
        ),
        business_setup=BusinessSetup(
            entity_type="LLC, Corporation, or Non-profit.",
            in_state_required=True, physical_office_required=False,
            notes="Washington allows telehealth peer services. Register with WA Secretary of State."
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name="Washington Health Care Authority (HCA)", portal_link="https://www.hca.wa.gov/billers-providers-partners",
            required_documents=["NPI Type 2", "WA Business Registration", "Articles of Incorporation", "W-9", "Liability Insurance", "ProviderOne Enrollment"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name="Molina Healthcare of Washington", credentialing_link="https://www.molinahealthcare.com/providers/wa/", phone="1-800-869-7165"),
            ManagedCareOrg(name="Coordinated Care", credentialing_link="https://www.coordinatedcarehealth.com/providers/", phone="1-877-644-4613"),
            ManagedCareOrg(name="Community Health Plan of Washington", credentialing_link="https://www.chpw.org/for-providers/", phone="1-800-440-1561"),
            ManagedCareOrg(name="United Healthcare Community Plan WA", credentialing_link="https://www.uhccommunityplan.com/wa/", phone="1-877-542-8997")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["LMHC", "LICSW", "Licensed Psychologist", "CDP", "Agency-Affiliated Counselor Supervisor"],
            notes="CPC supervision per HCA requirements. Clinical oversight required."
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Peer counseling", "H0025 - Prevention", "H2014 - Skills training"],
            units_of_service="15-minute increments.",
            documentation_basics="Service date, time, activities, progress notes, clinical signatures.",
            reimbursement_notes="Washington Medicaid rates via HCA fee schedules. MCO rates negotiated."
        ),
        checklist=get_standard_checklist()
    ),
    "AZ": StateData(
        state_code="AZ", state_name="Arizona", is_fully_populated=True,
        certification=CertificationRequirements(
            name="Peer Support Specialist / Recovery Support Specialist",
            who_qualifies="Individuals with lived experience in mental health and/or substance use recovery",
            training_hours="40-80 hours training depending on specialization via Arizona approved training providers",
            certification_authority="Arizona Health Care Cost Containment System (AHCCCS) / Arizona Board of Behavioral Health Examiners",
            certification_link="https://www.azahcccs.gov/AHCCCS/Initiatives/PeerRecoverySupport/"
        ),
        business_setup=BusinessSetup(
            entity_type="LLC, Corporation, or Non-profit.",
            in_state_required=True, physical_office_required=False,
            notes="Arizona allows telehealth peer services. Register with Arizona Corporation Commission."
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name="Arizona Health Care Cost Containment System (AHCCCS)", portal_link="https://www.azahcccs.gov/PlansProviders/ProviderEnrollment/",
            required_documents=["NPI Type 2", "AZ Business Registration", "Articles of Incorporation", "W-9", "Liability Insurance", "AHCCCS Provider Registration"],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(name="Arizona Complete Health", credentialing_link="https://www.azcompletehealth.com/providers/", phone="1-866-304-1836"),
            ManagedCareOrg(name="Mercy Care", credentialing_link="https://www.mercycareaz.org/providers/", phone="1-800-624-3879"),
            ManagedCareOrg(name="Banner University Family Care", credentialing_link="https://www.bannerhealth.com/providers/", phone="1-800-582-8686"),
            ManagedCareOrg(name="UnitedHealthcare Community Plan AZ", credentialing_link="https://www.uhccommunityplan.com/az/", phone="1-800-348-4058")
        ],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["LCSW", "LPC", "Licensed Psychologist", "LISAC", "Behavioral Health Professional"],
            notes="Peer support requires supervision by licensed behavioral health professional."
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Peer support", "H0025 - Prevention", "H2014 - Skills development"],
            units_of_service="15-minute increments.",
            documentation_basics="Service date/time, activities provided, progress notes, signatures.",
            reimbursement_notes="Arizona Medicaid rates via AHCCCS. MCO rates per contract."
        ),
        checklist=get_standard_checklist()
    )
}

def get_placeholder_state_data(state_code: str, state_name: str) -> StateData:
    return StateData(
        state_code=state_code, state_name=state_name, is_fully_populated=False,
        certification=CertificationRequirements(
            name=f"{state_name} Peer Support Certification",
            who_qualifies="Individuals with lived experience in recovery from mental health or substance use challenges",
            training_hours="Training requirements vary by state - contact your state authority",
            certification_authority=f"{state_name} Department of Health or equivalent",
            certification_link="Contact state health department for certification information"
        ),
        business_setup=BusinessSetup(
            entity_type="LLC or Corporation typically required",
            in_state_required=True, physical_office_required=False,
            notes=f"Requirements vary - contact {state_name} Secretary of State"
        ),
        medicaid_enrollment=MedicaidEnrollment(
            agency_name=f"{state_name} Medicaid",
            portal_link=f"Search: {state_name} Medicaid provider enrollment",
            required_documents=["NPI Type 2", "State Business License", "Articles of Incorporation", "W-9", "Liability Insurance"],
            npi_type2_required=True
        ),
        managed_care_orgs=[ManagedCareOrg(name=f"{state_name} MCOs - Contact State Medicaid", credentialing_link="Contact state Medicaid")],
        supervision_rules=SupervisionRules(
            licensed_supervisor_required=True,
            accepted_licenses=["LCSW", "LPC"],
            notes="Verify with your state certification authority"
        ),
        billing_overview=BillingOverview(
            common_codes=["H0038 - Peer services", "H0025 - Prevention"],
            units_of_service="Typically 15-minute increments",
            documentation_basics="Date, time, location, services, progress notes, signatures",
            reimbursement_notes="Contact your state Medicaid for current rates"
        ),
        checklist=get_standard_checklist()
    )

# Templates
TEMPLATES = {
    "policies-procedures": {
        "id": "policies-procedures", "title": "Policies & Procedures Template", "description": "Comprehensive outline for your agency's policy manual", "category": "Operations",
        "preview_text": "Sections: Mission Statement, Service Descriptions, Staff Qualifications, Supervision Protocols, Documentation Standards, Emergency Procedures, Confidentiality, Compliance.",
        "content": [
            {"section": "Mission Statement", "text": "Your agency's mission statement should articulate commitment to providing peer support services that empower individuals in their recovery journey."},
            {"section": "Service Descriptions", "text": "Define each peer support service: individual support, group facilitation, wellness coaching, recovery planning assistance."},
            {"section": "Staff Qualifications", "text": "All Peer Support Specialists must maintain current state certification, complete background checks, and participate in ongoing professional development."},
            {"section": "Supervision Protocols", "text": "Clinical supervision by licensed professional meeting state requirements. Weekly supervision sessions with documentation."},
            {"section": "Documentation Standards", "text": "All services documented within 24 hours. Include: date, time, duration, activities, progress notes, signatures."},
            {"section": "Emergency Procedures", "text": "Crisis intervention training required. Emergency contacts and protocols for mental health crises and safety concerns."},
            {"section": "Confidentiality Policies", "text": "All client information protected under HIPAA. Information shared only with written consent or as required by law."},
            {"section": "Compliance Guidelines", "text": "Maintain compliance with federal, state, local regulations including Medicaid requirements and MCO contracts."}
        ]
    },
    "job-posting": {
        "id": "job-posting", "title": "Peer Support Specialist Job Posting", "description": "Ready-to-use job description template", "category": "Hiring",
        "preview_text": "Position: Certified Peer Support Specialist. Qualifications: Current state certification, lived experience, valid driver's license...",
        "content": [
            {"section": "Position Title", "text": "Certified Peer Support Specialist"},
            {"section": "Position Summary", "text": "Provides recovery-oriented services using lived experience to inspire hope and support recovery."},
            {"section": "Essential Duties", "text": "• Individual and group peer support\n• Recovery planning and goal setting\n• Community resource connection\n• Model recovery and wellness\n• Document services\n• Participate in supervision"},
            {"section": "Qualifications", "text": "• Current state Peer Support certification\n• Lived experience in recovery\n• Valid driver's license\n• High school diploma\n• Pass background check"},
            {"section": "Compensation", "text": "Competitive hourly rate. Benefits: health insurance, PTO, professional development."}
        ]
    },
    "supervisor-contract": {
        "id": "supervisor-contract", "title": "Clinical Supervisor Contract", "description": "Agreement template for supervision arrangements", "category": "Contracts",
        "preview_text": "Agreement establishing terms of clinical supervision between Supervisor and Agency...",
        "content": [
            {"section": "Parties", "text": "Clinical Supervision Agreement between [SUPERVISOR] and [AGENCY]."},
            {"section": "Scope of Services", "text": "• Weekly supervision sessions\n• Documentation review and co-signing\n• Clinical guidance\n• Professional development support"},
            {"section": "Compensation", "text": "Rate of $[AMOUNT] per hour/session. Payment terms: [NET 30]."},
            {"section": "Term", "text": "Begins [DATE], continues until terminated with 30 days written notice."},
            {"section": "Insurance", "text": "Supervisor maintains professional liability insurance with minimum coverage of $[AMOUNT]."}
        ]
    },
    "provider-agreement": {
        "id": "provider-agreement", "title": "Provider Services Agreement", "description": "Contract template for client services", "category": "Contracts",
        "preview_text": "Provider Services Agreement defining scope of peer support services, payment terms, obligations...",
        "content": [
            {"section": "Services Provided", "text": "• Individual peer support\n• Group peer support\n• Recovery planning\n• Community resource navigation\n• Wellness coaching"},
            {"section": "Client Rights", "text": "• Receive respectful services\n• Participate in treatment planning\n• Access records\n• File grievances\n• Terminate services"},
            {"section": "Payment Terms", "text": "Services billed to [Medicaid/MCO/Private Pay] at approved rates."},
            {"section": "Termination", "text": "Either party may terminate with [30] days written notice."}
        ]
    },
    "medicaid-scripts": {
        "id": "medicaid-scripts", "title": "Medicaid Call Scripts", "description": "Phone scripts for Medicaid enrollment inquiries", "category": "Communications",
        "preview_text": "Script: 'Hello, my name is [Name] and I'm calling to inquire about enrolling as a behavioral health provider...'",
        "content": [
            {"section": "Initial Enrollment Inquiry", "text": "Hello, I'm [NAME] from [AGENCY]. I'm calling about enrolling as a behavioral health provider for peer support services.\n\n1. What are enrollment requirements?\n2. What forms are needed?\n3. What's the timeline?\n4. Is there an online portal?"},
            {"section": "Application Status Follow-up", "text": "Hello, I'm [NAME] from [AGENCY], checking on enrollment application [NUMBER] submitted [DATE].\n\n1. Current status?\n2. Additional documents needed?\n3. Expected completion date?"},
            {"section": "MCO Credentialing Inquiry", "text": "Hello, I'm [NAME] from [AGENCY], enrolled with [STATE] Medicaid, seeking credentialing with your plan.\n\n1. Credentialing process?\n2. Required documents?\n3. Timeline?\n4. Contact for materials?"}
        ]
    },
    "startup-budget": {
        "id": "startup-budget", "title": "Startup Budget Checklist", "description": "Financial planning template for new agencies", "category": "Finance",
        "preview_text": "Startup Costs: Business Registration ($100-500), Insurance ($2,000-5,000), Office Setup ($1,500-3,000)...",
        "content": [
            {"section": "One-Time Startup Costs", "text": "• Business Registration: $100-500\n• NPI Application: Free\n• Initial Insurance: $2,000-5,000\n• Equipment: $1,500-3,000\n• EHR Setup: $500-2,000\n• Website: $500-3,000\n• Marketing: $500-1,500\n• Legal/Consulting: $1,000-5,000"},
            {"section": "Monthly Operating Costs", "text": "• Office Rent: $500-2,000\n• Insurance: $200-500\n• Software: $100-400\n• Phone/Internet: $100-200\n• Supervision: $200-600\n• Marketing: $100-500"},
            {"section": "Staffing Costs", "text": "• PSS Wages: $15-25/hour\n• Supervisor: $75-150/hour\n• Admin: $15-20/hour\n• Add 20-30% for taxes/benefits"},
            {"section": "Working Capital", "text": "• Minimum 3 months expenses in reserve\n• Plan for 60-90 day Medicaid payment delay\n• Recommended starting capital: $25,000-50,000"}
        ]
    }
}

NATIONAL_OVERVIEW_DATA = {
    "what_is_peer_support": "Peer Support is a recovery-oriented service provided by individuals with lived experience of mental health challenges, substance use disorders, or co-occurring conditions. It emphasizes empowerment, self-determination, and community connection.",
    "what_is_medicaid_billable": "Medicaid-billable peer support services meet state and federal requirements for reimbursement. Your agency must be enrolled as a Medicaid provider, employ certified specialists, meet documentation/supervision requirements, and submit claims properly.",
    "universal_requirements": [
        "NPI Type 1 (individual) and Type 2 (organization)",
        "State business registration (LLC, Corporation, etc.)",
        "EIN from IRS",
        "General liability and professional liability insurance",
        "State-certified Peer Support Specialists",
        "Qualified supervision by licensed professional",
        "Written policies and procedures",
        "Compliant EHR and billing systems",
        "Criminal background checks",
        "HIPAA compliance program"
    ],
    "best_practices": [
        "Start with one state and master requirements before expanding",
        "Build MCO relationships before seeking credentialing",
        "Invest in quality training beyond minimum requirements",
        "Develop robust documentation systems from day one",
        "Create strong referral network with clinical providers",
        "Focus on quality over quantity initially",
        "Stay current with regulatory changes",
        "Join professional associations",
        "Start with smaller service area to build expertise",
        "Maintain detailed records for audits"
    ],
    "multi_state_strategy": "Expanding to multiple states requires foreign qualifying your business, obtaining registered agents, meeting state-specific licensing, credentialing with local MCOs, hiring locally-certified staff, and understanding rate differences between states."
}

# PDF Generation
def generate_template_pdf(template_id: str) -> BytesIO:
    template = TEMPLATES.get(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, textColor=NAVY, spaceAfter=20, alignment=TA_CENTER)
    section_style = ParagraphStyle('Section', parent=styles['Heading2'], fontSize=14, textColor=GOLD, spaceBefore=20, spaceAfter=10)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=11, spaceAfter=12, leading=16)
    
    story = [Paragraph(f"<b>{template['title']}</b>", title_style), Paragraph(f"<i>{template['description']}</i>", body_style), Spacer(1, 0.3*inch)]
    
    for item in template.get("content", []):
        story.append(Paragraph(item["section"], section_style))
        story.append(Paragraph(item["text"].replace('\n', '<br/>'), body_style))
    
    story.append(Spacer(1, 0.5*inch))
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, textColor=colors.gray, alignment=TA_CENTER)
    story.append(Paragraph("Launch Your Peer Support Agency™ | Educational purposes only", footer_style))
    
    doc.build(story)
    buffer.seek(0)
    return buffer

# Admin Authentication
def verify_admin_password(password: str) -> bool:
    return hashlib.sha256(password.encode()).hexdigest() == ADMIN_PASSWORD_HASH

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Peer Support Agency Launch API", "version": "3.0"}

@api_router.get("/states")
async def get_all_states():
    return {"states": [{"code": s["code"], "name": s["name"], "is_fully_populated": s["code"] in FULLY_POPULATED_STATES} for s in ALL_STATES]}

@api_router.get("/states/{state_code}")
async def get_state_data(state_code: str):
    state_code = state_code.upper()
    state_info = next((s for s in ALL_STATES if s["code"] == state_code), None)
    if not state_info:
        raise HTTPException(status_code=404, detail="State not found")
    if state_code in STATE_DATA:
        return STATE_DATA[state_code].model_dump()
    return get_placeholder_state_data(state_code, state_info["name"]).model_dump()

@api_router.get("/templates")
async def get_templates():
    return {"templates": [{"id": t["id"], "title": t["title"], "description": t["description"], "category": t["category"], "preview_text": t["preview_text"], "download_url": f"/api/templates/download/{t['id']}"} for t in TEMPLATES.values()]}

@api_router.get("/templates/download/{template_id}")
async def download_template(template_id: str):
    template = TEMPLATES.get(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return StreamingResponse(generate_template_pdf(template_id), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={template_id}.pdf"})

@api_router.post("/email-capture")
async def capture_email(data: EmailCapture):
    doc = {"id": str(uuid.uuid4()), "email": data.email, "name": data.name, "source": data.source, "template_id": data.template_id, "state": data.state, "message": data.message, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.email_captures.insert_one(doc)
    return {"success": True, "message": "Thank you! We'll be in touch soon."}

@api_router.post("/consultation-request")
async def submit_consultation(data: ConsultationRequest):
    doc = {"id": str(uuid.uuid4()), "name": data.name, "email": data.email, "state": data.state, "phone": data.phone, "message": data.message, "status": "pending", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.consultation_requests.insert_one(doc)
    return {"success": True, "message": "Consultation request submitted. We'll contact you within 24-48 hours."}

@api_router.get("/national-overview")
async def get_national_overview():
    return NATIONAL_OVERVIEW_DATA

@api_router.get("/products")
async def get_products():
    return {"products": PRODUCTS}

@api_router.post("/checkout/create-session")
async def create_checkout_session(request: CheckoutRequest, http_request: Request):
    if request.product_id not in PRODUCTS:
        raise HTTPException(status_code=400, detail="Invalid product")
    product = PRODUCTS[request.product_id]
    api_key = os.environ.get('STRIPE_API_KEY')
    host_url = request.origin_url.rstrip('/')
    webhook_url = f"{str(http_request.base_url).rstrip('/')}/api/webhook/stripe"
    success_url = f"{host_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/payment-cancel"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    checkout_request = CheckoutSessionRequest(amount=product["price"], currency="usd", success_url=success_url, cancel_url=cancel_url, metadata={"product_id": request.product_id, "product_name": product["name"]})
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    await db.payment_transactions.insert_one({"id": str(uuid.uuid4()), "session_id": session.session_id, "product_id": request.product_id, "product_name": product["name"], "amount": product["price"], "currency": "usd", "status": "pending", "payment_status": "initiated", "created_at": datetime.now(timezone.utc).isoformat()})
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, http_request: Request):
    api_key = os.environ.get('STRIPE_API_KEY')
    webhook_url = f"{str(http_request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    status = await stripe_checkout.get_checkout_status(session_id)
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"status": status.status, "payment_status": status.payment_status, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"status": status.status, "payment_status": status.payment_status, "amount_total": status.amount_total, "currency": status.currency, "metadata": status.metadata}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    api_key = os.environ.get('STRIPE_API_KEY')
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        if webhook_response.session_id:
            await db.payment_transactions.update_one({"session_id": webhook_response.session_id}, {"$set": {"status": webhook_response.event_type, "payment_status": webhook_response.payment_status, "updated_at": datetime.now(timezone.utc).isoformat()}})
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

# Admin Routes
@api_router.post("/admin/login")
async def admin_login(data: AdminLogin):
    if verify_admin_password(data.password):
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid password")

@api_router.get("/admin/leads")
async def get_leads(password: str = ""):
    if not verify_admin_password(password):
        raise HTTPException(status_code=401, detail="Unauthorized")
    leads = await db.email_captures.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"leads": leads, "total": len(leads)}

@api_router.get("/admin/consultations")
async def get_consultations(password: str = ""):
    if not verify_admin_password(password):
        raise HTTPException(status_code=401, detail="Unauthorized")
    consultations = await db.consultation_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"consultations": consultations, "total": len(consultations)}

@api_router.get("/admin/payments")
async def get_payments(password: str = ""):
    if not verify_admin_password(password):
        raise HTTPException(status_code=401, detail="Unauthorized")
    payments = await db.payment_transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"payments": payments, "total": len(payments)}

@api_router.get("/admin/stats")
async def get_admin_stats(password: str = ""):
    if not verify_admin_password(password):
        raise HTTPException(status_code=401, detail="Unauthorized")
    leads_count = await db.email_captures.count_documents({})
    consultations_count = await db.consultation_requests.count_documents({})
    payments_count = await db.payment_transactions.count_documents({})
    paid_payments = await db.payment_transactions.count_documents({"payment_status": "paid"})
    total_revenue = 0
    paid_docs = await db.payment_transactions.find({"payment_status": "paid"}, {"_id": 0, "amount": 1}).to_list(1000)
    for doc in paid_docs:
        total_revenue += doc.get("amount", 0)
    return {"leads": leads_count, "consultations": consultations_count, "payments": payments_count, "paid_payments": paid_payments, "total_revenue": total_revenue}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
