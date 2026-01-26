import { useState } from "react";
import { 
  DollarSign, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Building2,
  FileText,
  Users,
  Laptop,
  Shield,
  Clock,
  HelpCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FAQAssistant from "@/components/FAQAssistant";

const EstimatedCosts = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  const oneTimeCosts = [
    { item: "Business registration", range: "$0–$300", note: "Varies by state and entity type" },
    { item: "EIN (IRS)", range: "$0", note: "Free from IRS" },
    { item: "NPI registration", range: "$0", note: "Free from NPPES" },
    { item: "Policies & Procedures", range: "$0–$300", note: "DIY or purchase templates" },
    { item: "Hiring & onboarding documents", range: "$0–$150", note: "DIY or purchase templates" },
    { item: "Background checks (per staff)", range: "$25–$75 each", note: "Required for each staff member" },
    { item: "Computer/laptop (if needed)", range: "$300–$1,000", note: "Many already own" },
    { item: "Printer/scanner (if needed)", range: "$100–$300", note: "Many already own" },
    { item: "Office supplies (ink, paper, folders)", range: "$50–$150", note: "Basic supplies" },
    { item: "Insurance (if required)", range: "$0–$500", note: "Varies by state/MCO" }
  ];

  const monthlyCosts = [
    { item: "QP supervision (contract or salary)", range: "$500–$2,000", note: "Required in most states" },
    { item: "Billing service or software (optional)", range: "$0–$300", note: "Optional early on" },
    { item: "Phone, internet, admin tools", range: "$50–$200", note: "Basic operations" },
    { item: "EMR (optional early)", range: "$0–$150", note: "Can start simple" }
  ];

  return (
    <Card className="border-2 border-slate-200" data-testid="estimated-costs-section">
      <CardHeader className="bg-slate-50 border-b py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-navy font-serif text-lg">
              <DollarSign className="w-5 h-5 text-gold" />
              Estimated Cost to Start & Operate a Peer Support Agency
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <FAQAssistant context="Estimated Costs section" buttonStyle="icon" />
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-500" />
              )}
            </button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-4 space-y-6">
          {/* Intro text */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-800 leading-relaxed">
              Starting a Peer Support agency does not require large upfront capital. 
              Costs vary by state, staffing model, and payer requirements. 
              The estimates below are provided to help you plan.
            </p>
          </div>

          {/* One-time setup costs */}
          <div>
            <h4 className="font-medium text-navy mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gold" />
              One-Time Setup Costs (typical ranges)
            </h4>
            <div className="space-y-2">
              {oneTimeCosts.map((cost, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1">
                    <span className="text-sm text-slate-700">{cost.item}</span>
                    {cost.note && (
                      <span className="text-xs text-slate-400 ml-2">({cost.note})</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-navy">{cost.range}</span>
                </div>
              ))}
            </div>
            {/* One-time total */}
            <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-green-800">Estimated One-Time Setup Total</span>
                <span className="font-bold text-green-700 text-lg">$300–$2,000</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Note: Many users already own items like a computer or printer.
              </p>
            </div>
          </div>

          {/* Monthly operating costs */}
          <div>
            <h4 className="font-medium text-navy mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" />
              Monthly Operating Costs (early stage)
            </h4>
            <div className="space-y-2">
              {monthlyCosts.map((cost, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1">
                    <span className="text-sm text-slate-700">{cost.item}</span>
                    {cost.note && (
                      <span className="text-xs text-slate-400 ml-2">({cost.note})</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-navy">{cost.range}</span>
                </div>
              ))}
            </div>
            {/* Monthly total */}
            <div className="mt-3 p-3 bg-violet-50 border border-violet-100 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-violet-800">Estimated Monthly Operating Cost</span>
                <span className="font-bold text-violet-700 text-lg">$550–$2,500</span>
              </div>
            </div>
          </div>

          {/* Reassurance text */}
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-amber-800">
                  Many startup costs are one-time purchases, and many providers already own basic equipment. 
                  This estimate is meant to help you plan — not to create pressure.
                </p>
                <p className="text-sm text-amber-700">
                  Some states allow agencies to operate using a home or administrative address when services 
                  are provided in the community. Rules vary by state and payer and should be confirmed during enrollment.
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-slate-400 text-center pt-2 border-t border-slate-100">
            All costs shown are estimates only and are not guaranteed. Actual costs will vary based on your 
            specific situation, location, staffing decisions, and state requirements.
          </p>
        </CardContent>
      )}
    </Card>
  );
};

export default EstimatedCosts;
