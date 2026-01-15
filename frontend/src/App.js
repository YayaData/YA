import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import StatePage from "@/pages/StatePage";
import NationalOverviewPage from "@/pages/NationalOverviewPage";
import TemplatesPage from "@/pages/TemplatesPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import PaymentCancelPage from "@/pages/PaymentCancelPage";

function App() {
  return (
    <div className="App min-h-screen flex flex-col">
      <BrowserRouter>
        <Routes>
          {/* Payment pages without navbar/footer */}
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/payment-cancel" element={<PaymentCancelPage />} />
          
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
                </Routes>
              </main>
              <Footer />
            </>
          } />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;
