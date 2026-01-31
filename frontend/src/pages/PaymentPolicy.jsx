import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Anchor, CreditCard, AlertTriangle } from "lucide-react";

export default function PaymentPolicy() {
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
          <span className="text-lg font-semibold text-slate-900 font-['Manrope']">Payment Policy</span>
        </div>
      </header>

      <main className="px-6 md:px-12 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-8 prose prose-slate max-w-none">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="h-8 w-8 text-sky-600" />
                <h1 className="text-2xl font-bold text-slate-900 m-0">Payment Policy</h1>
              </div>
              
              <p className="text-sm text-slate-500 mb-6">Last updated: January 31, 2025</p>

              {/* Critical Disclaimer Box */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 my-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-amber-900 m-0 mb-2">Payment Does Not Guarantee Placement</h3>
                    <p className="text-amber-800 m-0">
                      The placement request fee covers <strong>access to the Anchor Placement platform and the placement 
                      review process only</strong>. This payment does not guarantee that you will secure a placement for your client.
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">What Your Payment Covers</h2>
              <ul className="text-slate-600 space-y-2">
                <li><strong>Platform Access:</strong> Submission of your placement request through our secure platform</li>
                <li><strong>Request Distribution:</strong> Your request is shared with relevant providers in our network</li>
                <li><strong>Review Process:</strong> Providers review your request based on their availability and criteria</li>
                <li><strong>Coordination Support:</strong> Access to our placement coordination tools and resources</li>
              </ul>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">What Your Payment Does NOT Cover</h2>
              <ul className="text-slate-600 space-y-2">
                <li><strong>Guaranteed Placement:</strong> We cannot guarantee any provider will accept your request</li>
                <li><strong>Provider Decisions:</strong> Providers make independent decisions based on their own criteria</li>
                <li><strong>Specific Outcomes:</strong> Timeline, location, or specific placement arrangements</li>
                <li><strong>Third-Party Services:</strong> Any fees charged by providers, facilities, or other organizations</li>
              </ul>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">Payment Options</h2>
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-slate-700 font-semibold">Single Placement Request: $20.00 USD</p>
                  <p className="text-slate-500 text-sm mt-1">
                    One-time fee for a single placement submission.
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-emerald-800 font-semibold">Monthly Subscription: $49.00 USD/month</p>
                  <p className="text-emerald-700 text-sm mt-1">
                    Unlimited placement requests for 30 days. Best value for agencies with multiple clients.
                  </p>
                </div>
              </div>
              <p className="text-slate-500 text-sm mt-3">
                All fees are non-refundable once a placement request has been submitted.
              </p>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">Refund Policy</h2>
              <p className="text-slate-600">
                Payments made for placement requests or monthly access are <strong>non-refundable</strong> once a placement request has been submitted.
              </p>
              <p className="text-slate-600">
                Payment provides access to the Anchor Placement platform and the placement review process only. Placement outcomes depend on availability, eligibility, and provider capacity and are not guaranteed.
              </p>
              <p className="text-slate-600 mt-4">
                Refunds may be considered only in the following limited circumstances:
              </p>
              <ul className="text-slate-600 space-y-2">
                <li>Duplicate charges</li>
                <li>Technical errors that prevent submission of a placement request</li>
                <li>Charges made in error before a request is submitted</li>
              </ul>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4">
                <p className="text-slate-700 m-0">
                  All refund requests must be submitted in writing <strong>within 7 days</strong> of the charge.
                </p>
                <p className="text-slate-600 text-sm mt-2 mb-0">
                  Anchor Placement reserves the right to review each request on a case-by-case basis.
                </p>
              </div>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">Payment Security</h2>
              <p className="text-slate-600">
                All payments are processed securely through Stripe. We do not store your payment card information 
                on our servers. Stripe is PCI-DSS compliant and uses industry-standard encryption to protect your data.
              </p>

              <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3">Questions?</h2>
              <p className="text-slate-600">
                If you have questions about our payment policy or need assistance, please contact us through the platform.
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
