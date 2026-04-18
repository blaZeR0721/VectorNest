import { useState } from "react";
import { Link } from "react-router-dom";

import { ArrowLeft, Mail, Send } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/authlayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/services/authservice";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success("Reset link sent to your email");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send reset link"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll send you a link to get back in"
    >
      <div
        className="glass-card rounded-2xl p-8 space-y-6"
        style={{ animation: "fade-up 0.5s ease-out 0.2s both" }}
      >
        {sent ? (
          <div className="text-center space-y-4">
            <div
              className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto border border-primary/20"
              style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
            >
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Check your inbox
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                A password reset link has been sent to{" "}
                <span className="text-foreground font-medium">{email}</span>. It
                expires in 3 minutes.
              </p>
            </div>
            <Link
              to="/login"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium">
                Email
              </Label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="you@example.com"
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
                  Sending...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" /> Send Reset Link
                </span>
              )}
            </Button>

            <p className="text-center">
              <Link
                to="/login"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to login
              </Link>
            </p>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
