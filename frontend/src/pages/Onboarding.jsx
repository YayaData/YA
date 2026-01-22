import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, CheckCircle2, Home, Users, Building2, Heart } from "lucide-react";
import { ORG_TYPE_LABELS, ORG_TYPE_GROUPS, ORG_CAPABILITIES } from "@/constants/organizationCapabilities";
import { routeByOrgType, canProvidePlacement } from "@/utils/routeByOrgType";
import { ORG_PLACEMENT_SCHEMAS } from "@/constants/placementSchemas";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_anchor-place/artifacts/a2v0mwtd_image.png";

// Organization Types - Grouped by Category
const ORGANIZATION_TYPES = {
  providers: {
    label: "Housing & Care Providers",
    options: [
      { value: "AFL_PROVIDER", label: "AFL Provider (Alternative Family Living)" },
      { value: "INDEPENDENT_HOME_PROVIDER", label: "Independent Home Provider" },
      { value: "GROUP_HOME", label: "Group Home" },
      { value: "TRANSITIONAL_HOUSING", label: "Transitional Housing" },
      { value: "RESPITE_PROVIDER", label: "Respite Provider" }
    ]
  },
  shelters: {
    label: "Shelters & Reentry Programs",
    options: [
      { value: "HOMELESS_SHELTER", label: "Homeless Shelter" },
      { value: "DOMESTIC_VIOLENCE_SHELTER", label: "Domestic Violence Shelter" },
      { value: "VETERANS_SHELTER", label: "Veterans Shelter" },
      { value: "REENTRY_PROGRAM", label: "Reentry Program" },
      { value: "PRISON_REENTRY", label: "Prison Reentry" },
      { value: "HALFWAY_HOUSE", label: "Halfway House" },
      { value: "PROBATION_PAROLE", label: "Probation / Parole Services" }
    ]
  },
  agencies: {
    label: "Agencies & Organizations",
    options: [
      { value: "BEHAVIORAL_HEALTH_AGENCY", label: "Behavioral Health Agency" },
      { value: "CASE_MANAGEMENT_AGENCY", label: "Case Management Agency" },
      { value: "HOSPITAL_DISCHARGE_PLANNER", label: "Hospital Discharge Planner" },
      { value: "NONPROFIT_ORGANIZATION", label: "Nonprofit Organization" },
      { value: "FAITH_BASED_ORG", label: "Faith-Based Organization" }
    ]
  },
  individuals: {
    label: "Individuals & Families",
    options: [
      { value: "VETERAN_SELF", label: "Veteran (Self)" },
      { value: "FAMILY_MEMBER", label: "Family Member" },
      { value: "SELF_REFERRAL", label: "Self-Referral" }
    ]
  }
};

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois",
  "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts",
  "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota",
  "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

const colors = {
  blue: "#1F4FD8",
  teal: "#1CB5A3",
  gold: "#F4B400",
  dark: "#1F2937"
};

export default function Onboarding() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    orgType: "",
    organizationName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    state: "",
    goal: "",
  });

  const totalSteps = 5;
  const isOutcomeScreen = currentStep === 99;

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.orgType !== "";
      case 2: return formData.organizationName !== "" && formData.contactName !== "";
      case 3: return formData.contactEmail !== "" && formData.contactPhone !== "";
      case 4: return formData.state !== "";
      case 5: return formData.goal !== "";
      default: return true;
    }
  };

  const handleFinish = () => {
    localStorage.setItem('anchorplacement_user_data', JSON.stringify(formData));
    localStorage.setItem('anchorplacement_onboarding_complete', 'true');
    setCurrentStep(99);
  };

  const getOrgTypeLabel = (value) => {
    for (const category of Object.values(ORGANIZATION_TYPES)) {
      const found = category.options.find(opt => opt.value === value);
      if (found) return found.label;
    }
    return value;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #F7FBFF 0%, #EAF4FF 100%)' }}>
      {/* Header */}
      <header className="w-full py-4 px-6 bg-white/90 backdrop-blur-sm border-b border-blue-100">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentStep > 1 && !isOutcomeScreen && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            {currentStep === 1 && (
              <div className="flex items-center gap-2">
                <img src={LOGO_URL} alt="Anchor Placement" className="h-8 w-8" />
                <span className="font-bold font-['Poppins']" style={{ color: colors.blue }}>Anchor Placement</span>
              </div>
            )}
          </div>
          {!isOutcomeScreen && (
            <span className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</span>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="text-gray-500"
          >
            Exit
          </Button>
        </div>
      </header>

      {/* Progress Bar */}
      {!isOutcomeScreen && (
        <div className="w-full bg-gray-200 h-2">
          <div 
            className="h-2 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%`, background: colors.teal }}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-xl rounded-2xl shadow-xl border-0">
          <CardContent className="p-8">
            
            {/* Step 1: Organization Type */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: `${colors.blue}15` }}>
                    <Building2 className="h-8 w-8" style={{ color: colors.blue }} />
                  </div>
                  <h2 className="text-2xl font-bold font-['Poppins']" style={{ color: colors.dark }}>
                    What best describes you?
                  </h2>
                  <p className="text-gray-500 mt-2">Select your organization type</p>
                </div>

                <div className="space-y-4">
                  {Object.entries(ORGANIZATION_TYPES).map(([key, category]) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-600">{category.label}</Label>
                      <div className="grid gap-2">
                        {category.options.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleChange('orgType', option.value)}
                            className={`w-full p-3 text-left rounded-xl border-2 transition-all ${
                              formData.orgType === option.value 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                          >
                            <span className={formData.orgType === option.value ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                              {option.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="w-full h-12 text-lg font-semibold rounded-xl mt-6"
                  style={{ background: canProceed() ? colors.gold : '#ccc', color: colors.dark }}
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Step 2: Organization & Contact Name */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: `${colors.teal}15` }}>
                    <Users className="h-8 w-8" style={{ color: colors.teal }} />
                  </div>
                  <h2 className="text-2xl font-bold font-['Poppins']" style={{ color: colors.dark }}>
                    Tell us about you
                  </h2>
                  <p className="text-gray-500 mt-2">Organization and contact details</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Organization Name *</Label>
                    <Input 
                      placeholder="Enter your organization name"
                      value={formData.organizationName}
                      onChange={(e) => handleChange('organizationName', e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Your Name *</Label>
                    <Input 
                      placeholder="Enter your full name"
                      value={formData.contactName}
                      onChange={(e) => handleChange('contactName', e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="w-full h-12 text-lg font-semibold rounded-xl mt-6"
                  style={{ background: canProceed() ? colors.gold : '#ccc', color: colors.dark }}
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Step 3: Contact Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: `${colors.blue}15` }}>
                    <Heart className="h-8 w-8" style={{ color: colors.blue }} />
                  </div>
                  <h2 className="text-2xl font-bold font-['Poppins']" style={{ color: colors.dark }}>
                    How can we reach you?
                  </h2>
                  <p className="text-gray-500 mt-2">Contact information for coordination</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Address *</Label>
                    <Input 
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.contactEmail}
                      onChange={(e) => handleChange('contactEmail', e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input 
                      type="tel"
                      placeholder="(555) 555-5555"
                      value={formData.contactPhone}
                      onChange={(e) => handleChange('contactPhone', e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="w-full h-12 text-lg font-semibold rounded-xl mt-6"
                  style={{ background: canProceed() ? colors.gold : '#ccc', color: colors.dark }}
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Step 4: State */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: `${colors.teal}15` }}>
                    <Home className="h-8 w-8" style={{ color: colors.teal }} />
                  </div>
                  <h2 className="text-2xl font-bold font-['Poppins']" style={{ color: colors.dark }}>
                    Where are you located?
                  </h2>
                  <p className="text-gray-500 mt-2">Select your state</p>
                </div>

                <Select value={formData.state} onValueChange={(value) => handleChange('state', value)}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="w-full h-12 text-lg font-semibold rounded-xl mt-6"
                  style={{ background: canProceed() ? colors.gold : '#ccc', color: colors.dark }}
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Step 5: Goal */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: `${colors.gold}20` }}>
                    <CheckCircle2 className="h-8 w-8" style={{ color: colors.gold }} />
                  </div>
                  <h2 className="text-2xl font-bold font-['Poppins']" style={{ color: colors.dark }}>
                    What are you trying to do?
                  </h2>
                  <p className="text-gray-500 mt-2">Select your primary goal</p>
                </div>

                <div className="space-y-3">
                  {[
                    { value: "list_space", label: "List available space for placements", icon: Home },
                    { value: "find_placement", label: "Find placement for a client", icon: Users },
                    { value: "explore", label: "Explore partnership opportunities", icon: Building2 },
                  ].map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleChange('goal', option.value)}
                        className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center gap-4 ${
                          formData.goal === option.value 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          formData.goal === option.value ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <IconComponent className={`h-6 w-6 ${formData.goal === option.value ? 'text-blue-600' : 'text-gray-500'}`} />
                        </div>
                        <span className={formData.goal === option.value ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <Button 
                  onClick={handleFinish}
                  disabled={!canProceed()}
                  className="w-full h-12 text-lg font-semibold rounded-xl mt-6"
                  style={{ background: canProceed() ? colors.teal : '#ccc' }}
                >
                  Complete Registration
                  <CheckCircle2 className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Outcome Screen */}
            {isOutcomeScreen && (
              <div className="space-y-6 text-center">
                <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: `${colors.teal}15` }}>
                  <CheckCircle2 className="h-10 w-10" style={{ color: colors.teal }} />
                </div>
                <h2 className="text-2xl font-bold font-['Poppins']" style={{ color: colors.dark }}>
                  You're All Set!
                </h2>
                <p className="text-gray-600">
                  Welcome to Anchor Placement, <strong>{formData.contactName}</strong>!
                </p>
                <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
                  <p className="text-sm text-gray-500">Your profile:</p>
                  <p className="font-medium">{formData.organizationName}</p>
                  <p className="text-sm text-gray-600">{getOrgTypeLabel(formData.orgType)}</p>
                  <p className="text-sm text-gray-600">{formData.state}</p>
                </div>

                <div className="flex flex-col gap-3 mt-6">
                  {formData.goal === "list_space" && (
                    <Button 
                      onClick={() => navigate("/placements")}
                      className="w-full h-12 text-lg font-semibold rounded-xl"
                      style={{ background: colors.gold, color: colors.dark }}
                    >
                      List Your Space
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                  {formData.goal === "find_placement" && (
                    <Button 
                      onClick={() => navigate("/place-client")}
                      className="w-full h-12 text-lg font-semibold rounded-xl"
                      style={{ background: colors.teal }}
                    >
                      Find Placement Options
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="w-full h-12 text-lg font-semibold rounded-xl"
                  >
                    Go to Home
                  </Button>
                </div>

                <p className="text-xs text-gray-400 mt-4">
                  Anchor Placement™ coordinates referrals and availability. Medicaid billing and licensing guidance is provided in AnchorAxis.
                </p>
              </div>
            )}

          </CardContent>
        </Card>
      </main>
    </div>
  );
}
