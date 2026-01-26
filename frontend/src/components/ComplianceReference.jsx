import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  Users,
  FileText,
  GraduationCap,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Info,
  Scale,
  ClipboardCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// State-specific compliance requirements data
// Summarized in plain language from official Medicaid policies
const COMPLIANCE_DATA = {
  NC: {
    policyName: "NC Medicaid Clinical Coverage Policy 8G",
    policyUrl: "https://medicaid.ncdhhs.gov/providers/clinical-coverage-policies/behavioral-health-idd-clinical-coverage-policies",
    policyCategory: "Peer Support Services",
    lastUpdated: "January 2025",
    requirements: {
      eligibility: {
        title: "Who Can Be a Peer Support Specialist",
        icon: Users,
        items: [
          "Must be at least 18 years old",
          "Must have lived experience with mental health, substance use, or both",
          "Must be in stable recovery (typically 1+ year for substance use)",
          "Must complete NC-approved Peer Support Specialist training",
          "Must pass background check (some exceptions may apply)"
        ],
        checklistLink: "Staff Credentials on File"
      },
      staffing: {
        title: "Supervision & Staffing Requirements",
        icon: Users,
        items: [
          "Must work under supervision of a Qualified Professional (QP)",
          "QP supervisors include: LCSW, LPC, LCMHC, or psychologist",
          "Supervision must be documented and occur regularly",
          "Peer specialists cannot work independently without oversight",
          "Agency must maintain supervision logs"
        ],
        checklistLink: "Clinical Supervisor Agreement"
      },
      documentation: {
        title: "Documentation Requirements",
        icon: FileText,
        items: [
          "All services must be documented within 72 hours",
          "Progress notes must include: date, time, service provided, client response",
          "Service plans must be individualized and recovery-focused",
          "Client consent forms must be signed before services begin",
          "Records must be retained for at least 5 years"
        ],
        checklistLink: "Client Intake Forms"
      },
      training: {
        title: "Training & Certification",
        icon: GraduationCap,
        items: [
          "Complete 40+ hour state-approved peer support training",
          "Pass certification exam (written and/or oral)",
          "Maintain certification through continuing education",
          "Annual training on HIPAA, ethics, and boundaries required",
          "Specialized training may be required for certain populations"
        ],
        checklistLink: "Staff Training Documentation"
      },
      nonBillable: {
        title: "Services That Cannot Be Billed",
        icon: XCircle,
        items: [
          "Transportation (unless specifically authorized)",
          "Services provided to family members without the client present",
          "Crisis services (requires different authorization)",
          "Group services exceeding maximum participant limits",
          "Services not in the approved service plan",
          "Duplicate services already billed by another provider"
        ],
        checklistLink: null
      }
    }
  },
  TX: {
    policyName: "Texas Medicaid Provider Procedures Manual - Behavioral Health",
    policyUrl: "https://www.tmhp.com/resources/provider-manuals",
    policyCategory: "Peer Support Services",
    lastUpdated: "January 2025",
    requirements: {
      eligibility: {
        title: "Who Can Be a Peer Support Specialist",
        icon: Users,
        items: [
          "Must be at least 18 years old",
          "Must have lived experience with mental health and/or substance use recovery",
          "Must be certified as MHPS (Mental Health Peer Specialist) or PRSS (Peer Recovery Support Specialist)",
          "Certification through Via Hope or approved training organization",
          "Must pass criminal background check"
        ],
        checklistLink: "Staff Credentials on File"
      },
      staffing: {
        title: "Supervision & Staffing Requirements",
        icon: Users,
        items: [
          "Must be supervised by a Qualified Mental Health Professional (QMHP)",
          "QMHP includes: LPC, LCSW, LMFT, or licensed psychologist",
          "Weekly supervision meetings recommended",
          "Supervision documentation required",
          "Peer-to-peer mentorship encouraged but does not replace clinical supervision"
        ],
        checklistLink: "Clinical Supervisor Agreement"
      },
      documentation: {
        title: "Documentation Requirements",
        icon: FileText,
        items: [
          "Service delivery notes required for each encounter",
          "Must document goals addressed and client progress",
          "Service authorization must be obtained before billing",
          "Electronic health records must meet HIPAA standards",
          "Retain records for minimum of 5 years"
        ],
        checklistLink: "Client Intake Forms"
      },
      training: {
        title: "Training & Certification",
        icon: GraduationCap,
        items: [
          "Complete Texas-approved peer specialist certification program",
          "MHPS or PRSS certification required before providing services",
          "Continuing education required for recertification",
          "Ethics and boundaries training mandatory",
          "Cultural competency training encouraged"
        ],
        checklistLink: "Staff Training Documentation"
      },
      nonBillable: {
        title: "Services That Cannot Be Billed",
        icon: XCircle,
        items: [
          "Services without prior authorization",
          "Activities that are primarily social or recreational",
          "Transportation costs",
          "Services to individuals not enrolled in Medicaid",
          "Services outside of scope of peer support practice"
        ],
        checklistLink: null
      }
    }
  },
  CA: {
    policyName: "DHCS Medi-Cal Peer Support Services Guidelines",
    policyUrl: "https://www.dhcs.ca.gov/services/MH/Pages/MHInfoforProviders.aspx",
    policyCategory: "Peer Support Specialist Services",
    lastUpdated: "January 2025",
    requirements: {
      eligibility: {
        title: "Who Can Be a Peer Support Specialist",
        icon: Users,
        items: [
          "Must be at least 18 years old",
          "Must have lived experience with mental health or substance use",
          "Must be CalMHSA certified or working toward certification",
          "Background check required per county requirements",
          "Must demonstrate ongoing recovery and wellness"
        ],
        checklistLink: "Staff Credentials on File"
      },
      staffing: {
        title: "Supervision & Staffing Requirements",
        icon: Users,
        items: [
          "Supervision by licensed clinician required",
          "Supervision requirements may vary by county MHP",
          "Regular supervision meetings must be documented",
          "Scope of practice must be clearly defined",
          "Collaborative care approach encouraged"
        ],
        checklistLink: "Clinical Supervisor Agreement"
      },
      documentation: {
        title: "Documentation Requirements",
        icon: FileText,
        items: [
          "Documentation must meet county MHP standards",
          "Progress notes required for each service encounter",
          "Client treatment plans must include peer support goals",
          "HIPAA-compliant record keeping required",
          "Documentation must support medical necessity"
        ],
        checklistLink: "Client Intake Forms"
      },
      training: {
        title: "Training & Certification",
        icon: GraduationCap,
        items: [
          "Complete CalMHSA-approved certification program",
          "75-hour training curriculum minimum",
          "Continuing education for certification maintenance",
          "County-specific training may be required",
          "Supervision training for those overseeing peers"
        ],
        checklistLink: "Staff Training Documentation"
      },
      nonBillable: {
        title: "Services That Cannot Be Billed",
        icon: XCircle,
        items: [
          "Services not included in county contract",
          "Room and board",
          "Services during inpatient stays (unless authorized)",
          "Duplicate services from multiple providers",
          "Services not documented properly"
        ],
        checklistLink: null
      }
    }
  },
  FL: {
    policyName: "Florida Medicaid Community Behavioral Health Services Coverage Policy",
    policyUrl: "https://ahca.myflorida.com/medicaid/",
    policyCategory: "Certified Recovery Peer Specialist Services",
    lastUpdated: "January 2025",
    requirements: {
      eligibility: {
        title: "Who Can Be a Peer Support Specialist",
        icon: Users,
        items: [
          "Must be at least 18 years old",
          "Must have personal lived experience with recovery",
          "Must hold CRPS (Certified Recovery Peer Specialist) credential",
          "Certification through Florida Certification Board",
          "Level 2 background screening required"
        ],
        checklistLink: "Staff Credentials on File"
      },
      staffing: {
        title: "Supervision & Staffing Requirements",
        icon: Users,
        items: [
          "Must work under licensed behavioral health professional",
          "Supervisors include: LCSW, LMHC, LMFT, psychologist",
          "Supervision requirements defined by employing agency",
          "Must maintain professional boundaries",
          "Team-based care model preferred"
        ],
        checklistLink: "Clinical Supervisor Agreement"
      },
      documentation: {
        title: "Documentation Requirements",
        icon: FileText,
        items: [
          "All services must be documented in client record",
          "Documentation must support service authorization",
          "Progress notes must reflect recovery goals",
          "Client signatures required on consent forms",
          "Records retention per Florida law (typically 7 years)"
        ],
        checklistLink: "Client Intake Forms"
      },
      training: {
        title: "Training & Certification",
        icon: GraduationCap,
        items: [
          "Complete FCB-approved CRPS training program",
          "Pass CRPS certification examination",
          "40 continuing education hours per renewal period",
          "Ethics training required",
          "Specialized tracks available (mental health, substance use)"
        ],
        checklistLink: "Staff Training Documentation"
      },
      nonBillable: {
        title: "Services That Cannot Be Billed",
        icon: XCircle,
        items: [
          "Services not prior authorized",
          "Socialization activities without therapeutic purpose",
          "Case management services (separate billing code)",
          "Services exceeding authorized units",
          "Services to non-Medicaid recipients"
        ],
        checklistLink: null
      }
    }
  },
  NY: {
    policyName: "14 NYCRR Part 512 - Peer Support Services",
    policyUrl: "https://omh.ny.gov/omhweb/guidance/",
    policyCategory: "OMH Peer Support Services",
    lastUpdated: "January 2025",
    requirements: {
      eligibility: {
        title: "Who Can Be a Peer Support Specialist",
        icon: Users,
        items: [
          "Must be at least 18 years old",
          "Must self-identify as having lived experience",
          "Must complete NYS-approved peer specialist training",
          "NYCPS certification required for Medicaid billing",
          "Background check per agency policy"
        ],
        checklistLink: "Staff Credentials on File"
      },
      staffing: {
        title: "Supervision & Staffing Requirements",
        icon: Users,
        items: [
          "Supervision by qualified clinical staff required",
          "Supervision must support peer specialist development",
          "Regular individual and group supervision",
          "Documentation of supervision sessions",
          "Clear scope of practice guidelines"
        ],
        checklistLink: "Clinical Supervisor Agreement"
      },
      documentation: {
        title: "Documentation Requirements",
        icon: FileText,
        items: [
          "Services documented per OMH guidelines",
          "Progress notes within required timeframe",
          "Treatment planning must be person-centered",
          "HIPAA and 42 CFR Part 2 compliance",
          "Quality assurance documentation"
        ],
        checklistLink: "Client Intake Forms"
      },
      training: {
        title: "Training & Certification",
        icon: GraduationCap,
        items: [
          "Complete Academy of Peer Services or equivalent",
          "NYCPS certification for Medicaid reimbursement",
          "Core competency training required",
          "Annual continuing education",
          "Specialized training for specific populations"
        ],
        checklistLink: "Staff Training Documentation"
      },
      nonBillable: {
        title: "Services That Cannot Be Billed",
        icon: XCircle,
        items: [
          "Services not in person-centered service plan",
          "Administrative activities",
          "Transportation (unless specifically included)",
          "Services during inpatient psychiatric admission",
          "Duplicative services"
        ],
        checklistLink: null
      }
    }
  }
};

// Default/generic compliance info for states without specific data
const DEFAULT_COMPLIANCE = {
  policyName: "State Medicaid Behavioral Health Policy",
  policyUrl: null,
  policyCategory: "Peer Support Services",
  lastUpdated: "January 2025",
  requirements: {
    eligibility: {
      title: "Who Can Be a Peer Support Specialist",
      icon: Users,
      items: [
        "Must be at least 18 years old",
        "Must have personal lived experience with mental health and/or substance use recovery",
        "Must complete state-approved peer support training",
        "Must pass required background checks",
        "Must maintain active certification"
      ],
      checklistLink: "Staff Credentials on File"
    },
    staffing: {
      title: "Supervision & Staffing Requirements",
      icon: Users,
      items: [
        "Must work under supervision of qualified clinical professional",
        "Supervision must be documented regularly",
        "Clear scope of practice must be established",
        "Professional boundaries must be maintained",
        "Team-based approach typically required"
      ],
      checklistLink: "Clinical Supervisor Agreement"
    },
    documentation: {
      title: "Documentation Requirements",
      icon: FileText,
      items: [
        "All services must be documented in client records",
        "Progress notes required for each encounter",
        "Service plans must be individualized",
        "Client consent forms required",
        "HIPAA compliance mandatory"
      ],
      checklistLink: "Client Intake Forms"
    },
    training: {
      title: "Training & Certification",
      icon: GraduationCap,
      items: [
        "Complete state-approved certification program",
        "Pass certification examination",
        "Maintain continuing education requirements",
        "Ethics and boundaries training",
        "Cultural competency training recommended"
      ],
      checklistLink: "Staff Training Documentation"
    },
    nonBillable: {
      title: "Services That Cannot Be Billed",
      icon: XCircle,
      items: [
        "Services without proper authorization",
        "Transportation (unless specifically covered)",
        "Social/recreational activities without therapeutic purpose",
        "Services to non-enrolled individuals",
        "Duplicate services from multiple providers"
      ],
      checklistLink: null
    }
  }
};

const ComplianceReference = ({ stateCode, stateName }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  // Get state-specific or default compliance data
  const compliance = COMPLIANCE_DATA[stateCode?.toUpperCase()] || DEFAULT_COMPLIANCE;
  const hasStateSpecificData = !!COMPLIANCE_DATA[stateCode?.toUpperCase()];

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const categoryColors = {
    eligibility: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    staffing: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
    documentation: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
    training: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
    nonBillable: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" }
  };

  return (
    <Card className="border-0 shadow-sm mb-6" data-testid="compliance-reference">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-serif text-navy">
                Peer Support Rules & Compliance
              </CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">
                {stateName || stateCode} Medicaid requirements (reference)
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-500"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-4">
          {/* Educational Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">
                  Educational Reference Only
                </p>
                <p className="text-sm text-amber-700">
                  This summary is for general guidance and preparation purposes. Rules and regulations 
                  change frequently. <strong>Always verify current requirements</strong> with your state 
                  Medicaid agency and official policy documents before making business decisions.
                </p>
              </div>
            </div>
          </div>

          {/* Policy Source */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-navy mb-1">
                  Primary Policy Reference
                </p>
                <p className="text-sm text-slate-600 mb-2">
                  {compliance.policyName}
                </p>
                {compliance.policyUrl ? (
                  <a 
                    href={compliance.policyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    View Official Policy
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Contact your state Medicaid agency for official policy documents
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  Last reviewed: {compliance.lastUpdated}
                </p>
              </div>
            </div>
          </div>

          {!hasStateSpecificData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-blue-700">
                <Info className="w-4 h-4 inline mr-1" />
                Showing general peer support requirements. State-specific details for {stateName || stateCode} 
                will be added soon.
              </p>
            </div>
          )}

          {/* Requirements Sections */}
          <div className="space-y-3">
            {Object.entries(compliance.requirements).map(([key, section]) => {
              const Icon = section.icon;
              const colors = categoryColors[key];
              const isOpen = expandedSections[key];

              return (
                <div 
                  key={key}
                  className={`border rounded-lg overflow-hidden ${colors.border}`}
                >
                  <button
                    onClick={() => toggleSection(key)}
                    className={`w-full p-4 flex items-center justify-between ${colors.bg} hover:brightness-95 transition-all`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                      <span className="font-medium text-navy">{section.title}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="p-4 bg-white border-t border-slate-100">
                      <ul className="space-y-2">
                        {section.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                            <CheckCircle2 className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Link to Site Visit Checklist */}
                      {section.checklistLink && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2 text-sm">
                            <ClipboardCheck className="w-4 h-4 text-teal-600" />
                            <span className="text-slate-500">Related checklist item:</span>
                            <span className="text-teal-600 font-medium">{section.checklistLink}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Tips */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-medium text-navy mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" />
              Quick Compliance Tips
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">•</span>
                Keep a copy of your state's current Medicaid policy manual accessible
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">•</span>
                Subscribe to your Medicaid agency's provider newsletter for updates
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">•</span>
                Document everything — if it's not documented, it didn't happen
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">•</span>
                When in doubt, contact your MCO or state Medicaid office directly
              </li>
            </ul>
          </div>

          {/* Final Note */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">
              This reference connects to your Site Visit Readiness checklist to help you prepare.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ComplianceReference;
