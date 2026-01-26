import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Check, ArrowRight, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StateSelector = () => {
  const [states, setStates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const response = await axios.get(`${API}/states`);
      setStates(response.data.states);
    } catch (error) {
      console.error("Error fetching states:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStates = states.filter(
    (state) =>
      state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      state.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStateClick = (stateCode) => {
    navigate(`/state/${stateCode}`);
  };

  // Get styling and badge for state tier
  const getTierStyles = (state) => {
    if (state.tier === "full_guidance") {
      return {
        borderClass: "border-gold bg-[hsl(262,50%,96%)]",
        badge: <Badge className="bg-gold text-white text-xs px-2 py-0.5"><Check className="w-3 h-3 mr-1" />Full Guide</Badge>
      };
    } else if (state.tier === "core_setup") {
      return {
        borderClass: "border-violet-300 bg-violet-50",
        badge: <Badge className="bg-violet-100 text-violet-700 border border-violet-200 text-xs px-2 py-0.5"><Clock className="w-3 h-3 mr-1" />Coming Soon</Badge>
      };
    } else {
      return {
        borderClass: "border-[hsl(40,15%,88%)] bg-[hsl(40,15%,99%)]",
        badge: null
      };
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse" data-testid="state-selector-loading">
        <div className="h-12 bg-slate-200 rounded-lg mb-6"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div data-testid="state-selector">
      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          type="text"
          placeholder="Search for your state..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-14 text-lg border-2 border-[hsl(40,15%,88%)] focus:border-gold rounded-xl bg-white"
          data-testid="state-search-input"
        />
      </div>

      {/* States Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" data-testid="states-grid">
        {filteredStates.map((state, index) => {
          const { borderClass, badge } = getTierStyles(state);
          return (
            <button
              key={state.code}
              onClick={() => handleStateClick(state.code)}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all duration-200
                card-hover focus-ring animate-fade-in hover:shadow-md
                ${borderClass}
              `}
              style={{ animationDelay: `${index * 20}ms` }}
              data-testid={`state-card-${state.code}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="block font-bold text-navy text-lg">{state.code}</span>
                  <span className="block text-sm text-slate-600 mt-1">{state.name}</span>
                </div>
                {badge}
              </div>
              <ArrowRight className="absolute bottom-3 right-3 w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>

      {filteredStates.length === 0 && (
        <div className="text-center py-12" data-testid="no-states-found">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No states found matching "{searchQuery}"</p>
          <Button
            variant="link"
            onClick={() => setSearchQuery("")}
            className="text-gold mt-2"
            data-testid="clear-search-button"
          >
            Clear search
          </Button>
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[hsl(262,50%,96%)] border-2 border-gold"></div>
          <span>Full Guidance Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-violet-50 border-2 border-violet-300"></div>
          <span>Core Setup (Addendum Soon)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[hsl(40,15%,99%)] border-2 border-[hsl(40,15%,88%)]"></div>
          <span>Planning Tools Only</span>
        </div>
      </div>
    </div>
  );
};

export default StateSelector;
