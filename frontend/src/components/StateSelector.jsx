import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Check, ArrowRight } from "lucide-react";
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
          className="pl-12 h-14 text-lg border-2 border-slate-200 focus:border-gold rounded-xl"
          data-testid="state-search-input"
        />
      </div>

      {/* States Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" data-testid="states-grid">
        {filteredStates.map((state, index) => (
          <button
            key={state.code}
            onClick={() => handleStateClick(state.code)}
            className={`
              relative p-4 rounded-xl border-2 text-left transition-all duration-200
              card-hover focus-ring animate-fade-in
              ${
                state.is_fully_populated
                  ? "border-gold bg-gold-light hover:border-gold"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }
            `}
            style={{ animationDelay: `${index * 20}ms` }}
            data-testid={`state-card-${state.code}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="block font-bold text-navy text-lg">{state.code}</span>
                <span className="block text-sm text-slate-600 mt-1">{state.name}</span>
              </div>
              {state.is_fully_populated && (
                <Badge className="bg-gold text-white text-xs px-2 py-0.5">
                  <Check className="w-3 h-3 mr-1" />
                  Ready
                </Badge>
              )}
            </div>
            <ArrowRight className="absolute bottom-3 right-3 w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
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
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gold-light border-2 border-gold"></div>
          <span>Full Guide Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white border-2 border-slate-200"></div>
          <span>Basic Info (Expanding Soon)</span>
        </div>
      </div>
    </div>
  );
};

export default StateSelector;
