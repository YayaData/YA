import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Users, Building2, Clock, Mail, MapPin, Phone,
  RefreshCw, AlertTriangle, CheckCircle2, Shield, Link2, Copy, UserPlus,
  Download, FileText, Lock, Home, Eye, MessageSquare, X
} from "lucide-react";
import { toast } from "sonner";
import { FEATURE_FLAGS } from "@/constants/featureFlags";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_anchor-placement/artifacts/a2v0mwtd_image.png";

const colors = {
  blue: "#1F4FD8",
  teal: "#1CB5A3",
  gold: "#F4B400",
  dark: "#1F2937"
};

// Response Scripts
const SCRIPTS = {
  CLOSURE_NO_PLACEMENT: `Hello,

Thank you for submitting a housing interest request. At this time, we are unable to move forward due to availability limitations.

We appreciate you reaching out and encourage you to seek additional local resources as well.

Thank you.`
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [placementRequests, setPlacementRequests] = useState([]);
  const [providerInquiries, setProviderInquiries] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [housingInterests, setHousingInterests] = useState([]);
  const [boardRequests, setBoardRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState("");
  const [showCloseModal, setShowCloseModal] = useState(null); // Holds the interest being closed

  useEffect(() => {
    fetchData();
    // Generate a sample invite link
    setInviteLink(`${window.location.origin}/onboarding?invite=admin-${Date.now().toString(36)}`);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [requestsRes, inquiriesRes, placementsRes, housingRes, boardRes] = await Promise.all([
        axios.get(`${API}/placement-requests`),
        axios.get(`${API}/provider-inquiries`),
        axios.get(`${API}/placements`),
        axios.get(`${API}/housing-interest`).catch(() => ({ data: [] })),
        axios.get(`${API}/placement-board`).catch(() => ({ data: [] }))
      ]);
      setPlacementRequests(requestsRes.data);
      setProviderInquiries(inquiriesRes.data);
      setPlacements(placementsRes.data);
      setHousingInterests(housingRes.data);
      setBoardRequests(boardRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateHousingStatus = async (id, status, closureMessage = null) => {
    try {
      let url = `${API}/housing-interest/${id}?status=${status}`;
      if (closureMessage) {
        url += `&admin_notes=${encodeURIComponent(closureMessage)}`;
      }
      await axios.patch(url);
      setHousingInterests(prev => 
        prev.map(h => h.id === id ? { ...h, status, admin_notes: closureMessage || h.admin_notes } : h)
      );
      toast.success(`Status updated to ${status}`);
      setShowCloseModal(null);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleCloseWithScript = (interest) => {
    setShowCloseModal(interest);
  };

  const confirmCloseWithScript = () => {
    if (showCloseModal) {
      handleUpdateHousingStatus(showCloseModal.id, 'closed', SCRIPTS.CLOSURE_NO_PLACEMENT);
    }
  };

  const handleUpdateBoardStatus = async (id, status) => {
    try {
      await axios.patch(`${API}/placement-board/${id}?status=${status}`);
      setBoardRequests(prev => 
        prev.map(r => r.id === id ? { ...r, status } : r)
      );
      toast.success(`Request ${status}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleApproveConnection = async (requestId, orgName) => {
    try {
      const res = await axios.post(`${API}/placement-board/${requestId}/approve-connection?organization_name=${encodeURIComponent(orgName)}`);
      toast.success(`Connection approved! Contact: ${res.data.contact_info.phone || res.data.contact_info.email}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to approve connection");
    }
  };

  const handleApproveAgency = async (inquiry) => {
    try {
      await axios.patch(`${API}/provider-inquiries/${inquiry.id}?status=approved`);
      toast.success(`Approved: ${inquiry.organization_name}`);
      setProviderInquiries(prev => 
        prev.map(i => i.id === inquiry.id ? { ...i, status: 'approved' } : i)
      );
    } catch (error) {
      console.error("Error approving agency:", error);
      toast.error("Failed to approve agency");
    }
  };

  const handleSuspendAgency = async (inquiry) => {
    try {
      await axios.patch(`${API}/provider-inquiries/${inquiry.id}?status=suspended`);
      toast.error(`Suspended: ${inquiry.organization_name}`);
      setProviderInquiries(prev => 
        prev.map(i => i.id === inquiry.id ? { ...i, status: 'suspended' } : i)
      );
    } catch (error) {
      console.error("Error suspending agency:", error);
      toast.error("Failed to suspend agency");
    }
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

  // Filter pending inquiries for approval section
  const pendingAgencies = providerInquiries.filter(i => !i.status || i.status === 'pending');
  const approvedAgencies = providerInquiries.filter(i => i.status === 'approved');
  const suspendedAgencies = providerInquiries.filter(i => i.status === 'suspended');

  // Count urgent requests
  const urgentCount = placementRequests.filter(r => r.urgency === "Urgent").length;
  const pendingInquiries = pendingAgencies.length;

  // Check if in read-only audit mode
  const isReadOnly = FEATURE_FLAGS.READ_ONLY_AUDIT;
  const canExport = FEATURE_FLAGS.EXPORT_REPORTS;

  const handleExportCSV = () => {
    if (!canExport) {
      toast.error("Export feature is disabled");
      return;
    }
    // Generate CSV content
    const headers = ["Contact Name", "Email", "Location", "Type", "Urgency", "Status"];
    const rows = placementRequests.map(r => [
      r.contact_name,
      r.contact_email,
      r.location_preference,
      r.placement_type_needed,
      r.urgency,
      r.status || "Pending"
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `placement-requests-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("CSV exported successfully!");
  };

  const handleExportPDF = () => {
    if (!canExport) {
      toast.error("Export feature is disabled");
      return;
    }
    toast.info("PDF export coming soon!");
  };

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
        {/* Read-Only Audit Mode Banner */}
        {isReadOnly && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3" data-testid="read-only-banner">
            <Lock className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">Read-only audit mode enabled</p>
              <p className="text-sm text-amber-600">All edit, approve, and suspend actions are disabled for compliance review.</p>
            </div>
          </div>
        )}

        {/* Export Actions */}
        {canExport && (
          <div className="mb-6 flex gap-3 justify-end" data-testid="export-actions">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportCSV}
              className="gap-2"
              data-testid="export-csv-btn"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportPDF}
              className="gap-2"
              data-testid="export-pdf-btn"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
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

          <Card className="rounded-xl border-0 shadow-md bg-purple-50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-100">
                <Home className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{housingInterests.filter(h => h.status === 'pending').length}</p>
                <p className="text-xs text-gray-500">Housing Interests</p>
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
                Agency Management
                {pendingAgencies.length > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 ml-1">
                    {pendingAgencies.length} pending
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-gray-500">Review, approve, and manage organizations</p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : providerInquiries.length === 0 ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No agency inquiries yet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Pending Agencies */}
                  {pendingAgencies.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Pending Approval</p>
                      {pendingAgencies.map((inquiry, i) => (
                        <div key={inquiry.id || i} className="p-4 bg-amber-50 rounded-xl mb-2 border border-amber-100">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-sm" style={{ color: colors.dark }}>
                                {inquiry.organization_name}
                              </p>
                              <p className="text-xs text-gray-500">{inquiry.contact_name}</p>
                              <p className="text-xs text-gray-400">{inquiry.inquiry_type}</p>
                            </div>
                            <Badge className="bg-amber-100 text-amber-700 text-xs">Pending</Badge>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleApproveAgency(inquiry)}
                              disabled={isReadOnly}
                              data-testid={`approve-btn-${i}`}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleSuspendAgency(inquiry)}
                              disabled={isReadOnly}
                              data-testid={`suspend-btn-${i}`}
                            >
                              Suspend
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Approved Agencies */}
                  {approvedAgencies.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Approved ({approvedAgencies.length})</p>
                      {approvedAgencies.map((inquiry, i) => (
                        <div key={inquiry.id || i} className="p-3 bg-green-50 rounded-xl mb-2 border border-green-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm" style={{ color: colors.dark }}>
                                {inquiry.organization_name}
                              </p>
                              <p className="text-xs text-gray-500">{inquiry.contact_name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-700 text-xs">Approved</Badge>
                              <Button 
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-700 text-xs h-7 px-2"
                                onClick={() => handleSuspendAgency(inquiry)}
                                disabled={isReadOnly}
                              >
                                Suspend
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Suspended Agencies */}
                  {suspendedAgencies.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Suspended ({suspendedAgencies.length})</p>
                      {suspendedAgencies.map((inquiry, i) => (
                        <div key={inquiry.id || i} className="p-3 bg-red-50 rounded-xl mb-2 border border-red-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm" style={{ color: colors.dark }}>
                                {inquiry.organization_name}
                              </p>
                              <p className="text-xs text-gray-500">{inquiry.contact_name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-red-100 text-red-700 text-xs">Suspended</Badge>
                              <Button 
                                size="sm"
                                variant="ghost"
                                className="text-green-500 hover:text-green-700 text-xs h-7 px-2"
                                onClick={() => handleApproveAgency(inquiry)}
                                disabled={isReadOnly}
                              >
                                Reinstate
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

        {/* Housing Interest Submissions */}
        <Card className="rounded-2xl border-0 shadow-lg mt-8" data-testid="housing-interest-section">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.dark }}>
                <Home className="h-5 w-5 text-purple-600" />
                Housing Interest Submissions
                {housingInterests.filter(h => h.status === 'pending').length > 0 && (
                  <Badge className="bg-purple-100 text-purple-700 ml-2">
                    {housingInterests.filter(h => h.status === 'pending').length} pending
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-gray-500">Review requests from individuals seeking housing</p>
            </div>
            {housingInterests.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open(`${API}/housing-interest/export`, '_blank');
                }}
                className="gap-2"
                data-testid="export-housing-interest-btn"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {housingInterests.length === 0 ? (
              <div className="text-center py-12">
                <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No housing interest submissions yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Share <strong>/housing-interest</strong> for individuals to submit requests
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {housingInterests.map((interest, index) => (
                  <div key={index} className="p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold" style={{ color: colors.dark }}>{interest.name}</p>
                          <Badge className={
                            interest.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            interest.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                            interest.status === 'contacted' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {interest.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {interest.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {interest.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                          <span>
                            Disability Income: {interest.has_disability_income === true ? 'Yes' : interest.has_disability_income === false ? 'No' : 'Unknown'}
                          </span>
                          <span>
                            Can Pay: {interest.can_pay === true ? 'Yes' : interest.can_pay === false ? 'No' : 'Unknown'}
                          </span>
                        </div>
                        {interest.description && (
                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                            "{interest.description}"
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        {interest.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateHousingStatus(interest.id, 'reviewed')}
                              className="text-xs"
                              disabled={isReadOnly}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Mark Reviewed
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleUpdateHousingStatus(interest.id, 'contacted')}
                              className="text-xs"
                              style={{ background: colors.teal }}
                              disabled={isReadOnly}
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Mark Contacted
                            </Button>
                          </>
                        )}
                        {interest.status === 'reviewed' && (
                          <Button 
                            size="sm"
                            onClick={() => handleUpdateHousingStatus(interest.id, 'contacted')}
                            className="text-xs"
                            style={{ background: colors.teal }}
                            disabled={isReadOnly}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Mark Contacted
                          </Button>
                        )}
                        {(interest.status === 'contacted' || interest.status === 'reviewed') && (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleCloseWithScript(interest)}
                            className="text-xs"
                            disabled={isReadOnly}
                            data-testid={`close-interest-btn-${index}`}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Close
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Placement Board Moderation */}
        <Card className="rounded-2xl border-0 shadow-lg mt-8" data-testid="placement-board-section">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.dark }}>
              <Users className="h-5 w-5" style={{ color: colors.blue }} />
              Placement Request Board Moderation
              {boardRequests.filter(r => r.status === 'pending').length > 0 && (
                <Badge className="bg-blue-100 text-blue-700 ml-2">
                  {boardRequests.filter(r => r.status === 'pending').length} pending approval
                </Badge>
              )}
              {boardRequests.filter(r => r.connection_requests?.length > 0 && r.status === 'approved').length > 0 && (
                <Badge className="bg-amber-100 text-amber-700 ml-2">
                  {boardRequests.filter(r => r.connection_requests?.length > 0 && r.status === 'approved').length} connection requests
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-gray-500">Approve requests and manage agency connections</p>
          </CardHeader>
          <CardContent>
            {boardRequests.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No placement board requests yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Share <strong>/submit-request</strong> for individuals to submit requests
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {boardRequests.map((request, index) => (
                  <div key={index} className="p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold" style={{ color: colors.dark }}>{request.display_name}</p>
                          <Badge className={
                            request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            request.status === 'approved' ? 'bg-green-100 text-green-700' :
                            request.status === 'connected' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {request.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {request.county}, {request.state}
                          </span>
                          <span>Income: {request.income_type}</span>
                          <span>Can Pay: {request.can_contribute ? 'Yes' : 'No'}</span>
                        </div>
                        {request.general_notes && (
                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                            "{request.general_notes}"
                          </p>
                        )}
                        
                        {/* Contact Info (Admin Only) */}
                        <div className="mt-2 text-xs text-gray-400 bg-blue-50 p-2 rounded">
                          <strong>Contact (Private):</strong> {request.contact_phone || request.contact_email} ({request.preferred_contact})
                        </div>

                        {/* Connection Requests */}
                        {request.connection_requests && request.connection_requests.length > 0 && request.status === 'approved' && (
                          <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                            <p className="text-sm font-medium text-amber-800 mb-2">
                              Connection Requests ({request.connection_requests.length}):
                            </p>
                            <div className="space-y-2">
                              {request.connection_requests.map((cr, i) => (
                                <div key={i} className="flex items-center justify-between bg-white p-2 rounded">
                                  <div>
                                    <p className="text-sm font-medium">{cr.organization_name}</p>
                                    <p className="text-xs text-gray-500">{cr.contact_name} • {cr.org_type}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveConnection(request.id, cr.organization_name)}
                                    className="text-xs"
                                    style={{ background: colors.teal }}
                                    disabled={isReadOnly}
                                  >
                                    Approve Connection
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Connected Agency */}
                        {request.approved_connector && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-800">
                              <strong>Connected to:</strong> {request.approved_connector.organization_name}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        {request.status === 'pending' && (
                          <>
                            <Button 
                              size="sm"
                              onClick={() => handleUpdateBoardStatus(request.id, 'approved')}
                              className="text-xs"
                              style={{ background: colors.teal }}
                              disabled={isReadOnly}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approve for Board
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateBoardStatus(request.id, 'closed')}
                              className="text-xs text-red-600"
                              disabled={isReadOnly}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {request.status === 'approved' && !request.approved_connector && (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateBoardStatus(request.id, 'closed')}
                            className="text-xs"
                            disabled={isReadOnly}
                          >
                            Close Request
                          </Button>
                        )}
                        {request.status === 'connected' && (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateBoardStatus(request.id, 'closed')}
                            className="text-xs"
                            disabled={isReadOnly}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Close Request Modal with Script B */}
        {showCloseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="close-modal-overlay">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 overflow-hidden" data-testid="close-modal">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: colors.dark }}>
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    Close Housing Interest Request
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowCloseModal(null)}
                    data-testid="close-modal-dismiss"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Closing request for <strong>{showCloseModal.name}</strong>
                </p>
              </div>
              
              <div className="p-6">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  The following standardized response will be recorded:
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 whitespace-pre-wrap">
                  {SCRIPTS.CLOSURE_NO_PLACEMENT}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  This message will be saved as admin notes for this request.
                </p>
              </div>
              
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                <Button 
                  variant="outline"
                  onClick={() => setShowCloseModal(null)}
                  data-testid="close-modal-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmCloseWithScript}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  data-testid="close-modal-confirm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm & Close Request
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
