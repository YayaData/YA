import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Briefcase, User } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_anchor-placement/artifacts/a2v0mwtd_image.png";

export default function PlacementChoice() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="w-full py-6 px-6 md:px-12 border-b border-slate-100">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            data-testid="back-to-home"
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img src={LOGO_URL} alt="Anchor Placement" className="h-8 w-8" />
          <span className="text-lg font-semibold text-slate-900 font-['Manrope']">Anchor Placement</span>
        </div>
      </header>

      <main className="px-6 md:px-12 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              How are you submitting a placement?
            </h1>
            <p className="text-slate-600 text-lg">
              Please select the option that best describes your situation. This helps us route your request correctly.
            </p>
          </div>

          {/* Choice Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* OPTION 1: Professional (PAID) */}
            <Card 
              className="border-2 border-slate-200 hover:border-sky-400 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate("/place-client")}
              data-testid="choice-professional"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                    <Briefcase className="h-6 w-6 text-sky-600" />
                  </div>
                  <span className="bg-sky-100 text-sky-700 text-xs font-semibold px-3 py-1 rounded-full">
                    Payment Required
                  </span>
                </div>
                
                <h2 className="text-lg font-bold text-slate-900 mb-2">
                  I am a professional placing a client
                </h2>
                <p className="text-slate-500 text-sm mb-4">
                  Agencies, hospitals, social workers, case managers, providers
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 text-sm text-slate-600 leading-relaxed">
                  <p className="mb-2">
                    Submitting a placement as a professional requires payment.
                  </p>
                  <p className="mb-2">You may choose:</p>
                  <ul className="list-disc list-inside mb-2 ml-1">
                    <li>$25 per placement, or</li>
                    <li>$49/month for unlimited placements.</li>
                  </ul>
                  <p>
                    Payment provides access to placement submission and review tools. Placement is not guaranteed.
                  </p>
                </div>

                <Button className="w-full bg-sky-600 hover:bg-sky-700 gap-2" data-testid="btn-professional">
                  Continue as Professional
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* OPTION 2: Individual (FREE) */}
            <Card 
              className="border-2 border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate("/submit-request")}
              data-testid="choice-individual"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <User className="h-6 w-6 text-emerald-600" />
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
                    Free to Submit
                  </span>
                </div>
                
                <h2 className="text-lg font-bold text-slate-900 mb-2">
                  I am an individual seeking housing
                </h2>
                <p className="text-slate-500 text-sm mb-4">
                  Self-referrals or family members seeking placement
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 text-sm text-slate-600 leading-relaxed">
                  <p className="mb-2">
                    There is no cost to submit an individual request.
                  </p>
                  <p className="mb-2">
                    All requests are reviewed based on availability and eligibility.
                  </p>
                  <p>
                    Submitting a request does not guarantee placement.
                  </p>
                </div>

                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2" data-testid="btn-individual">
                  Continue as Individual
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footer Disclaimer */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800 text-center">
              <strong>Important:</strong> Anchor Placement facilitates placement requests and review only. Payment does not guarantee placement.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
