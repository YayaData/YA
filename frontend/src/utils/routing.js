import { ORG_CAPABILITIES } from "../constants/organizationCapabilities";

export function routeByOrgType(orgType, navigate) {
  const capabilities = ORG_CAPABILITIES[orgType] || [];

  if (capabilities.includes("PROVIDE_PLACEMENT")) {
    navigate("/placements");
    return;
  }

  if (capabilities.includes("REQUEST_PLACEMENT")) {
    navigate("/place-client");
    return;
  }

  // fallback
  navigate("/");
}

export function canProvidePlacement(orgType) {
  const capabilities = ORG_CAPABILITIES[orgType] || [];
  return capabilities.includes("PROVIDE_PLACEMENT");
}

export function canRequestPlacement(orgType) {
  const capabilities = ORG_CAPABILITIES[orgType] || [];
  return capabilities.includes("REQUEST_PLACEMENT");
}
