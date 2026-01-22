import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Users, Building2, Clock, Mail, MapPin, 
  RefreshCw, AlertTriangle, CheckCircle2, Shield, Link2, Copy, UserPlus,
  Download, FileText, Lock
} from "lucide-react";
import { toast } from "sonner";
import { FEATURE_FLAGS } from "@/constants/featureFlags";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_anchor-place/artifacts/a2v0mwtd_image.png";

const colors = {
  blue: "#1F4FD8",
  teal: "#1CB5A3",
  gold: "#F4B400",
  dark: "#1F2937"
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [placementRequests, setPlacementRequests] = useState([]);
  const [providerInquiries, setProviderInquiries] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    fetchData();
    // Generate a sample invite link
    setInviteLink(`${window.location.origin}/onboarding?invite=admin-${Date.now().toString(36)}`);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [requestsRes, inquiriesRes, placementsRes] = await Promise.all([
        axios.get(`${API}/placement-requests`),
        axios.get(`${API}/provider-inquiries`),
        axios.get(`${API}/placements`)
      ]);
      setPlacementRequests(requestsRes.data);
      setProviderInquiries(inquiriesRes.data);
      setPlacements(placementsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAgency = (inquiry) => {
    toast.success(`Approved: ${inquiry.organization_name}`);
    setProviderInquiries(prev => prev.filter(i => i !== inquiry));
  };

  const handleSuspendAgency = (inquiry) => {
    toast.error(`Suspended: ${inquiry.organization_name}`);
    setProviderInquiries(prev => prev.filter(i => i !== inquiry));
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied to clipboard!");
  };

  const generateNewInvite = () => {
    setInviteLink(`${window.location.origin}/onboarding?invite=admin-${Date.now().toString(36)}`);
    toast.success("New invite link generated!");
  };

  // Filter flagged/high-risk requests
  const flaggedRequests = placementRequests.filter(r => 
    r.urgency === "Urgent" || r.matchFlags?.length > 2
  );

  // Count urgent requests
  const urgentCount = placementRequests.filter(r => r.urgency === "Urgent").length;
  const pendingInquiries = providerInquiries.length;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #F7FBFF 0%, #EAF4FF 100%)' }}>
      {/* Header */}
      <header className="w-full py-4 px-6 bg-white/90 backdrop-blur-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
              data-testid="back-button"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={LOGO_URL} alt="Anchor Placement" className="h-8 w-8" />
            <div>
              <span className="font-bold font-['Poppins']" style={{ color: colors.blue }}>Admin Oversight</span>
              <Badge className="ml-2 bg-purple-100 text-purple-700">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            className="gap-2"
            data-testid="refresh-button"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      <main className="px-6 py-8 max-w-7xl mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="rounded-xl border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${colors.blue}15` }}>
                <Users className="h-6 w-6" style={{ color: colors.blue }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: colors.dark }}>{placementRequests.length}</p>
                <p className="text-xs text-gray-500">Placement Requests</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${colors.teal}15` }}>
                <Building2 className="h-6 w-6" style={{ color: colors.teal }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: colors.dark }}>{placements.length}</p>
                <p className="text-xs text-gray-500">Active Placements</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${colors.gold}20` }}>
                <Clock className="h-6 w-6" style={{ color: colors.gold }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: colors.dark }}>{pendingInquiries}</p>
                <p className="text-xs text-gray-500">Pending Agencies</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-0 shadow-md bg-red-50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
                <p className="text-xs text-gray-500">Urgent Requests</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Admin Sections */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Agency Approvals */}
          <Card className="rounded-2xl border-0 shadow-lg" data-testid="agency-approvals-section">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.dark }}>
                <Building2 className="h-5 w-5" style={{ color: colors.gold }} />
                Agency Approvals
              </CardTitle>
              <p className="text-sm text-gray-500">Review and approve new organizations</p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : providerInquiries.length === 0 ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {providerInquiries.map((inquiry, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl">
                      <p className="font-semibold text-sm" style={{ color: colors.dark }}>
                        {inquiry.organization_name}
                      </p>
                      <p className="text-xs text-gray-500 mb-1">{inquiry.contact_name}</p>
                      <p className="text-xs text-gray-400">{inquiry.inquiry_type}</p>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                          onClick={() => handleApproveAgency(inquiry)}
                          data-testid={`approve-btn-${i}`}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white text-xs"
                          onClick={() => handleSuspendAgency(inquiry)}
                          data-testid={`suspend-btn-${i}`}
                        >
                          Suspend
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flagged Requests */}
          <Card className="rounded-2xl border-0 shadow-lg" data-testid="flagged-requests-section">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.dark }}>
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Flagged Requests
              </CardTitle>
              <p className="text-sm text-gray-500">Requests with high-risk flags or urgent timelines</p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : flaggedRequests.length === 0 ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No flagged requests</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {flaggedRequests.map((request, i) => (
                    <div key={i} className="p-4 bg-red-50 rounded-xl border border-red-100">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm" style={{ color: colors.dark }}>
                            {request.contact_name}
                          </p>
                          <p className="text-xs text-gray-500">{request.placement_type_needed}</p>
                        </div>
                        <Badge className="bg-red-100 text-red-700 text-xs">
                          {request.urgency}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {request.location_preference}
                      </div>
                      {request.matchFlags && request.matchFlags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {request.matchFlags.map((flag, j) => (
                            <Badge key={j} variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                              {flag.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invite Management */}
          <Card className="rounded-2xl border-0 shadow-lg" data-testid="invite-management-section">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.dark }}>
                <UserPlus className="h-5 w-5" style={{ color: colors.teal }} />
                Invite Management
              </CardTitle>
              <p className="text-sm text-gray-500">Control agency access and invite links</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.dark }}>Current Invite Link</p>
                <div className="flex gap-2">
                  <Input 
                    value={inviteLink} 
                    readOnly 
                    className="text-xs bg-gray-50"
                    data-testid="invite-link-input"
                  />
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={copyInviteLink}
                    data-testid="copy-invite-btn"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Button 
                className="w-full"
                style={{ background: colors.teal }}
                onClick={generateNewInvite}
                data-testid="generate-invite-btn"
              >
                <Link2 className="h-4 w-4 mr-2" />
                Generate New Invite
              </Button>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3" style={{ color: colors.dark }}>Quick Stats</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xl font-bold" style={{ color: colors.blue }}>{placements.length}</p>
                    <p className="text-xs text-gray-500">Active Providers</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xl font-bold" style={{ color: colors.teal }}>{placementRequests.length}</p>
                    <p className="text-xs text-gray-500">Total Requests</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Table */}
        <Card className="rounded-2xl border-0 shadow-lg mt-8" data-testid="recent-activity">
          <CardHeader>
            <CardTitle className="text-lg font-bold" style={{ color: colors.dark }}>
              Recent Placement Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {placementRequests.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No placement requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {placementRequests.slice(0, 5).map((request, index) => (
                  <div key={index} className="p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{request.contact_name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {request.contact_email}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {request.location_preference}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          request.urgency === "Urgent" ? "bg-red-100 text-red-700" :
                          request.urgency === "High" ? "bg-amber-100 text-amber-700" :
                          "bg-blue-100 text-blue-700"
                        }>
                          {request.urgency}
                        </Badge>
                        <Badge variant="outline">{request.status || "Pending"}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
