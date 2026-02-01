import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Clock, Mail, BookOpen, Anchor } from "lucide-react";

export default function RequestSubmitted() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="w-full py-6 px-6 md:px-12 border-b border-slate-100 bg-white">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="p-2 bg-sky-600 rounded-xl">
            <Anchor className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-slate-900">Anchor Place</span>
        </div>
      </header>

      <main className="px-6 md:px-12 py-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">
              Request Submitted Successfully!
            </h1>
            <p className="text-slate-600">
              Your placement request has been received and is now being reviewed.
            </p>
          </div>

          {/* What Happens Next */}
          <Card className="border border-slate-200 shadow-sm mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">What happens next</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Review Period</p>
                    <p className="text-sm text-slate-600">Your request will be reviewed within 1-2 business days for completeness.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">We'll Reach Out</p>
                    <p className="text-sm text-slate-600">If a potential match exists, you'll be contacted via the email provided.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Reminder:</strong> Submission does not guarantee placement. All placement decisions are made by providers based on availability and fit.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Upsell Section */}
          <Card className="border-2 border-sky-200 shadow-lg bg-gradient-to-br from-sky-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-sky-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Want help becoming a provider or setting up your agency?
                  </h2>
                </div>
              </div>
              
              <p className="text-slate-600 mb-6">
                Get templates, step-by-step guides, and support to launch or grow your placement services.
              </p>
              
              <Button 
                onClick={() => navigate("/resources")}
                className="w-full h-12 font-semibold rounded-xl gap-2 bg-sky-600 hover:bg-sky-700"
                data-testid="explore-resources-btn"
              >
                Explore Resources
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Return to Home */}
          <div className="text-center mt-8">
            <Button 
              onClick={() => navigate("/")}
              variant="ghost"
              className="text-slate-600 hover:text-slate-900"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
