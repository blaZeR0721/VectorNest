import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { AlertTriangle, Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/authlayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/services/authService";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!token) {
    return (
      <AuthLayout
        title="Invalid link"
        subtitle="This reset link is missing or expired"
        showBranding={false}
      >
        <div className="glass-card rounded-2xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-destructive/15 flex items-center justify-center mx-auto border border-destructive/20">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">
            Invalid or missing reset token.
          </p>
          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:underline font-medium"
          >
            Request a new reset link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password, confirmPassword);
      toast.success("Password reset successfully!");
      navigate("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a strong password for your account"
    >
      <div
        className="glass-card rounded-2xl p-8"
        style={{ animation: "fade-up 0.5s ease-out 0.2s both" }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-medium">
              New Password
            </Label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-xs font-medium">
              Confirm Password
            </Label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
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
                Resetting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" /> Reset Password
              </span>
            )}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
