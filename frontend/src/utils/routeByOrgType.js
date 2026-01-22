import { ORG_CAPABILITIES } from "../constants/organizationCapabilities";
import { USER_ROLES } from "../constants/userRoles";

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

export function getDashboardRoute(orgType) {
  const caps = ORG_CAPABILITIES[orgType] || [];

  if (caps.includes("PROVIDE_PLACEMENT")) {
    return "/provider-dashboard";
  }

  if (caps.includes("REQUEST_PLACEMENT")) {
    return "/requestor-dashboard";
  }

  return "/dashboard";
}

export function canProvidePlacement(orgType) {
  const capabilities = ORG_CAPABILITIES[orgType] || [];
  return capabilities.includes("PROVIDE_PLACEMENT");
}

export function canRequestPlacement(orgType) {
  const capabilities = ORG_CAPABILITIES[orgType] || [];
  return capabilities.includes("REQUEST_PLACEMENT");
}

// Admin route protection
export function requireAdmin(user, navigate) {
  if (!user || user.role !== USER_ROLES.ADMIN) {
    navigate("/");
    return false;
  }
  return true;
}

// Provider route protection
export function requireProvider(user, navigate) {
  if (!user || user.role !== USER_ROLES.PROVIDER) {
    navigate("/");
    return false;
  }
  return true;
}

// Requestor route protection
export function requireRequestor(user, navigate) {
  if (!user || user.role !== USER_ROLES.REQUESTOR) {
    navigate("/");
    return false;
  }
  return true;
}

// Check if user is authenticated
export function requireAuth(user, navigate) {
  if (!user) {
    navigate("/onboarding");
    return false;
  }
  return true;
}
