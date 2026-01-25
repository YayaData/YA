import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FileText, 
  Download, 
  Filter,
  Search,
  ArrowRight,
  Lock,
  CreditCard,
  Sparkles,
  Clock,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import ResourceCard from "@/components/ResourceCard";
import EmailCaptureModal from "@/components/EmailCaptureModal";
import ConsultationModal from "@/components/ConsultationModal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TemplatesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [products, setProducts] = useState({});
  const [fullyPopulatedStates, setFullyPopulatedStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  // Check if user's state is fully populated
  const userStatePopulated = !user?.selected_state || fullyPopulatedStates.includes(user.selected_state);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [templatesRes, productsRes] = await Promise.all([
        axios.get(`${API}/templates`),
        axios.get(`${API}/products`)
      ]);
      setTemplates(templatesRes.data.templates);
      setProducts(productsRes.data.products);
      setFullyPopulatedStates(productsRes.data.fully_populated_states || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["all", ...new Set(templates.map(t => t.category))];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDownloadClick = (template) => {
    setSelectedTemplate(template);
    setEmailModalOpen(true);
  };

  const handleEmailSuccess = () => {
    if (selectedTemplate) {
      // Trigger actual download
      window.open(`${API}/templates/download/${selectedTemplate.id}`, "_blank");
    }
  };

  const handleCheckout = async (productId) => {
    setCheckoutLoading(productId);
    try {
      const response = await axios.post(`${API}/checkout/create-session`, {
        product_id: productId,
        origin_url: window.location.origin
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="templates-page-loading">
        <Skeleton className="h-12 w-96 mb-4" />
        <Skeleton className="h-6 w-64 mb-8" />
        <div className="grid gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="templates-page">
      {/* Hero */}
      <section className="bg-white border-b border-slate-200 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-2 bg-gold-light text-gold rounded-full text-sm font-medium mb-6">
              Resource Library
            </span>
            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-navy tracking-tight mb-6">
              Templates & Resources
            </h1>
            <p className="text-lg text-slate-600">
              Download ready-to-use templates for policies, contracts, job postings, 
              and more. Free PDF downloads available with email signup.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-slate-200 sticky top-16 z-40 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="template-search-input"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="category-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredTemplates.length > 0 ? (
            <div className="space-y-6">
              {filteredTemplates.map((template, index) => (
                <div 
                  key={template.id} 
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ResourceCard
                    title={template.title}
                    description={template.description}
                    category={template.category}
                    previewText={template.preview_text}
                    onDownload={() => handleDownloadClick(template)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16" data-testid="no-templates-found">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold text-navy mb-2">
                No Templates Found
              </h3>
              <p className="text-slate-600 mb-4">
                Try adjusting your search or filter criteria.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                }}
                data-testid="clear-filters-btn"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Premium Products Section */}
      <section className="py-12 md:py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-gold text-white mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Premium Upgrades
            </Badge>
            <h2 className="text-3xl font-serif font-bold text-navy mb-4">
              Take Your Launch to the Next Level
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Get editable templates, comprehensive guides, and expert support to fast-track your agency launch.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(products).map(([id, product]) => (
              <Card key={id} className="border-2 border-slate-200 card-hover" data-testid={`product-card-${id}`}>
                <CardContent className="p-6">
                  <h3 className="font-serif font-bold text-navy text-lg mb-2">
                    {product.name}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    {product.description}
                  </p>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-gold">${product.price}</span>
                    <span className="text-slate-500 text-sm">USD</span>
                  </div>
                  <Button 
                    className="w-full bg-gold hover:bg-gold/90 text-white"
                    onClick={() => handleCheckout(id)}
                    disabled={checkoutLoading === id}
                    data-testid={`checkout-btn-${id}`}
                  >
                    {checkoutLoading === id ? (
                      "Processing..."
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Buy Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Consultation CTA */}
      <section className="py-12 md:py-16 bg-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-4">
            Need Personalized Guidance?
          </h2>
          <p className="text-slate-300 mb-8">
            Book a strategy consultation with our experts. Get answers to your specific questions 
            and a customized roadmap for your state.
          </p>
          <Button 
            onClick={() => setConsultationOpen(true)}
            className="bg-gold hover:bg-gold/90 text-white"
            size="lg"
            data-testid="book-consultation-btn"
          >
            Book a Consultation
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Modals */}
      <EmailCaptureModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        templateId={selectedTemplate?.id}
        templateTitle={selectedTemplate?.title}
        onSuccess={handleEmailSuccess}
      />

      <ConsultationModal
        isOpen={consultationOpen}
        onClose={() => setConsultationOpen(false)}
      />
    </div>
  );
};

export default TemplatesPage;
