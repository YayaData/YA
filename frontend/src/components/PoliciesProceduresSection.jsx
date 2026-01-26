import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Upload,
  ShoppingCart,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  FolderOpen,
  Download,
  X,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Core P&P categories that agencies typically need
const PP_CATEGORIES = [
  {
    id: "operations",
    title: "Operations & Administration",
    description: "Business operations, staffing, and administrative procedures",
    examples: ["Organizational chart", "Hours of operation", "Staff responsibilities"]
  },
  {
    id: "clinical",
    title: "Clinical & Service Delivery",
    description: "How peer support services are delivered",
    examples: ["Service documentation", "Treatment planning", "Progress notes"]
  },
  {
    id: "hipaa",
    title: "HIPAA & Privacy",
    description: "Protected health information and confidentiality",
    examples: ["Privacy notice", "Authorization forms", "Breach notification"]
  },
  {
    id: "client_rights",
    title: "Client Rights & Grievances",
    description: "Client protections and complaint procedures",
    examples: ["Rights statement", "Grievance process", "Appeals procedure"]
  },
  {
    id: "emergency",
    title: "Emergency & Safety",
    description: "Crisis response and safety procedures",
    examples: ["Emergency contacts", "Crisis protocols", "Incident reporting"]
  },
  {
    id: "compliance",
    title: "Compliance & Quality",
    description: "Regulatory compliance and quality assurance",
    examples: ["Audit procedures", "Record retention", "Quality improvement"]
  }
];

const PoliciesProceduresSection = ({ stateCode, token, hasPremiumAccess, onPurchaseToolkit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploadedPolicies, setUploadedPolicies] = useState(() => {
    const saved = localStorage.getItem(`pp_uploads_${stateCode}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [uploading, setUploading] = useState(false);

  // Calculate completion
  const completedCategories = Object.keys(uploadedPolicies).filter(k => uploadedPolicies[k]);
  const progressPercent = Math.round((completedCategories.length / PP_CATEGORIES.length) * 100);

  const handleMarkComplete = (categoryId) => {
    const newUploads = {
      ...uploadedPolicies,
      [categoryId]: uploadedPolicies[categoryId] ? null : { markedAt: new Date().toISOString() }
    };
    setUploadedPolicies(newUploads);
    localStorage.setItem(`pp_uploads_${stateCode}`, JSON.stringify(newUploads));
    
    if (!uploadedPolicies[categoryId]) {
      toast.success("Policy marked as ready!");
    }
  };

  const handleFileUpload = async (categoryId, file) => {
    if (!file) return;
    
    // For now, we'll just mark it as uploaded with file info
    // In a full implementation, you'd upload to cloud storage
    const newUploads = {
      ...uploadedPolicies,
      [categoryId]: {
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString()
      }
    };
    setUploadedPolicies(newUploads);
    localStorage.setItem(`pp_uploads_${stateCode}`, JSON.stringify(newUploads));
    toast.success(`"${file.name}" saved for ${PP_CATEGORIES.find(c => c.id === categoryId)?.title}`);
  };

  const handleRemoveUpload = (categoryId) => {
    const newUploads = { ...uploadedPolicies };
    delete newUploads[categoryId];
    setUploadedPolicies(newUploads);
    localStorage.setItem(`pp_uploads_${stateCode}`, JSON.stringify(newUploads));
    toast.success("Policy removed");
  };

  return (
    <Card className="border-0 shadow-sm mb-6" data-testid="policies-procedures-section">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-serif text-navy">
                Policies & Procedures
              </CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">
                Prepare your P&P manual at your own pace
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

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{completedCategories.length} of {PP_CATEGORIES.length} sections ready</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-4">
          {/* Reassuring intro */}
          <div className="bg-violet-50 border border-violet-100 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-violet-800 font-medium mb-1">
                  No rush — work on this when you're ready
                </p>
                <p className="text-sm text-violet-700">
                  Your Policies & Procedures manual is important for compliance, but it doesn't need to 
                  block your earlier steps. You can use your own policies or get our ready-made toolkit. 
                  Many agencies start with templates and customize over time.
                </p>
              </div>
            </div>
          </div>

          {/* Two paths */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {/* Option 1: Upload your own */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-5 h-5 text-slate-600" />
                <h4 className="font-medium text-navy">Use Your Own Policies</h4>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Already have policies? Track them here to stay organized for site visits.
              </p>
              <p className="text-xs text-slate-500">
                Mark each category complete as you prepare your documents.
              </p>
            </div>

            {/* Option 2: Purchase toolkit */}
            <div className="border-2 border-violet-200 rounded-lg p-4 bg-gradient-to-br from-violet-50 to-purple-50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <h4 className="font-medium text-navy">P&P Toolkit</h4>
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full ml-auto">
                  $97
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Get professionally crafted, editable templates for all required policies.
              </p>
              <Button
                size="sm"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                onClick={onPurchaseToolkit}
                data-testid="purchase-pp-toolkit-btn"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Get the Toolkit
              </Button>
            </div>
          </div>

          {/* Policy categories checklist */}
          <h4 className="text-sm font-medium text-navy mb-3 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-violet-500" />
            Policy Categories
          </h4>

          <div className="space-y-2">
            {PP_CATEGORIES.map((category) => {
              const isComplete = !!uploadedPolicies[category.id];
              const uploadInfo = uploadedPolicies[category.id];

              return (
                <div
                  key={category.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isComplete 
                      ? "bg-violet-50 border-violet-200" 
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleMarkComplete(category.id)}
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        isComplete 
                          ? "bg-violet-500 text-white" 
                          : "border-2 border-slate-300 hover:border-violet-400"
                      }`}
                      aria-label={isComplete ? "Mark incomplete" : "Mark complete"}
                    >
                      {isComplete && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${
                          isComplete ? "text-slate-500" : "text-navy"
                        }`}>
                          {category.title}
                        </p>
                        {isComplete && uploadInfo?.fileName && (
                          <span className="text-xs text-violet-600 bg-violet-100 px-2 py-0.5 rounded">
                            {uploadInfo.fileName}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${isComplete ? "text-slate-400" : "text-slate-500"}`}>
                        {category.description}
                      </p>
                      
                      {!isComplete && (
                        <p className="text-xs text-slate-400 mt-1">
                          Examples: {category.examples.join(", ")}
                        </p>
                      )}

                      {/* Upload option for incomplete items */}
                      {!isComplete && (
                        <div className="mt-2 flex items-center gap-2">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => handleFileUpload(category.id, e.target.files?.[0])}
                            />
                            <span className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700">
                              <Upload className="w-3 h-3" />
                              Upload file
                            </span>
                          </label>
                          <span className="text-xs text-slate-300">or</span>
                          <button
                            onClick={() => handleMarkComplete(category.id)}
                            className="text-xs text-slate-500 hover:text-slate-700"
                          >
                            Mark as ready
                          </button>
                        </div>
                      )}

                      {/* Remove option for complete items */}
                      {isComplete && (
                        <button
                          onClick={() => handleRemoveUpload(category.id)}
                          className="mt-1 text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completion message */}
          {progressPercent === 100 && (
            <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">
                P&P manual is ready!
              </p>
              <p className="text-xs text-green-600 mt-1">
                All policy sections are prepared for compliance review.
              </p>
            </div>
          )}

          {/* Link to templates */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Need individual templates?
            </p>
            <Link 
              to="/templates"
              className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
            >
              Browse free templates
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Connection to Site Visit */}
          <div className="mt-3 bg-teal-50 border border-teal-100 rounded-lg p-3">
            <p className="text-xs text-teal-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>
                Your P&P progress connects to the <strong>Site Visit Readiness</strong> checklist 
                under "Policies & Procedures Manual"
              </span>
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default PoliciesProceduresSection;
