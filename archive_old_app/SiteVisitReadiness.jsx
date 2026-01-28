import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  ClipboardCheck,
  FileText,
  Users,
  Shield,
  Building,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Site visit readiness checklist items organized by category
const READINESS_CATEGORIES = [
  {
    id: "documentation",
    title: "Documentation",
    icon: FileText,
    color: "blue",
    items: [
      {
        id: "policies",
        label: "Policies & Procedures Manual",
        description: "Your written P&P manual covering operations, client rights, and compliance",
        link: "/templates",
        linkText: "Download P&P Template"
      },
      {
        id: "forms",
        label: "Client Intake Forms",
        description: "Consent forms, intake assessments, and service agreements",
        link: "/templates",
        linkText: "View Templates"
      },
      {
        id: "credentials",
        label: "Staff Credentials on File",
        description: "Copies of certifications, background checks, and training records",
        link: null,
        linkText: null
      }
    ]
  },
  {
    id: "staffing",
    title: "Staffing & Supervision",
    icon: Users,
    color: "purple",
    items: [
      {
        id: "supervisor",
        label: "Clinical Supervisor Agreement",
        description: "Signed agreement with your qualified clinical supervisor",
        link: "/templates",
        linkText: "View Templates"
      },
      {
        id: "job_descriptions",
        label: "Job Descriptions",
        description: "Written job descriptions for all staff positions",
        link: "/templates",
        linkText: "Download Template"
      },
      {
        id: "training_log",
        label: "Staff Training Documentation",
        description: "Records of orientation and ongoing training",
        link: null,
        linkText: null
      }
    ]
  },
  {
    id: "compliance",
    title: "Compliance & Safety",
    icon: Shield,
    color: "green",
    items: [
      {
        id: "insurance",
        label: "Insurance Certificates",
        description: "Current liability and malpractice insurance certificates",
        link: null,
        linkText: null
      },
      {
        id: "hipaa",
        label: "HIPAA Compliance Documentation",
        description: "Privacy policies, BAAs, and security procedures",
        link: null,
        linkText: null
      },
      {
        id: "emergency",
        label: "Emergency Procedures",
        description: "Crisis intervention and emergency contact procedures",
        link: null,
        linkText: null
      }
    ]
  },
  {
    id: "physical",
    title: "Physical Space (if applicable)",
    icon: Building,
    color: "amber",
    items: [
      {
        id: "accessibility",
        label: "ADA Accessibility",
        description: "Wheelchair access, signage, and accommodations",
        link: null,
        linkText: null
      },
      {
        id: "private_space",
        label: "Private Meeting Space",
        description: "Confidential area for client sessions",
        link: null,
        linkText: null
      },
      {
        id: "posted_info",
        label: "Required Postings",
        description: "Client rights, grievance procedures, and licenses displayed",
        link: null,
        linkText: null
      }
    ]
  }
];

const SiteVisitReadiness = ({ completedSteps = [], stateCode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [checkedItems, setCheckedItems] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem(`siteVisitChecklist_${stateCode}`);
    return saved ? JSON.parse(saved) : [];
  });

  const toggleItem = (itemId) => {
    const newChecked = checkedItems.includes(itemId)
      ? checkedItems.filter(id => id !== itemId)
      : [...checkedItems, itemId];
    
    setCheckedItems(newChecked);
    localStorage.setItem(`siteVisitChecklist_${stateCode}`, JSON.stringify(newChecked));
  };

  // Calculate total items and completed
  const totalItems = READINESS_CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);
  const completedCount = checkedItems.length;
  const progressPercent = Math.round((completedCount / totalItems) * 100);

  // Color mapping for icons
  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    purple: { bg: "bg-purple-50", text: "text-purple-600" },
    green: { bg: "bg-green-50", text: "text-green-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" }
  };

  return (
    <Card className="border-0 shadow-sm mb-6" data-testid="site-visit-readiness">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-serif text-navy">
                Site Visit Readiness
              </CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">
                Prepare calmly for approval visits
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-500"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Progress bar - always visible */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{completedCount} of {totalItems} items ready</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-4">
          {/* Reassuring message */}
          <div className="bg-teal-50 border border-teal-100 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-teal-800 font-medium mb-1">
                  You're doing great!
                </p>
                <p className="text-sm text-teal-700">
                  Site visits are usually straightforward. Inspectors want to help you succeed, 
                  not catch you off guard. Use this checklist to organize what you already have — 
                  most of these items you've been building along the way.
                </p>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-6">
            {READINESS_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const colors = colorMap[category.color];
              const categoryCompleted = category.items.filter(item => 
                checkedItems.includes(item.id)
              ).length;

              return (
                <div key={category.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <h3 className="font-medium text-navy">{category.title}</h3>
                    <span className="text-xs text-slate-400 ml-auto">
                      {categoryCompleted}/{category.items.length}
                    </span>
                  </div>

                  <div className="space-y-2 pl-10">
                    {category.items.map((item) => {
                      const isChecked = checkedItems.includes(item.id);
                      
                      return (
                        <div 
                          key={item.id}
                          className={`p-3 rounded-lg border transition-all ${
                            isChecked 
                              ? "bg-slate-50 border-slate-200" 
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleItem(item.id)}
                              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                isChecked 
                                  ? "bg-teal-500 text-white" 
                                  : "border-2 border-slate-300 hover:border-teal-400"
                              }`}
                              aria-label={isChecked ? "Mark incomplete" : "Mark complete"}
                            >
                              {isChecked && <CheckCircle2 className="w-4 h-4" />}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${
                                isChecked ? "text-slate-400 line-through" : "text-navy"
                              }`}>
                                {item.label}
                              </p>
                              <p className={`text-xs mt-0.5 ${
                                isChecked ? "text-slate-400" : "text-slate-500"
                              }`}>
                                {item.description}
                              </p>
                              
                              {item.link && !isChecked && (
                                <Link 
                                  to={item.link}
                                  className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 mt-2"
                                >
                                  {item.linkText}
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completion message */}
          {progressPercent === 100 && (
            <div className="mt-6 bg-green-50 border border-green-100 rounded-lg p-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">
                You're fully prepared!
              </p>
              <p className="text-xs text-green-600 mt-1">
                Your documentation is organized and ready for any site visit.
              </p>
            </div>
          )}

          {/* Helpful tip */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center">
              <span className="font-medium">Tip:</span> Keep physical copies of key documents 
              in a labeled binder for easy access during visits.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default SiteVisitReadiness;
