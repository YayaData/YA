import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Users, Building2, Clock, Mail, Phone, MapPin, 
  RefreshCw, AlertTriangle, CheckCircle2, Shield, Bell
} from "lucide-react";

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

  useEffect(() => {
    fetchData();
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getUrgencyBadge = (urgency) => {
    const styles = {
      Urgent: "bg-red-100 text-red-700",
      High: "bg-amber-100 text-amber-700",
      Medium: "bg-blue-100 text-blue-700",
      Low: "bg-slate-100 text-slate-700"
    };
    return <Badge className={styles[urgency] || "bg-slate-100"}>{urgency}</Badge>;
  };

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

        {/* Admin Sections */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Pending Agencies */}
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.dark }}>
                <Clock className="h-5 w-5" style={{ color: colors.gold }} />
                Pending Agencies
              </CardTitle>
              <p className="text-sm text-gray-500">Review and approve new organizations</p>
            </CardHeader>
            <CardContent>
              {providerInquiries.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">No pending agencies</p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {providerInquiries.slice(0, 5).map((inquiry, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">{inquiry.organization_name}</p>
                      <p className="text-xs text-gray-500">{inquiry.inquiry_type}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Requests */}
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.dark }}>
                <Users className="h-5 w-5" style={{ color: colors.teal }} />
                Active Placement Requests
              </CardTitle>
              <p className="text-sm text-gray-500">Monitor risk flags and urgency</p>
            </CardHeader>
            <CardContent>
              {placementRequests.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">No active requests</p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {placementRequests.slice(0, 5).map((req, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{req.contact_name}</p>
                        <p className="text-xs text-gray-500">{req.placement_type_needed}</p>
                      </div>
                      {getUrgencyBadge(req.urgency)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Alerts */}
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.dark }}>
                <Bell className="h-5 w-5 text-red-500" />
                System Alerts
              </CardTitle>
              <p className="text-sm text-gray-500">Flagged or escalated placements</p>
            </CardHeader>
            <CardContent>
              {urgentCount === 0 ? (
                <div className="py-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 text-sm">All clear - no alerts</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {placementRequests.filter(r => r.urgency === "Urgent").map((req, i) => (
                    <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <p className="font-medium text-sm text-red-700">Urgent: {req.contact_name}</p>
                      </div>
                      <p className="text-xs text-red-600 mt-1">{req.location_preference}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="requests">
              Placement Requests ({placementRequests.length})
            </TabsTrigger>
            <TabsTrigger value="inquiries">
              Provider Inquiries ({providerInquiries.length})
            </TabsTrigger>
            <TabsTrigger value="placements">
              Active Placements ({placements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : placementRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No placement requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {placementRequests.map((request, index) => (
                      <div key={request.id || index} className="p-4 border rounded-xl hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{request.contact_name}</p>
                            <p className="text-sm text-gray-500">{request.referral_source}</p>
                          </div>
                          <div className="flex gap-2">
                            {getUrgencyBadge(request.urgency)}
                            <Badge variant="outline">{request.status || "Pending"}</Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            {request.contact_email}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            {request.contact_phone}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            {request.location_preference}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Building2 className="h-4 w-4" />
                            {request.placement_type_needed}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inquiries">
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardContent className="p-6">
                {providerInquiries.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No provider inquiries yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {providerInquiries.map((inquiry, index) => (
                      <div key={inquiry.id || index} className="p-4 border rounded-xl hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{inquiry.organization_name}</p>
                            <p className="text-sm text-gray-500">{inquiry.contact_name}</p>
                          </div>
                          <Badge variant="secondary">{inquiry.inquiry_type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{inquiry.description}</p>
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {inquiry.contact_email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {inquiry.contact_phone}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="placements">
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardContent className="p-6">
                {placements.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No active placements</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {placements.map((placement, index) => (
                      <div key={placement.id || index} className="p-4 border rounded-xl">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold">{placement.facility_name}</p>
                          <Badge className={
                            placement.availability_status === "Available" ? "bg-green-100 text-green-700" :
                            placement.availability_status === "Limited" ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }>
                            {placement.availability_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{placement.facility_type}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {placement.location}
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="text-gray-500">Capacity:</span> {placement.current_occupancy}/{placement.capacity}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
