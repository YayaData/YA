export const BASE_PLACEMENT_FIELDS = {
  preferredLocation: "",
  notes: "",
  fundingSource: "",
};

export const PRISON_REENTRY_FIELDS = {
  releaseDate: "",
  supervisionLevel: "", // NONE | PROBATION | PAROLE
  offenseRestrictions: false,
};

export const SHELTER_FIELDS = {
  urgencyLevel: "", // IMMEDIATE | 30_DAYS | FLEXIBLE
  householdSize: "",
};

export const VETERAN_FIELDS = {
  vaEligible: false,
  vaCaseManager: "",
};

export const ORG_PLACEMENT_SCHEMAS = {
  PRISON_REENTRY: {
    ...BASE_PLACEMENT_FIELDS,
    ...PRISON_REENTRY_FIELDS,
  },
  REENTRY_PROGRAM: {
    ...BASE_PLACEMENT_FIELDS,
    ...PRISON_REENTRY_FIELDS,
  },
  HOMELESS_SHELTER: {
    ...BASE_PLACEMENT_FIELDS,
    ...SHELTER_FIELDS,
  },
  DOMESTIC_VIOLENCE_SHELTER: {
    ...BASE_PLACEMENT_FIELDS,
    ...SHELTER_FIELDS,
  },
  VETERANS_SHELTER: {
    ...BASE_PLACEMENT_FIELDS,
    ...VETERAN_FIELDS,
  },
  VETERAN_SELF: {
    ...BASE_PLACEMENT_FIELDS,
    ...VETERAN_FIELDS,
  },
  DEFAULT: BASE_PLACEMENT_FIELDS,
};

// Field labels for display
export const FIELD_LABELS = {
  preferredLocation: "Preferred Location",
  notes: "Additional Notes",
  fundingSource: "Funding Source",
  releaseDate: "Release Date",
  supervisionLevel: "Supervision Level",
  offenseRestrictions: "Has Offense Restrictions",
  urgencyLevel: "Urgency Level",
  householdSize: "Household Size",
  vaEligible: "VA Eligible",
  vaCaseManager: "VA Case Manager",
};

// Options for select fields
export const FIELD_OPTIONS = {
  supervisionLevel: [
    { value: "NONE", label: "None" },
    { value: "PROBATION", label: "Probation" },
    { value: "PAROLE", label: "Parole" },
  ],
  urgencyLevel: [
    { value: "IMMEDIATE", label: "Immediate (Within 48 hours)" },
    { value: "30_DAYS", label: "Within 30 Days" },
    { value: "FLEXIBLE", label: "Flexible Timeline" },
  ],
  fundingSource: [
    { value: "MEDICAID", label: "Medicaid" },
    { value: "PRIVATE_PAY", label: "Private Pay" },
    { value: "VA_BENEFITS", label: "VA Benefits" },
    { value: "GRANT", label: "Grant Funded" },
    { value: "OTHER", label: "Other" },
  ],
};

// Get schema for organization type
export function getPlacementSchema(orgType) {
  return ORG_PLACEMENT_SCHEMAS[orgType] || ORG_PLACEMENT_SCHEMAS.DEFAULT;
}
