import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  ArrowLeft,
  MapPin, 
  Target, 
  Mail,
  CheckCircle,
  Sparkles,
  Clock,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const GOALS = [
  { id: "start-agency", label: "Start my own peer support agency", icon: "🚀" },
  { id: "expand-services", label: "Add peer support to existing services", icon: "📈" },
  { id: "learn-requirements", label: "Learn what's required in my state", icon: "📚" },
  { id: "just-exploring", label: "Just exploring for now", icon: "🔍" }
];

const POPULAR_STATES = [
  { code: "NC", name: "North Carolina" },
  { code: "TX", name: "Texas" },
  { code: "CA", name: "California" },
  { code: "FL", name: "Florida" },
  { code: "NY", name: "New York" },
  { code: "OH", name: "Ohio" },
  { code: "PA", name: "Pennsylvania" },
  { code: "GA", name: "Georgia" }
];

const ALL_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }
];

const StartPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, requestMagicLink, completeOnboarding } = useAuth();
  
  const [step, setStep] = useState(isAuthenticated && user ? 1 : 0);
  const [email, setEmail] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [showAllStates, setShowAllStates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      await requestMagicLink(email);
      setMagicLinkSent(true);
      toast.success("Check your email for the login link!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleStateSelect = (code) => {
    setSelectedState(code);
    setTimeout(() => setStep(2), 300);
  };

  const handleGoalSelect = async (goalId) => {
    setSelectedGoal(goalId);
    
    if (isAuthenticated) {
      setLoading(true);
      try {
        await completeOnboarding({
          selected_state: selectedState,
          goal: goalId
        });
        toast.success("You're all set!");
        navigate("/dashboard");
      } catch (err) {
        toast.error("Failed to save your preferences");
      } finally {
        setLoading(false);
      }
    } else {
      setStep(3);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      const result = await requestMagicLink(email);
      setMagicLinkSent(true);
      // Store selections in localStorage for after verification
      localStorage.setItem("pendingOnboarding", JSON.stringify({
        selected_state: selectedState,
        goal: selectedGoal
      }));
      toast.success("Check your email for the login link!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Step 0: Email entry (for non-authenticated users starting fresh)
  if (step === 0 && !isAuthenticated) {
    if (magicLinkSent) {
      return (
        <div className="min-h-screen bg-[hsl(40,20%,98%)] flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-[hsl(40,15%,90%)] shadow-lg bg-[hsl(40,15%,99%)]">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="font-serif text-2xl text-navy mb-3">Check your inbox</h1>
              <p className="text-slate-600 mb-6">
                We sent a login link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-slate-500">
                Click the link in your email to continue. It expires in 15 minutes.
              </p>
              <Button
                variant="ghost"
                className="mt-6 text-gold"
                onClick={() => setMagicLinkSent(false)}
              >
                Use a different email
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[hsl(40,20%,98%)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back button */}
          <Button
            variant="ghost"
            className="mb-4 text-slate-600 hover:text-navy"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl text-navy mb-3">
              Let's get started
            </h1>
            <p className="text-slate-600">
              Enter your email to save your progress as you go
            </p>
          </div>

          <Card className="border border-[hsl(40,15%,90%)] shadow-lg bg-[hsl(40,15%,99%)]">
            <CardContent className="p-8">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-center text-lg py-6 bg-white border-[hsl(40,15%,88%)]"
                  required
                />
                <Button 
                  type="submit" 
                  className="w-full bg-gold hover:bg-gold/90 text-white py-6 shadow-sm"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Continue"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
                <Shield className="w-4 h-4" />
                <span>No password needed. We'll email you a secure link.</span>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              className="text-slate-500"
              onClick={() => setStep(1)}
            >
              Skip for now — I'll save my progress later
            </Button>
          </div>

          <p className="text-center text-xs text-slate-400 mt-8">
            You can stop and return anytime. Your progress is automatically saved.
          </p>
        </div>
      </div>
    );
  }

  // Step 1: State Selection
  if (step === 1) {
    return (
      <div className="min-h-screen bg-[hsl(40,20%,98%)] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            className="mb-4 text-slate-600 hover:text-navy"
            onClick={() => isAuthenticated ? navigate("/") : setStep(0)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-3 h-3 rounded-full bg-gold"></div>
            <div className="w-8 h-0.5 bg-slate-200"></div>
            <div className="w-3 h-3 rounded-full bg-slate-200"></div>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-gold text-sm font-medium mb-3">
              <MapPin className="w-4 h-4" />
              Step 1 of 2
            </div>
            <h1 className="font-serif text-3xl text-navy mb-3">
              Which state are you launching in?
            </h1>
            <p className="text-slate-600">
              We'll show you exactly what's required there
            </p>
          </div>

          {/* Popular states */}
          <Card className="border-0 shadow-lg mb-6">
            <CardContent className="p-6">
              <p className="text-sm text-slate-500 mb-4">Popular choices</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {POPULAR_STATES.map((state) => (
                  <button
                    key={state.code}
                    onClick={() => handleStateSelect(state.code)}
                    className={`p-4 rounded-xl border-2 transition-all text-left hover:border-gold hover:bg-gold/5 ${
                      selectedState === state.code 
                        ? "border-gold bg-gold/10" 
                        : "border-slate-200"
                    }`}
                  >
                    <span className="text-2xl block mb-1">{state.code}</span>
                    <span className="text-sm text-slate-600">{state.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Show all states toggle */}
          {!showAllStates ? (
            <Button
              variant="ghost"
              className="w-full text-slate-500"
              onClick={() => setShowAllStates(true)}
            >
              Show all 50 states
            </Button>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500 mb-4">All states</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-64 overflow-y-auto">
                  {ALL_STATES.map((state) => (
                    <button
                      key={state.code}
                      onClick={() => handleStateSelect(state.code)}
                      className={`p-3 rounded-lg border transition-all text-center hover:border-gold hover:bg-gold/5 ${
                        selectedState === state.code 
                          ? "border-gold bg-gold/10" 
                          : "border-slate-200"
                      }`}
                    >
                      <span className="font-medium">{state.code}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <p className="text-center text-sm text-slate-400 mt-8">
            <Clock className="w-4 h-4 inline mr-1" />
            You can change this anytime
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Goal Selection
  if (step === 2) {
    return (
      <div className="min-h-screen bg-[hsl(40,20%,98%)] py-12 px-4">
        <div className="max-w-xl mx-auto">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-3 h-3 rounded-full bg-gold"></div>
            <div className="w-8 h-0.5 bg-gold"></div>
            <div className="w-3 h-3 rounded-full bg-gold"></div>
          </div>

          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-2 text-slate-500 mb-6 hover:text-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-gold text-sm font-medium mb-3">
              <Target className="w-4 h-4" />
              Step 2 of 2
            </div>
            <h1 className="font-serif text-3xl text-navy mb-3">
              What's your goal?
            </h1>
            <p className="text-slate-600">
              This helps us personalize your roadmap
            </p>
          </div>

          <div className="space-y-3">
            {GOALS.map((goal) => (
              <button
                key={goal.id}
                onClick={() => handleGoalSelect(goal.id)}
                disabled={loading}
                className={`w-full p-5 rounded-xl border-2 transition-all text-left hover:border-gold hover:bg-gold/5 flex items-center gap-4 ${
                  selectedGoal === goal.id 
                    ? "border-gold bg-gold/10" 
                    : "border-slate-200 bg-white"
                }`}
              >
                <span className="text-2xl">{goal.icon}</span>
                <span className="text-navy font-medium">{goal.label}</span>
                {selectedGoal === goal.id && (
                  <CheckCircle className="w-5 h-5 text-gold ml-auto" />
                )}
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-slate-400 mt-8">
            <Sparkles className="w-4 h-4 inline mr-1" />
            We'll create a personalized checklist for you
          </p>
        </div>
      </div>
    );
  }

  // Step 3: Save progress (email capture for non-authenticated)
  if (step === 3 && !isAuthenticated) {
    if (magicLinkSent) {
      return (
        <div className="min-h-screen bg-[hsl(40,20%,98%)] flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-[hsl(40,15%,90%)] shadow-lg bg-[hsl(40,15%,99%)]">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="font-serif text-2xl text-navy mb-3">Almost there!</h1>
              <p className="text-slate-600 mb-6">
                Check your email at <strong>{email}</strong> for your login link
              </p>
              <p className="text-sm text-slate-500">
                After clicking the link, you'll see your personalized roadmap for {selectedState}.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[hsl(40,20%,98%)] py-12 px-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-2 text-slate-500 mb-6 hover:text-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-gold" />
            </div>
            <h1 className="font-serif text-3xl text-navy mb-3">
              Your roadmap is ready!
            </h1>
            <p className="text-slate-600">
              Save it with your email so you can pick up where you left off
            </p>
          </div>

          <Card className="border border-[hsl(40,15%,90%)] shadow-lg bg-[hsl(40,15%,99%)]">
            <CardContent className="p-8">
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-center text-lg py-6"
                  required
                />
                <Button 
                  type="submit" 
                  className="w-full bg-gold hover:bg-gold/90 text-white py-6"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save & View My Roadmap"}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-4">
                No password needed. We'll email you a secure link.
              </p>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              className="text-slate-500"
              onClick={() => navigate(`/state/${selectedState}`)}
            >
              Skip — view roadmap without saving
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default StartPage;
