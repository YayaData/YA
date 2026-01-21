import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Anchor, CheckCircle2, HelpCircle, Settings, Clock, RotateCcw, Check } from "lucide-react";

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

// Flatten for easy lookup
const ALL_ORG_TYPES = [
  ...ORGANIZATION_TYPES.providers.options,
  ...ORGANIZATION_TYPES.shelters.options,
  ...ORGANIZATION_TYPES.agencies.options,
  ...ORGANIZATION_TYPES.individuals.options
];

const GOAL_OPTIONS = [
  { value: "accept_client", label: "Accept a client" },
  { value: "place_client", label: "Place a client" },
  { value: "explore", label: "Explore placement options" },
  { value: "partner", label: "Partner with an agency" }
];

const READINESS_OPTIONS = [
  { value: "available_room", label: "Available room or unit" },
  { value: "staff_available", label: "Staff or support available" },
  { value: "working_with_agency", label: "Working with an agency" },
  { value: "certification", label: "Certification (peer/DSP/etc.)" },
  { value: "none", label: "None yet — need guidance" }
];

const POPULATION_OPTIONS = [
  { value: "adults", label: "Adults (18+)" },
  { value: "mental_health", label: "Mental Health" },
  { value: "substance_use", label: "Substance Use" },
  { value: "disabilities", label: "Disabilities (IDD)" },
  { value: "seniors", label: "Seniors / Aging" },
  { value: "justice_involved", label: "Justice-Involved" },
  { value: "veterans", label: "Veterans" },
  { value: "homeless", label: "Homeless / Housing Insecure" },
  { value: "domestic_violence", label: "Domestic Violence Survivors" }
];

const ACTION_READINESS_OPTIONS = [
  { value: "yes_now", label: "Yes — now" },
  { value: "maybe_support", label: "Maybe — need support" },
  { value: "no_setup", label: "No — need setup" }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    organizationType: "",
    state: "",
    goal: "",
    readiness: [],
    population: [],
    actionReadiness: ""
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleMultiSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Welcome screen
      case 1: return true; // Confirmation screen
      case 2: return formData.role !== "";
      case 3: return formData.state !== "";
      case 4: return formData.goal !== "";
      case 5: return formData.readiness.length > 0;
      case 6: return true; // Population is optional
      case 7: return formData.actionReadiness !== "";
      default: return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 8) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // Store onboarding completion
    localStorage.setItem('anchorplace_onboarding_complete', 'true');
    localStorage.setItem('anchorplace_user_data', JSON.stringify(formData));
    
    // Route based on action readiness
    if (formData.actionReadiness === "yes_now") {
      navigate("/");
    }
  };

  const goToHome = () => {
    localStorage.setItem('anchorplace_onboarding_complete', 'true');
    localStorage.setItem('anchorplace_user_data', JSON.stringify(formData));
    navigate("/");
  };

  const restartQuiz = () => {
    setFormData({
      role: "",
      state: "",
      goal: "",
      readiness: [],
      population: [],
      actionReadiness: ""
    });
    setCurrentStep(0);
  };

  // Step 0: Welcome
  const WelcomeScreen = () => (
    <div className="text-center space-y-6">
      <div className="inline-flex p-4 rounded-2xl bg-sky-100 text-sky-600 mb-2">
        <Anchor className="h-12 w-12" />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight font-['Manrope']">
        Find or Offer Placement — Fast & Compliant
      </h1>
      <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
        Answer a few quick questions to see if you can place or accept a client today. 
        If setup is required, we'll guide you.
      </p>
      <Button 
        onClick={nextStep}
        data-testid="start-onboarding-btn"
        className="bg-sky-600 hover:bg-sky-700 h-12 px-8 text-base"
      >
        Start (2 minutes)
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );

  // Step 1: Confirmation Screen (Before We Start)
  const ConfirmationScreen = () => (
    <div className="text-center space-y-6">
      <div className="inline-flex p-4 rounded-2xl bg-slate-100 text-slate-600 mb-2">
        <Clock className="h-10 w-10" />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight font-['Manrope']">
        Before We Start
      </h1>
      <p className="text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">
        This short quiz helps route you correctly. You can restart the quiz at any time without affecting your access to the app.
      </p>
      
      {/* Checklist */}
      <div className="max-w-sm mx-auto text-left space-y-3 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-slate-700">Takes about 2 minutes</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-slate-700">Answers are not final</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-slate-700">You can restart anytime</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Button 
          onClick={nextStep}
          data-testid="start-quiz-btn"
          className="bg-sky-600 hover:bg-sky-700 h-12 px-8 text-base"
        >
          Start Quiz
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate("/")}
          data-testid="go-back-home-btn"
          className="h-12 px-8"
        >
          Go Back to Home
        </Button>
      </div>
    </div>
  );

  // Step 2: Role Selection
  const RoleScreen = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 font-['Manrope']">
          What best describes you right now?
        </h2>
        <p className="text-slate-500 text-sm">You can go back or change your answers at any time.</p>
      </div>
      <RadioGroup 
        value={formData.role} 
        onValueChange={(value) => updateFormData('role', value)}
        className="space-y-3"
      >
        {ROLE_OPTIONS.map((option) => (
          <div key={option.value} className="flex items-center space-x-3 p-4 border border-slate-200 rounded-xl hover:border-sky-300 hover:bg-sky-50 transition-all cursor-pointer">
            <RadioGroupItem value={option.value} id={option.value} data-testid={`role-${option.value}`} />
            <Label htmlFor={option.value} className="flex-1 cursor-pointer text-base">{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );

  // Step 3: State Selection
  const StateScreen = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 font-['Manrope']">
          What state are you operating in?
        </h2>
        <p className="text-slate-500 text-sm">You can go back or change your answers at any time.</p>
      </div>
      <Select value={formData.state} onValueChange={(value) => updateFormData('state', value)}>
        <SelectTrigger className="h-12" data-testid="state-select">
          <SelectValue placeholder="Select a state" />
        </SelectTrigger>
        <SelectContent>
          {US_STATES.map((state) => (
            <SelectItem key={state} value={state}>{state}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // Step 3: Goal Selection
  const GoalScreen = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 font-['Manrope']">
          What are you trying to do today?
        </h2>
        <p className="text-slate-500 text-sm">You can go back or change your answers at any time.</p>
      </div>
      <RadioGroup 
        value={formData.goal} 
        onValueChange={(value) => updateFormData('goal', value)}
        className="space-y-3"
      >
        {GOAL_OPTIONS.map((option) => (
          <div key={option.value} className="flex items-center space-x-3 p-4 border border-slate-200 rounded-xl hover:border-sky-300 hover:bg-sky-50 transition-all cursor-pointer">
            <RadioGroupItem value={option.value} id={`goal-${option.value}`} data-testid={`goal-${option.value}`} />
            <Label htmlFor={`goal-${option.value}`} className="flex-1 cursor-pointer text-base">{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );

  // Step 4: Readiness
  const ReadinessScreen = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 font-['Manrope']">
          Which do you have right now?
        </h2>
        <p className="text-slate-500 text-sm">You can go back or change your answers at any time.</p>
      </div>
      <div className="space-y-3">
        {READINESS_OPTIONS.map((option) => (
          <div 
            key={option.value} 
            className={`flex items-center space-x-3 p-4 border rounded-xl transition-all cursor-pointer ${
              formData.readiness.includes(option.value) 
                ? 'border-sky-500 bg-sky-50' 
                : 'border-slate-200 hover:border-sky-300 hover:bg-sky-50'
            }`}
            onClick={() => toggleMultiSelect('readiness', option.value)}
          >
            <Checkbox 
              checked={formData.readiness.includes(option.value)}
              onCheckedChange={() => toggleMultiSelect('readiness', option.value)}
              data-testid={`readiness-${option.value}`}
            />
            <Label className="flex-1 cursor-pointer text-base">{option.label}</Label>
          </div>
        ))}
      </div>
    </div>
  );

  // Step 5: Population (Optional)
  const PopulationScreen = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 font-['Manrope']">
          Who can you accept or place?
        </h2>
        <p className="text-slate-500 text-sm">You can go back or change your answers at any time. (Optional)</p>
      </div>
      <div className="space-y-3">
        {POPULATION_OPTIONS.map((option) => (
          <div 
            key={option.value} 
            className={`flex items-center space-x-3 p-4 border rounded-xl transition-all cursor-pointer ${
              formData.population.includes(option.value) 
                ? 'border-sky-500 bg-sky-50' 
                : 'border-slate-200 hover:border-sky-300 hover:bg-sky-50'
            }`}
            onClick={() => toggleMultiSelect('population', option.value)}
          >
            <Checkbox 
              checked={formData.population.includes(option.value)}
              onCheckedChange={() => toggleMultiSelect('population', option.value)}
              data-testid={`population-${option.value}`}
            />
            <Label className="flex-1 cursor-pointer text-base">{option.label}</Label>
          </div>
        ))}
      </div>
    </div>
  );

  // Step 6: Action Readiness
  const ActionReadinessScreen = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 font-['Manrope']">
          Are you ready to act today?
        </h2>
        <p className="text-slate-500 text-sm">You can go back or change your answers at any time.</p>
      </div>
      <RadioGroup 
        value={formData.actionReadiness} 
        onValueChange={(value) => updateFormData('actionReadiness', value)}
        className="space-y-3"
      >
        {ACTION_READINESS_OPTIONS.map((option) => (
          <div key={option.value} className="flex items-center space-x-3 p-4 border border-slate-200 rounded-xl hover:border-sky-300 hover:bg-sky-50 transition-all cursor-pointer">
            <RadioGroupItem value={option.value} id={`action-${option.value}`} data-testid={`action-${option.value}`} />
            <Label htmlFor={`action-${option.value}`} className="flex-1 cursor-pointer text-base">{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );

  // Outcome Screens
  const OutcomeYesNow = () => (
    <div className="text-center space-y-6">
      <div className="inline-flex p-4 rounded-2xl bg-emerald-100 text-emerald-600">
        <CheckCircle2 className="h-12 w-12" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 font-['Manrope']">
        You're Ready to Go!
      </h2>
      <p className="text-lg text-slate-600 max-w-md mx-auto">
        You can proceed now. Anchor Placementment helps coordinate housing and referrals.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={() => navigate("/placements")}
          data-testid="list-space-btn"
          className="bg-sky-600 hover:bg-sky-700 h-12 px-8 text-base font-medium"
        >
          List a Space
        </Button>
        <Button 
          onClick={() => navigate("/place-client")}
          data-testid="request-placement-btn"
          className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 text-base font-medium"
        >
          Request Placement
        </Button>
      </div>
      <p className="text-sm text-slate-500 max-w-md mx-auto">
        No Medicaid billing or licensing approvals are issued in this app.
      </p>
      <p className="text-xs text-slate-400 max-w-md mx-auto pt-4 border-t border-slate-100">
        Anchor Placementment coordinates referrals and availability. Medicaid billing and licensing guidance is provided in AnchorAxis.
      </p>
    </div>
  );

  const OutcomeMaybeSupport = () => (
    <div className="text-center space-y-6">
      <div className="inline-flex p-4 rounded-2xl bg-amber-100 text-amber-600">
        <HelpCircle className="h-12 w-12" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 font-['Manrope']">
        You Can Proceed with Support
      </h2>
      <p className="text-lg text-slate-600 max-w-md mx-auto">
        You can proceed with support or an agency partner. This is common.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={goToHome}
          data-testid="find-agency-btn"
          className="bg-sky-600 hover:bg-sky-700 h-12 px-8 text-base font-medium"
        >
          Find an Agency Partner
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate("/how-it-works")}
          data-testid="learn-needed-btn"
          className="h-12 px-8 text-base font-medium border-slate-300"
        >
          Learn What's Needed
        </Button>
      </div>
      <p className="text-sm text-slate-500 max-w-md mx-auto">
        We'll help you understand next steps without pressure.
      </p>
      <p className="text-xs text-slate-400 max-w-md mx-auto pt-4 border-t border-slate-100">
        Anchor Placementment coordinates referrals and availability. Medicaid billing and licensing guidance is provided in AnchorAxis.
      </p>
    </div>
  );

  const OutcomeNoSetup = () => (
    <div className="text-center space-y-6">
      <div className="inline-flex p-4 rounded-2xl bg-slate-100 text-slate-600">
        <Settings className="h-12 w-12" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 font-['Manrope']">
        Setup Needed
      </h2>
      <p className="text-lg text-slate-600 max-w-md mx-auto">
        You'll need setup before placement or billing. We'll guide you step-by-step.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={goToHome}
          data-testid="setup-guide-btn"
          className="bg-sky-600 hover:bg-sky-700 h-12 px-8 text-base font-medium"
        >
          Go to Setup Guide (AnchorAxis)
        </Button>
      </div>
      <p className="text-sm text-slate-500 max-w-md mx-auto">
        Your answers are saved. You can return anytime.
      </p>
      <p className="text-xs text-slate-400 max-w-md mx-auto pt-4 border-t border-slate-100">
        Anchor Placementment coordinates referrals and availability. Medicaid billing and licensing guidance is provided in AnchorAxis.
      </p>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <WelcomeScreen />;
      case 1: return <ConfirmationScreen />;
      case 2: return <RoleScreen />;
      case 3: return <StateScreen />;
      case 4: return <GoalScreen />;
      case 5: return <ReadinessScreen />;
      case 6: return <PopulationScreen />;
      case 7: return <ActionReadinessScreen />;
      case 8:
        if (formData.actionReadiness === "yes_now") return <OutcomeYesNow />;
        if (formData.actionReadiness === "maybe_support") return <OutcomeMaybeSupport />;
        if (formData.actionReadiness === "no_setup") return <OutcomeNoSetup />;
        return <OutcomeYesNow />;
      default: return <WelcomeScreen />;
    }
  };

  const totalSteps = 7; // Quiz steps (not counting welcome, confirmation, and outcome)
  const isOutcomeScreen = currentStep === 8;
  const isConfirmationScreen = currentStep === 1;
  const quizStepNumber = currentStep > 1 ? currentStep - 1 : 0; // For display purposes

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      {/* Header with Navigation */}
      {currentStep > 1 && !isOutcomeScreen && (
        <header className="w-full py-4 px-6 border-b border-slate-100">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={prevStep}
              data-testid="back-btn"
              className="gap-2 border-slate-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Step {quizStepNumber} of {totalSteps - 1}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/")}
              data-testid="save-exit-btn"
              className="text-slate-500 hover:text-slate-700"
            >
              Save & Exit
            </Button>
          </div>
        </header>
      )}

      {/* Progress Bar */}
      {currentStep > 1 && !isOutcomeScreen && (
        <div className="w-full bg-slate-100 h-1">
          <div 
            className="bg-sky-600 h-1 transition-all duration-300"
            style={{ width: `${(quizStepNumber / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-xl border-0 shadow-none bg-transparent">
          <CardContent className="p-0">
            {renderStep()}
          </CardContent>
        </Card>
      </main>

      {/* Navigation Footer */}
      {currentStep > 1 && currentStep < 8 && (
        <footer className="w-full py-6 px-6 border-t border-slate-100">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <Button 
              variant="outline"
              onClick={prevStep}
              data-testid="footer-back-btn"
              className="h-11 px-6 gap-2 border-slate-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button 
              onClick={currentStep === 7 ? () => setCurrentStep(8) : nextStep}
              disabled={!canProceed()}
              data-testid="continue-btn"
              className="bg-sky-600 hover:bg-sky-700 h-11 px-8 gap-2"
            >
              {currentStep === 7 ? "See Results" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          {/* Restart Quiz Link */}
          <div className="max-w-2xl mx-auto text-center mt-4">
            <button
              onClick={restartQuiz}
              data-testid="restart-quiz-link"
              className="text-sm text-slate-500 hover:text-sky-600 underline underline-offset-2 inline-flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Restart quiz
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
