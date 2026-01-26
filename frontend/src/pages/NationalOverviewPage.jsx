import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Globe, 
  Heart, 
  DollarSign, 
  CheckCircle2, 
  Star, 
  MapPin,
  ArrowRight,
  Users,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import InfoSection, { InfoList } from "@/components/InfoSection";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const NationalOverviewPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNationalOverview();
  }, []);

  const fetchNationalOverview = async () => {
    try {
      const response = await axios.get(`${API}/national-overview`);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching national overview:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="national-page-loading">
        <Skeleton className="h-12 w-96 mb-4" />
        <Skeleton className="h-6 w-64 mb-8" />
        <div className="space-y-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="national-overview-page">
      {/* Hero */}
      <section className="bg-slate-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <span className="inline-block px-4 py-2 bg-blue-light text-blue-700 rounded-full text-sm font-medium mb-6">
              National Guide
            </span>
            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-navy tracking-tight mb-6">
              Understanding Peer Support Services Nationwide
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              Before diving into state-specific requirements, understand the fundamentals 
              of peer support services, Medicaid billing, and what every agency needs to succeed.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/">
                <Button className="bg-gold hover:bg-gold/90 text-white" data-testid="nav-to-states-btn">
                  <MapPin className="mr-2 w-4 h-4" />
                  Find Your State Guide
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What is Peer Support */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gold-light rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-navy">
                  What is Peer Support?
                </h2>
              </div>
              <div className="prose prose-slate">
                <p className="text-slate-600 mb-4 leading-relaxed">
                  {data?.what_is_peer_support}
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1743385779347-1549dabf1320?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxjaGVja2xpc3QlMjBjbGlwYm9hcmQlMjBidXNpbmVzcyUyMHBsYW5uaW5nfGVufDB8fHx8MTc2ODUxMzgxNnww&ixlib=rb-4.1.0&q=85"
                alt="Business planning and checklist"
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-navy">Evidence-Based</p>
                    <p className="text-sm text-slate-500">Proven approach</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Medicaid Billable */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <Card className="border-2 border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="w-8 h-8 text-gold" />
                    <h3 className="font-serif font-bold text-navy text-xl">
                      Key Requirements
                    </h3>
                  </div>
                  <div className="space-y-3 text-slate-600">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Agency enrolled as Medicaid provider</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Employ certified specialists</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Meet documentation requirements</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Proper supervision structure</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="order-1 md:order-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gold-light rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-navy">
                  Medicaid-Billable Services
                </h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {data?.what_is_medicaid_billable}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Universal Requirements */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <Globe className="w-8 h-8 text-gold" />
              <h2 className="text-3xl font-serif font-bold text-navy">
                Universal Requirements
              </h2>
            </div>
            <p className="text-slate-600 max-w-2xl mx-auto">
              These requirements apply in virtually every state. Start here regardless of 
              where you plan to operate.
            </p>
            <div className="section-divider mx-auto mt-6"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {data?.universal_requirements?.map((req, idx) => (
              <Card key={idx} className="border-2 border-slate-200 card-hover" data-testid={`universal-req-${idx}`}>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-light rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-slate-700 font-medium">{req.item || req}</p>
                    {req.description && (
                      <p className="text-slate-500 text-sm mt-1">{req.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <Star className="w-8 h-8 text-gold" />
              <h2 className="text-3xl font-serif font-bold text-navy">
                Best Practices
              </h2>
            </div>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Learn from successful peer support agencies. These tips will help you 
              avoid common pitfalls and build a sustainable business.
            </p>
            <div className="section-divider mx-auto mt-6"></div>
          </div>

          <div className="max-w-4xl mx-auto">
            <InfoSection title="Recommended Practices" icon={Star}>
              <InfoList items={data?.best_practices || []} />
            </InfoSection>
          </div>
        </div>
      </section>

      {/* Multi-State Strategy */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gold-light rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-navy">
                  Multi-State Expansion
                </h2>
              </div>
              <div className="prose prose-slate">
                {data?.multi_state_strategy.split('\n\n').map((section, idx) => {
                  if (section.startsWith('**')) {
                    const title = section.match(/\*\*(.*?)\*\*/)?.[1];
                    const content = section.replace(/\*\*.*?\*\*:?\s*/, '');
                    return (
                      <div key={idx} className="mb-6">
                        <h3 className="font-serif font-bold text-navy text-lg mb-2">{title}</h3>
                        <p className="text-slate-600">{content}</p>
                      </div>
                    );
                  }
                  return (
                    <p key={idx} className="text-slate-600 mb-4">{section}</p>
                  );
                })}
              </div>
            </div>
            <div className="sticky top-24">
              <Card className="border-2 border-gold bg-gold-light/30">
                <CardContent className="p-6">
                  <h3 className="font-serif font-bold text-navy text-xl mb-4">
                    Ready to Expand?
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Our premium guide includes detailed multi-state expansion strategies, 
                    state comparison charts, and compliance tracking tools.
                  </p>
                  <Button className="w-full bg-gold hover:bg-gold/90 text-white" data-testid="upgrade-multi-state-btn">
                    Get Multi-State Guide
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            Select your state to get specific requirements, contacts, and a step-by-step 
            checklist tailored to your location.
          </p>
          <Link to="/">
            <Button size="lg" className="bg-gold hover:bg-gold/90 text-white px-8" data-testid="cta-select-state-btn">
              Select Your State
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default NationalOverviewPage;
