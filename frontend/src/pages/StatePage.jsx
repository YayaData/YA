import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Award, 
  Building2, 
  FileCheck, 
  Users, 
  UserCheck, 
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import StepCard from "@/components/StepCard";
import ProgressBar from "@/components/ProgressBar";
import InfoSection, { InfoItem, InfoList } from "@/components/InfoSection";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatePage = () => {
  const { stateCode } = useParams();
  const [stateData, setStateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checklist, setChecklist] = useState([]);

  useEffect(() => {
    fetchStateData();
  }, [stateCode]);

  const fetchStateData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/states/${stateCode}`);
      setStateData(response.data);
      setChecklist(response.data.checklist.map(item => ({ ...item, completed: false })));
    } catch (err) {
      setError("Failed to load state data. Please try again.");
      console.error("Error fetching state data:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (stepIndex) => {
    setChecklist(prev => 
      prev.map((item, idx) => 
        idx === stepIndex ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedSteps = checklist.filter(item => item.completed).length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="state-page-loading">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-12 w-96 mb-4" />
        <Skeleton className="h-6 w-64 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center" data-testid="state-page-error">
        <AlertTriangle className="w-16 h-16 text-gold mx-auto mb-4" />
        <h2 className="text-2xl font-serif font-bold text-navy mb-2">Unable to Load State Data</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <Link to="/">
          <Button className="bg-gold hover:bg-gold/90 text-white">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to State Selection
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="state-page">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-navy mb-6 transition-colors"
            data-testid="back-to-states-link"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to State Selection
          </Link>
          
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy">
                  {stateData.state_name}
                </h1>
                {stateData.is_fully_populated ? (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Full Guide
                  </Badge>
                ) : (
                  <Badge className="bg-gold-light text-gold">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Basic Info
                  </Badge>
                )}
              </div>
              <p className="text-slate-600">
                Peer Support Agency Launch Guide for {stateData.state_name}
              </p>
            </div>

            {!stateData.is_fully_populated && (
              <div className="warning-box p-4 rounded-lg max-w-md">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> This state guide contains general information. 
                  Full state-specific details coming soon. Always verify with official sources.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ProgressBar completed={completedSteps} total={checklist.length} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="checklist" className="space-y-8">
          <TabsList className="bg-white border border-slate-200 p-1 h-auto flex-wrap" data-testid="state-tabs">
            <TabsTrigger value="checklist" className="data-[state=active]:bg-gold data-[state=active]:text-white">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="certification" className="data-[state=active]:bg-gold data-[state=active]:text-white">
              <Award className="w-4 h-4 mr-2" />
              Certification
            </TabsTrigger>
            <TabsTrigger value="business" className="data-[state=active]:bg-gold data-[state=active]:text-white">
              <Building2 className="w-4 h-4 mr-2" />
              Business Setup
            </TabsTrigger>
            <TabsTrigger value="medicaid" className="data-[state=active]:bg-gold data-[state=active]:text-white">
              <FileCheck className="w-4 h-4 mr-2" />
              Medicaid
            </TabsTrigger>
            <TabsTrigger value="mcos" className="data-[state=active]:bg-gold data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              MCOs
            </TabsTrigger>
            <TabsTrigger value="supervision" className="data-[state=active]:bg-gold data-[state=active]:text-white">
              <UserCheck className="w-4 h-4 mr-2" />
              Supervision
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-gold data-[state=active]:text-white">
              <DollarSign className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
          </TabsList>

          {/* Checklist Tab */}
          <TabsContent value="checklist" className="space-y-4" data-testid="tab-checklist">
            <div className="bg-blue-light rounded-xl p-6 mb-6">
              <h3 className="font-serif font-bold text-navy text-lg mb-2">
                Your Step-by-Step Launch Checklist
              </h3>
              <p className="text-slate-600">
                Click on each step to mark it complete as you progress through the setup process.
              </p>
            </div>
            {checklist.map((item, index) => (
              <StepCard
                key={item.step}
                step={item.step}
                title={item.title}
                description={item.description}
                completed={item.completed}
                onToggle={() => toggleStep(index)}
              />
            ))}
          </TabsContent>

          {/* Certification Tab */}
          <TabsContent value="certification" className="space-y-6" data-testid="tab-certification">
            <InfoSection title="Certification Requirements" icon={Award} badge="Required">
              <dl className="divide-y divide-slate-100">
                <InfoItem label="Certification Name" value={stateData.certification.name} />
                <InfoItem label="Who Qualifies" value={stateData.certification.who_qualifies} />
                <InfoItem label="Training Hours" value={stateData.certification.training_hours} />
                <InfoItem label="Certification Authority" value={stateData.certification.certification_authority} />
                <InfoItem label="Official Website" value={stateData.certification.certification_link} isLink={stateData.certification.certification_link.startsWith('http')} />
              </dl>
            </InfoSection>
          </TabsContent>

          {/* Business Setup Tab */}
          <TabsContent value="business" className="space-y-6" data-testid="tab-business">
            <InfoSection title="Business Setup Requirements" icon={Building2}>
              <dl className="divide-y divide-slate-100">
                <InfoItem label="Entity Type Required" value={stateData.business_setup.entity_type} />
                <InfoItem 
                  label="In-State Registration Required" 
                  value={stateData.business_setup.in_state_required ? "Yes" : "No"} 
                />
                <InfoItem 
                  label="Physical Office Required" 
                  value={stateData.business_setup.physical_office_required ? "Yes - Physical office required" : "No - Virtual operations allowed"} 
                />
                <InfoItem label="Additional Notes" value={stateData.business_setup.notes} />
              </dl>
            </InfoSection>
          </TabsContent>

          {/* Medicaid Tab */}
          <TabsContent value="medicaid" className="space-y-6" data-testid="tab-medicaid">
            <InfoSection title="Medicaid Enrollment" icon={FileCheck} badge="Critical Step" badgeVariant="warning">
              <dl className="divide-y divide-slate-100 mb-6">
                <InfoItem label="Medicaid Agency" value={stateData.medicaid_enrollment.agency_name} />
                <InfoItem label="Enrollment Portal" value={stateData.medicaid_enrollment.portal_link} isLink={stateData.medicaid_enrollment.portal_link.startsWith('http')} />
                <InfoItem 
                  label="NPI Type 2 Required" 
                  value={stateData.medicaid_enrollment.npi_type2_required ? "Yes - Required for enrollment" : "No"} 
                />
              </dl>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-navy mb-3">Required Documents</h4>
                <InfoList items={stateData.medicaid_enrollment.required_documents} />
              </div>
            </InfoSection>
          </TabsContent>

          {/* MCOs Tab */}
          <TabsContent value="mcos" className="space-y-6" data-testid="tab-mcos">
            <div className="bg-blue-light rounded-xl p-6 mb-6">
              <h3 className="font-serif font-bold text-navy text-lg mb-2">
                Managed Care Organizations (MCOs)
              </h3>
              <p className="text-slate-600">
                You'll need to credential with the MCOs operating in your service area to receive referrals and payments.
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {stateData.managed_care_orgs.map((mco, index) => (
                <InfoSection key={index} title={mco.name} icon={Users}>
                  <div className="space-y-3">
                    {mco.credentialing_link.startsWith('http') ? (
                      <a 
                        href={mco.credentialing_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-gold hover:underline"
                      >
                        Credentialing Portal
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <p className="text-slate-600">{mco.credentialing_link}</p>
                    )}
                    {mco.phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4" />
                        {mco.phone}
                      </div>
                    )}
                  </div>
                </InfoSection>
              ))}
            </div>
          </TabsContent>

          {/* Supervision Tab */}
          <TabsContent value="supervision" className="space-y-6" data-testid="tab-supervision">
            <InfoSection title="Supervision Requirements" icon={UserCheck}>
              <dl className="divide-y divide-slate-100 mb-6">
                <InfoItem 
                  label="Licensed Supervisor Required" 
                  value={stateData.supervision_rules.licensed_supervisor_required ? "Yes" : "No"} 
                />
                <InfoItem label="Additional Notes" value={stateData.supervision_rules.notes} />
              </dl>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-navy mb-3">Accepted Supervisor Licenses</h4>
                <InfoList items={stateData.supervision_rules.accepted_licenses} />
              </div>
            </InfoSection>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6" data-testid="tab-billing">
            <InfoSection title="Billing Overview" icon={DollarSign}>
              <dl className="divide-y divide-slate-100 mb-6">
                <InfoItem label="Units of Service" value={stateData.billing_overview.units_of_service} />
                <InfoItem label="Documentation Basics" value={stateData.billing_overview.documentation_basics} />
                <InfoItem label="Reimbursement Notes" value={stateData.billing_overview.reimbursement_notes} />
              </dl>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-navy mb-3">Common Billing Codes</h4>
                <InfoList items={stateData.billing_overview.common_codes} />
              </div>
            </InfoSection>

            <div className="warning-box p-4 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Billing rates and procedures vary by MCO and change frequently. 
                Always verify current rates directly with your contracted MCOs before providing services.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* CTA */}
      <div className="bg-navy py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-serif font-bold text-white mb-4">
            Need Help Getting Started in {stateData.state_name}?
          </h3>
          <p className="text-slate-300 mb-6">
            Get personalized guidance and editable templates specific to your state.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/templates">
              <Button className="bg-gold hover:bg-gold/90 text-white" data-testid="cta-get-templates-btn">
                Get Templates
              </Button>
            </Link>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-navy" data-testid="cta-book-call-btn">
              Book a Strategy Call
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatePage;
