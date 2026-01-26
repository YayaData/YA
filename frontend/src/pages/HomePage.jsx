import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Shield, 
  Users, 
  MapPin, 
  CreditCard,
  Star,
  Clock,
  DollarSign,
  Award,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Building2,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StateSelector from "@/components/StateSelector";
import ConsultationModal from "@/components/ConsultationModal";
import TwoPathsSection from "@/components/TwoPathsSection";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HomePage = () => {
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

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

  const howItWorks = [
    {
      step: 1,
      title: "Select Your State",
      description: "Choose your state to see specific requirements, contacts, and enrollment steps.",
      icon: MapPin
    },
    {
      step: 2,
      title: "Follow the Checklist",
      description: "Complete each step at your own pace - from business formation to hiring staff.",
      icon: CheckCircle2
    },
    {
      step: 3,
      title: "Get Your Documents",
      description: "Download or purchase templates for policies, hiring, and compliance.",
      icon: FileText
    },
    {
      step: 4,
      title: "Start Your Agency",
      description: "Launch your Medicaid-billable peer support agency with confidence.",
      icon: Building2
    }
  ];

  const stats = [
    { value: "50", label: "States Covered" },
    { value: "11", label: "Step Checklist" },
    { value: "$300-$2K", label: "Startup Cost" },
    { value: "13", label: "States Fully Populated" }
  ];

  const testimonials = [
    {
      quote: "This platform made starting my peer support agency so much less intimidating. The step-by-step approach kept me on track.",
      author: "Recovery Coach",
      location: "North Carolina",
      rating: 5
    },
    {
      quote: "The state-specific information saved me weeks of research. I knew exactly what I needed for Texas.",
      author: "Peer Support Specialist",
      location: "Texas",
      rating: 5
    },
    {
      quote: "The document templates alone were worth it. Professional policies and procedures ready to customize.",
      author: "Agency Founder",
      location: "Florida",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "What is a Peer Support agency?",
      answer: "A Peer Support agency provides mental health and recovery support services through trained specialists who have lived experience with mental health challenges or substance use recovery. These agencies can bill Medicaid for their services, creating a sustainable business model while helping others."
    },
    {
      question: "Do I need a clinical license to start?",
      answer: "No clinical license is required. Peer Support Specialists use their lived experience, not clinical training. However, you'll need certified Peer Support Specialists on staff, and most states require a Qualified Professional (QP) for supervision."
    },
    {
      question: "How much does it cost to start?",
      answer: "Typical startup costs range from $300 to $2,000 for one-time expenses (business registration, documents, basic equipment). Monthly operating costs are typically $550 to $2,500 (supervision, billing, admin). Many providers start from a home office to keep costs low."
    },
    {
      question: "How long does it take to launch?",
      answer: "Timeline varies by state, but most providers complete the process in 3-6 months. Some steps like Medicaid enrollment can take 60-90 days. Our platform helps you work on multiple steps in parallel to save time."
    },
    {
      question: "Is this guide state-specific?",
      answer: "Yes! We provide detailed, state-specific information for all 50 states. Currently, 13 states have fully populated guides with step-by-step instructions, and we're continually adding more. All states have access to the checklist and free foundational content."
    },
    {
      question: "What if I already know the process?",
      answer: "If you're experienced, you can skip the guidance and purchase just the documents you need from our Document Shop. We offer policies & procedures, hiring packets, supervision templates, and more - all professionally prepared and ready to customize."
    }
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
      <section className="relative bg-gradient-to-b from-slate-50 to-white overflow-hidden">
        <div className="absolute inset-0 cta-pattern opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="bg-gold/10 text-gold border-gold/20 mb-6 animate-fade-in">
              50-State Edition • No Experience Required
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-navy tracking-tight mb-6 animate-fade-in-up">
              Launch Your Peer Support Agency™
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto animate-fade-in-up stagger-1">
              Your step-by-step guide to starting a Medicaid-billable Peer Support 
              Specialist agency in your state. Turn your lived experience into a career helping others.
            </p>
            <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up stagger-2">
              <Button 
                size="lg"
                className="bg-gold hover:bg-gold/90 text-white px-8 py-6 text-lg shadow-lg shadow-gold/25"
                onClick={() => document.getElementById('state-selector').scrollIntoView({ behavior: 'smooth' })}
                data-testid="hero-select-state-btn"
              >
                Select Your State
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Link to="/start">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-navy text-navy hover:bg-navy hover:text-white px-8 py-6 text-lg"
                  data-testid="hero-get-started-btn"
                >
                  Get Started Free
                </Button>
              </Link>
            </div>
            
            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Free to explore
              </span>
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                No account required
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold" />
                Start in minutes
              </span>
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
            <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-white text-lg font-medium">
                Join hundreds of entrepreneurs building peer support businesses across America
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-navy py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-gold mb-1">{stat.value}</p>
                <p className="text-slate-300 text-sm">{stat.label}</p>
              </div>
            ))}
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
            <p className="text-slate-600 max-w-2xl mx-auto">
              From business formation to your first billable service, we guide you through every step.
            </p>
            <div className="section-divider mx-auto mt-6"></div>
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

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-navy mb-4">
              How It Works
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              A simple, proven process to launch your peer support agency.
            </p>
            <div className="section-divider mx-auto mt-6"></div>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((item, idx) => (
              <div key={idx} className="relative text-center">
                {/* Connector line */}
                {idx < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gold/30"></div>
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gold text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold/25">
                    <span className="text-2xl font-bold">{item.step}</span>
                  </div>
                  <h3 className="font-serif font-bold text-navy text-lg mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/start">
              <Button size="lg" className="bg-gold hover:bg-gold/90 text-white">
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* State Selector Section */}
      <section id="state-selector" className="py-16 md:py-24 bg-white">
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

      {/* Two Paths Section - Guided vs Documents Only */}
      <TwoPathsSection />

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-navy mb-4">
              What People Are Saying
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Hear from others who've used our platform to launch their agencies.
            </p>
            <div className="section-divider mx-auto mt-6"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border-2 border-slate-200">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-slate-600 mb-4 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-navy text-sm">{testimonial.author}</p>
                      <p className="text-slate-500 text-xs">{testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-navy mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600">
              Quick answers to common questions about starting a peer support agency.
            </p>
            <div className="section-divider mx-auto mt-6"></div>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Card 
                key={idx} 
                className={`border-2 transition-all cursor-pointer ${openFaq === idx ? 'border-gold' : 'border-slate-200'}`}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-navy pr-4">{faq.question}</h3>
                    {openFaq === idx ? (
                      <ChevronUp className="w-5 h-5 text-gold flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </div>
                  {openFaq === idx && (
                    <p className="mt-3 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-3">
                      {faq.answer}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-navy relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gold rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Heart className="w-12 h-12 text-gold mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
            Ready to Turn Your Experience Into Impact?
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            Start building your peer support agency today. No experience required - 
            just a desire to help others on their recovery journey.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/start">
              <Button 
                size="lg"
                className="bg-gold hover:bg-gold/90 text-white px-8 shadow-lg shadow-gold/25"
                data-testid="cta-start-now-btn"
              >
                Start Now - It's Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
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
          
          <p className="text-slate-400 text-sm mt-8">
            Questions? Email us at support@peersupportagency.com
          </p>
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
