import { useState, useEffect } from "react";
import { 
  Lock, 
  Users, 
  MessageSquare, 
  CreditCard, 
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  RefreshCw,
  LogOut,
  User,
  AlertTriangle,
  Flag,
  CheckCircle,
  XCircle,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [brokenLinks, setBrokenLinks] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [authToken, setAuthToken] = useState("");
  const [loginError, setLoginError] = useState("");

  // Check for existing token on mount
  useEffect(() => {
    const token = sessionStorage.getItem("adminToken");
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
      fetchAllData(token);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
    
    try {
      const response = await axios.post(`${API}/admin/login`, { username, password });
      if (response.data.success && response.data.token) {
        const token = response.data.token;
        setAuthToken(token);
        sessionStorage.setItem("adminToken", token);
        setIsAuthenticated(true);
        toast.success("Login successful");
        fetchAllData(token);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Login failed";
      setLoginError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthToken("");
    sessionStorage.removeItem("adminToken");
    setUsername("");
    setPassword("");
    setStats(null);
    setLeads([]);
    setConsultations([]);
    setPayments([]);
    setBrokenLinks([]);
    setLoginError("");
  };

  const fetchAllData = async (token) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, leadsRes, consultationsRes, paymentsRes, brokenLinksRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers }),
        axios.get(`${API}/admin/leads`, { headers }),
        axios.get(`${API}/admin/consultations`, { headers }),
        axios.get(`${API}/admin/payments`, { headers }),
        axios.get(`${API}/admin/broken-links`, { headers })
      ]);
      setStats(statsRes.data);
      setLeads(leadsRes.data.leads);
      setConsultations(consultationsRes.data.consultations);
      setPayments(paymentsRes.data.payments);
      setBrokenLinks(brokenLinksRes.data.reports);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 401) {
        handleLogout();
        toast.error("Session expired. Please login again.");
      } else {
        toast.error("Failed to fetch data");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" data-testid="admin-login">
        <Card className="w-full max-w-md border-2 border-slate-200">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-navy rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="font-serif text-2xl text-navy">Admin Dashboard</CardTitle>
            <p className="text-slate-600 text-sm">Enter your credentials to access the dashboard</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mb-3"
                  data-testid="admin-username-input"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="admin-password-input"
                />
              </div>
              
              {loginError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-gold hover:bg-gold/90 text-white"
                disabled={loading || !username || !password}
                data-testid="admin-login-btn"
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500">
                Secure login with rate limiting protection
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="admin-dashboard">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg">Admin Dashboard</h1>
              <p className="text-slate-300 text-sm">Peer Support Agency Launch</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchAllData(authToken)}
              className="text-white hover:bg-white/10"
              data-testid="refresh-btn"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/10"
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-2 border-slate-200" data-testid="stat-leads">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Total Leads</p>
                    <p className="text-3xl font-bold text-navy">{stats.leads}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-light rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200" data-testid="stat-consultations">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Consultations</p>
                    <p className="text-3xl font-bold text-navy">{stats.consultations}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200" data-testid="stat-payments">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Paid Orders</p>
                    <p className="text-3xl font-bold text-navy">{stats.paid_payments}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gold bg-gold-light/30" data-testid="stat-revenue">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gold mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-navy">${stats.total_revenue.toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 bg-gold rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 p-1 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gold data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-gold data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Leads ({leads.length})
            </TabsTrigger>
            <TabsTrigger value="consultations" className="data-[state=active]:bg-gold data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Consultations ({consultations.length})
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-gold data-[state=active]:text-white">
              <CreditCard className="w-4 h-4 mr-2" />
              Payments ({payments.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Leads */}
              <Card className="border-2 border-slate-200">
                <CardHeader>
                  <CardTitle className="font-serif text-navy flex items-center gap-2">
                    <Users className="w-5 h-5 text-gold" />
                    Recent Leads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leads.slice(0, 5).map((lead, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="font-medium text-navy">{lead.email}</p>
                        <p className="text-sm text-slate-500">{lead.source}</p>
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(lead.created_at)}</span>
                    </div>
                  ))}
                  {leads.length === 0 && (
                    <p className="text-slate-500 text-center py-4">No leads yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Consultations */}
              <Card className="border-2 border-slate-200">
                <CardHeader>
                  <CardTitle className="font-serif text-navy flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-gold" />
                    Recent Consultations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {consultations.slice(0, 5).map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="font-medium text-navy">{c.name}</p>
                        <p className="text-sm text-slate-500">{c.state}</p>
                      </div>
                      <Badge className={c.status === "pending" ? "bg-gold-light text-gold" : "bg-green-100 text-green-700"}>
                        {c.status}
                      </Badge>
                    </div>
                  ))}
                  {consultations.length === 0 && (
                    <p className="text-slate-500 text-center py-4">No consultations yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <Card className="border-2 border-slate-200">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{lead.email}</TableCell>
                        <TableCell>{lead.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{lead.source}</Badge>
                        </TableCell>
                        <TableCell>{lead.template_id || "-"}</TableCell>
                        <TableCell className="text-slate-500">{formatDate(lead.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {leads.length === 0 && (
                  <p className="text-slate-500 text-center py-8">No leads captured yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consultations Tab */}
          <TabsContent value="consultations">
            <Card className="border-2 border-slate-200">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultations.map((c, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{c.state}</TableCell>
                        <TableCell>{c.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge className={c.status === "pending" ? "bg-gold-light text-gold" : "bg-green-100 text-green-700"}>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500">{formatDate(c.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {consultations.length === 0 && (
                  <p className="text-slate-500 text-center py-8">No consultation requests yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card className="border-2 border-slate-200">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Session ID</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{p.product_name}</TableCell>
                        <TableCell>${p.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={
                            p.payment_status === "paid" ? "bg-green-100 text-green-700" :
                            p.payment_status === "initiated" ? "bg-gold-light text-gold" :
                            "bg-slate-100 text-slate-700"
                          }>
                            {p.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{p.session_id?.slice(0, 20)}...</TableCell>
                        <TableCell className="text-slate-500">{formatDate(p.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {payments.length === 0 && (
                  <p className="text-slate-500 text-center py-8">No payments yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPage;
