import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Clock, CheckCircle2, AlertCircle, Users, Download, MapPin } from "lucide-react";
import { FEATURE_FLAGS } from "@/constants/featureFlags";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_anchor-place/artifacts/a2v0mwtd_image.png";

const colors = {
  blue: "#1F4FD8",
  teal: "#1CB5A3",
  gold: "#F4B400",
  dark: "#1F2937"
};

export default function RequestorDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const userData = JSON.parse(localStorage.getItem('anchorplacement_user_data') || '{}');

  // Feature flags
  const isCountyMode = FEATURE_FLAGS.COUNTY_MODE;
  const canExport = FEATURE_FLAGS.EXPORT_REPORTS;
  const assignedCounty = userData.state || userData.county || null;

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API}/placement-requests`);
      // Filter to show only this user's requests (in a real app, this would be server-side)
      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "Matched":
        return <Badge className="bg-blue-100 text-blue-700"><Users className="h-3 w-3 mr-1" /> Matched</Badge>;
      case "Completed":
        return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleExportCSV = () => {
    if (!canExport) return;
    const headers = ["Type", "Location", "Status", "Date"];
    const rows = requests.map(r => [
      r.placement_type_needed,
      r.location_preference,
      r.status || "Pending",
      r.created_at ? new Date(r.created_at).toLocaleDateString() : "N/A"
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-requests-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Navigate to place-client with county restriction if COUNTY_MODE is enabled
  const handleNewRequest = () => {
    if (isCountyMode && assignedCounty) {
      navigate(`/place-client?county=${encodeURIComponent(assignedCounty)}`);
    } else {
      navigate("/place-client");
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #F7FBFF 0%, #EAF4FF 100%)' }}>
      {/* Header */}
      <header className="w-full py-4 px-6 bg-white/90 backdrop-blur-sm border-b border-blue-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={LOGO_URL} alt="Anchor Placement" className="h-8 w-8" />
            <span className="font-bold font-['Poppins']" style={{ color: colors.blue }}>Requestor Dashboard</span>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 max-w-6xl mx-auto">
        {/* County Mode Banner */}
        {isCountyMode && assignedCounty && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3" data-testid="county-mode-banner">
            <MapPin className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-800">County Mode Active</p>
              <p className="text-sm text-blue-600">
                Your submissions are restricted to <strong>{assignedCounty}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold font-['Poppins']" style={{ color: colors.dark }}>
              Welcome{userData.contactName ? `, ${userData.contactName}` : ''}!
            </h1>
            <p className="text-gray-600 mt-2">
              Submit and track housing placement requests from your dashboard.
            </p>
          </div>
          {canExport && requests.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-2"
              data-testid="export-requests-btn"
            >
              <Download className="h-4 w-4" />
              Export My Requests
            </Button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="rounded-2xl shadow-lg border-0 hover:shadow-xl transition-all cursor-pointer" onClick={() => navigate("/place-client")}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: colors.gold }}>
                <Plus className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: colors.dark }}>New Placement Request</h3>
                <p className="text-gray-500 text-sm">Submit a request for housing placement</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg border-0 hover:shadow-xl transition-all cursor-pointer" onClick={() => navigate("/placements")}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: colors.teal }}>
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: colors.dark }}>Browse Placements</h3>
                <p className="text-gray-500 text-sm">View available housing options</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Requests */}
        <Card className="rounded-2xl shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold font-['Poppins']" style={{ color: colors.dark }}>
              Your Placement Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No placement requests yet</p>
                <Button 
                  onClick={() => navigate("/place-client")}
                  style={{ background: colors.gold, color: colors.dark }}
                  className="font-semibold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Request
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.slice(0, 5).map((request, index) => (
                  <div key={request.id || index} className="p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold" style={{ color: colors.dark }}>{request.placement_type_needed}</p>
                        <p className="text-sm text-gray-500">{request.location_preference}</p>
                      </div>
                      {getStatusBadge(request.status || "Pending")}
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Recently'}
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
