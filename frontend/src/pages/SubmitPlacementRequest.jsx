import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Send, CheckCircle2, AlertTriangle, Shield } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_anchor-placement/artifacts/a2v0mwtd_image.png";

const colors = {
  blue: "#1F4FD8",
  teal: "#1CB5A3",
  gold: "#F4B400",
  dark: "#1F2937"
};

const INCOME_TYPES = [
  { value: "ssi", label: "SSI (Supplemental Security Income)" },
  { value: "ssdi", label: "SSDI (Social Security Disability)" },
  { value: "employment", label: "Employment Income" },
  { value: "va_benefits", label: "VA Benefits" },
  { value: "retirement", label: "Retirement/Pension" },
  { value: "none", label: "No Current Income" },
  { value: "other", label: "Other" }
];

export default function SubmitPlacementRequest() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    county: "",
    state: "NC",
    incomeType: "",
    canContribute: "",
    contributionAmount: "",
    housingType: "",
    generalNotes: "",
    contactPhone: "",
    contactEmail: "",
    preferredContact: "phone"
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      toast.error("Please accept the terms to continue");
      return;
    }
    
    if (!formData.displayName || !formData.county || !formData.incomeType) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.contactPhone && !formData.contactEmail) {
      toast.error("Please provide at least one contact method");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API}/placement-board`, {
        display_name: formData.displayName,
        county: formData.county,
        state: formData.state,
        income_type: formData.incomeType,
        can_contribute: formData.canContribute === "yes",
        contribution_amount: formData.contributionAmount,
        housing_type: formData.housingType,
        general_notes: formData.generalNotes,
        contact_phone: formData.contactPhone,
        contact_email: formData.contactEmail,
        preferred_contact: formData.preferredContact
      });
      
      setIsSubmitted(true);
      toast.success("Your request has been submitted for review");
    } catch (error) {
      console.error("Error submitting:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #F7FBFF 0%, #EAF4FF 100%)' }}>
        <header className="w-full py-4 px-6 bg-white/90 backdrop-blur-sm border-b border-blue-100">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <img src={LOGO_URL} alt="Anchor Placement" className="h-8 w-8" />
            <span className="font-bold font-['Poppins']" style={{ color: colors.blue }}>Placement Request</span>
          </div>
        </header>

        <main className="px-6 py-12 max-w-2xl mx-auto">
          <Card className="rounded-2xl shadow-lg border-0">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: `${colors.teal}15` }}>
                <CheckCircle2 className="h-10 w-10" style={{ color: colors.teal }} />
              </div>
              <h1 className="text-2xl font-bold mb-4" style={{ color: colors.dark }}>
                Request Submitted for Review
              </h1>
              <p className="text-gray-600 mb-6">
                Your placement request has been submitted. An administrator will review your submission.
                Once approved, your request will be visible to qualified housing agencies.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>What happens next?</strong>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li>Your request will be reviewed by an administrator</li>
                      <li>If approved, agencies can view your general information</li>
                      <li>Interested agencies will request to connect through the platform</li>
                      <li>Admin will approve connections before sharing contact info</li>
                      <li>All placement decisions happen offline</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong> Submitting this request does not guarantee housing placement. 
                    Availability depends on provider capacity and eligibility requirements.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/")} variant="outline">
                  Return Home
                </Button>
                <Button onClick={() => navigate("/request-board")} style={{ background: colors.blue }}>
                  View Request Board
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #F7FBFF 0%, #EAF4FF 100%)' }}>
      <header className="w-full py-4 px-6 bg-white/90 backdrop-blur-sm border-b border-blue-100">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="back-button">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img src={LOGO_URL} alt="Anchor Placement" className="h-8 w-8" />
          <span className="font-bold font-['Poppins']" style={{ color: colors.blue }}>Submit Placement Request</span>
        </div>
      </header>

      <main className="px-6 py-8 max-w-2xl mx-auto">
        {/* Disclaimer Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-800 font-medium">
              This form is FREE for individuals seeking housing assistance.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>Important Notice:</strong> This form allows you to submit a request for housing placement support. 
              <strong> Submitting this request does not guarantee placement.</strong> Placement outcomes depend on 
              provider availability, eligibility, and capacity. All placement decisions are made offline by qualified agencies.
              <strong> Do not include sensitive medical or health information.</strong>
            </div>
          </div>
        </div>

        <Card className="rounded-2xl shadow-lg border-0">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Display Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: colors.dark }}>
                  Display Name or Initials <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g., J.D. or John"
                  value={formData.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  className="h-12 rounded-xl"
                  data-testid="input-display-name"
                  required
                />
                <p className="text-xs text-gray-500">This will be visible to agencies. Use initials for privacy.</p>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium" style={{ color: colors.dark }}>
                    County <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g., Wake County"
                    value={formData.county}
                    onChange={(e) => handleChange("county", e.target.value)}
                    className="h-12 rounded-xl"
                    data-testid="input-county"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium" style={{ color: colors.dark }}>
                    State
                  </Label>
                  <Select value={formData.state} onValueChange={(v) => handleChange("state", v)}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NC">North Carolina</SelectItem>
                      <SelectItem value="SC">South Carolina</SelectItem>
                      <SelectItem value="VA">Virginia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Income Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: colors.dark }}>
                  Income Type <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.incomeType} onValueChange={(v) => handleChange("incomeType", v)}>
                  <SelectTrigger className="h-12 rounded-xl" data-testid="select-income-type">
                    <SelectValue placeholder="Select income type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ability to Contribute */}
              <div className="space-y-3">
                <Label className="text-sm font-medium" style={{ color: colors.dark }}>
                  Can you contribute toward housing costs?
                </Label>
                <RadioGroup
                  value={formData.canContribute}
                  onValueChange={(v) => handleChange("canContribute", v)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="contribute-yes" />
                    <Label htmlFor="contribute-yes" className="cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="contribute-no" />
                    <Label htmlFor="contribute-no" className="cursor-pointer">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partial" id="contribute-partial" />
                    <Label htmlFor="contribute-partial" className="cursor-pointer">Partially</Label>
                  </div>
                </RadioGroup>
                {(formData.canContribute === "yes" || formData.canContribute === "partial") && (
                  <Input
                    placeholder="Approximate monthly amount (optional)"
                    value={formData.contributionAmount}
                    onChange={(e) => handleChange("contributionAmount", e.target.value)}
                    className="h-10 rounded-xl mt-2"
                  />
                )}
              </div>

              {/* Housing Type Preference */}
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: colors.dark }}>
                  Housing Type Preference (Optional)
                </Label>
                <Select value={formData.housingType} onValueChange={(v) => handleChange("housingType", v)}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="afl">Alternative Family Living (AFL)</SelectItem>
                    <SelectItem value="group_home">Group Home</SelectItem>
                    <SelectItem value="transitional">Transitional Housing</SelectItem>
                    <SelectItem value="independent">Independent Living Support</SelectItem>
                    <SelectItem value="any">Open to Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* General Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: colors.dark }}>
                  General Notes (Optional)
                </Label>
                <Textarea
                  placeholder="Share any general information about your housing needs..."
                  value={formData.generalNotes}
                  onChange={(e) => handleChange("generalNotes", e.target.value)}
                  className="min-h-[100px] rounded-xl"
                  data-testid="input-notes"
                />
                <p className="text-xs text-gray-500">
                  Do not include medical diagnoses, treatment history, or other protected health information.
                </p>
              </div>

              {/* Contact Information - Private */}
              <div className="border-t pt-6">
                <div className="bg-blue-50 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      <strong>Private Contact Information:</strong> This information will only be shared with agencies 
                      after admin approval of a connection request. It will not be displayed publicly.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium" style={{ color: colors.dark }}>
                      Phone Number
                    </Label>
                    <Input
                      type="tel"
                      placeholder="(555) 555-5555"
                      value={formData.contactPhone}
                      onChange={(e) => handleChange("contactPhone", e.target.value)}
                      className="h-12 rounded-xl"
                      data-testid="input-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium" style={{ color: colors.dark }}>
                      Email Address
                    </Label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={formData.contactEmail}
                      onChange={(e) => handleChange("contactEmail", e.target.value)}
                      className="h-12 rounded-xl"
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label className="text-sm font-medium" style={{ color: colors.dark }}>
                    Preferred Contact Method
                  </Label>
                  <RadioGroup
                    value={formData.preferredContact}
                    onValueChange={(v) => handleChange("preferredContact", v)}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="phone" id="prefer-phone" />
                      <Label htmlFor="prefer-phone" className="cursor-pointer">Phone</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="prefer-email" />
                      <Label htmlFor="prefer-email" className="cursor-pointer">Email</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Terms Acceptance */}
              <div className="border-t pt-6">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="terms" 
                    checked={acceptedTerms}
                    onCheckedChange={setAcceptedTerms}
                    data-testid="accept-terms"
                  />
                  <Label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
                    I understand and acknowledge that <strong>submitting this request does not guarantee housing placement</strong>. 
                    Placement outcomes depend on availability, eligibility, and provider capacity. 
                    I consent to having my general information (not contact details) displayed to 
                    qualified agencies for the purpose of finding housing support.
                  </Label>
                </div>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                disabled={isSubmitting || !acceptedTerms}
                className="w-full h-14 text-lg font-semibold rounded-xl gap-2"
                style={{ background: colors.teal }}
                data-testid="submit-button"
              >
                {isSubmitting ? "Submitting..." : (
                  <>
                    <Send className="h-5 w-5" />
                    Submit Request for Review
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
