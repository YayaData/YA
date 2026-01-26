import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import USMap from "@/components/USMap";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HomePage = () => {
  const [states, setStates] = useState([]);
  const [stateTiers, setStateTiers] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const response = await axios.get(`${API}/states`);
      const statesData = response.data.states;
      setStates(statesData);
      
      // Build tier map for the USMap component
      const tiers = {};
      statesData.forEach(state => {
        tiers[state.code] = state.tier;
      });
      setStateTiers(tiers);
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

  return (
    <div className="min-h-screen bg-[hsl(40,20%,98%)] text-slate-900" data-testid="home-page">
      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="bg-[hsl(40,15%,99%)] rounded-2xl p-8 md:p-12 shadow-sm border border-[hsl(40,15%,92%)]">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-navy mb-6 leading-tight">
            Start a Peer Support Agency — With Clarity, Confidence, and the Right Documents
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-3xl mx-auto">
            A guided platform for Certified Peer Support Specialists and providers who want to start,
            organize, or operate a Peer Support agency — with or without step-by-step guidance.
          </p>

          <Link to="/start">
            <Button 
              size="lg" 
              className="bg-gold hover:bg-gold/90 text-white px-8 py-6 text-lg shadow-md"
              data-testid="hero-get-started-btn"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>

          <p className="mt-4 text-sm text-slate-500">
            No payment required to explore the basics.
          </p>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="bg-[hsl(40,15%,95%)] py-16">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-6">
          <div className="bg-[hsl(40,15%,99%)] p-6 rounded-xl border border-[hsl(40,15%,90%)] shadow-sm">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-navy mb-4">
              This platform is for:
            </h2>
            <ul className="list-disc ml-6 space-y-2 text-slate-700">
              <li>Certified Peer Support Specialists</li>
              <li>Providers starting or expanding a Peer Support agency</li>
              <li>People who want documents, guidance, or both</li>
              <li>Those preparing for Medicaid enrollment or site visits</li>
            </ul>
          </div>

          <div className="bg-[hsl(40,15%,99%)] p-6 rounded-xl border border-[hsl(40,15%,90%)] shadow-sm">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-navy mb-4">
              This platform is NOT:
            </h2>
            <ul className="list-disc ml-6 space-y-2 text-slate-700">
              <li>Therapy or clinical services</li>
              <li>Legal advice</li>
              <li>A replacement for official Medicaid or state guidance</li>
            </ul>
          </div>
        </div>
      </section>

      {/* WHAT YOU CAN DO */}
      <section className="bg-[hsl(40,20%,98%)] py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-[hsl(40,15%,99%)] p-6 md:p-8 rounded-xl border border-[hsl(40,15%,90%)] shadow-sm">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-navy mb-6">
              What you can do here
            </h2>
            <ul className="list-disc ml-6 space-y-2 text-slate-700">
              <li>Follow an optional step-by-step guided setup</li>
              <li>Purchase required documents only if you already know the process</li>
              <li>Prepare for site visits and reviews</li>
              <li>Understand estimated startup and operating costs</li>
              <li>Avoid common mistakes that delay approval</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SELECT YOUR STATE - Interactive Map */}
      <section className="bg-[hsl(40,15%,95%)] py-16" data-testid="state-selection-section">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-navy mb-3">
              Select Your State
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Click on any state to view its peer support agency requirements.
              States with full guidance have complete step-by-step instructions.
            </p>
          </div>

          {/* Search + Map Container */}
          <div className="bg-[hsl(40,15%,99%)] rounded-2xl p-6 md:p-8 border border-[hsl(40,15%,90%)] shadow-sm">
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search for your state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-2 border-[hsl(40,15%,88%)] focus:border-gold rounded-xl bg-white"
                data-testid="state-search-input"
              />
            </div>

            {/* Conditional: Show Map or Search Results */}
            {searchQuery ? (
              /* Search Results */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" data-testid="search-results">
                {filteredStates.length > 0 ? (
                  filteredStates.map((state) => (
                    <button
                      key={state.code}
                      onClick={() => handleStateClick(state.code)}
                      className={`
                        p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md
                        ${state.tier === "full_guidance" 
                          ? "border-gold bg-[hsl(43,80%,94%)]" 
                          : state.tier === "core_setup"
                          ? "border-amber-300 bg-amber-50"
                          : "border-[hsl(40,15%,88%)] bg-[hsl(40,15%,99%)]"
                        }
                      `}
                      data-testid={`search-result-${state.code}`}
                    >
                      <span className="block font-bold text-navy text-lg">{state.code}</span>
                      <span className="block text-sm text-slate-600 mt-1">{state.name}</span>
                      {state.tier === "full_guidance" && (
                        <span className="inline-block mt-2 text-xs bg-gold text-white px-2 py-0.5 rounded">Full Guide</span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No states found matching "{searchQuery}"</p>
                    <Button
                      variant="link"
                      onClick={() => setSearchQuery("")}
                      className="text-gold mt-2"
                    >
                      Clear search
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* Interactive Map */
              <>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-pulse text-slate-400">Loading map...</div>
                  </div>
                ) : (
                  <USMap 
                    onStateClick={handleStateClick} 
                    stateTiers={stateTiers}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* TWO PATHS */}
      <section className="bg-[hsl(40,15%,95%)] py-16">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-6">
          <div className="bg-[hsl(40,15%,99%)] p-6 rounded-xl border border-[hsl(40,15%,90%)] shadow-sm">
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-navy mb-3">
              Option 1: Guided Setup
            </h3>
            <p className="text-slate-600 mb-4">
              Step-by-step checklist, state-specific guidance, readiness tools,
              and optional upgrades for those who want support.
            </p>
            <Link to="/start">
              <Button className="bg-gold hover:bg-gold/90 text-white shadow-sm">
                Start Guided Setup
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="bg-[hsl(40,15%,99%)] p-6 rounded-xl border border-[hsl(40,15%,90%)] shadow-sm">
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-navy mb-3">
              Option 2: Documents Only
            </h3>
            <p className="text-slate-600 mb-4">
              Purchase Policies & Procedures, hiring packets, supervision documents,
              and site-visit materials without guided setup.
            </p>
            <Link to="/document-shop">
              <Button variant="outline" className="border-[hsl(40,15%,85%)] text-slate-700 hover:bg-[hsl(40,15%,95%)]">
                Browse Documents
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* COST TRANSPARENCY */}
      <section className="bg-[hsl(40,20%,98%)] py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-[hsl(40,15%,99%)] p-6 md:p-8 rounded-xl border border-[hsl(40,15%,90%)] shadow-sm">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-navy mb-4">
              Estimated Costs
            </h2>
            <p className="text-slate-700 mb-4">
              Most Peer Support agencies start with:
            </p>
            <ul className="list-disc ml-6 space-y-2 text-slate-700">
              <li>One-time setup: approximately $300–$2,000</li>
              <li>Monthly operating costs: approximately $550–$2,500</li>
            </ul>
            <p className="mt-4 text-sm text-slate-500">
              Costs vary by state, staffing model, and payer requirements.
              This platform helps you plan — not pressure you.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-16 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-slate-300 mb-6 max-w-xl mx-auto">
            Explore the platform for free and decide what level of support you need.
          </p>

          <Link to="/start">
            <Button 
              size="lg" 
              className="bg-gold hover:bg-gold/90 text-white px-8 shadow-md"
              data-testid="cta-enter-platform-btn"
            >
              Enter the Platform
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FOOTER DISCLAIMER */}
      <footer className="bg-[hsl(40,15%,95%)] text-center text-sm text-slate-500 py-8 px-4 border-t border-[hsl(40,15%,90%)]">
        This platform provides educational and operational guidance only.
        Always verify requirements with official Medicaid, state, and MCO sources.
      </footer>
    </div>
  );
};

export default HomePage;
