import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/authlayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { resendOtp, verifyEmail } from "@/services/authservice";

export default function VerifyEmail() {
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  if (!email) {
    navigate("/login", { replace: true });
    return null;
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyEmail(email, otp);
      await checkAuth();
      toast.success("Email verified!");
      navigate("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOtp(email);
      toast.success("OTP resent to your email");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the code we sent to your inbox"
    >
      <div
        className="glass-card rounded-2xl p-8 space-y-6"
        style={{ animation: "fade-up 0.5s ease-out 0.2s both" }}
      >
        <div className="flex items-center gap-3 justify-center">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/20">
            <Mail className="w-6 h-6 text-primary" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          We sent a verification code to{" "}
          <span className="text-foreground font-medium">{email}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-xs font-medium">
              Verification Code
            </Label>
            <input
              id="otp"
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="auth-input text-center tracking-[0.4em] font-display text-lg"
              placeholder="000000"
              maxLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-xl text-sm font-medium shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Verify Email
              </span>
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-xs text-primary hover:underline inline-flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw
                className={`w-3 h-3 ${resending ? "animate-spin" : ""}`}
              />
              {resending ? "Resending..." : "Resend code"}
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
