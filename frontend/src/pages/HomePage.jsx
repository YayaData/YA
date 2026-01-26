import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900" data-testid="home-page">
      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
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
            className="bg-gold hover:bg-gold/90 text-white px-8 py-6 text-lg"
            data-testid="hero-get-started-btn"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>

        <p className="mt-4 text-sm text-slate-500">
          No payment required to explore the basics.
        </p>
      </section>

      {/* WHO IT'S FOR */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-10">
          <div>
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

          <div>
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
      <section className="max-w-5xl mx-auto px-6 py-16">
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
      </section>

      {/* TWO PATHS */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-10">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-navy mb-3">
              Option 1: Guided Setup
            </h3>
            <p className="text-slate-600">
              Step-by-step checklist, state-specific guidance, readiness tools,
              and optional upgrades for those who want support.
            </p>
            <Link to="/start" className="inline-block mt-4">
              <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-white">
                Start Guided Setup
              </Button>
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-navy mb-3">
              Option 2: Documents Only
            </h3>
            <p className="text-slate-600">
              Purchase Policies & Procedures, hiring packets, supervision documents,
              and site-visit materials without guided setup.
            </p>
            <Link to="/document-shop" className="inline-block mt-4">
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                Browse Documents
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* COST TRANSPARENCY */}
      <section className="max-w-5xl mx-auto px-6 py-16">
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
      </section>

      {/* CTA */}
      <section className="bg-navy py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-slate-300 mb-6 max-w-xl mx-auto px-4">
          Explore the platform for free and decide what level of support you need.
        </p>

        <Link to="/start">
          <Button 
            size="lg" 
            className="bg-gold hover:bg-gold/90 text-white px-8"
            data-testid="cta-enter-platform-btn"
          >
            Enter the Platform
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </section>

      {/* FOOTER DISCLAIMER */}
      <footer className="text-center text-sm text-slate-500 py-8 px-4 border-t border-slate-100">
        This platform provides educational and operational guidance only.
        Always verify requirements with official Medicaid, state, and MCO sources.
      </footer>
    </div>
  );
};

export default HomePage;
