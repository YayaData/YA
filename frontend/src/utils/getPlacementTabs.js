import { ORG_CAPABILITIES } from "../constants/organizationCapabilities";

export function getPlacementTabs(orgType) {
  const caps = ORG_CAPABILITIES[orgType] || [];

  return {
    showNeedPlacement: caps.includes("REQUEST_PLACEMENT"),
    showPlacementAvailable: caps.includes("PROVIDE_PLACEMENT"),
  };
}
