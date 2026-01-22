export const USER_ROLES = {
  ADMIN: "ADMIN",
  PROVIDER: "PROVIDER",
  REQUESTOR: "REQUESTOR",
};

export const USER_ROLE_LABELS = {
  ADMIN: "Administrator",
  PROVIDER: "Housing Provider",
  REQUESTOR: "Placement Requestor",
};

export const USER_ROLE_DESCRIPTIONS = {
  ADMIN: "Full access to manage placements, users, and system settings",
  PROVIDER: "Can list available space and respond to placement requests",
  REQUESTOR: "Can submit and track placement requests",
};

// Permissions by role
export const ROLE_PERMISSIONS = {
  ADMIN: [
    "view_all_placements",
    "edit_all_placements",
    "delete_placements",
    "view_all_requests",
    "approve_requests",
    "manage_users",
    "view_analytics",
    "system_settings",
  ],
  PROVIDER: [
    "view_own_placements",
    "create_placement",
    "edit_own_placements",
    "view_incoming_requests",
    "respond_to_requests",
    "view_own_analytics",
  ],
  REQUESTOR: [
    "view_available_placements",
    "create_request",
    "view_own_requests",
    "cancel_own_requests",
  ],
};

// Check if user has permission
export function hasPermission(userRole, permission) {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

// Get role from organization type
export function getRoleFromOrgType(orgType, capabilities) {
  if (!capabilities || capabilities.length === 0) {
    return USER_ROLES.REQUESTOR;
  }
  
  if (capabilities.includes("PROVIDE_PLACEMENT")) {
    return USER_ROLES.PROVIDER;
  }
  
  return USER_ROLES.REQUESTOR;
}
