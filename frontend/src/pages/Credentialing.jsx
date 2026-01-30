import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Shield, FileCheck, ClipboardCheck, AlertTriangle,
  CheckCircle2, Clock, ExternalLink, Save
} from "lucide-react";
import { toast } from "sonner";
import CredentialingChecklist from "@/components/CredentialingChecklist";
import DocumentUpload from "@/components/DocumentUpload";
import { getStateCredentials, isStateSupported } from "@/constants/stateCredentials";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_anchor-place/artifacts/a2v0mwtd_image.png";

const colors = {
  blue: "#1F4FD8",
  teal: "#1CB5A3",
  gold: "#F4B400",
  dark: "#1F2937"
};

export default function Credentialing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("checklist");
  const [completedItems, setCompletedItems] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const userData = JSON.parse(localStorage.getItem('anchorplacement_user_data') || '{}');
  const stateCode = userData.state === "North Carolina" ? "NC" : null;
  const orgType = userData.orgType || '';
  
  const stateCredentials = stateCode ? getStateCredentials(stateCode) : null;

  useEffect(() => {
    // Load saved credentialing data from localStorage
    const savedData = localStorage.getItem('anchorplacement_credentialing');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setCompletedItems(parsed.completedItems || []);
      setUploadedDocuments(parsed.uploadedDocuments || []);
    }
  }, []);

  const handleItemToggle = (itemId) => {
    setCompletedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleDocumentUpload = (docId, fileData) => {
    setUploadedDocuments(prev => {
      const existing = prev.filter(d => d.id !== docId);
      return [...existing, fileData];
    });
    // Toast is now handled in DocumentUpload component
  };

  const handleDocumentRemove = (docId) => {
    setUploadedDocuments(prev => prev.filter(d => d.id !== docId));
    toast.info("Document removed");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      const credentialingData = {
        completedItems,
        uploadedDocuments,
        lastUpdated: new Date().toISOString(),
        stateCode,
        orgType
      };
      localStorage.setItem('anchorplacement_credentialing', JSON.stringify(credentialingData));
      
      // Optionally save to backend
      try {
        await axios.post(`${API}/provider-credentials`, {
          organization_name: userData.organizationName,
          state: stateCode,
          org_type: orgType,
          checklist_completed: completedItems,
          documents_uploaded: uploadedDocuments.map(d => ({ id: d.id, fileName: d.fileName, uploadedAt: d.uploadedAt })),
          updated_at: new Date().toISOString()
        });
      } catch (apiError) {
        console.log("Backend save skipped - endpoint may not exist yet");
      }
      
      toast.success("Progress saved successfully!");
    } catch (error) {
      toast.error("Failed to save progress");
    } finally {
      setIsSaving(false);
    }
  };

  // If state not supported
  if (!stateCode || !isStateSupported(stateCode)) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #F7FBFF 0%, #EAF4FF 100%)' }}>
        <header className="w-full py-4 px-6 bg-white/90 backdrop-blur-sm border-b border-blue-100">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={LOGO_URL} alt="Anchor Placement" className="h-8 w-8" />
            <span className="font-bold font-['Poppins']" style={{ color: colors.blue }}>Credentialing</span>
          </div>
        </header>
        <main className="px-6 py-12 max-w-4xl mx-auto">
          <Card className="rounded-2xl shadow-lg border-0">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-amber-500" />
              <h2 className="text-2xl font-bold mb-2" style={{ color: colors.dark }}>
                Credentialing Not Available
              </h2>
              <p className="text-gray-600 mb-6">
                Credentialing checklists are currently only available for <strong>North Carolina</strong>.
                {userData.state && userData.state !== "North Carolina" && (
                  <span> Your profile shows <strong>{userData.state}</strong>.</span>
                )}
              </p>
              <p className="text-sm text-gray-500">
                Additional states will be added in future updates.
              </p>
              <Button onClick={() => navigate(-1)} className="mt-6" style={{ background: colors.blue }}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #F7FBFF 0%, #EAF4FF 100%)' }}>
      {/* Header */}
      <header className="w-full py-4 px-6 bg-white/90 backdrop-blur-sm border-b border-blue-100">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} data-testid="back-button">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={LOGO_URL} alt="Anchor Placement" className="h-8 w-8" />
            <div>
              <span className="font-bold font-['Poppins']" style={{ color: colors.blue }}>Credentialing</span>
              <Badge className="ml-2 bg-blue-100 text-blue-700">
                {stateCredentials.name}
              </Badge>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            style={{ background: colors.teal }}
            className="gap-2"
            data-testid="save-progress-btn"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Progress"}
          </Button>
        </div>
      </header>

      <main className="px-6 py-8 max-w-4xl mx-auto">
        {/* Info Banner */}
        <Card className="rounded-2xl shadow-lg border-0 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-start gap-4">
              <Shield className="h-10 w-10 flex-shrink-0" />
              <div>
                <h1 className="text-2xl font-bold font-['Poppins']">Provider Credentialing</h1>
                <p className="text-blue-100 mt-1">
                  Complete your credentialing checklist and upload required documents to become a verified provider.
                </p>
              </div>
            </div>
          </div>
          
          {/* Regulation References */}
          <CardContent className="p-4 bg-blue-50">
            <p className="text-sm font-medium mb-2" style={{ color: colors.dark }}>Reference Regulations:</p>
            <div className="flex flex-wrap gap-2">
              {stateCredentials.regulations.map(reg => (
                <Badge 
                  key={reg.id} 
                  variant="outline" 
                  className="bg-white cursor-pointer hover:bg-gray-50"
                  onClick={() => reg.url && window.open(reg.url, '_blank')}
                >
                  {reg.name}
                  {reg.url && <ExternalLink className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="checklist" className="gap-2" data-testid="tab-checklist">
              <ClipboardCheck className="h-4 w-4" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2" data-testid="tab-documents">
              <FileCheck className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checklist">
            <Card className="rounded-2xl shadow-lg border-0">
              <CardContent className="p-6">
                <CredentialingChecklist 
                  stateCode={stateCode}
                  orgType={orgType}
                  completedItems={completedItems}
                  onItemToggle={handleItemToggle}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card className="rounded-2xl shadow-lg border-0">
              <CardContent className="p-6">
                <DocumentUpload 
                  stateCode={stateCode}
                  orgType={orgType}
                  uploadedDocuments={uploadedDocuments}
                  onUpload={handleDocumentUpload}
                  onRemove={handleDocumentRemove}
                  organizationName={userData.organizationName}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card className="rounded-2xl shadow-lg border-0 mt-6">
          <CardContent className="p-6">
            <h3 className="font-bold mb-3" style={{ color: colors.dark }}>Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              If you have questions about credentialing requirements, contact your local LME/MCO or visit the NC DHHS website.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://www.ncdhhs.gov/divisions/mental-health-developmental-disabilities-and-substance-abuse', '_blank')}
                className="gap-2"
              >
                NC DHHS Website
                <ExternalLink className="h-3 w-3" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://www.ncdhhs.gov/providers/lme-mco-directory', '_blank')}
                className="gap-2"
              >
                Find Your LME/MCO
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
