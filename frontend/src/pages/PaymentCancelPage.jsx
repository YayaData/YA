import { Link } from "react-router-dom";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PaymentCancelPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" data-testid="payment-cancel-page">
      <Card className="max-w-md w-full border-2 border-slate-200">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-amber-600" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-navy mb-2">
            Payment Cancelled
          </h1>
          <p className="text-slate-600 mb-6">
            Your payment was cancelled. No charges were made to your account.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            If you have any questions or encountered an issue, please don't hesitate to contact our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button variant="outline" data-testid="back-to-home-btn">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <Link to="/templates">
              <Button className="bg-gold hover:bg-gold/90 text-white" data-testid="try-again-btn">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancelPage;
