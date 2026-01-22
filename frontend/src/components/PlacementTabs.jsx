import { useState } from "react";
import { getPlacementTabs } from "../utils/getPlacementTabs";

const colors = {
  blue: "#1F4FD8",
  teal: "#1CB5A3",
  gold: "#F4B400",
  dark: "#1F2937"
};

export default function PlacementTabs({ orgType, children }) {
  const { showNeedPlacement, showPlacementAvailable } =
    getPlacementTabs(orgType);

  const [activeTab, setActiveTab] = useState(
    showNeedPlacement ? "NEED" : "AVAILABLE"
  );

  // If only one tab is available, don't show tab buttons
  const showTabButtons = showNeedPlacement && showPlacementAvailable;

  return (
    <div>
      {/* TAB BUTTONS */}
      {showTabButtons && (
        <div className="flex gap-2 mb-6">
          {showNeedPlacement && (
            <button
              onClick={() => setActiveTab("NEED")}
              data-testid="tab-need-placement"
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === "NEED"
                  ? "text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={activeTab === "NEED" ? { background: colors.teal } : {}}
            >
              Need Placement
            </button>
          )}

          {showPlacementAvailable && (
            <button
              onClick={() => setActiveTab("AVAILABLE")}
              data-testid="tab-placement-available"
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === "AVAILABLE"
                  ? "text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={activeTab === "AVAILABLE" ? { background: colors.blue } : {}}
            >
              Placement Available
            </button>
          )}
        </div>
      )}

      {/* TAB CONTENT */}
      {activeTab === "NEED" && showNeedPlacement && (
        <div data-testid="tab-content-need">
          {children?.need || (
            <p className="text-gray-600">
              Submit and track placement requests.
            </p>
          )}
        </div>
      )}

      {activeTab === "AVAILABLE" && showPlacementAvailable && (
        <div data-testid="tab-content-available">
          {children?.available || (
            <p className="text-gray-600">
              Manage available housing placements.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Export the active tab getter for external use
export function useActiveTab(orgType) {
  const { showNeedPlacement } = getPlacementTabs(orgType);
  return showNeedPlacement ? "NEED" : "AVAILABLE";
}
