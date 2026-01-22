import { MATCH_FLAGS, PROVIDER_ACCEPTANCE_FLAGS } from "../constants/matchFlags";

/**
 * Check if a provider can accommodate a request based on match flags
 * @param {Object} provider - Provider object with acceptedFlags array
 * @param {Array} requestFlags - Array of MATCH_FLAGS from the request
 * @returns {boolean} - True if provider can accommodate all request requirements
 */
export function isCompatibleMatch(provider, requestFlags = []) {
  // If no request flags, any provider is compatible
  if (!requestFlags || requestFlags.length === 0) {
    return true;
  }

  // If provider has no accepted flags set, assume they accept everything
  if (!provider?.acceptedFlags || provider.acceptedFlags.length === 0) {
    return true;
  }

  const providerFlags = provider.acceptedFlags;

  // Check each request flag against provider capabilities
  for (const flag of requestFlags) {
    switch (flag) {
      case MATCH_FLAGS.SUPERVISION_REQUIRED:
        if (!providerFlags.includes(MATCH_FLAGS.SUPERVISION_REQUIRED) &&
            !providerFlags.includes(PROVIDER_ACCEPTANCE_FLAGS.ACCEPTS_SUPERVISION)) {
          return false;
        }
        break;

      case MATCH_FLAGS.NO_SEX_OFFENDER:
        // Provider must explicitly accept sex offenders OR not have any restriction
        if (providerFlags.includes(MATCH_FLAGS.NO_SEX_OFFENDER)) {
          return false; // Provider has same restriction, incompatible
        }
        break;

      case MATCH_FLAGS.MEDICAL_SUPPORT_NEEDED:
        if (!providerFlags.includes(MATCH_FLAGS.MEDICAL_SUPPORT_NEEDED) &&
            !providerFlags.includes(PROVIDER_ACCEPTANCE_FLAGS.PROVIDES_MEDICAL_SUPPORT)) {
          return false;
        }
        break;

      case MATCH_FLAGS.BEHAVIORAL_HEALTH_SUPPORT:
        if (!providerFlags.includes(MATCH_FLAGS.BEHAVIORAL_HEALTH_SUPPORT) &&
            !providerFlags.includes(PROVIDER_ACCEPTANCE_FLAGS.PROVIDES_BEHAVIORAL_SUPPORT)) {
          return false;
        }
        break;

      case MATCH_FLAGS.VA_ELIGIBLE:
        if (!providerFlags.includes(MATCH_FLAGS.VA_ELIGIBLE) &&
            !providerFlags.includes(PROVIDER_ACCEPTANCE_FLAGS.VA_CONTRACTED)) {
          return false;
        }
        break;

      case MATCH_FLAGS.IMMEDIATE_PLACEMENT:
        if (!providerFlags.includes(MATCH_FLAGS.IMMEDIATE_PLACEMENT) &&
            !providerFlags.includes(PROVIDER_ACCEPTANCE_FLAGS.IMMEDIATE_AVAILABILITY)) {
          return false;
        }
        break;

      default:
        // Unknown flag - check if provider has it
        if (!providerFlags.includes(flag)) {
          return false;
        }
    }
  }

  return true;
}

/**
 * Get compatibility details between provider and request
 * @param {Object} provider - Provider object with acceptedFlags array
 * @param {Array} requestFlags - Array of MATCH_FLAGS from the request
 * @returns {Object} - Compatibility details with isCompatible flag and reasons
 */
export function getCompatibilityDetails(provider, requestFlags = []) {
  const incompatibilities = [];
  const matches = [];

  if (!requestFlags || requestFlags.length === 0) {
    return { isCompatible: true, incompatibilities: [], matches: [] };
  }

  const providerFlags = provider?.acceptedFlags || [];

  for (const flag of requestFlags) {
    const flagLabel = flag.replace(/_/g, " ").toLowerCase();

    switch (flag) {
      case MATCH_FLAGS.SUPERVISION_REQUIRED:
        if (providerFlags.includes(MATCH_FLAGS.SUPERVISION_REQUIRED) ||
            providerFlags.includes(PROVIDER_ACCEPTANCE_FLAGS.ACCEPTS_SUPERVISION)) {
          matches.push(`Accepts supervised individuals`);
        } else {
          incompatibilities.push(`Does not accept supervised individuals`);
        }
        break;

      case MATCH_FLAGS.MEDICAL_SUPPORT_NEEDED:
        if (providerFlags.includes(MATCH_FLAGS.MEDICAL_SUPPORT_NEEDED) ||
            providerFlags.includes(PROVIDER_ACCEPTANCE_FLAGS.PROVIDES_MEDICAL_SUPPORT)) {
          matches.push(`Provides medical support`);
        } else {
          incompatibilities.push(`Does not provide medical support`);
        }
        break;

      case MATCH_FLAGS.BEHAVIORAL_HEALTH_SUPPORT:
        if (providerFlags.includes(MATCH_FLAGS.BEHAVIORAL_HEALTH_SUPPORT) ||
            providerFlags.includes(PROVIDER_ACCEPTANCE_FLAGS.PROVIDES_BEHAVIORAL_SUPPORT)) {
          matches.push(`Provides behavioral health support`);
        } else {
          incompatibilities.push(`Does not provide behavioral health support`);
        }
        break;

      case MATCH_FLAGS.VA_ELIGIBLE:
        if (providerFlags.includes(MATCH_FLAGS.VA_ELIGIBLE) ||
            providerFlags.includes(PROVIDER_ACCEPTANCE_FLAGS.VA_CONTRACTED)) {
          matches.push(`VA contracted`);
        } else {
          incompatibilities.push(`Not VA contracted`);
        }
        break;

      case MATCH_FLAGS.IMMEDIATE_PLACEMENT:
        if (providerFlags.includes(MATCH_FLAGS.IMMEDIATE_PLACEMENT) ||
            providerFlags.includes(PROVIDER_ACCEPTANCE_FLAGS.IMMEDIATE_AVAILABILITY)) {
          matches.push(`Has immediate availability`);
        } else {
          incompatibilities.push(`No immediate availability`);
        }
        break;

      default:
        if (providerFlags.includes(flag)) {
          matches.push(`Supports ${flagLabel}`);
        } else {
          incompatibilities.push(`Does not support ${flagLabel}`);
        }
    }
  }

  return {
    isCompatible: incompatibilities.length === 0,
    incompatibilities,
    matches
  };
}

/**
 * Filter requests to show only compatible ones for a provider
 * @param {Array} requests - Array of placement requests
 * @param {Object} provider - Provider object with acceptedFlags
 * @returns {Array} - Filtered array of compatible requests
 */
export function filterCompatibleRequests(requests, provider) {
  if (!requests || !Array.isArray(requests)) {
    return [];
  }

  return requests.filter(request => 
    isCompatibleMatch(provider, request.matchFlags || [])
  );
}

export default isCompatibleMatch;
