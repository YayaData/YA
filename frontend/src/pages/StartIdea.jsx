import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Anchor, Lightbulb, Send, CheckCircle2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const inquiryTypes = [
  { value: "Start New Placement", label: "Start a New Placement or Housing Program" },
  { value: "Expand Services", label: "Expand Existing Services" },
  { value: "Partnership", label: "Partnership or Collaboration Opportunity" }
];

export default function StartIdea() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [servicesList, setServicesList] = useState([]);

  const [formData, setFormData] = useState({
    organization_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    inquiry_type: "",
    description: "",
    services_interested: []
  });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get(`${API}/services-list`);
        setServicesList(res.data.services);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };
    fetchServices();
  }, []);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (service) => {
    setFormData(prev => ({
      ...prev,
      services_interested: prev.services_interested.includes(service)
        ? prev.services_interested.filter(s => s !== service)
        : [...prev.services_interested, service]
    }));
  };

  const validateForm = () => {
    if (!formData.organization_name || !formData.contact_name || !formData.contact_email || 
        !formData.contact_phone || !formData.inquiry_type || !formData.description) {
      toast.error("Please fill in all required fields");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/provider-inquiries`, formData);
      setIsSubmitted(true);
      toast.success("Inquiry submitted successfully!");
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast.error("Failed to submit inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
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
            <span className="text-lg font-semibold text-slate-900 font-['Manrope']">Start a Placement Idea</span>
          </div>
        </header>

        <main className="px-6 md:px-12 py-16 md:py-24">
          <div className="max-w-lg mx-auto text-center">
            <div className="inline-flex p-4 rounded-full bg-emerald-100 text-emerald-600 mb-6">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 font-['Manrope']">
              Thank You for Your Interest!
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              We've received your inquiry and will be in touch soon to discuss how we can work together.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => navigate("/")}
                data-testid="go-home-btn"
                className="bg-sky-600 hover:bg-sky-700"
              >
                Return Home
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/placements")}
                data-testid="view-placements-btn"
              >
                View Placements
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
          <span className="text-lg font-semibold text-slate-900 font-['Manrope']">Start a Placement Idea</span>
        </div>
      </header>

      <main className="px-6 md:px-12 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-10">
            <div className="inline-flex p-3 rounded-xl bg-amber-100 text-amber-600 mb-4">
              <Lightbulb className="h-8 w-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-3 font-['Manrope']">
              Interested in Providing Services?
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              Share your ideas about starting a placement or housing program, 
              and we'll help you explore the possibilities.
            </p>
          </div>

          {/* Provider Invitation Notice */}
          <Card className="mb-6 border border-sky-200 bg-sky-50">
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-3 font-['Manrope']">
                Interested in becoming a provider?
              </h3>
              <div className="text-sm text-slate-600 space-y-2">
                <p>
                  If you own or rent a home and have available space, you may be able to start a care or housing-based business by offering placement availability in your residence or rental property.
                </p>
                <p>
                  Many providers begin this way and work with the appropriate agencies to meet state and program requirements. Requirements vary by location and funding source.
                </p>
                <p className="text-slate-500 italic">
                  Anchor Place™ does not license, approve, or guarantee placements. The platform provides visibility and placement coordination once a provider is ready to accept referrals.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Provider Readiness Notice */}
          <Card className="mb-8 border border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Before receiving placements</span>, providers must complete a short readiness check (training and documentation verification). You'll be guided through this step before any placements are assigned.
              </p>
            </CardContent>
          </Card>

          {/* Form Card */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-slate-900 font-['Manrope']">
                Provider Inquiry Form
              </CardTitle>
              <CardDescription className="text-slate-600">
                Tell us about yourself and your ideas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Organization Info */}
              <div className="space-y-2">
                <Label htmlFor="organization_name">Organization Name *</Label>
                <Input
                  id="organization_name"
                  data-testid="organization-name-input"
                  placeholder="Your organization or business name"
                  value={formData.organization_name}
                  onChange={(e) => updateFormData('organization_name', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name *</Label>
                  <Input
                    id="contact_name"
                    data-testid="contact-name-input"
                    placeholder="Your full name"
                    value={formData.contact_name}
                    onChange={(e) => updateFormData('contact_name', e.target.value)}
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
                <Label htmlFor="inquiry_type">What are you interested in? *</Label>
                <Select 
                  value={formData.inquiry_type} 
                  onValueChange={(value) => updateFormData('inquiry_type', value)}
                >
                  <SelectTrigger data-testid="inquiry-type-select">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {inquiryTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Describe Your Idea *</Label>
                <Textarea
                  id="description"
                  data-testid="description-textarea"
                  placeholder="Tell us about your idea for a placement or housing program. What population would you serve? What services would you offer?"
                  className="min-h-[150px]"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Services You're Interested in Providing</Label>
                <div className="grid grid-cols-2 gap-3">
                  {servicesList.map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service}`}
                        data-testid={`service-${service.toLowerCase().replace(/\s+/g, '-')}`}
                        checked={formData.services_interested.includes(service)}
                        onCheckedChange={() => toggleService(service)}
                      />
                      <Label htmlFor={`service-${service}`} className="text-sm font-normal cursor-pointer">
                        {service}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-slate-100">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  data-testid="submit-inquiry-btn"
                  className="w-full bg-sky-600 hover:bg-sky-700 gap-2 h-12"
                >
                  {isSubmitting ? "Submitting..." : "Submit Inquiry"}
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-slate-100 rounded-xl">
            <p className="text-sm text-slate-600 text-center">
              After submitting, our team will review your inquiry and reach out to discuss next steps. 
              This is an exploratory process — no commitments required.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
