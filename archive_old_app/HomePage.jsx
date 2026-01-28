import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import StateSelector from "@/components/StateSelector";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-[hsl(40,20%,98%)] text-slate-900" data-testid="home-page">
      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="bg-[hsl(40,15%,99%)] rounded-2xl p-8 md:p-12 shadow-sm border border-[hsl(40,15%,92%)]">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-navy mb-6 leading-tight">
            Start a Peer Support Agency — With Clarity, Confidence, and the Right Documents
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-3xl mx-auto">
            A guided platform for Certified Peer Support Specialists and providers who want to start,
            organize, or operate a Peer Support agency — with or without step-by-step guidance.
          </p>

          <Link to="/start">
            <Button 
              size="lg" 
              className="bg-gold hover:bg-gold/90 text-white px-8 py-6 text-lg shadow-md"
              data-testid="hero-get-started-btn"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>

          <p className="mt-4 text-sm text-slate-500">
            No payment required to explore the basics.
          </p>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="bg-[hsl(40,15%,95%)] py-16">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-6">
          <div className="bg-[hsl(40,15%,99%)] p-6 rounded-xl border border-[hsl(40,15%,90%)] shadow-sm">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-navy mb-4">
              This platform is for:
            </h2>
            <ul className="list-disc ml-6 space-y-2 text-slate-700">
              <li>Certified Peer Support Specialists</li>
              <li>Providers starting or expanding a Peer Support agency</li>
              <li>People who want documents, guidance, or both</li>
              <li>Those preparing for Medicaid enrollment or site visits</li>
            </ul>
          </div>

          <div className="bg-[hsl(40,15%,99%)] p-6 rounded-xl border border-[hsl(40,15%,90%)] shadow-sm">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-navy mb-4">
              This platform is NOT:
            </h2>
            <ul className="list-disc ml-6 space-y-2 text-slate-700">
              <li>Therapy or clinical services</li>
              <li>Legal advice</li>
              <li>A replacement for official Medicaid or state guidance</li>
            </ul>
          </div>
        </div>
      </section>

      {/* WHAT YOU CAN DO */}
      <section className="bg-[hsl(40,20%,98%)] py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-[hsl(40,15%,99%)] p-6 md:p-8 rounded-xl border border-[hsl(40,15%,90%)] shadow-sm">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-navy mb-6">
              What you can do here
            </h2>
            <ul className="list-disc ml-6 space-y-2 text-slate-700">
              <li>Follow an optional step-by-step guided setup</li>
              <li>Purchase required documents only if you already know the process</li>
              <li>Prepare for site visits and reviews</li>
              <li>Understand estimated startup and operating costs</li>
              <li>Avoid common mistakes that delay approval</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SELECT YOUR STATE */}
      <section className="bg-[hsl(40,15%,95%)] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-navy mb-3">
              Select Your State
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              All 50 states are available. States with full guidance have complete step-by-step instructions.
              All states have access to universal roadmap, documents, and planning tools.
            </p>
          </div>
          <StateSelector />
        </div>
      </section>

      {/* TWO PATHS */}
      <section className="bg-[hsl(40,15%,95%)] py-16">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-6">
          <div className="bg-[hsl(40,15%,99%)] p-6 rounded-xl border border-[hsl(40,15%,90%)] shadow-sm">
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-navy mb-3">
              Option 1: Guided Setup
            </h3>
            <p className="text-slate-600 mb-4">
              Step-by-step checklist, state-specific guidance, readiness tools,
              and optional upgrades for those who want support.
            </p>
            <Link to="/start">
              <Button className="bg-gold hover:bg-gold/90 text-white shadow-sm">
                Start Guided Setup
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="bg-[hsl(40,15%,99%)] p-6 rounded-xl border border-[hsl(40,15%,90%)] shadow-sm">
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-navy mb-3">
              Option 2: Documents Only
            </h3>
            <p className="text-slate-600 mb-4">
              Purchase Policies & Procedures, hiring packets, supervision documents,
              and site-visit materials without guided setup.
            </p>
            <Link to="/document-shop">
              <Button variant="outline" className="border-[hsl(40,15%,85%)] text-slate-700 hover:bg-[hsl(40,15%,95%)]">
                Browse Documents
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* COST TRANSPARENCY */}
      <section className="bg-[hsl(40,20%,98%)] py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-[hsl(40,15%,99%)] p-6 md:p-8 rounded-xl border border-[hsl(40,15%,90%)] shadow-sm">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-navy mb-4">
              Estimated Costs
            </h2>
            <p className="text-slate-700 mb-4">
              Most Peer Support agencies start with:
            </p>
            <ul className="list-disc ml-6 space-y-2 text-slate-700">
              <li>One-time setup: approximately $300–$2,000</li>
              <li>Monthly operating costs: approximately $550–$2,500</li>
            </ul>
            <p className="mt-4 text-sm text-slate-500">
              Costs vary by state, staffing model, and payer requirements.
              This platform helps you plan — not pressure you.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-16 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-slate-300 mb-6 max-w-xl mx-auto">
            Explore the platform for free and decide what level of support you need.
          </p>

          <Link to="/start">
            <Button 
              size="lg" 
              className="bg-gold hover:bg-gold/90 text-white px-8 shadow-md"
              data-testid="cta-enter-platform-btn"
            >
              Enter the Platform
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FOOTER DISCLAIMER */}
      <footer className="bg-[hsl(40,15%,95%)] text-center text-sm text-slate-500 py-8 px-4 border-t border-[hsl(40,15%,90%)]">
        This platform provides educational and operational guidance only.
        Always verify requirements with official Medicaid, state, and MCO sources.
      </footer>
    </div>
  );
};

export default HomePage;
