import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import WelcomeScreen from "@/pages/WelcomeScreen";
import PlaceClient from "@/pages/PlaceClient";
import Placements from "@/pages/Placements";
import HowItWorks from "@/pages/HowItWorks";
import StartIdea from "@/pages/StartIdea";

function App() {
  return (
    <div className="App min-h-screen bg-slate-50">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/place-client" element={<PlaceClient />} />
          <Route path="/placements" element={<Placements />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/start-idea" element={<StartIdea />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
