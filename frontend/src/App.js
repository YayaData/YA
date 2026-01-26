import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import StatePage from "@/pages/StatePage";
import NationalOverviewPage from "@/pages/NationalOverviewPage";
import TemplatesPage from "@/pages/TemplatesPage";
import FederalLinksPage from "@/pages/FederalLinksPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import PaymentCancelPage from "@/pages/PaymentCancelPage";
import AdminPage from "@/pages/AdminPage";
import StartPage from "@/pages/StartPage";
import AuthVerifyPage from "@/pages/AuthVerifyPage";
import UserDashboardPage from "@/pages/UserDashboardPage";
import DocumentShopPage from "@/pages/DocumentShopPage";

function App() {
  return (
    <AuthProvider>
      <div className="App min-h-screen flex flex-col">
        <BrowserRouter>
          <Routes>
            {/* Pages without navbar/footer */}
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/payment-cancel" element={<PaymentCancelPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/start" element={<StartPage />} />
            <Route path="/auth/verify" element={<AuthVerifyPage />} />
            <Route path="/dashboard" element={<UserDashboardPage />} />
            <Route path="/document-shop" element={<DocumentShopPage />} />
            
            {/* Redirects for common alternate URLs */}
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/landing" element={<Navigate to="/" replace />} />
            <Route path="/launch" element={<Navigate to="/" replace />} />
            
            {/* Main pages with navbar/footer */}
            <Route path="/*" element={
              <>
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/state/:stateCode" element={<StatePage />} />
                    <Route path="/national-overview" element={<NationalOverviewPage />} />
                    <Route path="/templates" element={<TemplatesPage />} />
                    <Route path="/federal-links" element={<FederalLinksPage />} />
                  </Routes>
                </main>
                <Footer />
              </>
            } />
          </Routes>
          <Toaster position="top-right" />
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;
