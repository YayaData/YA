import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Home, CheckCircle2, AlertTriangle, Send } from "lucide-react";
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

export default function HousingInterest() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
    hasDisabilityIncome: "",
    canPay: "",
    description: ""
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.phone || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API}/housing-interest`, {
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        has_disability_income: formData.hasDisabilityIncome === "yes",
        can_pay: formData.canPay === "yes",
        description: formData.description
      });
      
      setIsSubmitted(true);
      toast.success("Your request has been submitted");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen - SCRIPT A RESPONSE
  if (isSubmitted) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #F7FBFF 0%, #EAF4FF 100%)' }}>
        <header className="w-full py-4 px-6 bg-white/90 backdrop-blur-sm border-b border-blue-100">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <img src={LOGO_URL} alt="Anchor Placement" className="h-8 w-8" />
            <span className="font-bold font-['Poppins']" style={{ color: colors.blue }}>Housing Interest</span>
          </div>
        </header>

        <main className="px-6 py-12 max-w-2xl mx-auto">
          <Card className="rounded-2xl shadow-lg border-0">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: `${colors.teal}15` }}>
                  <CheckCircle2 className="h-10 w-10" style={{ color: colors.teal }} />
                </div>
                <h1 className="text-2xl font-bold" style={{ color: colors.dark }}>
                  Request Received
                </h1>
              </div>
              
              {/* SCRIPT A - Response to Individual */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left space-y-4">
                <p className="text-gray-700">Hello,</p>
                
                <p className="text-gray-700">
                  Thank you for submitting a housing/placement interest request. We've received 
                  your information and will review it based on availability and partner agency capacity.
                </p>
                
                <p className="text-gray-700">
                  Please note that submitting a request <strong>does not guarantee placement</strong>. 
                  If additional information is needed, someone from our team will reach out.
                </p>
                
                <p className="text-gray-700">Thank you.</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-blue-800">
                  <strong>What happens next?</strong> Your request will be reviewed by our team. 
                  We review submissions on a regular basis and will contact you if we identify 
                  a potential match with our partner agencies.
                </p>
              </div>

              <div className="text-center">
                <Button onClick={() => navigate("/")} style={{ background: colors.blue }}>
                  Return to Home
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
      {/* Header */}
      <header className="w-full py-4 px-6 bg-white/90 backdrop-blur-sm border-b border-blue-100">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="back-button">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img src={LOGO_URL} alt="Anchor Placement" className="h-8 w-8" />
          <span className="font-bold font-['Poppins']" style={{ color: colors.blue }}>Housing Interest</span>
        </div>
      </header>

      <main className="px-6 py-8 max-w-2xl mx-auto">
        {/* Info Card */}
        <Card className="rounded-2xl shadow-lg border-0 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-start gap-4">
              <Home className="h-10 w-10 flex-shrink-0" />
              <div>
                <h1 className="text-2xl font-bold font-['Poppins']">Looking for Housing?</h1>
                <p className="text-blue-100 mt-1">
                  Submit your information below and a coordinator may reach out if housing options become available in your area.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>Important:</strong> This form is for expressing interest only. 
              Submitting this form does not guarantee housing placement, create any agreement, 
              or establish a provider-client relationship. Housing availability depends on 
              provider capacity and eligibility requirements.
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="rounded-2xl shadow-lg border-0">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium" style={{ color: colors.dark }}>
                  Name or Initials <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your name or initials"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="h-12 rounded-xl"
                  data-testid="input-name"
                  required
                />
                <p className="text-xs text-gray-500">You may use initials if you prefer privacy</p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium" style={{ color: colors.dark }}>
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 555-5555"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="h-12 rounded-xl"
                  data-testid="input-phone"
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium" style={{ color: colors.dark }}>
                  City or County <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Raleigh, Wake County"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className="h-12 rounded-xl"
                  data-testid="input-location"
                  required
                />
              </div>

              {/* Disability Income */}
              <div className="space-y-3">
                <Label className="text-sm font-medium" style={{ color: colors.dark }}>
                  Do you receive disability income (SSI/SSDI)?
                </Label>
                <RadioGroup
                  value={formData.hasDisabilityIncome}
                  onValueChange={(value) => handleChange("hasDisabilityIncome", value)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="disability-yes" data-testid="disability-yes" />
                    <Label htmlFor="disability-yes" className="cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="disability-no" data-testid="disability-no" />
                    <Label htmlFor="disability-no" className="cursor-pointer">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unsure" id="disability-unsure" data-testid="disability-unsure" />
                    <Label htmlFor="disability-unsure" className="cursor-pointer">Unsure</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Ability to Pay */}
              <div className="space-y-3">
                <Label className="text-sm font-medium" style={{ color: colors.dark }}>
                  Are you able to contribute toward housing costs?
                </Label>
                <RadioGroup
                  value={formData.canPay}
                  onValueChange={(value) => handleChange("canPay", value)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="pay-yes" data-testid="pay-yes" />
                    <Label htmlFor="pay-yes" className="cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="pay-no" data-testid="pay-no" />
                    <Label htmlFor="pay-no" className="cursor-pointer">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partial" id="pay-partial" data-testid="pay-partial" />
                    <Label htmlFor="pay-partial" className="cursor-pointer">Partially</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium" style={{ color: colors.dark }}>
                  Brief Description of Your Situation (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Tell us a little about your housing needs..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="min-h-[100px] rounded-xl"
                  data-testid="input-description"
                />
                <p className="text-xs text-gray-500">
                  Do not include sensitive medical or personal health information.
                </p>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-14 text-lg font-semibold rounded-xl gap-2"
                style={{ background: colors.teal }}
                data-testid="submit-button"
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Submit Interest Form
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Privacy Note */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Your information will only be used to match you with potential housing options. 
          We do not share your data with third parties without your consent.
        </p>
      </main>
    </div>
  );
}
