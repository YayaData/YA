import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, HelpCircle, Lightbulb, Anchor } from "lucide-react";

const actionCards = [
  {
    id: "place-client",
    title: "Place a Client (Case Managers & Agencies)",
    description: "Submit a placement request for someone who needs housing or care services.",
    icon: Users,
    path: "/place-client",
    image: "https://images.unsplash.com/photo-1659353888906-adb3e0041693?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3MjQyMTd8MHwxfHNlYXJjaHwxfHxmcmllbmRseSUyMGRpdmVyc2UlMjBoZWFsdGhjYXJlJTIwcHJvZmVzc2lvbmFsJTIwcG9ydHJhaXR8ZW58MHx8fHwxNzY4NDA1MjEyfDA&ixlib=rb-4.1.0&q=85&w=400",
    color: "bg-sky-50 hover:bg-sky-100",
    iconColor: "text-sky-600"
  },
  {
    id: "list-placements",
    title: "Offer a Placement (Providers & Homeowners)",
    description: "Browse current openings at facilities and housing programs in your area.",
    icon: Building2,
    path: "/placements",
    image: "https://images.unsplash.com/photo-1758548157747-285c7012db5b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3MjQyMTd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBicmlnaHQlMjBjbGVhbiUyMGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8fHx8MTc2ODQwNTIxNnww&ixlib=rb-4.1.0&q=85&w=400",
    color: "bg-emerald-50 hover:bg-emerald-100",
    iconColor: "text-emerald-600"
  },
  {
    id: "how-it-works",
    title: "Learn How Placement Works",
    description: "New to placement coordination? Start here for a step-by-step guide.",
    icon: HelpCircle,
    path: "/how-it-works",
    image: "https://images.unsplash.com/photo-1763982811982-e4901b18bbe3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwyfHxjb21wYXNzaW9uYXRlJTIwc3VwcG9ydCUyMGhlbHBpbmclMjBoYW5kc3xlbnwwfHx8fDE3Njg0MDUyMTd8MA&ixlib=rb-4.1.0&q=85&w=400",
    color: "bg-violet-50 hover:bg-violet-100",
    iconColor: "text-violet-600"
  },
  {
    id: "start-idea",
    title: "Explore Starting a Placement",
    description: "Interested in providing housing or care services? Let's explore the possibilities.",
    icon: Lightbulb,
    path: "/start-idea",
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&auto=format&fit=crop",
    color: "bg-amber-50 hover:bg-amber-100",
    iconColor: "text-amber-600"
  }
];

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="w-full py-6 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="p-2 bg-sky-600 rounded-xl">
            <Anchor className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-semibold text-slate-900 font-['Manrope']">Anchor Place</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 md:px-12 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-in" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4 font-['Manrope']">
              Coordinate housing placements and referrals in one place
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Select the option below that matches your role. You'll be guided step by step.
            </p>
          </div>

          {/* Start Here Guidance */}
          <div className="max-w-2xl mx-auto mb-12 text-center animate-in" style={{ animationDelay: '0.2s' }}>
            <div className="inline-block px-4 py-1.5 bg-sky-100 text-sky-700 rounded-full text-sm font-semibold mb-4">
              Start Here
            </div>
            <div className="text-slate-600 space-y-1">
              <p>This tool helps coordinate housing placements and referrals.</p>
              <p>Choose the option below based on your role.</p>
              <p>You'll be guided step by step — no prior setup required.</p>
            </div>
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {actionCards.map((card, index) => {
              const IconComponent = card.icon;
              return (
                <Card 
                  key={card.id}
                  data-testid={`action-card-${card.id}`}
                  className={`cursor-pointer border border-slate-200 shadow-sm card-hover overflow-hidden animate-in stagger-${index + 1}`}
                  onClick={() => navigate(card.path)}
                >
                  <div className="h-40 overflow-hidden">
                    <img 
                      src={card.image} 
                      alt={card.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                  <CardContent className={`p-6 ${card.color} transition-colors duration-300`}>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl bg-white shadow-sm`}>
                        <IconComponent className={`h-6 w-6 ${card.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-slate-900 mb-2 font-['Manrope']">
                          {card.title}
                        </h2>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Privacy Notice */}
          <div className="mt-16 text-center animate-in" style={{ animationDelay: '0.5s' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-sm text-slate-600">
                This tool does not collect or store protected health information
              </span>
            </div>
          </div>

          {/* Compliance Disclaimer */}
          <div className="mt-12 max-w-2xl mx-auto text-center animate-in" style={{ animationDelay: '0.6s' }}>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Disclaimer</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Anchor Place™ is a placement coordination and availability tool only. 
              It does not store protected health information (PHI), make placement decisions, or guarantee placement outcomes. 
              All placements are subject to provider acceptance, agency approval, and applicable state and federal regulations.
            </p>
          </div>

          {/* Pricing Notice */}
          <div className="mt-8 max-w-2xl mx-auto text-center animate-in" style={{ animationDelay: '0.7s' }}>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Pricing Notice</h3>
            <div className="text-sm text-slate-500 leading-relaxed space-y-2">
              <p>Anchor Place™ is offered as a subscription service for housing and care providers.</p>
              <p><span className="font-medium text-slate-600">Provider Access:</span> $29.99 per month per provider location.</p>
              <p>This includes listing placement availability and receiving placement inquiries.</p>
              <p>Placement seekers (hospitals, social workers, LMEs, reentry programs) may use the platform at no cost during the pilot phase.</p>
              <p>Billing and payment setup are handled during provider onboarding.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-12 border-t border-slate-100">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-slate-500">
            Anchor Place – Client Placement Coordination Tool
          </p>
        </div>
      </footer>
    </div>
  );
}
