import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Building2, MapPin, Phone, Mail, Users, Filter, Anchor, RefreshCw } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getStatusBadge = (status) => {
  switch (status) {
    case "Available":
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Available</Badge>;
    case "Limited":
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Limited</Badge>;
    case "Full":
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Full</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function Placements() {
  const navigate = useNavigate();
  const [placements, setPlacements] = useState([]);
  const [filteredPlacements, setFilteredPlacements] = useState([]);
  const [placementTypes, setPlacementTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "all",
    availability: "all",
    location: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [placements, filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // First seed data if needed
      await axios.post(`${API}/seed-data`);
      
      const [placementsRes, typesRes] = await Promise.all([
        axios.get(`${API}/placements`),
        axios.get(`${API}/placement-types`)
      ]);
      setPlacements(placementsRes.data);
      setPlacementTypes(typesRes.data.types);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load placements");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...placements];
    
    if (filters.type !== "all") {
      result = result.filter(p => p.facility_type === filters.type);
    }
    
    if (filters.availability !== "all") {
      result = result.filter(p => p.availability_status === filters.availability);
    }
    
    if (filters.location) {
      result = result.filter(p => 
        p.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    setFilteredPlacements(result);
  };

  const clearFilters = () => {
    setFilters({
      type: "all",
      availability: "all",
      location: ""
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="w-full py-6 px-6 md:px-12 border-b border-slate-100">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            data-testid="back-to-home"
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="p-2 bg-sky-600 rounded-xl">
            <Anchor className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-slate-900 font-['Manrope']">Available Placements</span>
        </div>
      </header>

      <main className="px-6 md:px-12 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Filters */}
          <Card className="mb-8 border border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-slate-500" />
                  <CardTitle className="text-lg font-semibold text-slate-900 font-['Manrope']">
                    Filter Placements
                  </CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  data-testid="clear-filters-btn"
                  className="text-slate-500"
                >
                  Clear Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Placement Type</label>
                  <Select 
                    value={filters.type} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger data-testid="filter-type-select">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {placementTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Availability</label>
                  <Select 
                    value={filters.availability} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, availability: value }))}
                  >
                    <SelectTrigger data-testid="filter-availability-select">
                      <SelectValue placeholder="All Availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Availability</SelectItem>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Limited">Limited</SelectItem>
                      <SelectItem value="Full">Full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Location</label>
                  <Input
                    placeholder="Search by city or region"
                    data-testid="filter-location-input"
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-600">
              Showing <span className="font-semibold text-slate-900">{filteredPlacements.length}</span> placements
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchData}
              data-testid="refresh-btn"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Provider Invitation */}
          <Card className="mb-8 border border-sky-200 bg-sky-50">
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-3 font-['Manrope']">
                Interested in becoming a provider?
              </h3>
              <div className="text-sm text-slate-600 space-y-2">
                <p>
                  If you own or rent a home and have available space, you may be able to start a care or housing-based business by offering placement availability in your residence or rental property.
                </p>
                <p>
                  Many providers begin this way and work with the appropriate agencies to meet state and program requirements. Requirements vary by location and funding source.
                </p>
                <p className="text-slate-500 italic">
                  Anchor Place™ does not license, approve, or guarantee placements. The platform provides visibility and placement coordination once a provider is ready to accept referrals.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Placements Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="border border-slate-200 animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-slate-200 rounded mb-4 w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded mb-2 w-1/2"></div>
                    <div className="h-20 bg-slate-200 rounded mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPlacements.length === 0 ? (
            <Card className="border border-slate-200">
              <CardContent className="p-12 text-center">
                <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No placements found</h3>
                <p className="text-slate-600 mb-4">Try adjusting your filters or check back later.</p>
                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlacements.map((placement, index) => (
                <Card 
                  key={placement.id} 
                  data-testid={`placement-card-${index}`}
                  className="border border-slate-200 shadow-sm card-hover"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-semibold text-slate-900 font-['Manrope'] pr-2">
                        {placement.facility_name}
                      </CardTitle>
                      {getStatusBadge(placement.availability_status)}
                    </div>
                    <Badge variant="secondary" className="w-fit mt-2">
                      {placement.facility_type}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {placement.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {placement.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="h-4 w-4 text-slate-400" />
                        {placement.current_occupancy} / {placement.capacity} beds occupied
                      </div>
                    </div>

                    {placement.accepts_medicaid && (
                      <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">
                        Accepts Medicaid
                      </Badge>
                    )}

                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <a href={`tel:${placement.contact_phone}`} className="text-sky-600 hover:underline">
                          {placement.contact_phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <a href={`mailto:${placement.contact_email}`} className="text-sky-600 hover:underline truncate">
                          {placement.contact_email}
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
