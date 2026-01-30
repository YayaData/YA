import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import WelcomeScreen from "@/pages/WelcomeScreen";
import PlaceClient from "@/pages/PlaceClient";
import Placements from "@/pages/Placements";
import HowItWorks from "@/pages/HowItWorks";
import StartIdea from "@/pages/StartIdea";
import Onboarding from "@/pages/Onboarding";
import AdminDashboard from "@/pages/AdminDashboard";
import ProviderDashboard from "@/pages/ProviderDashboard";
import RequestorDashboard from "@/pages/RequestorDashboard";
import Dashboard from "@/pages/Dashboard";
import Credentialing from "@/pages/Credentialing";

function App() {
  return (
    <div className="App min-h-screen bg-slate-50">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/credentialing" element={<Credentialing />} />
          <Route path="/place-client" element={<PlaceClient />} />
          <Route path="/placements" element={<Placements />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/start-idea" element={<StartIdea />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/provider-dashboard" element={<ProviderDashboard />} />
          <Route path="/requestor-dashboard" element={<RequestorDashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
