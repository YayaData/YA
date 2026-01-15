import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FileText, 
  Download, 
  Filter,
  Search,
  ArrowRight,
  Lock
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
import axios from "axios";
import ResourceCard from "@/components/ResourceCard";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/templates`);
      setTemplates(response.data.templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
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
              and more. Preview each template before downloading.
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
                    downloadUrl={`${API}${template.download_url}`}
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

      {/* Premium Templates CTA */}
      <section className="py-12 md:py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-gold bg-gradient-to-br from-gold-light/50 to-white overflow-hidden">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-8 md:p-12">
                  <Badge className="bg-gold text-white mb-4">
                    <Lock className="w-3 h-3 mr-1" />
                    Premium Access
                  </Badge>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-navy mb-4">
                    Get Editable Templates
                  </h2>
                  <p className="text-slate-600 mb-6">
                    Upgrade to access fully editable Word and Excel versions of all templates. 
                    Customize them for your specific state and business needs.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Editable Word & Excel formats",
                      "State-specific customization notes",
                      "Compliance checklist included",
                      "Free updates when regulations change"
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-slate-700">
                        <div className="w-5 h-5 bg-gold rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-gold hover:bg-gold/90 text-white" data-testid="get-premium-templates-btn">
                      Get Premium Templates
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white" data-testid="view-sample-btn">
                      View Sample
                    </Button>
                  </div>
                </div>
                <div className="hidden md:flex items-center justify-center bg-slate-100 p-8">
                  <div className="relative">
                    <div className="absolute -top-4 -left-4 w-48 h-64 bg-white rounded-lg shadow-lg transform -rotate-6 border border-slate-200">
                      <div className="p-4">
                        <div className="h-3 w-20 bg-slate-200 rounded mb-3"></div>
                        <div className="h-2 w-full bg-slate-100 rounded mb-2"></div>
                        <div className="h-2 w-full bg-slate-100 rounded mb-2"></div>
                        <div className="h-2 w-3/4 bg-slate-100 rounded"></div>
                      </div>
                    </div>
                    <div className="relative w-48 h-64 bg-white rounded-lg shadow-xl border-2 border-gold">
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText className="w-6 h-6 text-gold" />
                          <div className="h-3 w-24 bg-gold rounded"></div>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded mb-2"></div>
                        <div className="h-2 w-full bg-slate-200 rounded mb-2"></div>
                        <div className="h-2 w-full bg-slate-200 rounded mb-2"></div>
                        <div className="h-2 w-2/3 bg-slate-200 rounded mb-4"></div>
                        <div className="h-8 w-full bg-gold-light rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-12 md:py-16 bg-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-4">
            Need Custom Templates?
          </h2>
          <p className="text-slate-300 mb-8">
            Our team can create customized templates specific to your state's requirements 
            and your agency's unique needs.
          </p>
          <Button 
            variant="outline" 
            className="border-white text-white hover:bg-white hover:text-navy"
            data-testid="request-custom-btn"
          >
            Request Custom Templates
          </Button>
        </div>
      </section>
    </div>
  );
};

export default TemplatesPage;
