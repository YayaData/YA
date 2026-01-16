import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, Award, Building2, FileCheck, Users, UserCheck, DollarSign,
  CheckCircle2, AlertTriangle, ExternalLink, Phone, Globe, Scale, 
  FileText, MapPin, Shield, BookOpen, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatePage = () => {
  const { stateCode } = useParams();
  const [stateData, setStateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  useEffect(() => {
    fetchStateData();
    const accepted = localStorage.getItem('disclaimer_accepted');
    if (accepted) setDisclaimerAccepted(true);
  }, [stateCode]);

  const fetchStateData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/states/${stateCode}`);
      setStateData(response.data);
      setChecklist(response.data.checklist?.map(item => ({ ...item, completed: false })) || []);
    } catch (err) {
      setError("Failed to load state data.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (stepIndex) => {
    setChecklist(prev => prev.map((item, idx) => idx === stepIndex ? { ...item, completed: !item.completed } : item));
  };

  const acceptDisclaimer = () => {
    localStorage.setItem('disclaimer_accepted', 'true');
    setDisclaimerAccepted(true);
  };

  const completedSteps = checklist.filter(item => item.completed).length;
  const progressPercent = checklist.length > 0 ? Math.round((completedSteps / checklist.length) * 100) : 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8" data-testid="state-page-loading">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-12 w-96 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center" data-testid="state-page-error">
        <AlertTriangle className="w-16 h-16 text-gold mx-auto mb-4" />
        <h2 className="text-2xl font-serif font-bold text-navy mb-2">Unable to Load State Data</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <Link to="/"><Button className="bg-gold hover:bg-gold/90 text-white"><ArrowLeft className="mr-2 w-4 h-4" />Back</Button></Link>
      </div>
    );
  }

  // Disclaimer Modal
  if (!disclaimerAccepted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" data-testid="disclaimer-modal">
        <Card className="max-w-2xl border-2 border-gold">
          <CardHeader className="bg-gold-light">
            <CardTitle className="font-serif text-navy flex items-center gap-2">
              <Shield className="w-6 h-6 text-gold" />
              Important Disclaimers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3 text-sm text-slate-700">
              <p><strong>Educational Only:</strong> This platform provides educational guidance only and does not constitute legal, financial, medical, or professional advice.</p>
              <p><strong>No Guarantee:</strong> Medicaid approval and reimbursement are not guaranteed. Requirements vary by state and change frequently.</p>
              <p><strong>Verify Information:</strong> Laws, regulations, and administrative rules change. Users must verify current requirements with official agencies.</p>
              <p><strong>Local Compliance:</strong> Zoning and occupancy requirements are determined by local (city/county) governments.</p>
              <p><strong>Professional Help:</strong> Users should consult qualified professionals (attorneys, compliance specialists) as needed.</p>
            </div>
            <Button onClick={acceptDisclaimer} className="w-full bg-gold hover:bg-gold/90 text-white" data-testid="accept-disclaimer-btn">
              I Understand - Continue to State Guide
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="state-page">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-navy mb-6" data-testid="back-link">
            <ArrowLeft className="w-4 h-4" />Back to State Selection
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy">{stateData.state_name}</h1>
                <Badge className={stateData.is_fully_populated ? "bg-green-100 text-green-700" : "bg-gold-light text-gold"}>
                  {stateData.is_fully_populated ? <><CheckCircle2 className="w-3 h-3 mr-1" />Full Guide</> : <><AlertTriangle className="w-3 h-3 mr-1" />Basic Info</>}
                </Badge>
              </div>
              <p className="text-slate-600">Peer Support Agency Launch Guide</p>
              {stateData.last_verified && <p className="text-xs text-slate-400 mt-1">Last verified: {stateData.last_verified}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-navy">{completedSteps} of {checklist.length} steps completed</span>
            <span className="font-bold text-gold">{progressPercent}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gold transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="snapshot" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 flex-wrap h-auto gap-1" data-testid="state-tabs">
            <TabsTrigger value="snapshot" className="data-[state=active]:bg-gold data-[state=active]:text-white text-xs sm:text-sm">
              <Globe className="w-4 h-4 mr-1 hidden sm:inline" />Snapshot
            </TabsTrigger>
            <TabsTrigger value="checklist" className="data-[state=active]:bg-gold data-[state=active]:text-white text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 mr-1 hidden sm:inline" />Checklist
            </TabsTrigger>
            <TabsTrigger value="links" className="data-[state=active]:bg-gold data-[state=active]:text-white text-xs sm:text-sm">
              <ExternalLink className="w-4 h-4 mr-1 hidden sm:inline" />Links
            </TabsTrigger>
            <TabsTrigger value="credentialing" className="data-[state=active]:bg-gold data-[state=active]:text-white text-xs sm:text-sm">
              <FileCheck className="w-4 h-4 mr-1 hidden sm:inline" />Credentialing
            </TabsTrigger>
            <TabsTrigger value="laws" className="data-[state=active]:bg-gold data-[state=active]:text-white text-xs sm:text-sm">
              <Scale className="w-4 h-4 mr-1 hidden sm:inline" />Laws
            </TabsTrigger>
            <TabsTrigger value="policies" className="data-[state=active]:bg-gold data-[state=active]:text-white text-xs sm:text-sm">
              <FileText className="w-4 h-4 mr-1 hidden sm:inline" />P&P
            </TabsTrigger>
            <TabsTrigger value="zoning" className="data-[state=active]:bg-gold data-[state=active]:text-white text-xs sm:text-sm">
              <MapPin className="w-4 h-4 mr-1 hidden sm:inline" />Zoning
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Snapshot */}
          <TabsContent value="snapshot" className="space-y-6" data-testid="tab-snapshot">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Certification */}
              <Card className="border-2 border-slate-200">
                <CardHeader className="bg-slate-50 border-b py-4">
                  <CardTitle className="flex items-center gap-2 text-navy font-serif text-lg">
                    <Award className="w-5 h-5 text-gold" />Certification
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div><span className="text-sm text-slate-500">Name:</span><p className="font-medium text-navy">{stateData.certification_name}</p></div>
                  <div><span className="text-sm text-slate-500">Authority:</span><p>{stateData.certification_authority}</p></div>
                  <div><span className="text-sm text-slate-500">Training:</span><p>{stateData.training_hours}</p></div>
                  {stateData.certification_url && (
                    <a href={stateData.certification_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gold hover:underline text-sm">
                      Official Website <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </CardContent>
              </Card>

              {/* Medicaid */}
              <Card className="border-2 border-slate-200">
                <CardHeader className="bg-slate-50 border-b py-4">
                  <CardTitle className="flex items-center gap-2 text-navy font-serif text-lg">
                    <Building2 className="w-5 h-5 text-gold" />Medicaid
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div><span className="text-sm text-slate-500">Agency:</span><p className="font-medium text-navy">{stateData.medicaid_agency_name}</p></div>
                  {stateData.medicaid_enrollment_url && (
                    <a href={stateData.medicaid_enrollment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gold hover:underline text-sm">
                      Provider Enrollment Portal <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {stateData.medicaid_manual_url && (
                    <a href={stateData.medicaid_manual_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gold hover:underline text-sm block">
                      Provider Manual <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </CardContent>
              </Card>

              {/* Supervision */}
              <Card className="border-2 border-slate-200">
                <CardHeader className="bg-slate-50 border-b py-4">
                  <CardTitle className="flex items-center gap-2 text-navy font-serif text-lg">
                    <UserCheck className="w-5 h-5 text-gold" />Supervision
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className={stateData.supervision_required ? "bg-gold-light text-gold" : "bg-green-100 text-green-700"}>
                      {stateData.supervision_required ? "Required" : "Not Required"}
                    </Badge>
                  </div>
                  <p className="text-sm">{stateData.supervision_details}</p>
                  {stateData.accepted_supervisor_licenses?.length > 0 && (
                    <div>
                      <span className="text-sm text-slate-500">Accepted Licenses:</span>
                      <p className="text-sm">{stateData.accepted_supervisor_licenses.join(", ")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Virtual/Telehealth */}
              <Card className="border-2 border-slate-200">
                <CardHeader className="bg-slate-50 border-b py-4">
                  <CardTitle className="flex items-center gap-2 text-navy font-serif text-lg">
                    <Globe className="w-5 h-5 text-gold" />Virtual Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div><span className="text-sm text-slate-500">Telehealth Status:</span><p className="font-medium">{stateData.virtual_allowed}</p></div>
                  {stateData.telehealth_notes && <p className="text-sm text-slate-600">{stateData.telehealth_notes}</p>}
                </CardContent>
              </Card>
            </div>

            {/* MCOs */}
            {stateData.managed_care_orgs?.length > 0 && (
              <Card className="border-2 border-slate-200">
                <CardHeader className="bg-slate-50 border-b py-4">
                  <CardTitle className="flex items-center gap-2 text-navy font-serif text-lg">
                    <Users className="w-5 h-5 text-gold" />Managed Care Organizations (MCOs)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stateData.managed_care_orgs.map((mco, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-medium text-navy mb-2">{mco.name}</h4>
                        {mco.credentialing_url && (
                          <a href={mco.credentialing_url} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline text-sm flex items-center gap-1">
                            Credentialing <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {mco.phone && <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><Phone className="w-3 h-3" />{mco.phone}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Billing Overview */}
            <Card className="border-2 border-slate-200">
              <CardHeader className="bg-slate-50 border-b py-4">
                <CardTitle className="flex items-center gap-2 text-navy font-serif text-lg">
                  <DollarSign className="w-5 h-5 text-gold" />Billing Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div><span className="text-sm text-slate-500">Common Codes:</span>
                  <ul className="list-disc list-inside text-sm">{stateData.common_billing_codes?.map((code, i) => <li key={i}>{code}</li>)}</ul>
                </div>
                <div><span className="text-sm text-slate-500">Units:</span><p className="text-sm">{stateData.units_of_service}</p></div>
                <div><span className="text-sm text-slate-500">Documentation:</span><p className="text-sm">{stateData.documentation_requirements}</p></div>
                <p className="text-xs text-slate-400 mt-2">{stateData.reimbursement_notes}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Checklist */}
          <TabsContent value="checklist" className="space-y-4" data-testid="tab-checklist">
            <div className="bg-blue-light rounded-xl p-4 mb-4">
              <h3 className="font-serif font-bold text-navy mb-2">Step-by-Step Launch Checklist</h3>
              <p className="text-slate-600 text-sm">Click each step to mark complete as you progress.</p>
            </div>
            {checklist.map((item, index) => (
              <Card key={item.step} className={`border-2 transition-all ${item.completed ? "border-green-500 bg-green-50/50" : "border-slate-200"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <button onClick={() => toggleStep(index)} className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${item.completed ? "bg-green-500 text-white" : "bg-gold-light text-gold hover:bg-gold hover:text-white"}`}>
                      {item.completed ? <CheckCircle2 className="w-5 h-5" /> : <span className="font-bold">{item.step}</span>}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-serif font-bold ${item.completed ? "text-green-700 line-through" : "text-navy"}`}>{item.title}</h4>
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      </div>
                      <p className="text-slate-600 text-sm">{item.description}</p>
                      {item.documents?.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-slate-500">Documents needed: </span>
                          <span className="text-xs">{item.documents.join(", ")}</span>
                        </div>
                      )}
                      {item.common_mistakes?.length > 0 && (
                        <div className="mt-2 p-2 bg-amber-50 rounded text-xs">
                          <span className="font-medium text-amber-700">Common mistakes: </span>
                          <span className="text-amber-600">{item.common_mistakes.join("; ")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* TAB 3: Official Links */}
          <TabsContent value="links" className="space-y-6" data-testid="tab-links">
            <Card className="border-2 border-slate-200">
              <CardHeader className="bg-slate-50 border-b py-4">
                <CardTitle className="font-serif text-navy">State Medicaid Agency</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {stateData.medicaid_enrollment_url && <a href={stateData.medicaid_enrollment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gold hover:underline"><ExternalLink className="w-4 h-4" />Provider Enrollment Portal</a>}
                {stateData.medicaid_manual_url && <a href={stateData.medicaid_manual_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gold hover:underline"><ExternalLink className="w-4 h-4" />Provider Manual</a>}
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200">
              <CardHeader className="bg-slate-50 border-b py-4">
                <CardTitle className="font-serif text-navy">Behavioral Health Authority</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <p className="text-sm mb-2">{stateData.behavioral_health_authority}</p>
                {stateData.behavioral_health_url && <a href={stateData.behavioral_health_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gold hover:underline"><ExternalLink className="w-4 h-4" />Official Website</a>}
                {stateData.certification_url && <a href={stateData.certification_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gold hover:underline"><ExternalLink className="w-4 h-4" />Peer Certification</a>}
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200">
              <CardHeader className="bg-slate-50 border-b py-4">
                <CardTitle className="font-serif text-navy">Business Formation</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {stateData.secretary_of_state_url && <a href={stateData.secretary_of_state_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gold hover:underline"><ExternalLink className="w-4 h-4" />Secretary of State - Business Registration</a>}
                <a href="https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gold hover:underline"><ExternalLink className="w-4 h-4" />IRS EIN Application</a>
                <a href="https://nppes.cms.hhs.gov/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gold hover:underline"><ExternalLink className="w-4 h-4" />NPPES NPI Registry</a>
              </CardContent>
            </Card>

            {/* MCO Links */}
            {stateData.managed_care_orgs?.length > 0 && (
              <Card className="border-2 border-slate-200">
                <CardHeader className="bg-slate-50 border-b py-4">
                  <CardTitle className="font-serif text-navy">MCO Credentialing Portals</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {stateData.managed_care_orgs.map((mco, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                        <span className="font-medium">{mco.name}</span>
                        <div className="flex gap-3">
                          {mco.credentialing_url && <a href={mco.credentialing_url} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline text-sm">Credentialing</a>}
                          {mco.phone && <span className="text-slate-500 text-sm">{mco.phone}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB 4: Credentialing */}
          <TabsContent value="credentialing" className="space-y-6" data-testid="tab-credentialing">
            <Card className="border-2 border-slate-200">
              <CardHeader className="bg-slate-50 border-b py-4">
                <CardTitle className="font-serif text-navy">Universal Credentialing Requirements</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-slate-600 mb-4">These requirements apply in virtually every state.</p>
                <div className="space-y-3">
                  {[
                    { item: "Legal Business Entity", desc: "Form LLC, Corporation, or approved entity type" },
                    { item: "EIN", desc: "Employer Identification Number from IRS" },
                    { item: "NPI Type 2", desc: "Organizational NPI through NPPES" },
                    { item: "Taxonomy Code", desc: "e.g., 101YP2500X for Peer Specialist" },
                    { item: "Medicaid Enrollment", desc: "Complete state provider enrollment" },
                    { item: "MCO Credentialing", desc: "Apply to each MCO in service area" },
                    { item: "Liability Insurance", desc: "General + professional liability coverage" },
                    { item: "Background Checks", desc: "Policy for all staff" },
                  ].map((req, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div><span className="font-medium text-navy">{req.item}</span><p className="text-sm text-slate-600">{req.desc}</p></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {stateData.credentialing_requirements?.length > 0 && (
              <Card className="border-2 border-gold">
                <CardHeader className="bg-gold-light border-b py-4">
                  <CardTitle className="font-serif text-navy">{stateData.state_name}-Specific Requirements</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {stateData.credentialing_requirements.map((req, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded border">
                        <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-navy">{req.item}</span>
                          <p className="text-sm text-slate-600">{req.description}</p>
                          {req.notes && <p className="text-xs text-slate-400 mt-1">{req.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB 5: Laws & Rules */}
          <TabsContent value="laws" className="space-y-6" data-testid="tab-laws">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r mb-4">
              <p className="text-sm text-amber-800"><strong>Important:</strong> Laws and regulations change frequently. Always verify with official sources before relying on this information.</p>
            </div>
            
            {stateData.laws_and_rules?.length > 0 ? (
              <div className="space-y-4">
                {stateData.laws_and_rules.map((law, idx) => (
                  <Card key={idx} className="border-2 border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Scale className="w-5 h-5 text-gold" />
                            <h4 className="font-serif font-bold text-navy">{law.title}</h4>
                          </div>
                          <Badge variant="outline" className="mb-2">{law.category}</Badge>
                          <p className="text-sm text-slate-600">{law.summary}</p>
                          <p className="text-xs text-slate-400 mt-2">Last verified: {law.last_verified}</p>
                        </div>
                        {law.official_url && (
                          <a href={law.official_url} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline text-sm flex items-center gap-1">
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-2 border-slate-200">
                <CardContent className="p-8 text-center">
                  <Scale className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Detailed legal citations pending. Contact state Medicaid and behavioral health authority for current regulations.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB 6: Policies & Procedures */}
          <TabsContent value="policies" className="space-y-6" data-testid="tab-policies">
            <Card className="border-2 border-slate-200">
              <CardHeader className="bg-slate-50 border-b py-4">
                <CardTitle className="font-serif text-navy flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-gold" />
                  P&P Framework for Peer Support Agencies
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-slate-600 mb-4">Your Policies & Procedures manual should include these sections to meet compliance requirements:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    "Mission, Vision & Values", "Organizational Structure", "HIPAA Privacy & Security",
                    "Confidentiality & Consent", "Documentation Standards", "Service Delivery Standards",
                    "Staff Credential Verification", "Clinical Supervision", "Incident Reporting",
                    "Grievances & Appeals", "Cultural Competency", "Ethics & Boundaries",
                    "Record Retention", "Fraud, Waste & Abuse", "Emergency & Crisis Response",
                    "Quality Improvement", "Compliance Program", "Telehealth Policy (if applicable)"
                  ].map((section, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                      <FileText className="w-4 h-4 text-gold" />
                      <span className="text-sm">{section}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gold bg-gold-light/30">
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 text-gold mx-auto mb-4" />
                <h3 className="font-serif font-bold text-navy text-lg mb-2">Get Ready-to-Use P&P Templates</h3>
                <p className="text-slate-600 text-sm mb-4">Download our compliance-ready policy templates customized for peer support agencies.</p>
                <Link to="/templates"><Button className="bg-gold hover:bg-gold/90 text-white">View Templates</Button></Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 7: Zoning */}
          <TabsContent value="zoning" className="space-y-6" data-testid="tab-zoning">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r mb-4">
              <p className="text-sm text-amber-800"><strong>Important:</strong> Zoning requirements are determined by <strong>local</strong> (city/county) governments, not state agencies. You must verify requirements with your local planning/zoning department.</p>
            </div>

            <Card className="border-2 border-slate-200">
              <CardHeader className="bg-slate-50 border-b py-4">
                <CardTitle className="font-serif text-navy flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gold" />
                  Location & Zoning Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded">
                    <span className="text-sm text-slate-500">Virtual Operations:</span>
                    <p className="font-medium">{stateData.zoning_info?.virtual_allowed ? "Allowed (verify state rules)" : "Verify with state Medicaid"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded">
                    <span className="text-sm text-slate-500">Physical Office:</span>
                    <p className="font-medium">{stateData.zoning_info?.office_required ? "Required" : "May not be required - verify"}</p>
                  </div>
                </div>
                {stateData.zoning_info?.home_office_notes && (
                  <p className="text-sm text-slate-600">{stateData.zoning_info.home_office_notes}</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200">
              <CardHeader className="bg-slate-50 border-b py-4">
                <CardTitle className="font-serif text-navy">Zoning Quick Checklist</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {(stateData.zoning_info?.local_requirements || [
                    "Verify zoning allows business use at your address",
                    "Check local business license requirements",
                    "Confirm ADA accessibility if clients visit",
                    "Review parking requirements",
                    "Check signage regulations",
                    "Determine if home occupation permit needed",
                    "Review fire/occupancy codes if clients onsite"
                  ]).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Checkbox id={`zoning-${idx}`} />
                      <label htmlFor={`zoning-${idx}`} className="text-sm">{item}</label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <h4 className="font-medium text-navy mb-2">How to Find Your Local Zoning Office</h4>
                <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                  <li>Search: "[Your City/County] zoning department" or "planning department"</li>
                  <li>Call and ask about business use at your specific address</li>
                  <li>Ask if a home occupation permit or business license is required</li>
                  <li>Request zoning verification letter if available</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer Disclaimer */}
      <div className="bg-slate-100 border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-xs text-slate-500 text-center">
            <strong>Disclaimer:</strong> This information is for educational purposes only. Not legal, medical, or financial advice. 
            Requirements change frequently. Always verify with official state agencies. Zoning requirements are local. 
            No guarantee of Medicaid approval or reimbursement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatePage;
