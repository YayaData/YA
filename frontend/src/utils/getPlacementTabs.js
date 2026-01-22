import { ORG_CAPABILITIES } from "../constants/organizationCapabilities";

/**
 * Get placement tab visibility based on organization type capabilities
 * @param {string} orgType - Organization type (e.g., "AFL_PROVIDER", "HOSPITAL_DISCHARGE_PLANNER")
 * @returns {Object} - Object with showNeedPlacement and showPlacementAvailable flags
 */
export function getPlacementTabs(orgType) {
  const caps = ORG_CAPABILITIES[orgType] || [];

  return {
    showNeedPlacement: caps.includes("REQUEST_PLACEMENT"),
    showPlacementAvailable: caps.includes("PROVIDE_PLACEMENT"),
  };
}

/**
 * Check if organization can see both tabs (dual-role)
 * @param {string} orgType - Organization type
 * @returns {boolean} - True if org has both capabilities
 */
export function isDualRole(orgType) {
  const tabs = getPlacementTabs(orgType);
  return tabs.showNeedPlacement && tabs.showPlacementAvailable;
}

/**
 * Get the primary action for an organization type
 * @param {string} orgType - Organization type
 * @returns {string} - "request" | "provide" | "both" | "none"
 */
export function getPrimaryAction(orgType) {
  const tabs = getPlacementTabs(orgType);
  
  if (tabs.showNeedPlacement && tabs.showPlacementAvailable) {
    return "both";
  }
  if (tabs.showNeedPlacement) {
    return "request";
  }
  if (tabs.showPlacementAvailable) {
    return "provide";
  }
  return "none";
}

export default getPlacementTabs;
