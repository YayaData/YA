import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getPlacementTabs } from "@/utils/getPlacementTabs";
import { getDashboardRoute } from "@/utils/routeByOrgType";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_anchor-place/artifacts/a2v0mwtd_image.png";

export default function WelcomeScreen() {
  const navigate = useNavigate();
  
  const userData = JSON.parse(localStorage.getItem('anchorplacement_user_data') || '{}');
  const isOnboarded = localStorage.getItem('anchorplacement_onboarding_complete') === 'true';
  const orgType = userData.orgType;
  const placementTabs = orgType ? getPlacementTabs(orgType) : { showNeedPlacement: true, showPlacementAvailable: true };
  const dashboardRoute = orgType ? getDashboardRoute(orgType) : '/onboarding';

  const providerHref = "/onboarding?path=provider";
  const requestHref = "/place-client";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="w-full py-4 px-4 md:px-6 bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Anchor Place" className="h-8 w-8 object-contain" />
            <span className="text-lg font-semibold text-gray-900">Anchor Place</span>
          </div>
          <div className="flex items-center gap-2">
            {isOnboarded && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(dashboardRoute)}
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/admin")}
              className="text-gray-600"
            >
              Admin
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        {/* HERO */}
        <section className="rounded-2xl border bg-white p-6 md:p-10">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl text-gray-900">
              Match individuals needing supportive housing with available providers — faster and simpler.
            </h1>
            <p className="mt-4 text-base text-gray-700 md:text-lg">
              Anchor Place helps agencies, providers, and care homes connect for potential placements.
              <span className="font-medium"> Submission does not guarantee placement.</span>
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate(providerHref)}
                className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-white hover:bg-gray-800 transition-colors"
                data-testid="hero-provider-btn"
              >
                I Have Space Available
              </button>
              <button
                onClick={() => navigate(requestHref)}
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 hover:bg-gray-50 transition-colors"
                data-testid="hero-agency-btn"
              >
                I Need Placement Help
              </button>
            </div>
          </div>
        </section>

        {/* SPLIT PATH */}
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-semibold text-gray-900">For Providers / Homes</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">
              <li>List available space</li>
              <li>Receive placement inquiries</li>
              <li>Control who contacts you</li>
            </ul>
            <button
              onClick={() => navigate(providerHref)}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-black px-5 py-3 text-white hover:bg-gray-800 transition-colors"
              data-testid="card-provider-btn"
            >
              List Space
            </button>
          </div>

          <div className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-semibold text-gray-900">For Agencies / Professionals</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">
              <li>Submit structured placement requests</li>
              <li>Reduce back-and-forth emails</li>
              <li>Centralized intake</li>
            </ul>
            <button
              onClick={() => navigate(requestHref)}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-5 py-3 hover:bg-gray-50 transition-colors"
              data-testid="card-agency-btn"
            >
              Submit Request
            </button>
          </div>
        </section>

        {/* WHAT HAPPENS NEXT */}
        <section className="mt-8 rounded-2xl border bg-white p-6">
          <h3 className="text-xl font-semibold text-gray-900">What happens next</h3>
          <ol className="mt-4 grid gap-3 md:grid-cols-3">
            <li className="rounded-xl border p-4">
              <div className="text-sm font-semibold text-gray-900">Step 1</div>
              <div className="mt-1 text-gray-700">Submit your request or space details</div>
            </li>
            <li className="rounded-xl border p-4">
              <div className="text-sm font-semibold text-gray-900">Step 2</div>
              <div className="mt-1 text-gray-700">Requests are reviewed for completeness</div>
            </li>
            <li className="rounded-xl border p-4">
              <div className="text-sm font-semibold text-gray-900">Step 3</div>
              <div className="mt-1 text-gray-700">You're contacted if a potential match exists</div>
            </li>
          </ol>
          <p className="mt-4 text-sm text-gray-700">
            <span className="font-medium">Submission does not guarantee placement.</span>
          </p>
        </section>

        {/* PRICING REFRAME */}
        <section className="mt-8 rounded-2xl border bg-white p-6">
          <h3 className="text-xl font-semibold text-gray-900">Why there's a small access fee</h3>
          <p className="mt-3 text-gray-700">
            A small access fee helps keep requests organized, reduces spam, and supports platform
            operations and moderation. Pricing and access rules remain the same — we're simply making
            the purpose clearer.
          </p>
        </section>

        {/* TRUST SIGNALS */}
        <section className="mt-8 rounded-2xl border bg-white p-6">
          <h3 className="text-xl font-semibold text-gray-900">Built for real placement workflows</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">
            <li>Built by providers with real placement experience</li>
            <li>Designed for compliance-aware agencies</li>
            <li>Created to reduce placement delays and inbox chaos</li>
          </ul>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-8 px-4 md:px-6 bg-white border-t">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="Anchor Place" className="h-6 w-6 object-contain" />
              <span className="text-sm font-medium text-gray-900">Anchor Place</span>
            </div>
            
            <p className="text-sm text-gray-600 text-center max-w-md">
              We facilitate connections only and do not guarantee placement outcomes.
            </p>
            
            <div className="flex gap-4">
              <button onClick={() => navigate("/privacy")} className="text-sm text-gray-600 hover:text-gray-900 underline">
                Privacy
              </button>
              <button onClick={() => navigate("/terms")} className="text-sm text-gray-600 hover:text-gray-900 underline">
                Terms
              </button>
              <button onClick={() => navigate("/payment-policy")} className="text-sm text-gray-600 hover:text-gray-900 underline">
                Payment Policy
              </button>
            </div>
          </div>
          
          <p className="text-center text-xs text-gray-500 mt-4">
            © {new Date().getFullYear()} Anchor Place. Submission does not guarantee placement.
          </p>
        </div>
      </footer>
    </div>
  );
}
