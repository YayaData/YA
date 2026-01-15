import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, FileText, Shield, Users, MapPin, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StateSelector from "@/components/StateSelector";
import ConsultationModal from "@/components/ConsultationModal";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HomePage = () => {
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const features = [
    {
      icon: MapPin,
      title: "50-State Coverage",
      description: "State-specific requirements, contacts, and resources for every U.S. state.",
    },
    {
      icon: CheckCircle2,
      title: "Step-by-Step Guide",
      description: "Clear checklist from business formation to billing your first service.",
    },
    {
      icon: FileText,
      title: "Ready Templates",
      description: "Policies, contracts, job postings, and more - download and customize.",
    },
    {
      icon: Shield,
      title: "Compliance Focused",
      description: "Understand Medicaid, MCO, and state certification requirements.",
    },
  ];

  const handleCheckout = async (productId) => {
    setCheckoutLoading(true);
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
      setCheckoutLoading(false);
    }
  };

  return (
    <div data-testid="home-page">
      {/* Hero Section */}
      <section className="relative bg-slate-50 overflow-hidden">
        <div className="absolute inset-0 cta-pattern"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <span className="inline-block px-4 py-2 bg-gold-light text-gold rounded-full text-sm font-medium mb-6 animate-fade-in">
              50-State Edition
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-navy tracking-tight mb-6 animate-fade-in-up">
              Launch Your Peer Support Agency™
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto animate-fade-in-up stagger-1">
              Your step-by-step guide to starting a Medicaid-billable Peer Support 
              Specialist agency in your state. No experience required.
            </p>
            <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up stagger-2">
              <Button 
                size="lg"
                className="bg-gold hover:bg-gold/90 text-white px-8 py-6 text-lg"
                onClick={() => document.getElementById('state-selector').scrollIntoView({ behavior: 'smooth' })}
                data-testid="hero-select-state-btn"
              >
                Select Your State
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Link to="/national-overview">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-navy text-navy hover:bg-navy hover:text-white px-8 py-6 text-lg"
                  data-testid="hero-learn-more-btn"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up stagger-3">
            <img
              src="https://images.unsplash.com/photo-1622675363311-3e1904dc1885?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3MjQyMTd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwcHJvZmVzc2lvbmFsJTIwdGVhbSUyMG1lZXRpbmclMjBzdXBwb3J0fGVufDB8fHx8MTc2ODUxMzgxMXww&ixlib=rb-4.1.0&q=85"
              alt="Diverse professional team collaborating"
              className="w-full h-64 sm:h-80 md:h-96 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/50 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-white text-lg font-medium">
                Join hundreds of entrepreneurs building peer support businesses across America
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-navy mb-4">
              Everything You Need to Get Started
            </h2>
            <div className="section-divider mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className="card-hover border-2 border-slate-200 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
                data-testid={`feature-card-${index}`}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-gold-light rounded-xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="font-serif font-bold text-navy text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* State Selector Section */}
      <section id="state-selector" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-navy mb-4">
              Select Your State
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Choose your state to see specific certification requirements, Medicaid enrollment 
              steps, and local resources for starting your peer support agency.
            </p>
            <div className="section-divider mx-auto mt-6"></div>
          </div>

          <StateSelector />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-navy relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gold rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
            Ready to Take the Next Step?
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            Get the complete guide with editable templates, video walkthroughs, 
            and access to our expert support team.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg"
              className="bg-gold hover:bg-gold/90 text-white px-8"
              onClick={() => handleCheckout("pdf-guide")}
              disabled={checkoutLoading}
              data-testid="cta-get-full-guide-btn"
            >
              {checkoutLoading ? "Processing..." : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Get Full Guide - $47
                </>
              )}
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-navy px-8"
              onClick={() => setConsultationOpen(true)}
              data-testid="cta-book-consultation-btn"
            >
              Book a Consultation
            </Button>
          </div>
        </div>
      </section>

      <ConsultationModal
        isOpen={consultationOpen}
        onClose={() => setConsultationOpen(false)}
      />
    </div>
  );
};

export default HomePage;
