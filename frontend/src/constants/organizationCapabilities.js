export const ORGANIZATION_TYPES = [
  "AFL_PROVIDER",
  "INDEPENDENT_HOME_PROVIDER",
  "GROUP_HOME",
  "TRANSITIONAL_HOUSING",
  "RESPITE_PROVIDER",
  "VETERANS_TRANSITIONAL",

  "HOMELESS_SHELTER",
  "DOMESTIC_VIOLENCE_SHELTER",
  "VETERANS_SHELTER",
  "REENTRY_PROGRAM",
  "PRISON_REENTRY",
  "HALFWAY_HOUSE",
  "PROBATION_PAROLE",

  "BEHAVIORAL_HEALTH_AGENCY",
  "CASE_MANAGEMENT_AGENCY",
  "HOSPITAL_DISCHARGE_PLANNER",
  "NONPROFIT_ORGANIZATION",
  "FAITH_BASED_ORG",

  "VETERAN_SELF",
  "FAMILY_MEMBER",
  "SELF_REFERRAL"
];

export const ORG_CAPABILITIES = {
  AFL_PROVIDER: ["PROVIDE_PLACEMENT"],
  INDEPENDENT_HOME_PROVIDER: ["PROVIDE_PLACEMENT"],
  GROUP_HOME: ["PROVIDE_PLACEMENT"],
  TRANSITIONAL_HOUSING: ["PROVIDE_PLACEMENT"],
  RESPITE_PROVIDER: ["PROVIDE_PLACEMENT"],
  VETERANS_TRANSITIONAL: ["REQUEST_PLACEMENT", "PROVIDE_PLACEMENT"],

  HOMELESS_SHELTER: ["REQUEST_PLACEMENT"],
  DOMESTIC_VIOLENCE_SHELTER: ["REQUEST_PLACEMENT"],
  VETERANS_SHELTER: ["REQUEST_PLACEMENT"],
  REENTRY_PROGRAM: ["REQUEST_PLACEMENT"],
  PRISON_REENTRY: ["REQUEST_PLACEMENT"],
  HALFWAY_HOUSE: ["REQUEST_PLACEMENT"],
  PROBATION_PAROLE: ["REQUEST_PLACEMENT"],

  BEHAVIORAL_HEALTH_AGENCY: ["REQUEST_PLACEMENT"],
  CASE_MANAGEMENT_AGENCY: ["REQUEST_PLACEMENT"],
  HOSPITAL_DISCHARGE_PLANNER: ["REQUEST_PLACEMENT"],

  NONPROFIT_ORGANIZATION: ["REQUEST_PLACEMENT"],
  FAITH_BASED_ORG: ["REQUEST_PLACEMENT"],

  VETERAN_SELF: ["REQUEST_PLACEMENT"],
  FAMILY_MEMBER: ["REQUEST_PLACEMENT"],
  SELF_REFERRAL: ["REQUEST_PLACEMENT"]
};

// Organization type labels for display
export const ORG_TYPE_LABELS = {
  AFL_PROVIDER: "AFL Provider (Alternative Family Living)",
  INDEPENDENT_HOME_PROVIDER: "Independent Home Provider",
  GROUP_HOME: "Group Home",
  TRANSITIONAL_HOUSING: "Transitional Housing",
  RESPITE_PROVIDER: "Respite Provider",

  HOMELESS_SHELTER: "Homeless Shelter",
  DOMESTIC_VIOLENCE_SHELTER: "Domestic Violence Shelter",
  VETERANS_SHELTER: "Veterans Shelter",
  REENTRY_PROGRAM: "Reentry Program",
  PRISON_REENTRY: "Prison Reentry",
  HALFWAY_HOUSE: "Halfway House",
  PROBATION_PAROLE: "Probation / Parole Services",

  BEHAVIORAL_HEALTH_AGENCY: "Behavioral Health Agency",
  CASE_MANAGEMENT_AGENCY: "Case Management Agency",
  HOSPITAL_DISCHARGE_PLANNER: "Hospital Discharge Planner",
  NONPROFIT_ORGANIZATION: "Nonprofit Organization",
  FAITH_BASED_ORG: "Faith-Based Organization",

  VETERAN_SELF: "Veteran (Self)",
  FAMILY_MEMBER: "Family Member",
  SELF_REFERRAL: "Self-Referral"
};

// Grouped organization types for UI display
export const ORG_TYPE_GROUPS = {
  providers: {
    label: "Housing & Care Providers",
    description: "I have space available for placements",
    options: [
      "AFL_PROVIDER",
      "INDEPENDENT_HOME_PROVIDER",
      "GROUP_HOME",
      "TRANSITIONAL_HOUSING",
      "RESPITE_PROVIDER"
    ]
  },
  shelters: {
    label: "Shelters & Reentry Programs",
    description: "I need to place clients in housing",
    options: [
      "HOMELESS_SHELTER",
      "DOMESTIC_VIOLENCE_SHELTER",
      "VETERANS_SHELTER",
      "REENTRY_PROGRAM",
      "PRISON_REENTRY",
      "HALFWAY_HOUSE",
      "PROBATION_PAROLE"
    ]
  },
  agencies: {
    label: "Agencies & Organizations",
    description: "I coordinate placements for clients",
    options: [
      "BEHAVIORAL_HEALTH_AGENCY",
      "CASE_MANAGEMENT_AGENCY",
      "HOSPITAL_DISCHARGE_PLANNER",
      "NONPROFIT_ORGANIZATION",
      "FAITH_BASED_ORG"
    ]
  },
  individuals: {
    label: "Individuals & Families",
    description: "I'm seeking placement for myself or a family member",
    options: [
      "VETERAN_SELF",
      "FAMILY_MEMBER",
      "SELF_REFERRAL"
    ]
  }
};
