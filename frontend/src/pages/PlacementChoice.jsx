import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Anchor, Briefcase, User, ArrowRight, CreditCard, CheckCircle2 } from "lucide-react";

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
          <span className="text-lg font-semibold text-slate-900 font-['Manrope']">Request Placement</span>
        </div>
      </header>

      <main className="px-6 md:px-12 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              How can we help you?
            </h1>
            <p className="text-slate-600 text-lg">
              Choose the option that best describes your situation
            </p>
          </div>

          {/* Choice Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Professional Option */}
            <Card 
              className="border-2 border-slate-200 hover:border-sky-400 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate("/place-client")}
              data-testid="choice-professional"
            >
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-sky-200 transition-colors">
                  <Briefcase className="h-7 w-7 text-sky-600" />
                </div>
                
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  I'm a Professional
                </h2>
                <p className="text-slate-600 text-sm mb-4">
                  Social workers, case managers, hospital discharge planners, and agency staff placing clients
                </p>

                <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-sky-800 text-sm font-medium">
                    <CreditCard className="h-4 w-4" />
                    <span>$20 per placement or $49/month</span>
                  </div>
                </div>

                <ul className="space-y-2 text-sm text-slate-600 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Access to provider network
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Placement coordination tools
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Direct provider matching
                  </li>
                </ul>

                <Button className="w-full bg-sky-600 hover:bg-sky-700 gap-2" data-testid="btn-professional">
                  Place a Client
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Individual Option */}
            <Card 
              className="border-2 border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate("/submit-request")}
              data-testid="choice-individual"
            >
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                  <User className="h-7 w-7 text-emerald-600" />
                </div>
                
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  I'm an Individual
                </h2>
                <p className="text-slate-600 text-sm mb-4">
                  Seeking housing assistance for yourself or helping a family member find placement
                </p>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-emerald-800 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>FREE to submit</span>
                  </div>
                </div>

                <ul className="space-y-2 text-sm text-slate-600 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Submit housing interest
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Admin reviews your request
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Agencies can request to connect
                  </li>
                </ul>

                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2" data-testid="btn-individual">
                  Submit Request
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs text-slate-500 mt-8">
            Submission does not guarantee placement. All placement decisions are made by providers.
          </p>
        </div>
      </main>
    </div>
  );
}
