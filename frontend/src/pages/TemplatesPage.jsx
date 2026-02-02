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
  AlertCircle,
  Building,
  FileCheck,
  Users,
  ClipboardList,
  Shield,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import ResourceCard from "@/components/ResourceCard";
import EmailCaptureModal from "@/components/EmailCaptureModal";
import ConsultationModal from "@/components/ConsultationModal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Category icons mapping
const CATEGORY_ICONS = {
  corporate_legal: Building,
  medicaid_payer: FileCheck,
  workforce_credentialing: Users,
  clinical_operations: ClipboardList,
  service_documentation: FileText,
  risk_insurance: Shield
};

const TemplatesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState({});
  const [byCategory, setByCategory] = useState({});
  const [products, setProducts] = useState({});
  const [fullyPopulatedStates, setFullyPopulatedStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

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
      setCategories(templatesRes.data.categories || {});
      setByCategory(templatesRes.data.by_category || {});
      setProducts(productsRes.data.products);
      setFullyPopulatedStates(productsRes.data.fully_populated_states || []);
      
      // Expand all categories by default
      const expanded = {};
      Object.keys(templatesRes.data.by_category || {}).forEach(key => {
        expanded[key] = true;
      });
      setExpandedCategories(expanded);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const filteredByCategory = () => {
    if (!searchQuery) return byCategory;
    
    const filtered = {};
    Object.entries(byCategory).forEach(([catId, catData]) => {
      const matchingTemplates = catData.templates.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingTemplates.length > 0) {
        filtered[catId] = {
          ...catData,
          templates: matchingTemplates
        };
      }
    });
    return filtered;
  };

  const handleDownloadClick = (template) => {
    setSelectedTemplate(template);
    setEmailModalOpen(true);
  };

  const handleEmailSuccess = () => {
    if (selectedTemplate) {
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

  const getCategoryIcon = (categoryId) => {
    const IconComponent = CATEGORY_ICONS[categoryId] || FileText;
    return <IconComponent className="w-5 h-5" />;
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

  const filteredCategories = filteredByCategory();

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
            <p className="text-lg text-slate-600 mb-4">
              Download ready-to-use templates for policies, contracts, job postings, 
              and more. Organized by category to help you find what you need.
            </p>
            <p className="text-sm text-slate-500">
              These templates provide frameworks for organizational use. Verify specific requirements with your state Medicaid agency.
            </p>
          </div>
        </div>
      </section>

      {/* Document Shop CTA */}
      <section className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h3 className="font-medium text-navy text-lg">Need editable documents?</h3>
                <p className="text-sm text-slate-600">Purchase fully editable Word documents for your agency.</p>
              </div>
            </div>
            <Link to="/document-shop">
              <Button className="bg-violet-600 hover:bg-violet-700 text-white" data-testid="templates-document-shop-btn">
                Document Shop
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative max-w-md">
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
        </div>
      </section>

      {/* Templates by Category */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {Object.keys(filteredCategories).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(filteredCategories).map(([categoryId, categoryData]) => (
                <Card key={categoryId} className="border-2 border-slate-200" data-testid={`category-${categoryId}`}>
                  <Collapsible
                    open={expandedCategories[categoryId]}
                    onOpenChange={() => toggleCategory(categoryId)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="bg-[hsl(40,15%,96%)] border-b cursor-pointer hover:bg-[hsl(40,15%,94%)] transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gold-light rounded-lg flex items-center justify-center text-gold">
                              {getCategoryIcon(categoryId)}
                            </div>
                            <div>
                              <CardTitle className="font-serif text-navy text-lg">
                                {categoryData.category?.name || categoryId}
                              </CardTitle>
                              <p className="text-sm text-slate-500 font-normal">
                                {categoryData.category?.description} • {categoryData.templates.length} template{categoryData.templates.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          {expandedCategories[categoryId] ? (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="p-4 space-y-4">
                        {categoryData.templates.map((template) => (
                          <ResourceCard
                            key={template.id}
                            title={template.title}
                            description={template.description}
                            category={template.category_name}
                            previewText={template.preview_text}
                            onDownload={() => handleDownloadClick(template)}
                          />
                        ))}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16" data-testid="no-templates-found">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold text-navy mb-2">
                No Templates Found
              </h3>
              <p className="text-slate-600 mb-4">
                Try adjusting your search criteria.
              </p>
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
                data-testid="clear-filters-btn"
              >
                Clear Search
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
              Comprehensive Document Packages
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Get editable templates and expert support. Verify requirements with your state Medicaid agency.
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
            Book a strategy consultation with our experts. Get answers to your specific questions.
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
