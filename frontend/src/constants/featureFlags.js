/**
 * Feature Flags Configuration
 * Toggle features on/off across the application
 */

export const FEATURE_FLAGS = {
  // County-specific filtering and views
  COUNTY_MODE: false,
  
  // Read-only audit trail for compliance
  READ_ONLY_AUDIT: false,
  
  // Enable report export functionality
  EXPORT_REPORTS: false,
};

/**
 * Check if a feature is enabled
 * @param {string} flagName - Name of the feature flag
 * @returns {boolean} - Whether the feature is enabled
 */
export function isFeatureEnabled(flagName) {
  return FEATURE_FLAGS[flagName] === true;
}

/**
 * Get all enabled features
 * @returns {string[]} - Array of enabled feature names
 */
export function getEnabledFeatures() {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name);
}

export default FEATURE_FLAGS;
