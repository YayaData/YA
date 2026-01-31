import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Check, AlertTriangle, Anchor, CreditCard, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const urgencyLevels = [
  { value: "Low", label: "Low – Within 30 days" },
  { value: "Medium", label: "Medium – Within 2 weeks" },
  { value: "High", label: "High – Within 1 week" },
  { value: "Urgent", label: "Urgent – Within 48 hours" }
];

const steps = [
  { id: 1, title: "Your Contact Information", description: "For coordination purposes only" },
  { id: 2, title: "Placement Needs", description: "What type of placement is needed" },
  { id: 3, title: "Additional Details", description: "Any other information" }
];

export default function PlaceClient() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentVerified = searchParams.get("payment_verified") === "true";
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [referralSources, setReferralSources] = useState([]);
  const [placementTypes, setPlacementTypes] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [paymentOptions, setPaymentOptions] = useState(null);
  const [paymentSessionId, setPaymentSessionId] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState("placement");
  const [disclaimerAcknowledged, setDisclaimerAcknowledged] = useState(false);

  const [formData, setFormData] = useState({
    referral_source: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    placement_type_needed: "",
    location_preference: "",
    urgency: "Medium",
    services_needed: [],
    additional_notes: "",
    accepts_medicaid_required: false
  });

  // Check subscription status when email changes
  const checkSubscription = async (email) => {
    if (!email) return;
    try {
      const response = await axios.get(`${API}/payments/subscription/check?email=${encodeURIComponent(email)}`);
      setHasActiveSubscription(response.data.has_active_subscription);
      if (response.data.subscription?.expires_at) {
        setSubscriptionExpiry(response.data.subscription.expires_at);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sourcesRes, typesRes, servicesRes, feeRes] = await Promise.all([
          axios.get(`${API}/referral-sources`),
          axios.get(`${API}/placement-types`),
          axios.get(`${API}/services-list`),
          axios.get(`${API}/payments/fee`)
        ]);
        setReferralSources(sourcesRes.data.sources);
        setPlacementTypes(typesRes.data.types);
        setServicesList(servicesRes.data.services);
        setPaymentOptions(feeRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load form data");
      }
    };
    fetchData();

    // Check for stored payment session
    const storedSession = localStorage.getItem("placement_payment_session");
    if (storedSession && paymentVerified) {
      setPaymentSessionId(storedSession);
    }
  }, [paymentVerified]);

  // Check subscription when email is entered
  useEffect(() => {
    if (formData.contact_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      const debounceTimer = setTimeout(() => {
        checkSubscription(formData.contact_email);
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [formData.contact_email]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (service) => {
    setFormData(prev => ({
      ...prev,
      services_needed: prev.services_needed.includes(service)
        ? prev.services_needed.filter(s => s !== service)
        : [...prev.services_needed, service]
    }));
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.referral_source || !formData.contact_name || !formData.contact_email || !formData.contact_phone) {
        toast.error("Please fill in all required fields");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
        toast.error("Please enter a valid email address");
        return false;
      }
    }
    if (currentStep === 2) {
      if (!formData.placement_type_needed || !formData.location_preference || !formData.urgency) {
        toast.error("Please fill in all required fields");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    // If user has active subscription, submit directly
    if (hasActiveSubscription) {
      setIsSubmitting(true);
      try {
        await axios.post(`${API}/placement-requests?user_email=${encodeURIComponent(formData.contact_email)}`, formData);
        toast.success("Placement request submitted successfully!");
        navigate("/");
      } catch (error) {
        console.error("Error submitting request:", error);
        toast.error("Failed to submit request. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // If has payment session, submit with it
    if (paymentSessionId) {
      setIsSubmitting(true);
      try {
        await axios.post(`${API}/placement-requests?payment_session_id=${paymentSessionId}&user_email=${encodeURIComponent(formData.contact_email)}`, formData);
        
        // Clear the payment session
        localStorage.removeItem("placement_payment_session");
        
        toast.success("Placement request submitted successfully!");
        navigate("/");
      } catch (error) {
        console.error("Error submitting request:", error);
        if (error.response?.status === 402) {
          toast.error("Payment required. Please complete payment first.");
          setPaymentSessionId(null);
        } else {
          toast.error("Failed to submit request. Please try again.");
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // No subscription or payment - redirect to payment
    await initiatePayment();
  };

  const initiatePayment = async () => {
    setIsProcessingPayment(true);
    try {
      const response = await axios.post(`${API}/payments/checkout/create`, {
        origin_url: window.location.origin,
        payment_type: selectedPaymentType,
        user_email: formData.contact_email,
        metadata: {
          contact_email: formData.contact_email,
          placement_type: formData.placement_type_needed
        }
      });

      // Redirect to Stripe Checkout
      window.location.href = response.data.checkout_url;
    } catch (error) {
      console.error("Error creating payment session:", error);
      toast.error("Failed to initialize payment. Please try again.");
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="w-full py-6 px-6 md:px-12 border-b border-slate-100">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            data-testid="back-to-home"
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="p-2 bg-sky-600 rounded-xl">
            <Anchor className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-slate-900 font-['Manrope']">Place a Client</span>
        </div>
      </header>

      <main className="px-6 md:px-12 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* PHI Warning */}
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Important Privacy Notice</p>
              <p className="text-sm text-amber-700 mt-1">
                Do not enter any protected health information (PHI), real names, or medical diagnoses. 
                This form is for coordination purposes only.
              </p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all
                        ${currentStep > step.id 
                          ? 'bg-emerald-500 text-white' 
                          : currentStep === step.id 
                            ? 'bg-sky-600 text-white' 
                            : 'bg-slate-200 text-slate-500'
                        }`}
                    >
                      {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                    </div>
                    <span className={`text-xs mt-2 font-medium hidden md:block ${
                      currentStep >= step.id ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 md:w-24 h-1 mx-2 rounded ${
                      currentStep > step.id ? 'bg-emerald-500' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-slate-900 font-['Manrope']">
                {steps[currentStep - 1].title}
              </CardTitle>
              <CardDescription className="text-slate-600">
                {steps[currentStep - 1].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Contact Information */}
              {currentStep === 1 && (
                <>
                  <div className="p-3 bg-sky-50 border border-sky-100 rounded-lg mb-2">
                    <p className="text-sm text-sky-700">
                      This information is used only to coordinate placement communication. Do not enter client-identifying information.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referral_source">Referral Source *</Label>
                    <Select 
                      value={formData.referral_source} 
                      onValueChange={(value) => updateFormData('referral_source', value)}
                    >
                      <SelectTrigger data-testid="referral-source-select">
                        <SelectValue placeholder="Select your organization type" />
                      </SelectTrigger>
                      <SelectContent>
                        {referralSources.map((source) => (
                          <SelectItem key={source} value={source}>{source}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Your Name *</Label>
                    <Input
                      id="contact_name"
                      data-testid="contact-name-input"
                      placeholder="Enter your full name"
                      value={formData.contact_name}
                      onChange={(e) => updateFormData('contact_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email Address *</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      data-testid="contact-email-input"
                      placeholder="your.email@example.com"
                      value={formData.contact_email}
                      onChange={(e) => updateFormData('contact_email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Phone Number *</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      data-testid="contact-phone-input"
                      placeholder="(555) 555-5555"
                      value={formData.contact_phone}
                      onChange={(e) => updateFormData('contact_phone', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Step 2: Placement Needs */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="placement_type">Type of Placement Needed *</Label>
                    <Select 
                      value={formData.placement_type_needed} 
                      onValueChange={(value) => updateFormData('placement_type_needed', value)}
                    >
                      <SelectTrigger data-testid="placement-type-select">
                        <SelectValue placeholder="Select placement type" />
                      </SelectTrigger>
                      <SelectContent>
                        {placementTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location Preference *</Label>
                    <Input
                      id="location"
                      data-testid="location-input"
                      placeholder="City, County, or Region"
                      value={formData.location_preference}
                      onChange={(e) => updateFormData('location_preference', e.target.value)}
                    />
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mt-2">
                      <p className="text-xs font-medium text-slate-600 mb-1">Relocation Note:</p>
                      <p className="text-xs text-slate-500">
                        Anchor Placement™ supports both in-state and out-of-state placement coordination. 
                        Location flexibility and interstate considerations are handled directly between providers and placement teams.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="urgency">Urgency Level *</Label>
                    <Select 
                      value={formData.urgency} 
                      onValueChange={(value) => updateFormData('urgency', value)}
                    >
                      <SelectTrigger data-testid="urgency-select">
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                      <SelectContent>
                        {urgencyLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="medicaid"
                      data-testid="medicaid-checkbox"
                      checked={formData.accepts_medicaid_required}
                      onCheckedChange={(checked) => updateFormData('accepts_medicaid_required', checked)}
                    />
                    <Label htmlFor="medicaid" className="text-sm font-normal cursor-pointer">
                      Must accept Medicaid
                    </Label>
                  </div>
                </>
              )}

              {/* Step 3: Additional Details */}
              {currentStep === 3 && (
                <>
                  <div className="space-y-3">
                    <Label>Services Needed (select all that apply)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {servicesList.map((service) => (
                        <div key={service} className="flex items-center space-x-2">
                          <Checkbox
                            id={service}
                            data-testid={`service-${service.toLowerCase().replace(/\s+/g, '-')}`}
                            checked={formData.services_needed.includes(service)}
                            onCheckedChange={() => toggleService(service)}
                          />
                          <Label htmlFor={service} className="text-sm font-normal cursor-pointer">
                            {service}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      data-testid="additional-notes-textarea"
                      placeholder="Any other information that would help with placement (do not include PHI)"
                      className="min-h-[120px]"
                      value={formData.additional_notes}
                      onChange={(e) => updateFormData('additional_notes', e.target.value)}
                    />
                  </div>
                  
                  {/* Active Subscription Info */}
                  {hasActiveSubscription && (
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl" data-testid="subscription-active-info">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Check className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-emerald-900">Active Subscription</p>
                          <p className="text-sm text-emerald-700">
                            Your subscription is active. Submit unlimited placement requests.
                            {subscriptionExpiry && (
                              <span className="block text-xs mt-1">
                                Expires: {new Date(subscriptionExpiry).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Payment Options - Show if no subscription and no payment session */}
                  {!hasActiveSubscription && !paymentSessionId && paymentOptions && (
                    <div className="mt-4 p-4 bg-sky-50 border border-sky-200 rounded-xl" data-testid="payment-info">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-sky-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sky-900">Choose Your Payment Option</p>
                          <p className="text-sm text-sky-700">Select how you'd like to access the platform</p>
                        </div>
                      </div>
                      
                      {/* Payment Options */}
                      <div className="space-y-3 mb-4">
                        {/* Single Placement Option */}
                        <div 
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedPaymentType === 'placement' 
                              ? 'border-sky-500 bg-white' 
                              : 'border-slate-200 bg-white hover:border-sky-300'
                          }`}
                          onClick={() => setSelectedPaymentType('placement')}
                          data-testid="payment-option-placement"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedPaymentType === 'placement' ? 'border-sky-500' : 'border-slate-300'
                              }`}>
                                {selectedPaymentType === 'placement' && (
                                  <div className="w-3 h-3 rounded-full bg-sky-500" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">Single Placement</p>
                                <p className="text-xs text-slate-500">One-time fee for this request</p>
                              </div>
                            </div>
                            <p className="text-lg font-bold text-sky-600">${paymentOptions.placement_fee}</p>
                          </div>
                        </div>
                        
                        {/* Subscription Option */}
                        <div 
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative ${
                            selectedPaymentType === 'subscription' 
                              ? 'border-emerald-500 bg-white' 
                              : 'border-slate-200 bg-white hover:border-emerald-300'
                          }`}
                          onClick={() => setSelectedPaymentType('subscription')}
                          data-testid="payment-option-subscription"
                        >
                          <div className="absolute -top-2 right-3 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                            Best Value
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedPaymentType === 'subscription' ? 'border-emerald-500' : 'border-slate-300'
                              }`}>
                                {selectedPaymentType === 'subscription' && (
                                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">Monthly Subscription</p>
                                <p className="text-xs text-slate-500">Unlimited placements for 30 days</p>
                              </div>
                            </div>
                            <p className="text-lg font-bold text-emerald-600">${paymentOptions.subscription_fee}/mo</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Payment Disclaimer */}
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg" data-testid="payment-disclaimer">
                        <p className="text-xs text-amber-800">
                          <strong>Important:</strong> Payment covers access to the Anchor Placement platform and placement review process only. 
                          <strong> Payment does not guarantee placement.</strong> Placement decisions are made by providers based on availability, 
                          compatibility, and other factors beyond our control.
                        </p>
                      </div>
                      
                      {/* Acknowledgment Checkbox */}
                      <div className="mt-3 flex items-start gap-2">
                        <Checkbox
                          id="disclaimer-acknowledge"
                          data-testid="disclaimer-acknowledge-checkbox"
                          checked={disclaimerAcknowledged}
                          onCheckedChange={(checked) => setDisclaimerAcknowledged(checked)}
                          className="mt-0.5"
                        />
                        <Label htmlFor="disclaimer-acknowledge" className="text-xs text-slate-600 cursor-pointer leading-relaxed">
                          I understand and acknowledge that payment does not guarantee placement. I agree to the{" "}
                          <a href="/terms" target="_blank" className="text-sky-600 underline hover:text-sky-800">Terms of Service</a>{" "}
                          and{" "}
                          <a href="/payment-policy" target="_blank" className="text-sky-600 underline hover:text-sky-800">Payment Policy</a>.
                        </Label>
                      </div>
                    </div>
                  )}
                  
                  {paymentSessionId && (
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl" data-testid="payment-complete-info">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Check className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-emerald-900">Payment Complete</p>
                          <p className="text-sm text-emerald-700">
                            Your payment has been processed. Click submit to finalize your request.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  data-testid="prev-step-btn"
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                {currentStep < 3 ? (
                  <Button
                    onClick={nextStep}
                    data-testid="next-step-btn"
                    className="gap-2 bg-sky-600 hover:bg-sky-700"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : hasActiveSubscription ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    data-testid="submit-request-btn"
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Request
                        <Check className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : paymentSessionId ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    data-testid="submit-request-btn"
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Request
                        <Check className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isProcessingPayment || !disclaimerAcknowledged}
                    data-testid="pay-and-submit-btn"
                    className={`gap-2 disabled:opacity-50 ${
                      selectedPaymentType === 'subscription' 
                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                        : 'bg-sky-600 hover:bg-sky-700'
                    }`}
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : selectedPaymentType === 'subscription' ? (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Subscribe ${paymentOptions?.subscription_fee || '49'}/mo
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Pay ${paymentOptions?.placement_fee || '20'} & Submit
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {/* Short Disclaimer - Always visible on Step 3 */}
              {currentStep === 3 && (
                <p className="text-center text-xs text-slate-500 mt-4" data-testid="short-disclaimer">
                  Payment does not guarantee placement.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
