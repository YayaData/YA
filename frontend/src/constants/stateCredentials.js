/**
 * State Credentialing Requirements
 * Structure designed for easy addition of new states
 * 
 * References:
 * - 10A NCAC 27G (NC Behavioral Health Rules)
 * - LME/MCO Contract Requirements
 * - Agency-specific credentialing checklists
 */

export const STATE_CREDENTIALS = {
  NC: {
    name: "North Carolina",
    code: "NC",
    regulations: [
      {
        id: "10A_NCAC_27G",
        name: "10A NCAC 27G",
        description: "NC Administrative Code - Mental Health, Developmental Disabilities, and Substance Abuse Services",
        url: "https://www.ncdhhs.gov/divisions/mental-health-developmental-disabilities-and-substance-abuse/rules"
      },
      {
        id: "LME_MCO",
        name: "LME/MCO Contract Requirements",
        description: "Local Management Entity/Managed Care Organization provider requirements",
        url: null
      }
    ],
    
    // Required documents by organization type
    requiredDocuments: {
      AFL_PROVIDER: [
        { id: "afl_certificate", name: "AFL Certificate", description: "Alternative Family Living certification from NC DHHS", required: true },
        { id: "background_check", name: "Background Check", description: "Criminal background check (within last 12 months)", required: true },
        { id: "first_aid_cpr", name: "First Aid/CPR Certification", description: "Current First Aid and CPR certification", required: true },
        { id: "home_inspection", name: "Home Safety Inspection", description: "Home safety inspection report", required: true },
        { id: "liability_insurance", name: "Liability Insurance", description: "Proof of liability insurance coverage", required: true },
        { id: "training_certificate", name: "Training Certificate", description: "Required AFL training completion certificate", required: true }
      ],
      GROUP_HOME: [
        { id: "facility_license", name: "Facility License", description: "NC DHHS facility license", required: true },
        { id: "background_check", name: "Background Check", description: "Criminal background checks for all staff", required: true },
        { id: "fire_inspection", name: "Fire Inspection", description: "Current fire safety inspection certificate", required: true },
        { id: "health_inspection", name: "Health Inspection", description: "Current health department inspection", required: true },
        { id: "liability_insurance", name: "Liability Insurance", description: "Proof of liability insurance coverage", required: true },
        { id: "staff_training", name: "Staff Training Records", description: "Documentation of required staff training", required: true },
        { id: "emergency_plan", name: "Emergency Plan", description: "Written emergency and evacuation plan", required: true }
      ],
      TRANSITIONAL_HOUSING: [
        { id: "business_license", name: "Business License", description: "Local business license", required: true },
        { id: "background_check", name: "Background Check", description: "Criminal background check", required: true },
        { id: "fire_inspection", name: "Fire Inspection", description: "Fire safety inspection certificate", required: true },
        { id: "liability_insurance", name: "Liability Insurance", description: "Proof of liability insurance coverage", required: true },
        { id: "policies_procedures", name: "Policies & Procedures", description: "Written policies and procedures manual", required: false }
      ],
      VETERANS_TRANSITIONAL: [
        { id: "va_certification", name: "VA Certification", description: "VA-approved provider certification (if applicable)", required: false },
        { id: "background_check", name: "Background Check", description: "Criminal background check", required: true },
        { id: "fire_inspection", name: "Fire Inspection", description: "Fire safety inspection certificate", required: true },
        { id: "liability_insurance", name: "Liability Insurance", description: "Proof of liability insurance coverage", required: true },
        { id: "veteran_services_plan", name: "Veteran Services Plan", description: "Plan for veteran-specific services", required: true }
      ],
      DEFAULT: [
        { id: "background_check", name: "Background Check", description: "Criminal background check", required: true },
        { id: "liability_insurance", name: "Liability Insurance", description: "Proof of liability insurance coverage", required: true }
      ]
    },

    // Credentialing checklists per org type (reference only, not enforcement)
    checklists: {
      AFL_PROVIDER: {
        title: "AFL Provider Credentialing Checklist",
        reference: "10A NCAC 27G .0100 - .0600",
        sections: [
          {
            name: "Provider Qualifications",
            items: [
              { id: "age_21", label: "Provider is at least 21 years of age", required: true },
              { id: "high_school", label: "High school diploma or equivalent", required: true },
              { id: "no_disqualifying_offenses", label: "No disqualifying criminal offenses", required: true },
              { id: "physical_mental_health", label: "Physical and mental health sufficient to care for individuals", required: true },
              { id: "completed_training", label: "Completed required AFL pre-service training", required: true }
            ]
          },
          {
            name: "Home Requirements",
            items: [
              { id: "adequate_space", label: "Adequate bedroom space for placed individuals", required: true },
              { id: "safety_features", label: "Safety features (smoke detectors, fire extinguisher, etc.)", required: true },
              { id: "clean_sanitary", label: "Home is clean and sanitary", required: true },
              { id: "accessible_bathroom", label: "Accessible bathroom facilities", required: true },
              { id: "secure_medications", label: "Ability to secure medications", required: true }
            ]
          },
          {
            name: "Training & Supervision",
            items: [
              { id: "first_aid_cpr", label: "Current First Aid/CPR certification", required: true },
              { id: "medication_admin", label: "Medication administration training (if applicable)", required: false },
              { id: "crisis_intervention", label: "Crisis intervention training", required: true },
              { id: "ongoing_training", label: "Plan for ongoing training (12 hours annually)", required: true }
            ]
          },
          {
            name: "LME/MCO Requirements",
            items: [
              { id: "lme_enrollment", label: "Enrolled with local LME/MCO", required: true },
              { id: "service_agreement", label: "Signed service agreement", required: true },
              { id: "rate_agreement", label: "Rate agreement in place", required: true },
              { id: "background_check_clearance", label: "Background check clearance letter", required: true }
            ]
          }
        ]
      },
      GROUP_HOME: {
        title: "Group Home Credentialing Checklist",
        reference: "10A NCAC 27G .1700 - .1800",
        sections: [
          {
            name: "Facility Licensing",
            items: [
              { id: "dhhs_license", label: "Valid NC DHHS facility license", required: true },
              { id: "capacity_compliance", label: "Operating within licensed capacity", required: true },
              { id: "zoning_compliance", label: "Zoning compliance documentation", required: true },
              { id: "fire_marshal_approval", label: "Fire Marshal approval", required: true }
            ]
          },
          {
            name: "Staffing Requirements",
            items: [
              { id: "qualified_administrator", label: "Qualified administrator on staff", required: true },
              { id: "staff_ratios", label: "Adequate staff-to-resident ratios", required: true },
              { id: "staff_background_checks", label: "Background checks for all staff", required: true },
              { id: "staff_training_records", label: "Training records for all staff", required: true }
            ]
          },
          {
            name: "Policies & Procedures",
            items: [
              { id: "admission_criteria", label: "Written admission and discharge criteria", required: true },
              { id: "grievance_procedure", label: "Grievance procedure in place", required: true },
              { id: "emergency_procedures", label: "Emergency procedures documented", required: true },
              { id: "medication_policies", label: "Medication management policies", required: true },
              { id: "incident_reporting", label: "Incident reporting procedures", required: true }
            ]
          },
          {
            name: "Quality & Compliance",
            items: [
              { id: "quality_improvement", label: "Quality improvement plan", required: false },
              { id: "rights_posted", label: "Client rights posted and accessible", required: true },
              { id: "record_keeping", label: "Proper record keeping systems", required: true }
            ]
          }
        ]
      },
      DEFAULT: {
        title: "General Provider Credentialing Checklist",
        reference: "NC DHHS Provider Requirements",
        sections: [
          {
            name: "Basic Requirements",
            items: [
              { id: "background_check", label: "Criminal background check completed", required: true },
              { id: "liability_insurance", label: "Liability insurance in place", required: true },
              { id: "business_registration", label: "Proper business registration", required: false }
            ]
          }
        ]
      }
    }
  }
  // Additional states can be added here following the same structure
  // Example:
  // SC: { name: "South Carolina", code: "SC", regulations: [...], requiredDocuments: {...}, checklists: {...} }
};

/**
 * Get credentials requirements for a specific state and org type
 */
export function getStateCredentials(stateCode) {
  return STATE_CREDENTIALS[stateCode] || null;
}

/**
 * Get required documents for an org type in a specific state
 */
export function getRequiredDocuments(stateCode, orgType) {
  const state = STATE_CREDENTIALS[stateCode];
  if (!state) return [];
  
  return state.requiredDocuments[orgType] || state.requiredDocuments.DEFAULT || [];
}

/**
 * Get credentialing checklist for an org type in a specific state
 */
export function getCredentialingChecklist(stateCode, orgType) {
  const state = STATE_CREDENTIALS[stateCode];
  if (!state) return null;
  
  return state.checklists[orgType] || state.checklists.DEFAULT || null;
}

/**
 * Get list of supported states
 */
export function getSupportedStates() {
  return Object.keys(STATE_CREDENTIALS).map(code => ({
    code,
    name: STATE_CREDENTIALS[code].name
  }));
}

/**
 * Check if a state is supported
 */
export function isStateSupported(stateCode) {
  return stateCode in STATE_CREDENTIALS;
}

export default STATE_CREDENTIALS;
