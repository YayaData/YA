import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  ShoppingCart,
  CheckCircle2,
  ArrowLeft,
  Package,
  Download,
  Info,
  Star,
  MapPin,
  AlertCircle,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import FAQAssistant from "@/components/FAQAssistant";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DocumentShopPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [locationStatus, setLocationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  useEffect(() => {
    fetchProducts();
    // Only fetch location status if user has a selected state
    if (user?.selected_state) {
      fetchLocationStatus(user.selected_state);
    }
  }, [user?.selected_state]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/document-shop`);
      setProducts(response.data.products || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      toast.error("Failed to load document shop");
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationStatus = async (stateCode) => {
    try {
      const response = await axios.get(`${API}/location-status/${stateCode}`);
      setLocationStatus(response.data);
    } catch (err) {
      console.error("Failed to fetch location status:", err);
    }
  };

  const handlePurchase = async (productId) => {
    setPurchasing(productId);
    try {
      const response = await axios.post(`${API}/checkout/document`, null, {
        params: {
          product_id: productId,
          origin_url: window.location.origin
        }
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      console.error("Failed to create checkout:", err);
      toast.error(err.response?.data?.detail || "Failed to start checkout");
    } finally {
      setPurchasing(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "allowed": return { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "text-green-500" };
      case "allowed_conditions": return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "text-amber-500" };
      case "verify": return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-500" };
      case "not_recommended": return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "text-red-500" };
      default: return { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", icon: "text-slate-500" };
    }
  };

  // Calculate bundle savings
  const totalIndividual = products.reduce((sum, p) => sum + p.price, 0);
  const bundlePrice = 97; // Templates bundle price
  const savings = totalIndividual - bundlePrice;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="document-shop-page">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="h-6 w-px bg-slate-200" />
              <h1 className="text-lg font-serif font-semibold text-navy">Documents & Templates</h1>
            </div>
            {isAuthenticated && user?.selected_state && (
              <div className="text-sm text-slate-500">
                <MapPin className="w-4 h-4 inline mr-1" />
                {user.selected_state}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Page Title & Intro */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-navy mb-3">
            Documents & Templates Only
          </h2>
          <p className="text-lg text-slate-600 mb-4">
            For providers who already understand the process and only need required documentation.
          </p>
          <FAQAssistant context="Document Shop page" buttonStyle="pill" />
        </div>

        {/* Intro Text Card */}
        <Card className="border border-slate-200 bg-white mb-8">
          <CardContent className="p-6">
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 mb-4">
                If you are already familiar with starting or operating a Peer Support agency, you can 
                purchase individual documents without step-by-step guidance.
              </p>
              <p className="text-slate-600 mb-4">
                These documents are designed to help you prepare for approval, site visits, and compliance reviews.
              </p>
              <p className="text-slate-600 mb-0">
                Guidance and setup support are optional and not required to purchase documents.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="border border-amber-200 bg-amber-50 mb-8" data-testid="important-notice">
          <CardContent className="p-5">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium text-amber-800 mb-2">Important Notice</h3>
                <p className="text-sm text-amber-700">
                  Some documents apply across all states, while others may require state-specific addendums. 
                  Always confirm requirements with official Medicaid or MCO guidance for your state.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Status Card - Only show for logged in users with selected state */}
        {locationStatus && (
          <Card className={`mb-8 border ${getStatusColor(locationStatus.status).border} ${getStatusColor(locationStatus.status).bg}`} data-testid="location-status-card">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(locationStatus.status).bg} border ${getStatusColor(locationStatus.status).border}`}>
                  <MapPin className={`w-5 h-5 ${getStatusColor(locationStatus.status).icon}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-navy">Business Address & Service Location</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(locationStatus.status).bg} ${getStatusColor(locationStatus.status).text} border ${getStatusColor(locationStatus.status).border}`}>
                      {locationStatus.label}
                    </span>
                  </div>
                  <p className={`text-sm ${getStatusColor(locationStatus.status).text}`}>
                    {locationStatus.note}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bundle Savings Banner */}
        <Card className="mb-8 border-2 border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50" data-testid="bundle-savings-card">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-medium text-navy">Want everything?</h3>
                  <p className="text-sm text-slate-600">
                    Get <strong>all documents</strong> for ${bundlePrice} 
                    <span className="text-green-600 font-medium ml-1">(Save ${savings.toFixed(0)})</span>
                  </p>
                </div>
              </div>
              <Link to="/templates?purchase=templates-bundle">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                  Get Complete Bundle
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Loading documents...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {products.map((product) => (
              <Card 
                key={product.id} 
                className="border border-slate-200 hover:border-violet-200 hover:shadow-md transition-all"
                data-testid={`product-card-${product.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-medium text-navy">
                          {product.name}
                        </CardTitle>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          product.scope === "core" 
                            ? "bg-green-100 text-green-700" 
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {product.scope_label}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-navy">${product.price}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-sm text-slate-600 mb-3">
                    {product.description}
                  </p>
                  
                  {/* What's included */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-3">
                    <p className="text-xs font-medium text-slate-500 mb-2">Includes:</p>
                    <ul className="space-y-1">
                      {product.includes.slice(0, 4).map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-600 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                      {product.includes.length > 4 && (
                        <li className="text-xs text-slate-400">
                          +{product.includes.length - 4} more
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Format & Scope note */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {product.format}
                    </span>
                  </div>

                  {/* Scope note */}
                  <p className="text-xs text-slate-500 bg-slate-50 rounded p-2 mb-4">
                    <Info className="w-3 h-3 inline mr-1" />
                    {product.scope_note}
                  </p>

                  {/* Purchase button */}
                  <Button 
                    className="w-full bg-navy hover:bg-navy/90 text-white"
                    onClick={() => handlePurchase(product.id)}
                    disabled={purchasing === product.id}
                    data-testid={`buy-${product.id}-btn`}
                  >
                    {purchasing === product.id ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy ${product.price}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 mb-4">
            Not sure which documents you need?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <Link to="/templates">
              <Button variant="outline">
                Browse Free Templates
              </Button>
            </Link>
          </div>
        </div>

        {/* Reassurance footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>All documents are professionally written and fully editable.</p>
          <p className="mt-1">Secure checkout powered by Stripe.</p>
        </div>
      </main>
    </div>
  );
};

export default DocumentShopPage;
