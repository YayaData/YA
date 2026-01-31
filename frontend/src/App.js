import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import WelcomeScreen from "@/pages/WelcomeScreen";
import PlaceClient from "@/pages/PlaceClient";
import PlaceClientSuccess from "@/pages/PlaceClientSuccess";
import Placements from "@/pages/Placements";
import HowItWorks from "@/pages/HowItWorks";
import StartIdea from "@/pages/StartIdea";
import Onboarding from "@/pages/Onboarding";
import AdminDashboard from "@/pages/AdminDashboard";
import ProviderDashboard from "@/pages/ProviderDashboard";
import RequestorDashboard from "@/pages/RequestorDashboard";
import Dashboard from "@/pages/Dashboard";
import Credentialing from "@/pages/Credentialing";
import HousingInterest from "@/pages/HousingInterest";
import PlacementRequestBoard from "@/pages/PlacementRequestBoard";
import SubmitPlacementRequest from "@/pages/SubmitPlacementRequest";
import Terms from "@/pages/Terms";
import PaymentPolicy from "@/pages/PaymentPolicy";

function App() {
  return (
    <div className="App min-h-screen bg-slate-50">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/credentialing" element={<Credentialing />} />
          <Route path="/housing-interest" element={<HousingInterest />} />
          <Route path="/request-board" element={<PlacementRequestBoard />} />
          <Route path="/submit-request" element={<SubmitPlacementRequest />} />
          <Route path="/place-client" element={<PlaceClient />} />
          <Route path="/place-client/success" element={<PlaceClientSuccess />} />
          <Route path="/placements" element={<Placements />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/start-idea" element={<StartIdea />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/provider-dashboard" element={<ProviderDashboard />} />
          <Route path="/requestor-dashboard" element={<RequestorDashboard />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/payment-policy" element={<PaymentPolicy />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
