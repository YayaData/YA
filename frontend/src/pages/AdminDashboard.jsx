import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Anchor, Users, Building2, Clock, Mail, Phone, MapPin, RefreshCw } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [placementRequests, setPlacementRequests] = useState([]);
  const [providerInquiries, setProviderInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [requestsRes, inquiriesRes] = await Promise.all([
        axios.get(`${API}/placement-requests`),
        axios.get(`${API}/provider-inquiries`)
      ]);
      setPlacementRequests(requestsRes.data);
      setProviderInquiries(inquiriesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getUrgencyBadge = (urgency) => {
    const colors = {
      Low: "bg-slate-100 text-slate-700",
      Medium: "bg-sky-100 text-sky-700",
      High: "bg-amber-100 text-amber-700",
      Urgent: "bg-red-100 text-red-700"
    };
    return <Badge className={colors[urgency] || "bg-slate-100"}>{urgency}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="w-full py-6 px-6 md:px-12 border-b border-slate-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
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
            <span className="text-lg font-semibold text-slate-900 font-['Manrope']">Admin Dashboard</span>
          </div>
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
      </header>

      <main className="px-6 md:px-12 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card className="border border-slate-200">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-sky-100 rounded-xl">
                  <Users className="h-6 w-6 text-sky-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{placementRequests.length}</p>
                  <p className="text-sm text-slate-600">Placement Requests</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-slate-200">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Building2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{providerInquiries.length}</p>
                  <p className="text-sm text-slate-600">Provider Inquiries</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="requests" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="requests" data-testid="tab-requests">
                Placement Requests ({placementRequests.length})
              </TabsTrigger>
              <TabsTrigger value="inquiries" data-testid="tab-inquiries">
                Provider Inquiries ({providerInquiries.length})
              </TabsTrigger>
            </TabsList>

            {/* Placement Requests Tab */}
            <TabsContent value="requests">
              {isLoading ? (
                <div className="text-center py-12 text-slate-500">Loading...</div>
              ) : placementRequests.length === 0 ? (
                <Card className="border border-slate-200">
                  <CardContent className="p-12 text-center">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No placement requests yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {placementRequests.map((request, index) => (
                    <Card key={request.id || index} className="border border-slate-200" data-testid={`request-${index}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg font-semibold text-slate-900">
                              {request.contact_name}
                            </CardTitle>
                            <p className="text-sm text-slate-500">{request.referral_source}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getUrgencyBadge(request.urgency)}
                            <Badge variant="outline">{request.status || "Pending"}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <a href={`mailto:${request.contact_email}`} className="text-sky-600 hover:underline">
                              {request.contact_email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-slate-400" />
                            <a href={`tel:${request.contact_phone}`} className="text-sky-600 hover:underline">
                              {request.contact_phone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600">{request.location_preference}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600">{formatDate(request.created_at)}</span>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-slate-100">
                          <p className="text-sm"><span className="font-medium">Placement Type:</span> {request.placement_type_needed}</p>
                          {request.services_needed?.length > 0 && (
                            <p className="text-sm mt-1">
                              <span className="font-medium">Services Needed:</span> {request.services_needed.join(", ")}
                            </p>
                          )}
                          {request.additional_notes && (
                            <p className="text-sm mt-1">
                              <span className="font-medium">Notes:</span> {request.additional_notes}
                            </p>
                          )}
                          {request.accepts_medicaid_required && (
                            <Badge className="mt-2 bg-sky-50 text-sky-700">Medicaid Required</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Provider Inquiries Tab */}
            <TabsContent value="inquiries">
              {isLoading ? (
                <div className="text-center py-12 text-slate-500">Loading...</div>
              ) : providerInquiries.length === 0 ? (
                <Card className="border border-slate-200">
                  <CardContent className="p-12 text-center">
                    <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No provider inquiries yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {providerInquiries.map((inquiry, index) => (
                    <Card key={inquiry.id || index} className="border border-slate-200" data-testid={`inquiry-${index}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg font-semibold text-slate-900">
                              {inquiry.organization_name}
                            </CardTitle>
                            <p className="text-sm text-slate-500">{inquiry.contact_name}</p>
                          </div>
                          <Badge variant="secondary">{inquiry.inquiry_type}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <a href={`mailto:${inquiry.contact_email}`} className="text-sky-600 hover:underline">
                              {inquiry.contact_email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-slate-400" />
                            <a href={`tel:${inquiry.contact_phone}`} className="text-sky-600 hover:underline">
                              {inquiry.contact_phone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-sm col-span-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600">{formatDate(inquiry.created_at)}</span>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-slate-100">
                          <p className="text-sm"><span className="font-medium">Description:</span> {inquiry.description}</p>
                          {inquiry.services_interested?.length > 0 && (
                            <p className="text-sm mt-1">
                              <span className="font-medium">Services Interested:</span> {inquiry.services_interested.join(", ")}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
