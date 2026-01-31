import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Anchor, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="w-full py-6 px-6 md:px-12 border-b border-slate-100">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="p-2 bg-sky-600 rounded-xl">
            <Anchor className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-slate-900 font-['Manrope']">Privacy Policy</span>
        </div>
      </header>

      <main className="px-6 md:px-12 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-8 prose prose-slate max-w-none">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-8 w-8 text-sky-600" />
                <h1 className="text-2xl font-bold text-slate-900 m-0">Privacy Policy</h1>
              </div>
              
              <p className="text-sm text-slate-500 mb-6">Last updated: January 31, 2025</p>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">1. Introduction</h2>
              <p className="text-slate-600">
                Anchor Placement ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">2. Information We Collect</h2>
              <p className="text-slate-600">We may collect the following types of information:</p>
              <ul className="text-slate-600 space-y-2">
                <li><strong>Contact Information:</strong> Name, email address, phone number</li>
                <li><strong>Organization Information:</strong> Organization name, type, location</li>
                <li><strong>Placement Request Information:</strong> General placement needs, location preferences, urgency level</li>
                <li><strong>Usage Data:</strong> How you interact with our platform</li>
              </ul>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">3. Information We Do NOT Collect</h2>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 my-4">
                <p className="text-emerald-800 m-0">
                  <strong>Important:</strong> We do NOT collect Protected Health Information (PHI), medical records, 
                  diagnoses, treatment information, or any information covered under HIPAA. Our platform is designed 
                  for coordination purposes only.
                </p>
              </div>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">4. How We Use Your Information</h2>
              <p className="text-slate-600">We use collected information to:</p>
              <ul className="text-slate-600 space-y-2">
                <li>Facilitate placement coordination between providers and professionals</li>
                <li>Process and review placement requests</li>
                <li>Communicate with you about your submissions</li>
                <li>Improve our platform and services</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">5. Information Sharing</h2>
              <p className="text-slate-600">
                We may share your general information (not contact details for individual requests) with:
              </p>
              <ul className="text-slate-600 space-y-2">
                <li>Housing providers and agencies for placement coordination purposes</li>
                <li>Service providers who assist in operating our platform</li>
                <li>Legal authorities when required by law</li>
              </ul>
              <p className="text-slate-600 mt-2">
                We do not sell your personal information to third parties.
              </p>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">6. Data Security</h2>
              <p className="text-slate-600">
                We implement reasonable security measures to protect your information. However, no method of 
                transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">7. Your Rights</h2>
              <p className="text-slate-600">You have the right to:</p>
              <ul className="text-slate-600 space-y-2">
                <li>Access your personal information</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt out of certain communications</li>
              </ul>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">8. Cookies and Tracking</h2>
              <p className="text-slate-600">
                We may use cookies and similar technologies to improve your experience on our platform. 
                You can control cookie settings through your browser preferences.
              </p>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">9. Changes to This Policy</h2>
              <p className="text-slate-600">
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new policy on this page and updating the "Last updated" date.
              </p>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">10. Contact Us</h2>
              <p className="text-slate-600">
                If you have questions about this Privacy Policy, please contact us through the platform.
              </p>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <Button onClick={() => navigate(-1)} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
