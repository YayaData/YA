import { MATCH_FLAGS } from "../constants/matchFlags";

export function generateMatchFlags(request) {
  const flags = [];

  if (request.supervisionLevel && request.supervisionLevel !== "NONE") {
    flags.push(MATCH_FLAGS.SUPERVISION_REQUIRED);
  }

  if (request.offenseRestrictions) {
    flags.push(MATCH_FLAGS.NO_SEX_OFFENDER);
  }

  if (request.medicalNeeds) {
    flags.push(MATCH_FLAGS.MEDICAL_SUPPORT_NEEDED);
  }

  if (request.behavioralHealthNeeds) {
    flags.push(MATCH_FLAGS.BEHAVIORAL_HEALTH_SUPPORT);
  }

  if (request.vaEligible) {
    flags.push(MATCH_FLAGS.VA_ELIGIBLE);
  }

  if (request.urgencyLevel === "IMMEDIATE") {
    flags.push(MATCH_FLAGS.IMMEDIATE_PLACEMENT);
  }

  return flags;
}

// Get human-readable summary of match flags
export function getMatchFlagsSummary(flags) {
  const summaries = {
    [MATCH_FLAGS.SUPERVISION_REQUIRED]: "Requires supervision",
    [MATCH_FLAGS.NO_SEX_OFFENDER]: "Sex offender restrictions",
    [MATCH_FLAGS.MEDICAL_SUPPORT_NEEDED]: "Needs medical support",
    [MATCH_FLAGS.BEHAVIORAL_HEALTH_SUPPORT]: "Needs behavioral health support",
    [MATCH_FLAGS.VA_ELIGIBLE]: "VA eligible",
    [MATCH_FLAGS.IMMEDIATE_PLACEMENT]: "Urgent placement",
  };

  return flags.map(flag => summaries[flag] || flag);
}

// Check if request has any special requirements
export function hasSpecialRequirements(request) {
  const flags = generateMatchFlags(request);
  return flags.length > 0;
}

// Get priority level based on flags
export function getRequestPriority(request) {
  const flags = generateMatchFlags(request);
  
  if (flags.includes(MATCH_FLAGS.IMMEDIATE_PLACEMENT)) {
    return { level: "URGENT", label: "Urgent", color: "#dc2626" };
  }
  
  if (flags.includes(MATCH_FLAGS.MEDICAL_SUPPORT_NEEDED) || 
      flags.includes(MATCH_FLAGS.BEHAVIORAL_HEALTH_SUPPORT)) {
    return { level: "HIGH", label: "High Priority", color: "#f59e0b" };
  }
  
  if (flags.length > 0) {
    return { level: "MEDIUM", label: "Medium Priority", color: "#3b82f6" };
  }
  
  return { level: "NORMAL", label: "Normal", color: "#6b7280" };
}
