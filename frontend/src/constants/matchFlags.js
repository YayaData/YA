export const MATCH_FLAGS = {
  SUPERVISION_REQUIRED: "SUPERVISION_REQUIRED",
  NO_SEX_OFFENDER: "NO_SEX_OFFENDER",
  MEDICAL_SUPPORT_NEEDED: "MEDICAL_SUPPORT_NEEDED",
  BEHAVIORAL_HEALTH_SUPPORT: "BEHAVIORAL_HEALTH_SUPPORT",
  VA_ELIGIBLE: "VA_ELIGIBLE",
  IMMEDIATE_PLACEMENT: "IMMEDIATE_PLACEMENT",
};

export const MATCH_FLAG_LABELS = {
  SUPERVISION_REQUIRED: "Supervision Required",
  NO_SEX_OFFENDER: "No Sex Offender History",
  MEDICAL_SUPPORT_NEEDED: "Medical Support Needed",
  BEHAVIORAL_HEALTH_SUPPORT: "Behavioral Health Support",
  VA_ELIGIBLE: "VA Eligible",
  IMMEDIATE_PLACEMENT: "Immediate Placement Needed",
};

export const MATCH_FLAG_DESCRIPTIONS = {
  SUPERVISION_REQUIRED: "Client requires supervision (probation/parole)",
  NO_SEX_OFFENDER: "Placement cannot accept individuals with sex offense history",
  MEDICAL_SUPPORT_NEEDED: "Client requires medical support or monitoring",
  BEHAVIORAL_HEALTH_SUPPORT: "Client requires behavioral health support",
  VA_ELIGIBLE: "Client is eligible for VA benefits",
  IMMEDIATE_PLACEMENT: "Placement needed within 48 hours",
};

// Provider acceptance flags - what they can accommodate
export const PROVIDER_ACCEPTANCE_FLAGS = {
  ACCEPTS_SUPERVISION: "ACCEPTS_SUPERVISION",
  ACCEPTS_SEX_OFFENDERS: "ACCEPTS_SEX_OFFENDERS",
  PROVIDES_MEDICAL_SUPPORT: "PROVIDES_MEDICAL_SUPPORT",
  PROVIDES_BEHAVIORAL_SUPPORT: "PROVIDES_BEHAVIORAL_SUPPORT",
  VA_CONTRACTED: "VA_CONTRACTED",
  IMMEDIATE_AVAILABILITY: "IMMEDIATE_AVAILABILITY",
};

// Match a request's flags against provider's acceptance flags
export function checkMatchCompatibility(requestFlags = [], providerFlags = []) {
  const incompatibilities = [];

  if (requestFlags.includes(MATCH_FLAGS.SUPERVISION_REQUIRED) && 
      !providerFlags.includes(PROVIDER_ACCEPTANCE_FLAGS.ACCEPTS_SUPERVISION)) {
    incompatibilities.push("Provider does not accept supervised individuals");
  }

  if (requestFlags.includes(MATCH_FLAGS.MEDICAL_SUPPORT_NEEDED) && 
      !providerFlags.includes(PROVIDER_ACCEPTANCE_FLAGS.PROVIDES_MEDICAL_SUPPORT)) {
    incompatibilities.push("Provider does not offer medical support");
  }

  if (requestFlags.includes(MATCH_FLAGS.BEHAVIORAL_HEALTH_SUPPORT) && 
      !providerFlags.includes(PROVIDER_ACCEPTANCE_FLAGS.PROVIDES_BEHAVIORAL_SUPPORT)) {
    incompatibilities.push("Provider does not offer behavioral health support");
  }

  if (requestFlags.includes(MATCH_FLAGS.VA_ELIGIBLE) && 
      !providerFlags.includes(PROVIDER_ACCEPTANCE_FLAGS.VA_CONTRACTED)) {
    incompatibilities.push("Provider is not VA contracted");
  }

  if (requestFlags.includes(MATCH_FLAGS.IMMEDIATE_PLACEMENT) && 
      !providerFlags.includes(PROVIDER_ACCEPTANCE_FLAGS.IMMEDIATE_AVAILABILITY)) {
    incompatibilities.push("Provider does not have immediate availability");
  }

  return {
    isCompatible: incompatibilities.length === 0,
    incompatibilities
  };
}
