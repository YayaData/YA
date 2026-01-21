import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, Users, Search, CheckCircle, ArrowRight, 
  Globe, Heart, Shield, Zap, ArrowDown, Sparkles
} from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_anchor-place/artifacts/a2v0mwtd_image.png";

// Brand colors
const colors = {
  blue: "#1F4FD8",
  teal: "#1CB5A3",
  gold: "#F4B400",
  dark: "#1F2937"
};

// Caregiving images
const images = {
  hero: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1600&auto=format&fit=crop",
  caregiver: "https://images.pexels.com/photos/7551622/pexels-photo-7551622.jpeg?w=800&auto=format&fit=crop",
  provider: "https://images.unsplash.com/photo-1666066894547-749f0272a630?w=800&auto=format&fit=crop",
  agency: "https://images.pexels.com/photos/7979597/pexels-photo-7979597.jpeg?w=800&auto=format&fit=crop",
  community: "https://images.unsplash.com/photo-1641135309825-4d703d0225a8?w=1200&auto=format&fit=crop",
  hands: "https://images.unsplash.com/photo-1739932885175-5fdaa1bd5989?w=1200&auto=format&fit=crop"
};

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <header className="w-full py-4 px-6 md:px-12 bg-white/90 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
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

      {/* HERO SECTION WITH BACKGROUND IMAGE */}
      <section className="relative min-h-[600px] flex items-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${images.hero})`,
          }}
        >
          {/* Gradient Overlay */}
          <div 
            className="absolute inset-0"
            style={{ 
              background: `linear-gradient(135deg, rgba(31,79,216,0.85) 0%, rgba(28,181,163,0.75) 100%)`
            }}
          ></div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full px-6 md:px-12 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-['Poppins'] leading-tight mb-6 text-white">
                A Centralized Placement Network for Care-Based Housing
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 font-['Inter']">
                Post available space or match clients to approved care-based housing — all in one secure platform.
              </p>
              
              {/* Primary CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Button 
                  onClick={() => navigate("/onboarding?path=provider")}
                  data-testid="have-space-btn"
                  className="h-14 px-8 text-lg font-semibold font-['Poppins'] rounded-xl shadow-lg hover:shadow-xl transition-all text-gray-900"
                  style={{ background: colors.gold }}
                >
                  <Home className="mr-2 h-5 w-5" />
                  I Have Space to Share
                </Button>
                <Button 
                  onClick={() => navigate("/onboarding?path=agency")}
                  data-testid="need-place-btn"
                  className="h-14 px-8 text-lg font-semibold font-['Poppins'] rounded-xl shadow-lg hover:shadow-xl transition-all bg-white hover:bg-gray-100"
                  style={{ color: colors.blue }}
                >
                  <Search className="mr-2 h-5 w-5" />
                  I Need to Place a Client
                </Button>
              </div>

              {/* Secondary CTA */}
              <Button 
                onClick={() => navigate("/onboarding")}
                variant="outline"
                className="h-12 px-6 text-base font-medium rounded-xl border-white/40 text-white hover:bg-white/10 mb-8"
              >
                See If I Qualify
              </Button>

              {/* Trust Reassurance */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-lg">
                <p className="text-white/90 text-sm">
                  <strong className="text-yellow-300">You don't need experience. You're not alone.</strong><br />
                  We guide you through requirements, safety checks, and next steps.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="py-10" style={{ background: 'linear-gradient(180deg, #F7FBFF 0%, #EAF4FF 100%)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${colors.blue}15` }}>
                <Globe className="h-7 w-7" style={{ color: colors.blue }} />
              </div>
              <span className="font-semibold text-gray-700">Works Nationwide</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${colors.teal}15` }}>
                <Heart className="h-7 w-7" style={{ color: colors.teal }} />
              </div>
              <span className="font-semibold text-gray-700">IDD, Mental Health, Aging & Transitional Care</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${colors.gold}20` }}>
                <Sparkles className="h-7 w-7" style={{ color: colors.gold }} />
              </div>
              <span className="font-semibold text-gray-700">Free to List Space</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${colors.blue}15` }}>
                <Shield className="h-7 w-7" style={{ color: colors.blue }} />
              </div>
              <span className="font-semibold text-gray-700">Built for Providers & Professionals</span>
            </div>
          </div>
        </div>
      </section>

      {/* WHO THIS IS FOR - TWO CARDS WITH IMAGES */}
      <section className="px-6 md:px-12 py-20" style={{ background: `linear-gradient(180deg, ${colors.teal}08 0%, ${colors.blue}05 100%)` }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-['Poppins'] text-center mb-4" style={{ color: colors.dark }}>
            Who Is Anchor Placement For?
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            The platform brings together two groups that need each other
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* PROVIDERS CARD */}
            <Card className="rounded-3xl shadow-xl border-0 overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="h-56 overflow-hidden">
                <img 
                  src={images.provider} 
                  alt="Welcoming home entrance"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-2" style={{ background: colors.blue }}></div>
              <CardContent className="p-8 bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${colors.blue}15` }}>
                    <Home className="h-6 w-6" style={{ color: colors.blue }} />
                  </div>
                  <h3 className="text-2xl font-bold font-['Poppins']" style={{ color: colors.dark }}>
                    Have space in your home or rental property?
                  </h3>
                </div>
                <p className="text-gray-600 text-lg mb-6">
                  List your spare room, unit, or bed and connect with agencies and professionals actively looking to place clients. We work with both everyday homeowners and housing providers.
                </p>
                <div className="space-y-2 mb-6">
                  <p className="text-sm text-gray-500 font-medium">Perfect for:</p>
                  <div className="flex flex-wrap gap-2">
                    {["Homeowners & renters", "AFL and Respite providers", "Group homes", "Supportive housing"].map((item) => (
                      <span key={item} className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: `${colors.blue}12`, color: colors.blue }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <Button 
                  onClick={() => navigate("/onboarding?path=provider")}
                  className="w-full h-12 text-lg font-semibold font-['Poppins'] rounded-xl"
                  style={{ background: colors.gold, color: colors.dark }}
                >
                  List Available Space
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>

            {/* AGENCIES CARD */}
            <Card className="rounded-3xl shadow-xl border-0 overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="h-56 overflow-hidden">
                <img 
                  src={images.agency} 
                  alt="Professional meeting with family"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-2" style={{ background: colors.teal }}></div>
              <CardContent className="p-8 bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${colors.teal}15` }}>
                    <Users className="h-6 w-6" style={{ color: colors.teal }} />
                  </div>
                  <h3 className="text-2xl font-bold font-['Poppins']" style={{ color: colors.dark }}>
                    Need to Place a Client?
                  </h3>
                </div>
                <p className="text-gray-600 text-lg mb-6">
                  Search real availability instead of making dozens of calls. Find providers ready to accept placements.
                </p>
                <div className="space-y-2 mb-6">
                  <p className="text-sm text-gray-500 font-medium">Perfect for:</p>
                  <div className="flex flex-wrap gap-2">
                    {["Social Workers", "Hospitals", "Care Coordinators", "MCOs"].map((item) => (
                      <span key={item} className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: `${colors.teal}12`, color: colors.teal }}>
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

      {/* WHY ANCHOR PLACEMENT EXISTS - WITH IMAGE */}
      <section className="relative py-20 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${images.hands})` }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(31,79,216,0.92) 0%, rgba(28,181,163,0.88) 100%)' }}></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold font-['Poppins'] mb-8 text-white">
            Placements Shouldn't Take Weeks
          </h2>
          <div className="text-xl md:text-2xl text-white/90 space-y-4 mb-10">
            <p><span className="font-semibold text-yellow-300">Families wait.</span></p>
            <p><span className="font-semibold text-yellow-300">Hospitals hold discharges.</span></p>
            <p><span className="font-semibold text-yellow-300">Providers sit with empty space.</span></p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 max-w-xl mx-auto">
            <p className="text-xl text-white font-medium">
              Anchor Placement removes confusion and delays by bringing everyone into <span className="text-yellow-300 font-bold">one shared system</span>.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - VISUAL DIAGRAM */}
      <section className="px-6 md:px-12 py-20" style={{ background: `linear-gradient(180deg, ${colors.teal}10 0%, #F7FBFF 100%)` }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-['Poppins'] text-center mb-4" style={{ color: colors.dark }}>
            The Anchor Placement Ecosystem
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12">
            How providers and placement professionals work together
          </p>

          <div className="flex flex-col items-center gap-4">
            {/* Step 1 */}
            <Card className="w-full max-w-xl rounded-2xl shadow-lg border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="w-20 flex items-center justify-center" style={{ background: colors.blue }}>
                    <Home className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1 p-5 bg-white">
                    <h3 className="text-lg font-bold font-['Poppins'] mb-1" style={{ color: colors.blue }}>Providers List Available Space</h3>
                    <p className="text-gray-600">Homes, beds, and units are listed in one secure system.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ArrowDown className="h-10 w-10" style={{ color: colors.gold }} />

            {/* Step 2 */}
            <Card className="w-full max-w-xl rounded-2xl shadow-lg border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="w-20 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})` }}>
                    <img src={LOGO_URL} alt="Anchor" className="h-10 w-10 object-contain" />
                  </div>
                  <div className="flex-1 p-5 bg-white">
                    <h3 className="text-lg font-bold font-['Poppins'] mb-1" style={{ color: colors.teal }}>Anchor Placement Database</h3>
                    <p className="text-gray-600">All listings are organized and searchable nationwide.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ArrowDown className="h-10 w-10" style={{ color: colors.gold }} />

            {/* Step 3 */}
            <Card className="w-full max-w-xl rounded-2xl shadow-lg border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="w-20 flex items-center justify-center" style={{ background: colors.teal }}>
                    <Search className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1 p-5 bg-white">
                    <h3 className="text-lg font-bold font-['Poppins'] mb-1" style={{ color: colors.teal }}>Agencies & Professionals Search</h3>
                    <p className="text-gray-600">Social workers and agencies find real availability without endless calls.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ArrowDown className="h-10 w-10" style={{ color: colors.gold }} />

            {/* Step 4 */}
            <Card className="w-full max-w-xl rounded-2xl shadow-xl border-0 overflow-hidden" style={{ boxShadow: `0 8px 40px ${colors.gold}30` }}>
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="w-20 flex items-center justify-center" style={{ background: colors.gold }}>
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1 p-5" style={{ background: `linear-gradient(90deg, ${colors.gold}10, white)` }}>
                    <h3 className="text-lg font-bold font-['Poppins'] mb-1" style={{ color: colors.dark }}>Faster Placements & Filled Homes</h3>
                    <p className="text-gray-600">Clients are placed sooner. Providers grow sustainably.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section className="px-6 md:px-12 py-20" style={{ background: 'linear-gradient(180deg, #F7FBFF 0%, #EAF4FF 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-['Poppins'] text-center mb-12" style={{ color: colors.dark }}>
            Everyone Benefits When We Work Together
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Providers Benefits */}
            <Card className="rounded-2xl shadow-lg border-0 overflow-hidden">
              <div className="h-2" style={{ background: colors.blue }}></div>
              <CardContent className="p-8 bg-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `${colors.blue}15` }}>
                    <Home className="h-7 w-7" style={{ color: colors.blue }} />
                  </div>
                  <h3 className="text-xl font-bold font-['Poppins']" style={{ color: colors.blue }}>Providers Benefit:</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "More visibility to agencies and professionals",
                    "Faster placements with less waiting",
                    "Less outreach and marketing needed",
                    "Fewer empty beds and units"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 mt-0.5 flex-shrink-0" style={{ color: colors.gold }} />
                      <span className="text-gray-700 text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Agencies Benefits */}
            <Card className="rounded-2xl shadow-lg border-0 overflow-hidden">
              <div className="h-2" style={{ background: colors.teal }}></div>
              <CardContent className="p-8 bg-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `${colors.teal}15` }}>
                    <Users className="h-7 w-7" style={{ color: colors.teal }} />
                  </div>
                  <h3 className="text-xl font-bold font-['Poppins']" style={{ color: colors.teal }}>Agencies Benefit:</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Real-time availability information",
                    "Faster placements for clients in need",
                    "Less follow-up and phone tag",
                    "Better client outcomes"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 mt-0.5 flex-shrink-0" style={{ color: colors.gold }} />
                      <span className="text-gray-700 text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* BUILT FOR REAL PEOPLE - WITH IMAGE */}
      <section className="relative py-24 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${images.community})` }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(244,180,0,0.85) 0%, rgba(28,181,163,0.80) 100%)' }}></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 md:px-12">
          <h2 className="text-3xl md:text-5xl font-bold font-['Poppins'] mb-6 text-white">
            Built for Real People
          </h2>
          <p className="text-xl md:text-2xl text-white/95 mb-4">
            Anchor Placement was designed for real caregivers and professionals — <strong>not tech experts</strong>.
          </p>
          <p className="text-lg md:text-xl text-white/90">
            If you can fill out a form, you can use this platform.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 md:px-12 py-24" style={{ background: 'linear-gradient(180deg, #EAF4FF 0%, #F7FBFF 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold font-['Poppins'] mb-6" style={{ color: colors.dark }}>
            Start Where You Are
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Join the growing community of providers and professionals working together.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              onClick={() => navigate("/onboarding?path=provider")}
              data-testid="final-have-space-btn"
              className="h-16 px-10 text-xl font-semibold font-['Poppins'] rounded-2xl shadow-lg hover:shadow-xl transition-all text-gray-900"
              style={{ background: colors.gold }}
            >
              <Home className="mr-3 h-6 w-6" />
              I Have Space Available
            </Button>
            <Button 
              onClick={() => navigate("/onboarding?path=agency")}
              data-testid="final-need-place-btn"
              className="h-16 px-10 text-xl font-semibold font-['Poppins'] rounded-2xl shadow-lg hover:shadow-xl transition-all"
              style={{ background: colors.teal }}
            >
              <Search className="mr-3 h-6 w-6" />
              I Need to Place a Client
            </Button>
          </div>

          <p className="text-gray-500">
            Registration is simple. Support is available. <strong className="text-gray-700">You are not alone.</strong>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 md:px-12" style={{ background: colors.dark }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Anchor Placement" className="h-10 w-10 object-contain" />
              <span className="text-xl font-bold font-['Poppins'] text-white">Anchor Placement</span>
            </div>
            <p className="text-sm text-gray-400 text-center max-w-lg">
              Anchor Placement™ coordinates referrals and availability. Medicaid billing and licensing guidance is provided in AnchorAxis.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/how-it-works")} className="text-gray-400 hover:text-white">
                Learn More
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="text-gray-400 hover:text-white">
                Admin
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
