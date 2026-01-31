import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Anchor, FileText } from "lucide-react";

export default function Terms() {
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
          <span className="text-lg font-semibold text-slate-900 font-['Manrope']">Terms of Service</span>
        </div>
      </header>

      <main className="px-6 md:px-12 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-8 prose prose-slate max-w-none">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="h-8 w-8 text-sky-600" />
                <h1 className="text-2xl font-bold text-slate-900 m-0">Terms of Service</h1>
              </div>
              
              <p className="text-sm text-slate-500 mb-6">Last updated: January 31, 2025</p>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">1. Acceptance of Terms</h2>
              <p className="text-slate-600">
                By accessing or using the Anchor Placement platform ("Service"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our Service.
              </p>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">2. Description of Service</h2>
              <p className="text-slate-600">
                Anchor Placement is a platform that connects housing and care providers with professionals seeking to place 
                clients with complex needs. Our Service facilitates coordination and communication between parties but does 
                not directly provide housing, care, or placement services.
              </p>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">3. No Guarantee of Placement</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
                <p className="text-amber-800 font-medium m-0">
                  <strong>IMPORTANT:</strong> Payment for placement request submission provides access to the Anchor Placement 
                  platform and placement review process only. <strong>Payment does not guarantee placement.</strong>
                </p>
                <p className="text-amber-700 mt-2 mb-0 text-sm">
                  Placement decisions are made solely by providers based on their availability, capacity, compatibility 
                  requirements, and other factors that are beyond the control of Anchor Placement. We cannot guarantee that 
                  any placement request will result in a successful placement.
                </p>
              </div>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">4. User Responsibilities</h2>
              <ul className="text-slate-600 space-y-2">
                <li>You agree to provide accurate and truthful information in your submissions.</li>
                <li>You agree not to submit any Protected Health Information (PHI) or personally identifiable medical information.</li>
                <li>You are responsible for maintaining the confidentiality of any account credentials.</li>
                <li>You agree to use the Service only for lawful purposes related to placement coordination.</li>
              </ul>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">5. Payments and Refunds</h2>
              <p className="text-slate-600">
                Payments made for placement requests or monthly access are <strong>non-refundable</strong> once a placement 
                request has been submitted. Payment covers access to the Anchor Placement platform and placement review 
                process only.
              </p>
              <p className="text-slate-600 mt-2">
                Refunds may only be considered for: duplicate charges, technical errors that prevent submission, or charges 
                made in error before a request is submitted. All refund requests must be submitted in writing within 7 days 
                of the charge. See our <a href="/payment-policy" className="text-sky-600 underline hover:text-sky-800">Payment Policy</a> for 
                complete details.
              </p>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">6. Privacy and Data</h2>
              <p className="text-slate-600">
                We collect and process information as described in our Privacy Policy. By using the Service, you consent 
                to such collection and processing. We do not collect or store Protected Health Information (PHI).
              </p>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">7. Limitation of Liability</h2>
              <p className="text-slate-600">
                Anchor Placement is provided "as is" without warranties of any kind. We are not liable for any damages 
                arising from the use of our Service, including but not limited to unsuccessful placement attempts, 
                provider decisions, or outcomes of any placements made through the platform.
              </p>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">8. Modifications</h2>
              <p className="text-slate-600">
                We reserve the right to modify these Terms at any time. Continued use of the Service after changes 
                constitutes acceptance of the modified Terms.
              </p>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">9. Contact</h2>
              <p className="text-slate-600">
                For questions about these Terms, please contact us through the platform.
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
