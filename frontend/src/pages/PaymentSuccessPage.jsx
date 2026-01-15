import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("loading");
  const [paymentData, setPaymentData] = useState(null);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus();
    } else {
      setStatus("error");
    }
  }, [sessionId]);

  const pollPaymentStatus = async () => {
    if (pollCount >= 5) {
      setStatus("timeout");
      return;
    }

    try {
      const response = await axios.get(`${API}/checkout/status/${sessionId}`);
      setPaymentData(response.data);

      if (response.data.payment_status === "paid") {
        setStatus("success");
      } else if (response.data.status === "expired") {
        setStatus("expired");
      } else {
        setPollCount(prev => prev + 1);
        setTimeout(pollPaymentStatus, 2000);
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" data-testid="payment-success-page">
      <Card className="max-w-md w-full border-2 border-slate-200">
        <CardContent className="p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 text-gold mx-auto mb-6 animate-spin" />
              <h1 className="text-2xl font-serif font-bold text-navy mb-2">
                Processing Payment...
              </h1>
              <p className="text-slate-600">
                Please wait while we confirm your payment.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-navy mb-2">
                Payment Successful!
              </h1>
              <p className="text-slate-600 mb-6">
                Thank you for your purchase. You'll receive an email with your download links shortly.
              </p>
              {paymentData?.metadata?.product_name && (
                <div className="bg-gold-light rounded-lg p-4 mb-6">
                  <p className="text-sm text-gold font-medium">
                    Product: {paymentData.metadata.product_name}
                  </p>
                  <p className="text-lg font-bold text-navy">
                    ${(paymentData.amount_total / 100).toFixed(2)} {paymentData.currency?.toUpperCase()}
                  </p>
                </div>
              )}
              <Link to="/">
                <Button className="bg-gold hover:bg-gold/90 text-white" data-testid="back-to-home-btn">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </>
          )}

          {(status === "error" || status === "expired" || status === "timeout") && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-navy mb-2">
                {status === "timeout" ? "Payment Verification Timeout" : "Payment Issue"}
              </h1>
              <p className="text-slate-600 mb-6">
                {status === "timeout" 
                  ? "We couldn't verify your payment. Please check your email for confirmation or contact support."
                  : "There was an issue with your payment. Please try again or contact support."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/">
                  <Button variant="outline" data-testid="back-to-home-error-btn">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                <Button className="bg-gold hover:bg-gold/90 text-white" data-testid="contact-support-btn">
                  Contact Support
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;
