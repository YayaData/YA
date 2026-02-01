import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, Users, ArrowRight, CheckCircle, Shield, Zap, 
  FileText, MessageSquare, UserCheck, Building2, Briefcase,
  Clock, Search, Star
} from "lucide-react";
import { getPlacementTabs } from "@/utils/getPlacementTabs";
import { getDashboardRoute } from "@/utils/routeByOrgType";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_anchor-place/artifacts/a2v0mwtd_image.png";

const colors = {
  blue: "#1F4FD8",
  teal: "#1CB5A3",
  gold: "#F4B400",
  dark: "#1F2937"
};

export default function WelcomeScreen() {
  const navigate = useNavigate();
  
  const userData = JSON.parse(localStorage.getItem('anchorplacement_user_data') || '{}');
  const isOnboarded = localStorage.getItem('anchorplacement_onboarding_complete') === 'true';
  const orgType = userData.orgType;
  const placementTabs = orgType ? getPlacementTabs(orgType) : { showNeedPlacement: true, showPlacementAvailable: true };
  const dashboardRoute = orgType ? getDashboardRoute(orgType) : '/onboarding';

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="w-full py-4 px-6 md:px-12 bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Anchor Placement" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold font-['Poppins']" style={{ color: colors.blue }}>
              Anchor Place
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isOnboarded && (
              <Button 
                variant="ghost" 
                onClick={() => navigate(dashboardRoute)}
                className="text-slate-600 hover:text-slate-900"
              >
                Dashboard
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => navigate("/admin")}
              className="text-slate-600"
            >
              Admin
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="py-16 md:py-24 px-6 md:px-12 bg-gradient-to-b from-sky-50 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Match individuals needing supportive housing with available providers — faster and simpler.
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-3xl mx-auto">
            Anchor Place helps agencies, providers, and care homes connect for potential placements. 
            <span className="block mt-2 text-slate-500 text-base">Submission does not guarantee placement.</span>
          </p>
          
          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/onboarding?path=provider")}
              className="h-14 px-8 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all gap-2"
              style={{ background: colors.blue }}
              data-testid="hero-provider-btn"
            >
              <Home className="h-5 w-5" />
              I Have Space Available
            </Button>
            <Button 
              onClick={() => navigate("/place-client")}
              variant="outline"
              className="h-14 px-8 text-lg font-semibold rounded-xl border-2 hover:bg-slate-50 transition-all gap-2"
              style={{ borderColor: colors.blue, color: colors.blue }}
              data-testid="hero-agency-btn"
            >
              <Search className="h-5 w-5" />
              I Need Placement Help
            </Button>
          </div>
        </div>
      </section>

      {/* CHOOSE YOUR PATH SECTION */}
      <section className="py-16 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-900 mb-4">
            Choose your path
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Whether you have space to offer or need help finding placement, we've built tools for both sides.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Card 1: For Providers */}
            <Card className="border-2 border-slate-200 hover:border-emerald-400 hover:shadow-xl transition-all rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                  <Building2 className="h-7 w-7 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">For Providers / Homes</h3>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-slate-600">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    List available space
                  </li>
                  <li className="flex items-center gap-3 text-slate-600">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    Receive placement inquiries
                  </li>
                  <li className="flex items-center gap-3 text-slate-600">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    Control who contacts you
                  </li>
                </ul>
                <Button 
                  onClick={() => navigate("/onboarding?path=provider")}
                  className="w-full h-12 font-semibold rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700"
                  data-testid="card-provider-btn"
                >
                  List Space
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Card 2: For Agencies */}
            <Card className="border-2 border-slate-200 hover:border-sky-400 hover:shadow-xl transition-all rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center mb-6">
                  <Briefcase className="h-7 w-7 text-sky-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">For Agencies / Professionals</h3>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-slate-600">
                    <CheckCircle className="h-5 w-5 text-sky-500 flex-shrink-0" />
                    Submit structured placement requests
                  </li>
                  <li className="flex items-center gap-3 text-slate-600">
                    <CheckCircle className="h-5 w-5 text-sky-500 flex-shrink-0" />
                    Reduce back-and-forth emails
                  </li>
                  <li className="flex items-center gap-3 text-slate-600">
                    <CheckCircle className="h-5 w-5 text-sky-500 flex-shrink-0" />
                    Centralized intake
                  </li>
                </ul>
                <Button 
                  onClick={() => navigate("/place-client")}
                  className="w-full h-12 font-semibold rounded-xl gap-2 bg-sky-600 hover:bg-sky-700"
                  data-testid="card-agency-btn"
                >
                  Submit Request
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* WHAT HAPPENS NEXT SECTION */}
      <section className="py-16 px-6 md:px-12 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-900 mb-4">
            What happens next
          </h2>
          <p className="text-slate-600 text-center mb-12">
            A simple 3-step process to get started
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <FileText className="h-7 w-7 text-slate-600" />
              </div>
              <div className="bg-slate-900 text-white text-sm font-bold px-3 py-1 rounded-full inline-block mb-3">
                Step 1
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Submit your request or space details</h3>
              <p className="text-slate-500 text-sm">Fill out a short form with the information needed to get started.</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <UserCheck className="h-7 w-7 text-slate-600" />
              </div>
              <div className="bg-slate-900 text-white text-sm font-bold px-3 py-1 rounded-full inline-block mb-3">
                Step 2
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Requests are reviewed for completeness</h3>
              <p className="text-slate-500 text-sm">Our team reviews submissions to ensure quality and completeness.</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <MessageSquare className="h-7 w-7 text-slate-600" />
              </div>
              <div className="bg-slate-900 text-white text-sm font-bold px-3 py-1 rounded-full inline-block mb-3">
                Step 3
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">You're contacted if a potential match exists</h3>
              <p className="text-slate-500 text-sm">If there's a potential fit, you'll be notified to discuss next steps.</p>
            </div>
          </div>

          <p className="text-center text-slate-500 text-sm mt-10 pt-6 border-t border-slate-200">
            Submission does not guarantee placement.
          </p>
        </div>
      </section>

      {/* WHY THERE'S A SMALL ACCESS FEE SECTION */}
      <section className="py-16 px-6 md:px-12 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-sky-50 to-emerald-50 rounded-3xl p-8 md:p-12 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 text-center">
              Why there's a small access fee
            </h2>
            <p className="text-slate-600 text-center mb-8 max-w-2xl mx-auto">
              A small access fee helps keep requests organized, reduces spam, and supports platform operations and moderation.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">$25</p>
                    <p className="text-sm text-slate-500">Per request access</p>
                  </div>
                </div>
                <p className="text-slate-600 text-sm">One-time platform access for a single placement request.</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-200 relative">
                <div className="absolute -top-2 right-4 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  Best Value
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Star className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">$49/month</p>
                    <p className="text-sm text-slate-500">Unlimited platform access</p>
                  </div>
                </div>
                <p className="text-slate-600 text-sm">Unlimited placement requests for 30 days.</p>
              </div>
            </div>

            <p className="text-center text-slate-500 text-xs mt-6">
              Access fee applies to professional placement requests only. Individual housing inquiries are free.
            </p>
          </div>
        </div>
      </section>

      {/* TRUST SIGNALS SECTION */}
      <section className="py-16 px-6 md:px-12 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-10">
            Built for real placement challenges
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-7 w-7 text-sky-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Built by providers with real placement experience</h3>
              <p className="text-slate-500 text-sm">We understand the challenges because we've lived them.</p>
            </div>
            
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Designed for compliance-aware agencies</h3>
              <p className="text-slate-500 text-sm">No PHI collected. Built with privacy and compliance in mind.</p>
            </div>
            
            <div className="text-center">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-7 w-7 text-amber-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Created to reduce placement delays and inbox chaos</h3>
              <p className="text-slate-500 text-sm">Structured requests mean faster reviews and less back-and-forth.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-16 px-6 md:px-12 bg-gradient-to-r from-sky-600 to-sky-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-sky-100 mb-8 max-w-2xl mx-auto">
            Join providers and agencies already using Anchor Place to simplify placement coordination.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/onboarding?path=provider")}
              className="h-12 px-6 font-semibold rounded-xl bg-white hover:bg-slate-100 gap-2"
              style={{ color: colors.blue }}
            >
              <Home className="h-5 w-5" />
              List Space
            </Button>
            <Button 
              onClick={() => navigate("/place-client")}
              variant="outline"
              className="h-12 px-6 font-semibold rounded-xl border-2 border-white text-white hover:bg-white/10 gap-2"
            >
              <Briefcase className="h-5 w-5" />
              Submit Request
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 md:px-12 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Anchor Placement" className="h-10 w-10 object-contain" />
              <span className="text-xl font-bold text-white">Anchor Place</span>
            </div>
            <p className="text-sm text-slate-400 text-center max-w-lg">
              Anchor Place is a coordination platform that connects housing providers with placement professionals. 
              We facilitate connections only and do not guarantee placement outcomes.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/how-it-works")} className="text-slate-400 hover:text-white">
                Learn More
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="text-slate-400 hover:text-white">
                Admin
              </Button>
            </div>
          </div>
          
          {/* Legal Links & Disclaimer */}
          <div className="border-t border-slate-700 pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex gap-6">
                <button onClick={() => navigate("/privacy")} className="text-sm text-slate-400 hover:text-white underline">
                  Privacy Policy
                </button>
                <button onClick={() => navigate("/terms")} className="text-sm text-slate-400 hover:text-white underline">
                  Terms of Service
                </button>
                <button onClick={() => navigate("/payment-policy")} className="text-sm text-slate-400 hover:text-white underline">
                  Payment Policy
                </button>
              </div>
              <p className="text-xs text-slate-500 text-center">
                © {new Date().getFullYear()} Anchor Place. Submission does not guarantee placement.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
