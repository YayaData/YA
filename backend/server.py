from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

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

# North Carolina Full Data
NC_DATA = StateData(
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
        required_documents=[
            "NPI Type 2 (Organization)",
            "NC Business License",
            "Articles of Incorporation/Organization",
            "W-9 Form",
            "Liability Insurance Certificate",
            "Ownership Disclosure Form",
            "Provider Agreement Application"
        ],
        npi_type2_required=True
    ),
    managed_care_orgs=[
        ManagedCareOrg(
            name="Alliance Health",
            credentialing_link="https://www.alliancehealthplan.org/providers/",
            phone="1-800-510-9132"
        ),
        ManagedCareOrg(
            name="Eastpointe",
            credentialing_link="https://www.eastpointe.net/providers/",
            phone="1-800-913-6109"
        ),
        ManagedCareOrg(
            name="Partners Health Management",
            credentialing_link="https://www.partnersbhm.org/providers/",
            phone="1-888-235-4673"
        ),
        ManagedCareOrg(
            name="Sandhills Center",
            credentialing_link="https://www.sandhillscenter.org/providers/",
            phone="1-800-256-2452"
        ),
        ManagedCareOrg(
            name="Trillium Health Resources",
            credentialing_link="https://www.trilliumhealthresources.org/providers/",
            phone="1-877-685-2415"
        ),
        ManagedCareOrg(
            name="Vaya Health",
            credentialing_link="https://www.vayahealth.com/providers/",
            phone="1-800-962-9003"
        )
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
)

# Generic placeholder data for other states
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
            required_documents=[
                "NPI Type 2 (Organization)",
                "State Business License",
                "Articles of Incorporation/Organization",
                "W-9 Form",
                "Liability Insurance",
                "Provider Application"
            ],
            npi_type2_required=True
        ),
        managed_care_orgs=[
            ManagedCareOrg(
                name=f"{state_name} Managed Care - Contact State Medicaid",
                credentialing_link="Contact state Medicaid for MCO information",
                phone="Contact state Medicaid"
            )
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
TEMPLATES = [
    Template(
        id="policies-procedures",
        title="Policies & Procedures Template",
        description="Comprehensive outline for your agency's policy manual",
        category="Operations",
        preview_text="This template includes sections for: Mission Statement, Service Descriptions, Staff Qualifications, Supervision Protocols, Documentation Standards, Emergency Procedures, Confidentiality Policies, and Compliance Guidelines.",
        download_url="/api/templates/download/policies-procedures"
    ),
    Template(
        id="job-posting",
        title="Peer Support Specialist Job Posting",
        description="Ready-to-use job description template",
        category="Hiring",
        preview_text="Position: Certified Peer Support Specialist\nQualifications: Current state certification, lived experience in recovery, valid driver's license...",
        download_url="/api/templates/download/job-posting"
    ),
    Template(
        id="supervisor-contract",
        title="Clinical Supervisor Contract",
        description="Agreement template for supervision arrangements",
        category="Contracts",
        preview_text="This agreement establishes the terms of clinical supervision between [Supervisor Name] and [Agency Name] for the purpose of...",
        download_url="/api/templates/download/supervisor-contract"
    ),
    Template(
        id="provider-agreement",
        title="Provider Services Agreement",
        description="Contract template for client services",
        category="Contracts",
        preview_text="Provider Services Agreement defining the scope of peer support services, payment terms, and mutual obligations...",
        download_url="/api/templates/download/provider-agreement"
    ),
    Template(
        id="medicaid-scripts",
        title="Medicaid Call Scripts",
        description="Phone scripts for Medicaid enrollment inquiries",
        category="Communications",
        preview_text="Script for calling Medicaid Provider Enrollment: 'Hello, my name is [Name] and I'm calling to inquire about enrolling as a behavioral health provider...'",
        download_url="/api/templates/download/medicaid-scripts"
    ),
    Template(
        id="startup-budget",
        title="Startup Budget Checklist",
        description="Financial planning template for new agencies",
        category="Finance",
        preview_text="Startup Costs: Business Registration ($___), Insurance ($___), Office Setup ($___), Software/EHR ($___), Marketing ($___), Working Capital ($___)...",
        download_url="/api/templates/download/startup-budget"
    )
]

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

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Peer Support Agency Launch API", "version": "1.0"}

@api_router.get("/states")
async def get_all_states():
    """Get list of all 50 states with basic info"""
    states_with_status = []
    for state in ALL_STATES:
        states_with_status.append({
            "code": state["code"],
            "name": state["name"],
            "is_fully_populated": state["code"] == "NC"
        })
    return {"states": states_with_status}

@api_router.get("/states/{state_code}")
async def get_state_data(state_code: str):
    """Get detailed data for a specific state"""
    state_code = state_code.upper()
    state_info = next((s for s in ALL_STATES if s["code"] == state_code), None)
    
    if not state_info:
        raise HTTPException(status_code=404, detail="State not found")
    
    if state_code == "NC":
        return NC_DATA.model_dump()
    else:
        return get_placeholder_state_data(state_code, state_info["name"]).model_dump()

@api_router.get("/templates")
async def get_templates():
    """Get all available templates"""
    return {"templates": [t.model_dump() for t in TEMPLATES]}

@api_router.get("/templates/{template_id}")
async def get_template(template_id: str):
    """Get specific template details"""
    template = next((t for t in TEMPLATES if t.id == template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template.model_dump()

@api_router.get("/templates/download/{template_id}")
async def download_template(template_id: str):
    """Download template PDF placeholder"""
    template = next((t for t in TEMPLATES if t.id == template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Return download info (in real app, would serve actual PDF)
    return {
        "message": f"Download initiated for: {template.title}",
        "template_id": template_id,
        "filename": f"{template_id}.pdf",
        "note": "PDF download link - upgrade for editable templates"
    }

@api_router.get("/national-overview")
async def get_national_overview():
    """Get national overview content"""
    return NATIONAL_OVERVIEW_DATA.model_dump()

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
