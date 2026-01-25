import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  MapPin, 
  CheckCircle2, 
  Circle,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Download,
  ExternalLink,
  LogOut,
  Settings,
  Sparkles,
  Clock,
  ArrowRight,
  FileText,
  Users,
  Building2,
  Zap,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import StepDetailModal from "@/components/StepDetailModal";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// First 3 steps shown by default
const INITIAL_STEPS_SHOWN = 3;

// Quick wins - easy tasks that build confidence
const QUICK_WINS = [
  { step: 1, task: "Get your EIN online", time: "10 min", tip: "It's free and instant at irs.gov", icon: "📋" },
  { step: 2, task: "Download a document template", time: "2 min", tip: "We have templates ready for you", icon: "📄" },
  { step: 3, task: "Get an insurance quote", time: "5 min", tip: "Just request a quote — no commitment", icon: "🛡️" },
  { step: 4, task: "Create your PECOS account", time: "10 min", tip: "You'll need it for Medicaid enrollment", icon: "🔐" },
  { step: 5, task: "Register on CAQH ProView", time: "15 min", tip: "Many MCOs require this", icon: "📝" },
  { step: 6, task: "Write a simple job description", time: "10 min", tip: "Start with the basics — refine later", icon: "👥" },
  { step: 7, task: "Research supervisor options", time: "10 min", tip: "Make a list of 3 potential supervisors", icon: "🎓" },
  { step: 8, task: "Download a P&P template", time: "2 min", tip: "We have one ready for you", icon: "📄" },
  { step: 9, task: "Research billing software", time: "10 min", tip: "Compare 2-3 options online", icon: "💻" },
  { step: 10, task: "Check your local zoning", time: "5 min", tip: "Call your city/county office", icon: "📍" },
  { step: 11, task: "Join a peer support group", time: "5 min", tip: "Connect with others on this journey", icon: "🤝" }
];

const UserDashboardPage = () => {
  const navigate = useNavigate();
  const { user, token, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [stateData, setStateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [quickWinDismissed, setQuickWinDismissed] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/start");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (token && user) {
      fetchDashboardData();
    }
    // Check if quick win was dismissed this session
    const dismissed = sessionStorage.getItem("quickWinDismissed");
    if (dismissed) setQuickWinDismissed(true);
  }, [token, user]);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, stateRes] = await Promise.all([
        axios.get(`${API}/user/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        user?.selected_state 
          ? axios.get(`${API}/states/${user.selected_state}`)
          : Promise.resolve(null)
      ]);
      
      setDashboardData(dashRes.data);
      if (stateRes) {
        setStateData(stateRes.data);
      }
      
      // Fetch detailed progress for selected state
      if (user?.selected_state) {
        try {
          const progressRes = await axios.get(
            `${API}/user/progress/${user.selected_state}`,
            { headers: { Authorization: `Bearer ${token}` }}
          );
          setCompletedSteps(progressRes.data.completed_steps || []);
        } catch (err) {
          // Progress might not exist yet
          setCompletedSteps([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = async (stepNumber) => {
    const newCompleted = completedSteps.includes(stepNumber)
      ? completedSteps.filter(s => s !== stepNumber)
      : [...completedSteps, stepNumber];
    
    setCompletedSteps(newCompleted);

    // Save to backend
    try {
      await axios.post(
        `${API}/user/progress/${user.selected_state}`,
        { 
          state_code: user.selected_state,
          completed_steps: newCompleted,
          bookmarked_links: [],
          notes: null
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
    } catch (err) {
      console.error("Failed to save progress:", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user?.onboarding_complete) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <Sparkles className="w-12 h-12 text-gold mx-auto mb-4" />
            <h1 className="font-serif text-2xl text-navy mb-3">Let's set up your roadmap</h1>
            <p className="text-slate-600 mb-6">
              Tell us your state and goal so we can personalize your journey.
            </p>
            <Button 
              onClick={() => navigate("/start")}
              className="bg-gold hover:bg-gold/90 text-white"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSteps = stateData?.checklist?.length || 11;
  const progressPercent = Math.round((completedSteps.length / totalSteps) * 100);
  const visibleSteps = showAllSteps 
    ? stateData?.checklist 
    : stateData?.checklist?.slice(0, INITIAL_STEPS_SHOWN);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="user-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-lg text-navy font-bold">
            Peer Support Launch
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:block">
              {user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-500"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl text-navy mb-2">
            {user?.name ? `Welcome back, ${user.name}!` : "Welcome back!"}
          </h1>
          <p className="text-slate-600">
            Pick up where you left off. Your progress is saved automatically.
          </p>
        </div>

        {/* State & Progress Card */}
        <Card className="border-0 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-navy">
                    {stateData?.state_name || user?.selected_state}
                  </h2>
                  <p className="text-sm text-slate-500">Your selected state</p>
                </div>
              </div>
              <Link 
                to={`/state/${user?.selected_state}`}
                className="text-gold text-sm font-medium flex items-center gap-1 hover:underline"
              >
                View full guide
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600">Your progress</span>
                <span className="font-medium text-navy">{completedSteps.length} of {totalSteps} steps</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>
            
            {progressPercent > 0 && progressPercent < 100 && (
              <p className="text-sm text-slate-500 mt-3">
                <Clock className="w-4 h-4 inline mr-1" />
                You're making great progress! Take your time — there's no rush.
              </p>
            )}
            
            {progressPercent === 100 && (
              <p className="text-sm text-green-600 mt-3">
                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                Congratulations! You've completed all the steps.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Win Card - Optional, dismissable */}
        {!quickWinDismissed && completedSteps.length < totalSteps && (() => {
          // Find the next incomplete step
          const nextStepNum = completedSteps.length > 0 
            ? Math.min(...[1,2,3,4,5,6,7,8,9,10,11].filter(s => !completedSteps.includes(s)))
            : 1;
          const quickWin = QUICK_WINS.find(q => q.step === nextStepNum);
          
          if (!quickWin) return null;
          
          return (
            <Card className="border-0 shadow-sm mb-6 bg-gradient-to-r from-amber-50 to-orange-50 relative" data-testid="quick-win-card">
              <button
                onClick={() => {
                  setQuickWinDismissed(true);
                  sessionStorage.setItem("quickWinDismissed", "true");
                }}
                className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white/50"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
              <CardContent className="p-4 pr-10">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{quickWin.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">Quick Win</span>
                      <span className="text-xs text-slate-500">• {quickWin.time}</span>
                    </div>
                    <p className="text-sm font-medium text-navy">{quickWin.task}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{quickWin.tip}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Roadmap Steps */}
        <div className="mb-8">
          <h2 className="font-serif text-xl text-navy mb-4">Your Roadmap</h2>
          
          <div className="space-y-3">
            {visibleSteps?.map((step, index) => {
              const isCompleted = completedSteps.includes(step.step);
              const isNext = !isCompleted && completedSteps.length === index;
              
              return (
                <Card 
                  key={step.step} 
                  className={`border-0 shadow-sm transition-all cursor-pointer hover:shadow-md ${
                    isNext ? "ring-2 ring-gold ring-offset-2" : ""
                  }`}
                  onClick={() => setSelectedStep(step)}
                  data-testid={`step-card-${step.step}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStep(step.step);
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isCompleted 
                            ? "bg-green-500 text-white" 
                            : "border-2 border-slate-300 hover:border-gold"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-medium text-slate-400">{step.step}</span>
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium ${isCompleted ? "text-slate-400 line-through" : "text-navy"}`}>
                          {step.title}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {step.description}
                        </p>
                        
                        {isNext && (
                          <div className="mt-3">
                            <span className="inline-flex items-center gap-1 text-sm text-gold font-medium">
                              View details
                              <ChevronRight className="w-4 h-4" />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Show more/less toggle */}
          {stateData?.checklist?.length > INITIAL_STEPS_SHOWN && (
            <Button
              variant="ghost"
              className="w-full mt-4 text-slate-500"
              onClick={() => setShowAllSteps(!showAllSteps)}
            >
              {showAllSteps ? (
                <>Show less</>
              ) : (
                <>
                  Show all {totalSteps} steps
                  <ChevronDown className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Link to="/templates">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-navy text-sm">Templates</h3>
                  <p className="text-xs text-slate-500">Download forms & docs</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/federal-links">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-navy text-sm">Federal Links</h3>
                  <p className="text-xs text-slate-500">IRS, NPI, CAQH & more</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/national-overview">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-navy text-sm">Learn More</h3>
                  <p className="text-xs text-slate-500">National overview</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Reassuring footer */}
        <div className="text-center py-8 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            <Clock className="w-4 h-4 inline mr-1" />
            Your progress is saved automatically. Come back anytime.
          </p>
        </div>
      </main>

      {/* Step Detail Modal */}
      {selectedStep && (
        <StepDetailModal
          step={selectedStep}
          isCompleted={completedSteps.includes(selectedStep.step)}
          onClose={() => setSelectedStep(null)}
          onMarkComplete={(stepNum) => {
            if (!completedSteps.includes(stepNum)) {
              toggleStep(stepNum);
            }
          }}
          stateCode={user?.selected_state}
        />
      )}
    </div>
  );
};

export default UserDashboardPage;
