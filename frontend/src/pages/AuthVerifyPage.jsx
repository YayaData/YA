import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const AuthVerifyPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyMagicLink, user } = useAuth();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      handleVerify(token);
    } else {
      setStatus("error");
      setError("No verification token found");
    }
  }, [searchParams]);

  const handleVerify = async (token) => {
    try {
      const result = await verifyMagicLink(token);
      if (result.success) {
        setStatus("success");
        // Redirect based on onboarding status
        setTimeout(() => {
          if (result.user?.onboarding_complete) {
            navigate("/dashboard");
          } else {
            navigate("/start");
          }
        }, 1500);
      }
    } catch (err) {
      setStatus("error");
      setError(err.response?.data?.detail || "Verification failed. The link may have expired.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          {status === "verifying" && (
            <>
              <Loader2 className="w-16 h-16 text-gold mx-auto mb-4 animate-spin" />
              <h1 className="font-serif text-2xl text-navy mb-2">Verifying your link...</h1>
              <p className="text-slate-600">Just a moment</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="font-serif text-2xl text-navy mb-2">You're in!</h1>
              <p className="text-slate-600">Redirecting you now...</p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="font-serif text-2xl text-navy mb-2">Link expired</h1>
              <p className="text-slate-600 mb-6">{error}</p>
              <Button 
                onClick={() => navigate("/start")}
                className="bg-gold hover:bg-gold/90 text-white"
              >
                Request a new link
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthVerifyPage;
