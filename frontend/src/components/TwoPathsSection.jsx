import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  FileText, 
  Route, 
  CheckCircle2,
  Users,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const TwoPathsSection = ({ className = "" }) => {
  return (
    <section className={`py-16 md:py-20 bg-white ${className}`} data-testid="two-paths-section">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-navy mb-3">
            Choose Your Path
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            We offer two ways to support your journey — choose the option that fits your experience level.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Path 1: Guided Setup */}
          <Card className="border-2 border-slate-200 hover:border-gold/50 transition-all group">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <Route className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-navy text-lg">Guided Setup</h3>
                  <p className="text-sm text-slate-500">Recommended for most users</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                Step-by-step guidance through every stage of launching your peer support agency, 
                with state-specific details and progress tracking.
              </p>

              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">Step-by-step guidance</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">State-specific details</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">Templates and readiness tools</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">Optional paid access for deeper guidance</span>
                </li>
              </ul>

              <Link to="/start">
                <Button className="w-full bg-gold hover:bg-gold/90 text-white">
                  Start Guided Setup
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Path 2: Documents Only */}
          <Card className="border-2 border-slate-200 hover:border-violet-200 transition-all group">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                  <FileText className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-navy text-lg">Documents Only</h3>
                  <p className="text-sm text-slate-500">For experienced providers</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                Already familiar with starting a peer support agency? Purchase individual documents 
                without required guidance or checklist completion.
              </p>

              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">Purchase individual documents</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">No required guidance</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">No checklist enforcement</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">Intended for experienced providers</span>
                </li>
              </ul>

              <Link to="/document-shop">
                <Button variant="outline" className="w-full border-violet-200 text-violet-700 hover:bg-violet-50">
                  <Download className="w-4 h-4 mr-2" />
                  Browse Documents
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Reassurance text */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Both paths provide professional, high-quality resources. Choose what works best for your situation.
        </p>
      </div>
    </section>
  );
};

export default TwoPathsSection;
