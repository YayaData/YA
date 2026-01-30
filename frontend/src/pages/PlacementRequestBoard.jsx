import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, MapPin, DollarSign, Home, Clock, Search, 
  AlertTriangle, Shield, UserPlus, CheckCircle2, Filter
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_anchor-placement/artifacts/a2v0mwtd_image.png";

const colors = {
  blue: "#1F4FD8",
  teal: "#1CB5A3",
  gold: "#F4B400",
  dark: "#1F2937"
};

const INCOME_LABELS = {
  ssi: "SSI",
  ssdi: "SSDI",
  employment: "Employment",
  va_benefits: "VA Benefits",
  retirement: "Retirement",
  none: "No Income",
  other: "Other"
};

const HOUSING_LABELS = {
  afl: "AFL",
  group_home: "Group Home",
  transitional: "Transitional",
  independent: "Independent Living",
  any: "Open to Any"
};

export default function PlacementRequestBoard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCounty, setFilterCounty] = useState("");
  
  // Check if user is an approved agency
  const userData = JSON.parse(localStorage.getItem('anchorplacement_user_data') || '{}');
  const isOnboarded = localStorage.getItem('anchorplacement_onboarding_complete') === 'true';
  const canRequestConnection = isOnboarded && userData.orgType;

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API}/placement-board/approved`);
      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestConnection = async (requestId) => {
    if (!canRequestConnection) {
      toast.error("Please complete onboarding to request connections");
      navigate("/onboarding");
      return;
    }

    try {
      await axios.post(`${API}/placement-board/${requestId}/request-connection`, {
        organization_name: userData.organizationName,
        contact_name: userData.contactName,
        contact_email: userData.contactEmail,
        org_type: userData.orgType
      });
      toast.success("Connection request submitted for admin approval");
      fetchRequests();
    } catch (error) {
      if (error.response?.status === 400) {
        toast.info("You have already requested to connect with this individual");
      } else {
        toast.error("Failed to submit connection request");
      }
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = !searchTerm || 
      req.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.county?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.general_notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCounty = !filterCounty || 
      req.county?.toLowerCase().includes(filterCounty.toLowerCase());
    
    return matchesSearch && matchesCounty;
  });

  // Get unique counties for filter
  const counties = [...new Set(requests.map(r => r.county).filter(Boolean))];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #F7FBFF 0%, #EAF4FF 100%)' }}>
      {/* Header */}
      <header className="w-full py-4 px-6 bg-white/90 backdrop-blur-sm border-b border-blue-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="back-button">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={LOGO_URL} alt="Anchor Placement" className="h-8 w-8" />
            <span className="font-bold font-['Poppins']" style={{ color: colors.blue }}>Placement Request Board</span>
          </div>
          <Button 
            onClick={() => navigate("/submit-request")}
            style={{ background: colors.gold, color: colors.dark }}
            className="gap-2"
            data-testid="submit-request-btn"
          >
            <UserPlus className="h-4 w-4" />
            Submit a Request
          </Button>
        </div>
      </header>

      <main className="px-6 py-8 max-w-6xl mx-auto">
        {/* Info Banner */}
        <Card className="rounded-2xl shadow-lg border-0 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <h1 className="text-2xl font-bold font-['Poppins'] mb-2">Placement Request Board</h1>
            <p className="text-blue-100">
              View individuals seeking housing placement support. All requests are reviewed and approved 
              by administrators before appearing here.
            </p>
          </div>
        </Card>

        {/* Disclaimers */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>For Agencies:</strong> Contact information is not shown. Request to connect 
                through the platform. Admin approval required before connection.
              </p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                <strong>Privacy Protected:</strong> Only non-PHI information is displayed. 
                All placement decisions happen offline after proper vetting.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, county, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              data-testid="search-input"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterCounty}
              onChange={(e) => setFilterCounty(e.target.value)}
              className="h-12 px-4 rounded-xl border bg-white"
              data-testid="filter-county"
            >
              <option value="">All Counties</option>
              {counties.map(county => (
                <option key={county} value={county}>{county}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Request Cards */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <Card className="rounded-2xl shadow-lg border-0">
            <CardContent className="p-12 text-center">
              <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.dark }}>
                No Requests Found
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterCounty 
                  ? "No requests match your search criteria." 
                  : "There are no approved placement requests at this time."}
              </p>
              <Button 
                onClick={() => navigate("/submit-request")}
                style={{ background: colors.teal }}
              >
                Submit a New Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <Card 
                key={request.id} 
                className="rounded-2xl shadow-lg border-0 hover:shadow-xl transition-shadow"
                data-testid={`request-card-${request.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold" style={{ color: colors.dark }}>
                        {request.display_name}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        {request.county}, {request.state}
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Income Type</p>
                      <p className="font-medium text-sm" style={{ color: colors.dark }}>
                        {INCOME_LABELS[request.income_type] || request.income_type}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Can Contribute</p>
                      <p className="font-medium text-sm" style={{ color: colors.dark }}>
                        {request.can_contribute ? "Yes" : "No"}
                        {request.contribution_amount && ` (~$${request.contribution_amount})`}
                      </p>
                    </div>
                  </div>

                  {/* Housing Preference */}
                  {request.housing_type && (
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Preference: {HOUSING_LABELS[request.housing_type] || request.housing_type}
                      </span>
                    </div>
                  )}

                  {/* Notes */}
                  {request.general_notes && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 line-clamp-3">
                        "{request.general_notes}"
                      </p>
                    </div>
                  )}

                  {/* Posted Date */}
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    Posted {request.approved_at ? new Date(request.approved_at).toLocaleDateString() : 'Recently'}
                  </div>

                  {/* Connection Status / Button */}
                  {request.has_pending_connection ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-amber-700">
                        Connection request pending admin approval
                      </p>
                    </div>
                  ) : request.is_connected ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-green-700">
                        Already connected with an agency
                      </p>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => handleRequestConnection(request.id)}
                      className="w-full"
                      style={{ background: colors.teal }}
                      disabled={!canRequestConnection}
                      data-testid={`connect-btn-${request.id}`}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {canRequestConnection ? "Request to Connect" : "Login to Connect"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Not Onboarded Notice */}
        {!canRequestConnection && (
          <div className="mt-8 bg-gray-50 border rounded-xl p-6 text-center">
            <Shield className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <h3 className="font-semibold mb-2" style={{ color: colors.dark }}>Agency Access Required</h3>
            <p className="text-gray-600 text-sm mb-4">
              To request connections with individuals, you must be a registered organization.
            </p>
            <Button onClick={() => navigate("/onboarding")} style={{ background: colors.blue }}>
              Register Your Organization
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
