import { MATCH_FLAGS } from "../constants/matchFlags";

export default function ProviderPreferences({ preferences, setPreferences }) {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold">Placement Preferences</h2>
      <p className="text-sm text-gray-600">
        Select the types of placements you can accept.
      </p>

      {Object.values(MATCH_FLAGS).map(flag => (
        <label key={flag} className="block mt-2">
          <input
            type="checkbox"
            checked={preferences.includes(flag)}
            onChange={() =>
              setPreferences(prev =>
                prev.includes(flag)
                  ? prev.filter(f => f !== flag)
                  : [...prev, flag]
              )
            }
          />
          <span className="ml-2">{flag.replace(/_/g, " ")}</span>
        </label>
      ))}
    </div>
  );
}
