import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Clock,
  Folder,
  FileText,
  Download,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Step details with reassuring, simple content
// Each step has ONE optional resource to reduce searching
const STEP_DETAILS = {
  1: {
    title: "Form Your Business Entity",
    intro: "This step helps you legally establish your agency.\nYou don't need to do everything at once.\nTake it one task at a time.",
    instructions: [
      "Choose your business type (LLC is most common)",
      "Register with your Secretary of State",
      "Get your EIN from the IRS (free and instant)"
    ],
    whyItMatters: "Having a legal business entity is required before you can enroll as a Medicaid provider or contract with MCOs.",
    commonMistakes: [
      "Filing in the wrong state",
      "Choosing the wrong entity type for your situation",
      "Forgetting to get a registered agent",
      "Not keeping your Operating Agreement updated"
    ],
    actionLabel: "Start Step 1",
    progressMessage: "You're doing great.\nMost people complete this step over a few days.\nYou can stop and return whenever you need.",
    completionMessage: "Step 1 complete.\nYour business is legally established and ready for the next step.",
    resource: {
      label: "Apply for EIN",
      url: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online",
      type: "external"
    }
  },
  2: {
    title: "Collect Required Documents",
    intro: "This step helps you gather and organize important documents.\nYou do not need to finish everything at once.\nTake it one document at a time.",
    instructions: [
      "Download required templates",
      "Customize them for your agency",
      "Save all documents in one folder"
    ],
    whyItMatters: "These documents are required for Medicaid, MCOs, and audits.\nHaving them organized now will save you time and stress later.",
    commonMistakes: [
      "Using templates without customizing them",
      "Forgetting to update agency name and address",
      "Saving documents in different places",
      "Using outdated forms"
    ],
    actionLabel: "Start Step 2",
    progressMessage: "You're doing well.\nMost people complete this step a little at a time.\nYou can stop and return whenever you need.",
    completionMessage: "Step 2 complete.\nYour documents are organized and ready for the next step.",
    resource: {
      label: "Download Templates",
      url: "/templates",
      type: "internal"
    }
  },
  3: {
    title: "Obtain Business Insurance",
    intro: "This step helps you protect your agency and meet requirements.\nInsurance quotes are free and don't require commitment.\nStart by just getting a quote.",
    instructions: [
      "Request quotes for general liability insurance",
      "Request quotes for professional liability insurance",
      "Compare options and choose coverage"
    ],
    whyItMatters: "Insurance protects you from lawsuits and is required by most MCOs before they'll credential you.",
    commonMistakes: [
      "Getting insufficient coverage limits",
      "Choosing the wrong policy type",
      "Not listing your agency as the named insured",
      "Letting coverage lapse"
    ],
    actionLabel: "Start Step 3",
    progressMessage: "Take your time comparing options.\nYou don't have to decide today.\nGetting quotes is a great first step.",
    completionMessage: "Step 3 complete.\nYour agency is protected and ready for credentialing."
  },
  4: {
    title: "Enroll as Medicaid Provider",
    intro: "This step gets you into the Medicaid system.\nThe application can feel long, but take it section by section.\nYou can save and return.",
    instructions: [
      "Create your account in the state portal",
      "Gather required documents (EIN, NPI, license)",
      "Complete the provider enrollment application"
    ],
    whyItMatters: "Medicaid enrollment is required before you can bill for peer support services.",
    commonMistakes: [
      "Submitting incomplete applications",
      "Missing required signatures",
      "Selecting the wrong provider type",
      "Not following up on pending applications"
    ],
    actionLabel: "Start Step 4",
    progressMessage: "Enrollment applications take time.\nDon't rush — incomplete applications get rejected.\nYou're making progress.",
    completionMessage: "Step 4 complete.\nYou're now enrolled as a Medicaid provider."
  },
  5: {
    title: "Credential with MCOs",
    intro: "This step connects you with managed care organizations.\nEach MCO has its own process.\nStart with one MCO at a time.",
    instructions: [
      "Identify MCOs in your service area",
      "Submit credentialing applications",
      "Complete CAQH profile if required"
    ],
    whyItMatters: "Most Medicaid members are enrolled in MCOs.\nYou need MCO contracts to serve and bill for most clients.",
    commonMistakes: [
      "Not applying to all MCOs in your area",
      "Incomplete CAQH profile",
      "Missing required attestations",
      "Not following up regularly"
    ],
    actionLabel: "Start Step 5",
    progressMessage: "MCO credentialing can take 60-120 days.\nThis is normal — keep following up.\nYou're on the right track.",
    completionMessage: "Step 5 complete.\nYou're credentialed and ready to serve MCO members."
  },
  6: {
    title: "Hire Certified Staff",
    intro: "This step helps you build your team.\nYou can start with just one certified peer specialist.\nGrow your team as your client base grows.",
    instructions: [
      "Write a job description",
      "Post on job boards and networks",
      "Verify certifications before hiring"
    ],
    whyItMatters: "You need certified peer support specialists to deliver and bill for services.",
    commonMistakes: [
      "Hiring without verifying certifications",
      "Skipping background checks",
      "Not having a credential verification process",
      "Hiring before you're credentialed"
    ],
    actionLabel: "Start Step 6",
    progressMessage: "Finding the right people takes time.\nStart networking now, even if you're not ready to hire.\nGood candidates are worth waiting for.",
    completionMessage: "Step 6 complete.\nYour team is ready to serve clients."
  },
  7: {
    title: "Establish Supervision",
    intro: "This step sets up required clinical oversight.\nSupervision protects your staff and clients.\nOne good supervisor is all you need to start.",
    instructions: [
      "Identify licensed professionals who can supervise",
      "Create a supervision agreement",
      "Set up a regular supervision schedule"
    ],
    whyItMatters: "Most states require licensed supervision of peer support specialists.\nIt's also essential for quality care.",
    commonMistakes: [
      "Using supervisors with the wrong license type",
      "Not having a written agreement",
      "Inadequate supervision frequency",
      "Not documenting supervision sessions"
    ],
    actionLabel: "Start Step 7",
    progressMessage: "A good supervisor relationship takes time to build.\nStart with clear expectations.\nYou can adjust as you learn what works.",
    completionMessage: "Step 7 complete.\nYour supervision structure is in place."
  },
  8: {
    title: "Develop Policies & Procedures",
    intro: "This step creates your agency's rulebook.\nYou don't need to write everything from scratch.\nStart with templates and customize them.",
    instructions: [
      "Download our P&P template",
      "Customize for your agency",
      "Review and update regularly"
    ],
    whyItMatters: "Policies and procedures are required for Medicaid compliance and MCO audits.\nThey also protect you and your staff.",
    commonMistakes: [
      "Using generic templates without customization",
      "Missing required policies",
      "Not training staff on policies",
      "Forgetting to update policies"
    ],
    actionLabel: "Start Step 8",
    progressMessage: "Policies don't have to be perfect on day one.\nStart with the essentials.\nYou can refine them over time.",
    completionMessage: "Step 8 complete.\nYour policies and procedures are documented."
  },
  9: {
    title: "Set Up Billing Systems",
    intro: "This step prepares you to get paid.\nBilling software doesn't have to be expensive.\nStart simple and upgrade as you grow.",
    instructions: [
      "Research billing software options",
      "Set up your chosen system",
      "Test with a practice claim"
    ],
    whyItMatters: "Proper billing systems ensure you get paid for your services and stay compliant.",
    commonMistakes: [
      "Choosing incompatible software",
      "Not testing before going live",
      "Skipping staff training",
      "Not setting up claim tracking"
    ],
    actionLabel: "Start Step 9",
    progressMessage: "Billing can feel intimidating.\nTake it step by step.\nMost software has good support.",
    completionMessage: "Step 9 complete.\nYour billing system is ready to process claims."
  },
  10: {
    title: "Verify Zoning & Location",
    intro: "This step ensures your location is compliant.\nA quick call to your city/county can answer most questions.\nMany peer support services can be delivered virtually.",
    instructions: [
      "Check local zoning for your address",
      "Get required business licenses",
      "Verify ADA accessibility if needed"
    ],
    whyItMatters: "Operating from a non-compliant location can result in fines or being shut down.",
    commonMistakes: [
      "Operating in residential zone without permit",
      "Missing local business license",
      "Ignoring ADA requirements",
      "Not checking parking requirements"
    ],
    actionLabel: "Start Step 10",
    progressMessage: "Local requirements vary.\nA quick call to your city office can save a lot of time.\nYou're almost there.",
    completionMessage: "Step 10 complete.\nYour location is compliant and ready for business."
  },
  11: {
    title: "Start Accepting Referrals",
    intro: "This is the exciting part — serving clients!\nStart small and build your reputation.\nQuality over quantity.",
    instructions: [
      "Network with referral sources",
      "Create simple marketing materials",
      "Set up your referral tracking"
    ],
    whyItMatters: "Referrals are the lifeblood of your agency.\nBuilding relationships takes time but pays off.",
    commonMistakes: [
      "Starting before credentialing is complete",
      "Not tracking referral sources",
      "Skipping documentation training",
      "Taking on too many clients too fast"
    ],
    actionLabel: "Start Step 11",
    progressMessage: "Building a referral network takes time.\nStart with one or two relationships.\nWord of mouth will grow your agency.",
    completionMessage: "Congratulations!\nYou've completed all the steps.\nYour peer support agency is ready to serve your community."
  }
};

const StepDetailModal = ({ 
  step, 
  isCompleted, 
  onClose, 
  onMarkComplete,
  onStartStep,
  stateCode 
}) => {
  const [showProgress, setShowProgress] = useState(false);
  const details = STEP_DETAILS[step?.step] || STEP_DETAILS[1];

  if (!step) return null;

  const handleStartStep = () => {
    setShowProgress(true);
    if (onStartStep) onStartStep(step.step);
  };

  const handleMarkComplete = () => {
    if (onMarkComplete) onMarkComplete(step.step);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isCompleted ? "bg-green-500 text-white" : "bg-gold/10 text-gold"
            }`}>
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <span className="font-bold">{step.step}</span>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Step {step.step} of 11</p>
              <h2 className="font-serif text-lg text-navy">{details.title}</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Intro */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-slate-700 whitespace-pre-line leading-relaxed">
              {details.intro}
            </p>
          </div>

          {/* Main Instructions */}
          <div>
            <h3 className="font-medium text-navy mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold" />
              What you'll do
            </h3>
            <ul className="space-y-2">
              {details.instructions.map((instruction, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <ChevronRight className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">{instruction}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Why It Matters */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Why this matters
            </h3>
            <p className="text-blue-800 text-sm whitespace-pre-line">
              {details.whyItMatters}
            </p>
          </div>

          {/* Common Mistakes */}
          <div>
            <h3 className="font-medium text-navy mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Common mistakes to avoid
            </h3>
            <ul className="space-y-2">
              {details.commonMistakes.map((mistake, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span className="text-slate-600">{mistake}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Progress Message */}
          {showProgress && !isCompleted && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-green-800 text-sm whitespace-pre-line">
                {details.progressMessage}
              </p>
            </div>
          )}

          {/* Completion Message */}
          {isCompleted && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <p className="text-green-800 whitespace-pre-line">
                  {details.completionMessage}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex gap-3">
          {!isCompleted ? (
            <>
              {!showProgress ? (
                <Button 
                  onClick={handleStartStep}
                  className="flex-1 bg-gold hover:bg-gold/90 text-white"
                >
                  {details.actionLabel}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleMarkComplete}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Complete
                </Button>
              )}
            </>
          ) : (
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepDetailModal;
