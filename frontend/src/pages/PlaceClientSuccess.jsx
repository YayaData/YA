import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, XCircle, ArrowRight, Anchor } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PlaceClientSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  
  const [status, setStatus] = useState("checking"); // checking, paid, failed, expired
  const [pollAttempts, setPollAttempts] = useState(0);
  const maxAttempts = 5;

  useEffect(() => {
    if (!sessionId) {
      setStatus("failed");
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        const response = await axios.get(`${API}/payments/checkout/status/${sessionId}`);
        const data = response.data;
        
        if (data.payment_status === "paid") {
          setStatus("paid");
          // Store session ID for form submission
          localStorage.setItem("placement_payment_session", sessionId);
          toast.success("Payment successful!");
        } else if (data.status === "expired") {
          setStatus("expired");
        } else if (pollAttempts < maxAttempts) {
          // Continue polling
          setPollAttempts(prev => prev + 1);
          setTimeout(checkPaymentStatus, 2000);
        } else {
          setStatus("failed");
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        if (pollAttempts < maxAttempts) {
          setPollAttempts(prev => prev + 1);
          setTimeout(checkPaymentStatus, 2000);
        } else {
          setStatus("failed");
        }
      }
    };

    checkPaymentStatus();
  }, [sessionId]);

  const handleContinue = () => {
    // Navigate back to place-client with payment verified
    navigate("/place-client?payment_verified=true");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
      <Card className="max-w-md w-full border border-slate-200 shadow-lg">
        <CardContent className="p-8 text-center">
          {status === "checking" && (
            <>
              <Loader2 className="h-16 w-16 mx-auto text-sky-600 animate-spin mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Verifying Payment</h2>
              <p className="text-slate-600">Please wait while we confirm your payment...</p>
            </>
          )}

          {status === "paid" && (
            <>
              <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Payment Successful!</h2>
              <p className="text-slate-600 mb-6">
                Your payment has been processed. You can now complete your placement request.
              </p>
              <Button 
                onClick={handleContinue}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                data-testid="continue-to-form-btn"
              >
                Continue to Form
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Payment Failed</h2>
              <p className="text-slate-600 mb-6">
                We couldn't verify your payment. Please try again.
              </p>
              <Button 
                onClick={() => navigate("/place-client")}
                variant="outline"
                className="w-full"
              >
                Return to Form
              </Button>
            </>
          )}

          {status === "expired" && (
            <>
              <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-10 w-10 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Session Expired</h2>
              <p className="text-slate-600 mb-6">
                Your payment session has expired. Please try again.
              </p>
              <Button 
                onClick={() => navigate("/place-client")}
                variant="outline"
                className="w-full"
              >
                Return to Form
              </Button>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400">
            <Anchor className="h-4 w-4" />
            <span className="text-sm">Anchor Placement</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
