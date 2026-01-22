import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Home, Clock, CheckCircle2, Settings, Users, Eye, Filter } from "lucide-react";
import ProviderPreferences from "@/components/ProviderPreferences";
import { isCompatibleMatch } from "@/utils/isCompatibleMatch";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_anchor-place/artifacts/a2v0mwtd_image.png";

const colors = {
  blue: "#1F4FD8",
  teal: "#1CB5A3",
  gold: "#F4B400",
  dark: "#1F2937"
};

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const [placements, setPlacements] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [preferences, setPreferences] = useState([]);
  const userData = JSON.parse(localStorage.getItem('anchorplacement_user_data') || '{}');

  // Filter requests based on provider preferences
  const provider = useMemo(() => ({
    acceptedFlags: preferences
  }), [preferences]);

  const visibleRequests = useMemo(() => {
    if (showAllRequests || preferences.length === 0) {
      return requests;
    }
    return requests.filter(req =>
      isCompatibleMatch(provider, req.matchFlags || [])
    );
  }, [requests, provider, showAllRequests, preferences]);

  useEffect(() => {
    fetchData();
    // Load saved preferences
    const savedPrefs = localStorage.getItem('anchorplacement_provider_prefs');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [placementsRes, requestsRes] = await Promise.all([
        axios.get(`${API}/placements`),
        axios.get(`${API}/placement-requests`)
      ]);
      setPlacements(placementsRes.data);
      setRequests(requestsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem('anchorplacement_provider_prefs', JSON.stringify(preferences));
    setShowPreferences(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Available":
        return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3 mr-1" /> Available</Badge>;
      case "Occupied":
        return <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" /> Occupied</Badge>;
      case "Pending":
        return <Badge className="bg-blue-100 text-blue-700"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
              data-testid="back-button"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={LOGO_URL} alt="Anchor Placement" className="h-8 w-8" />
            <span className="font-bold font-['Poppins']" style={{ color: colors.blue }}>Provider Dashboard</span>
          </div>
          <Button 
            variant="outline"
            onClick={() => setShowPreferences(!showPreferences)}
            className="gap-2"
            data-testid="preferences-button"
          >
            <Settings className="h-4 w-4" />
            Preferences
          </Button>
        </div>
      </header>

      <main className="px-6 py-8 max-w-6xl mx-auto">
        {/* Preferences Modal */}
        {showPreferences && (
          <Card className="rounded-2xl shadow-lg border-0 mb-8" data-testid="preferences-panel">
            <CardContent className="p-0">
              <ProviderPreferences 
                preferences={preferences} 
                setPreferences={setPreferences} 
              />
              <div className="px-6 pb-6 flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowPreferences(false)}>Cancel</Button>
                <Button 
                  onClick={handleSavePreferences}
                  style={{ background: colors.teal }}
                  data-testid="save-preferences-button"
                >
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-['Poppins']" style={{ color: colors.dark }} data-testid="welcome-heading">
            Welcome{userData.contactName ? `, ${userData.contactName}` : ''}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your placements and respond to placement requests.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card 
            className="rounded-2xl shadow-lg border-0 hover:shadow-xl transition-all cursor-pointer" 
            onClick={() => navigate("/placements")}
            data-testid="list-space-card"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: colors.gold }}>
                <Plus className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: colors.dark }}>List New Space</h3>
                <p className="text-gray-500 text-sm">Add available placement</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="rounded-2xl shadow-lg border-0 hover:shadow-xl transition-all cursor-pointer" 
            onClick={() => navigate("/placements")}
            data-testid="view-placements-card"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: colors.teal }}>
                <Home className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: colors.dark }}>My Placements</h3>
                <p className="text-gray-500 text-sm">{placements.length} active listings</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="rounded-2xl shadow-lg border-0 hover:shadow-xl transition-all cursor-pointer"
            data-testid="incoming-requests-card"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: colors.blue }}>
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: colors.dark }}>Incoming Requests</h3>
                <p className="text-gray-500 text-sm">
                  {visibleRequests.length} compatible
                  {preferences.length > 0 && visibleRequests.length !== requests.length && (
                    <span className="text-gray-400"> ({requests.length} total)</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Placements */}
        <Card className="rounded-2xl shadow-lg border-0 mb-8" data-testid="placements-list">
          <CardHeader>
            <CardTitle className="text-xl font-bold font-['Poppins']" style={{ color: colors.dark }}>
              Your Listed Placements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : placements.length === 0 ? (
              <div className="text-center py-12">
                <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No placements listed yet</p>
                <Button 
                  onClick={() => navigate("/placements")}
                  style={{ background: colors.gold, color: colors.dark }}
                  className="font-semibold"
                  data-testid="create-first-listing"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Listing
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {placements.slice(0, 5).map((placement, index) => (
                  <div 
                    key={placement.id || index} 
                    className="p-4 border rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between"
                    data-testid={`placement-item-${index}`}
                  >
                    <div>
                      <p className="font-semibold" style={{ color: colors.dark }}>{placement.name}</p>
                      <p className="text-sm text-gray-500">{placement.location} • {placement.placement_type}</p>
                      <p className="text-xs text-gray-400 mt-1">Capacity: {placement.capacity || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(placement.availability_status || "Available")}
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incoming Requests */}
        <Card className="rounded-2xl shadow-lg border-0" data-testid="requests-list">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold font-['Poppins']" style={{ color: colors.dark }}>
              Incoming Placement Requests
              {preferences.length > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({visibleRequests.length} of {requests.length} shown)
                </span>
              )}
            </CardTitle>
            {preferences.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllRequests(!showAllRequests)}
                className="gap-2"
                data-testid="filter-toggle"
              >
                <Filter className="h-4 w-4" />
                {showAllRequests ? "Show Compatible Only" : "Show All"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : visibleRequests.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {requests.length > 0 && preferences.length > 0 
                    ? "No compatible requests match your preferences"
                    : "No incoming requests at this time"
                  }
                </p>
                {requests.length > 0 && preferences.length > 0 && (
                  <Button
                    variant="link"
                    onClick={() => setShowAllRequests(true)}
                    className="mt-2"
                  >
                    Show all {requests.length} requests
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {visibleRequests.slice(0, 5).map((request, index) => (
                  <div 
                    key={request.id || index} 
                    className="p-4 border rounded-xl hover:bg-gray-50 transition-colors"
                    data-testid={`request-item-${index}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold" style={{ color: colors.dark }}>{request.placement_type_needed}</p>
                        <p className="text-sm text-gray-500">{request.organization_name} • {request.location_preference}</p>
                        {request.matchFlags && request.matchFlags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {request.matchFlags.map((flag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {flag.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Recently submitted'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs"
                        >
                          View Details
                        </Button>
                        <Button 
                          size="sm"
                          style={{ background: colors.teal }}
                          className="text-xs"
                        >
                          Respond
                        </Button>
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
