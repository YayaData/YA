import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  ArrowLeft, 
  Anchor, 
  ClipboardList, 
  Search, 
  Phone, 
  CheckCircle2, 
  HelpCircle,
  Users,
  Building2,
  Shield
} from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Submit a Placement Request",
    description: "Fill out a simple form with your contact information and the type of placement needed. No protected health information is collected.",
    icon: ClipboardList,
    color: "bg-sky-100 text-sky-600"
  },
  {
    number: 2,
    title: "Browse Available Placements",
    description: "Search through our database of housing and care facilities filtered by type, location, and availability.",
    icon: Search,
    color: "bg-emerald-100 text-emerald-600"
  },
  {
    number: 3,
    title: "Contact Facilities Directly",
    description: "Use the contact information provided to reach out to facilities that match your needs.",
    icon: Phone,
    color: "bg-violet-100 text-violet-600"
  },
  {
    number: 4,
    title: "Coordinate Placement",
    description: "Work with the facility to complete their intake process and finalize the placement.",
    icon: CheckCircle2,
    color: "bg-amber-100 text-amber-600"
  }
];

const faqs = [
  {
    question: "What is Anchor Place™?",
    answer: "Anchor Place™ is a placement coordination and availability platform that helps providers connect with hospitals, social workers, and placement teams seeking housing or care options for individuals with complex needs."
  },
  {
    question: "Who can use Anchor Place™?",
    answer: "Anchor Place™ is designed for AFL providers, group homes, supportive and transitional housing, sober living programs, and other residential care providers."
  },
  {
    question: "Does Anchor Place™ store client information?",
    answer: "No. Anchor Place™ does not store protected health information (PHI), client names, medical records, or diagnoses. It is a coordination tool only."
  },
  {
    question: "How does placement coordination work?",
    answer: "Providers list available beds or rooms, accepted populations, funding types, and location. Placement teams submit requests based on general criteria. All placement decisions are handled offline between the provider and referring agency."
  },
  {
    question: "Does Anchor Place™ make placement decisions or guarantee referrals?",
    answer: "No. Anchor Place™ does not approve, deny, or guarantee placements. All acceptance decisions remain solely with the provider."
  },
  {
    question: "Can Anchor Place™ be used across different cities or states?",
    answer: "Yes. Anchor Place™ supports both in-state and out-of-state placement coordination. Providers may indicate location flexibility and whether interstate placements are accepted."
  },
  {
    question: "How much does Anchor Place™ cost for providers?",
    answer: "Provider access is $29.99 per month per provider location. There are no long-term contracts during the pilot phase."
  },
  {
    question: "Is Anchor Place™ HIPAA compliant?",
    answer: "Anchor Place™ is designed to avoid HIPAA requirements by not collecting or storing protected health information. Providers and placement teams should continue to follow their internal compliance procedures when sharing client-specific details offline."
  },
  {
    question: "Do providers need to respond to every inquiry?",
    answer: "No. Providers may choose which inquiries to respond to based on availability and fit."
  }
];

const audiences = [
  {
    title: "Hospitals & Healthcare Systems",
    description: "Find discharge placements for patients transitioning out of acute care.",
    icon: Building2
  },
  {
    title: "Social Workers & Case Managers",
    description: "Quickly locate appropriate housing and care options for clients.",
    icon: Users
  },
  {
    title: "LMEs & MCOs",
    description: "Coordinate care placements for managed care populations.",
    icon: Shield
  }
];

export default function HowItWorks() {
  const navigate = useNavigate();

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
          <span className="text-lg font-semibold text-slate-900 font-['Manrope']">How Placement Works</span>
        </div>
      </header>

      <main className="px-6 md:px-12 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4 font-['Manrope']">
              A Simple Guide to Client Placement
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Anchor Place makes it easy to coordinate housing and care placements. 
              Follow these steps to get started.
            </p>
          </div>

          {/* Steps Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-slate-900 mb-8 font-['Manrope']">
              The Process
            </h2>
            <div className="space-y-6">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <Card 
                    key={step.number}
                    data-testid={`step-card-${step.number}`}
                    className="border border-slate-200 shadow-sm animate-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${step.color}`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-semibold text-slate-400">
                              Step {step.number}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-2 font-['Manrope']">
                            {step.title}
                          </h3>
                          <p className="text-slate-600">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Who We Serve */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-slate-900 mb-8 font-['Manrope']">
              Who We Serve
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {audiences.map((audience, index) => {
                const IconComponent = audience.icon;
                return (
                  <Card 
                    key={index}
                    className="border border-slate-200 shadow-sm"
                  >
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex p-3 rounded-xl bg-sky-50 text-sky-600 mb-4">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 mb-2 font-['Manrope']">
                        {audience.title}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {audience.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* FAQs */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <HelpCircle className="h-6 w-6 text-sky-600" />
              <h2 className="text-2xl font-semibold text-slate-900 font-['Manrope']">
                Frequently Asked Questions
              </h2>
            </div>
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`item-${index}`}
                      data-testid={`faq-item-${index}`}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:bg-slate-50 text-left font-medium text-slate-900">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4 text-slate-600">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <Card className="border border-sky-200 bg-sky-50">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-slate-900 mb-3 font-['Manrope']">
                Ready to Get Started?
              </h2>
              <p className="text-slate-600 mb-6">
                Find available placements or submit a request today.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => navigate("/placements")}
                  data-testid="view-placements-btn"
                  className="bg-sky-600 hover:bg-sky-700"
                >
                  View Available Placements
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate("/place-client")}
                  data-testid="submit-request-btn"
                >
                  Submit a Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-12 border-t border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-slate-500">
            Anchor Place – Client Placement Coordination Tool
          </p>
        </div>
      </footer>
    </div>
  );
}
