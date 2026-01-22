import { useState } from "react";
import { getPlacementTabs } from "../utils/getPlacementTabs";

export default function PlacementTabs({ orgType }) {
  const { showNeedPlacement, showPlacementAvailable } =
    getPlacementTabs(orgType);

  const [activeTab, setActiveTab] = useState(
    showNeedPlacement ? "NEED" : "AVAILABLE"
  );

  return (
    <div>
      {/* TAB BUTTONS */}
      <div className="flex gap-2 mb-4">
        {showNeedPlacement && (
          <button
            onClick={() => setActiveTab("NEED")}
            className={`px-4 py-2 rounded ${
              activeTab === "NEED"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            Need Placement
          </button>
        )}

        {showPlacementAvailable && (
          <button
            onClick={() => setActiveTab("AVAILABLE")}
            className={`px-4 py-2 rounded ${
              activeTab === "AVAILABLE"
                ? "bg-green-600 text-white"
                : "bg-gray-200"
            }`}
          >
            Placement Available
          </button>
        )}
      </div>

      {/* TAB CONTENT */}
      {activeTab === "NEED" && showNeedPlacement && (
        <div>
          {/* Request Placement UI */}
          <p className="text-gray-600">
            Submit and track placement requests.
          </p>
        </div>
      )}

      {activeTab === "AVAILABLE" && showPlacementAvailable && (
        <div>
          {/* Provide Placement UI */}
          <p className="text-gray-600">
            Manage available housing placements.
          </p>
        </div>
      )}
    </div>
  );
}
