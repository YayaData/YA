import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, Users, Search, CheckCircle, ArrowRight, 
  Globe, Heart, Shield, Zap, Phone, Clock, 
  Building2, UserCheck, ArrowDown, Sparkles
} from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_anchor-place/artifacts/a2v0mwtd_image.png";

// Brand colors
const colors = {
  blue: "#1F4FD8",
  teal: "#1CB5A3",
  gold: "#F4B400",
  dark: "#1F2937"
};

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #F7FBFF 0%, #EAF4FF 100%)' }}>
      {/* Navigation Header */}
      <header className="w-full py-4 px-6 md:px-12 bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Anchor Placement" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold font-['Poppins']" style={{ color: colors.blue }}>
              Anchor Placement
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/how-it-works")}
              className="hidden md:flex text-gray-600 hover:text-gray-900"
            >
              How It Works
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/admin")}
              className="border-gray-300"
            >
              Admin
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-['Poppins'] leading-tight mb-6" style={{ color: colors.dark }}>
              Connecting Available Homes with People Who Need to Place Clients
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-6 font-['Inter']">
              Anchor Placement makes it easy for providers with available space and professionals who need placements to find each other — <span className="font-semibold" style={{ color: colors.teal }}>quickly, clearly, and nationwide</span>.
            </p>
            <div className="flex flex-col md:flex-row gap-3 justify-center text-gray-500 mb-10">
              <span className="flex items-center gap-2"><CheckCircle className="h-5 w-5" style={{ color: colors.teal }} /> No endless phone calls</span>
              <span className="flex items-center gap-2"><CheckCircle className="h-5 w-5" style={{ color: colors.teal }} /> No guessing who has openings</span>
              <span className="flex items-center gap-2"><CheckCircle className="h-5 w-5" style={{ color: colors.teal }} /> No waiting weeks</span>
            </div>
            
            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate("/onboarding?path=provider")}
                data-testid="have-space-btn"
                className="h-14 px-8 text-lg font-semibold font-['Poppins'] rounded-xl shadow-lg hover:shadow-xl transition-all"
                style={{ background: colors.blue }}
              >
                <Home className="mr-2 h-5 w-5" />
                I Have Space Available
              </Button>
              <Button 
                onClick={() => navigate("/onboarding?path=agency")}
                data-testid="need-place-btn"
                className="h-14 px-8 text-lg font-semibold font-['Poppins'] rounded-xl shadow-lg hover:shadow-xl transition-all"
                style={{ background: colors.teal }}
              >
                <Search className="mr-2 h-5 w-5" />
                I Need to Place a Client
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="py-8 bg-white/60 border-y border-blue-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Globe className="h-8 w-8" style={{ color: colors.blue }} />
              <span className="font-medium text-gray-700">Works Nationwide</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Heart className="h-8 w-8" style={{ color: colors.teal }} />
              <span className="font-medium text-gray-700">IDD, Mental Health, Aging & Transitional Care</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Sparkles className="h-8 w-8" style={{ color: colors.gold }} />
              <span className="font-medium text-gray-700">Free to List Space</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Shield className="h-8 w-8" style={{ color: colors.blue }} />
              <span className="font-medium text-gray-700">Built for Providers & Professionals</span>
            </div>
          </div>
        </div>
      </section>

      {/* WHO THIS IS FOR - TWO CARDS */}
      <section className="px-6 md:px-12 py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-['Poppins'] text-center mb-12" style={{ color: colors.dark }}>
            Who Is Anchor Placement For?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* PROVIDERS CARD */}
            <Card className="rounded-3xl shadow-xl border-0 overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="h-3" style={{ background: colors.blue }}></div>
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: `${colors.blue}15` }}>
                  <Home className="h-8 w-8" style={{ color: colors.blue }} />
                </div>
                <h3 className="text-2xl font-bold font-['Poppins'] mb-4" style={{ color: colors.dark }}>
                  Have Available Space?
                </h3>
                <p className="text-gray-600 text-lg mb-6">
                  List open beds, rooms, or units and connect with agencies and professionals actively looking to place clients.
                </p>
                <div className="space-y-2 mb-8">
                  <p className="text-sm text-gray-500 font-medium">Perfect for:</p>
                  <div className="flex flex-wrap gap-2">
                    {["AFL / Alternative Family Living", "Respite Providers", "Group Homes", "Supportive Housing", "Individuals with Extra Space"].map((item) => (
                      <span key={item} className="px-3 py-1 rounded-full text-sm" style={{ background: `${colors.blue}10`, color: colors.blue }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <Button 
                  onClick={() => navigate("/onboarding?path=provider")}
                  className="w-full h-12 text-lg font-semibold font-['Poppins'] rounded-xl"
                  style={{ background: colors.blue }}
                >
                  List Available Space
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>

            {/* AGENCIES CARD */}
            <Card className="rounded-3xl shadow-xl border-0 overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="h-3" style={{ background: colors.teal }}></div>
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: `${colors.teal}15` }}>
                  <Users className="h-8 w-8" style={{ color: colors.teal }} />
                </div>
                <h3 className="text-2xl font-bold font-['Poppins'] mb-4" style={{ color: colors.dark }}>
                  Need to Place a Client?
                </h3>
                <p className="text-gray-600 text-lg mb-6">
                  Search real availability instead of making dozens of calls. Find providers ready to accept placements.
                </p>
                <div className="space-y-2 mb-8">
                  <p className="text-sm text-gray-500 font-medium">Perfect for:</p>
                  <div className="flex flex-wrap gap-2">
                    {["Social Workers", "Discharge Planners", "Hospitals", "Care Coordinators", "Agencies & MCOs"].map((item) => (
                      <span key={item} className="px-3 py-1 rounded-full text-sm" style={{ background: `${colors.teal}10`, color: colors.teal }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <Button 
                  onClick={() => navigate("/onboarding?path=agency")}
                  className="w-full h-12 text-lg font-semibold font-['Poppins'] rounded-xl"
                  style={{ background: colors.teal }}
                >
                  Find Placement Options
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* WHY ANCHOR PLACEMENT EXISTS */}
      <section className="px-6 md:px-12 py-16 md:py-20 bg-white/60">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-['Poppins'] mb-6" style={{ color: colors.dark }}>
            Placements Shouldn't Take Weeks
          </h2>
          <div className="text-xl text-gray-600 space-y-3 mb-8">
            <p><span className="font-semibold text-gray-800">Families wait.</span></p>
            <p><span className="font-semibold text-gray-800">Hospitals hold discharges.</span></p>
            <p><span className="font-semibold text-gray-800">Providers sit with empty space.</span></p>
          </div>
          <p className="text-xl" style={{ color: colors.teal }}>
            <strong>Anchor Placement removes confusion and delays</strong> by bringing everyone into one shared system.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS - VISUAL DIAGRAM */}
      <section className="px-6 md:px-12 py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-['Poppins'] text-center mb-4" style={{ color: colors.dark }}>
            The Anchor Placement Ecosystem
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12">
            How providers and placement professionals work together
          </p>

          <div className="flex flex-col items-center gap-6">
            {/* Step 1 */}
            <Card className="w-full max-w-lg rounded-2xl shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: colors.blue }}>
                  <Home className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-['Poppins']" style={{ color: colors.blue }}>Providers List Available Space</h3>
                  <p className="text-gray-600">Homes, beds, and units are listed in one secure system.</p>
                </div>
              </CardContent>
            </Card>

            <ArrowDown className="h-8 w-8" style={{ color: colors.gold }} />

            {/* Step 2 */}
            <Card className="w-full max-w-lg rounded-2xl shadow-lg border-2 border-teal-100 hover:border-teal-300 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})` }}>
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-['Poppins']" style={{ color: colors.teal }}>Anchor Placement Database</h3>
                  <p className="text-gray-600">All listings are organized and searchable nationwide.</p>
                </div>
              </CardContent>
            </Card>

            <ArrowDown className="h-8 w-8" style={{ color: colors.gold }} />

            {/* Step 3 */}
            <Card className="w-full max-w-lg rounded-2xl shadow-lg border-2 border-teal-100 hover:border-teal-300 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: colors.teal }}>
                  <Search className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-['Poppins']" style={{ color: colors.teal }}>Agencies & Professionals Search</h3>
                  <p className="text-gray-600">Social workers and agencies find real availability without endless calls.</p>
                </div>
              </CardContent>
            </Card>

            <ArrowDown className="h-8 w-8" style={{ color: colors.gold }} />

            {/* Step 4 */}
            <Card className="w-full max-w-lg rounded-2xl shadow-lg border-2 hover:shadow-xl transition-all" style={{ borderColor: colors.gold, background: `linear-gradient(135deg, ${colors.gold}10, ${colors.teal}10)` }}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: colors.gold }}>
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-['Poppins']" style={{ color: colors.dark }}>Faster Placements & Filled Homes</h3>
                  <p className="text-gray-600">Clients are placed sooner. Providers grow sustainably.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section className="px-6 md:px-12 py-16 md:py-20 bg-white/60">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-['Poppins'] text-center mb-12" style={{ color: colors.dark }}>
            Everyone Benefits When We Work Together
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Providers Benefits */}
            <Card className="rounded-2xl shadow-lg border-0">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${colors.blue}15` }}>
                    <Home className="h-6 w-6" style={{ color: colors.blue }} />
                  </div>
                  <h3 className="text-xl font-bold font-['Poppins']" style={{ color: colors.blue }}>Providers Benefit Because:</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "More visibility to agencies and professionals",
                    "Faster placements with less waiting",
                    "Less outreach and marketing needed",
                    "Fewer empty beds and units"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: colors.blue }} />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Agencies Benefits */}
            <Card className="rounded-2xl shadow-lg border-0">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${colors.teal}15` }}>
                    <Users className="h-6 w-6" style={{ color: colors.teal }} />
                  </div>
                  <h3 className="text-xl font-bold font-['Poppins']" style={{ color: colors.teal }}>Agencies Benefit Because:</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Real-time availability information",
                    "Faster placements for clients in need",
                    "Less follow-up and phone tag",
                    "Better client outcomes"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: colors.teal }} />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* BUILT FOR REAL PEOPLE */}
      <section className="px-6 md:px-12 py-16 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6" style={{ background: `${colors.gold}20` }}>
            <UserCheck className="h-10 w-10" style={{ color: colors.gold }} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-['Poppins'] mb-6" style={{ color: colors.dark }}>
            Built for Real People
          </h2>
          <p className="text-xl text-gray-600 mb-4">
            Anchor Placement was designed for real caregivers and professionals — <strong>not tech experts</strong>.
          </p>
          <p className="text-lg text-gray-500">
            If you can fill out a form, you can use this platform.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 md:px-12 py-16 md:py-24" style={{ background: `linear-gradient(135deg, ${colors.blue}08, ${colors.teal}08)` }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-['Poppins'] mb-6" style={{ color: colors.dark }}>
            Start Where You Are
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Join the growing community of providers and professionals working together.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              onClick={() => navigate("/onboarding?path=provider")}
              data-testid="final-have-space-btn"
              className="h-14 px-8 text-lg font-semibold font-['Poppins'] rounded-xl shadow-lg hover:shadow-xl transition-all"
              style={{ background: colors.blue }}
            >
              <Home className="mr-2 h-5 w-5" />
              I Have Space Available
            </Button>
            <Button 
              onClick={() => navigate("/onboarding?path=agency")}
              data-testid="final-need-place-btn"
              className="h-14 px-8 text-lg font-semibold font-['Poppins'] rounded-xl shadow-lg hover:shadow-xl transition-all"
              style={{ background: colors.teal }}
            >
              <Search className="mr-2 h-5 w-5" />
              I Need to Place a Client
            </Button>
          </div>

          <p className="text-sm text-gray-500">
            Registration is simple. Support is available. <strong>You are not alone.</strong>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 md:px-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Anchor Placement" className="h-8 w-8 object-contain" />
              <span className="font-bold font-['Poppins']" style={{ color: colors.blue }}>Anchor Placement</span>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Anchor Placement™ coordinates referrals and availability. Medicaid billing and licensing guidance is provided in AnchorAxis.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/how-it-works")} className="text-gray-600">
                Learn More
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="text-gray-600">
                Admin
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
