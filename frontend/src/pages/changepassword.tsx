import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/services/authservice";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword, confirmPassword);
      toast.success("Password changed successfully");
      navigate("/");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to change password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute inset-0 auth-panel-gradient" />
      <div className="floating-orb w-64 h-64 bg-primary/10 -top-10 right-10" />
      <div
        className="floating-orb w-48 h-48 bg-primary/8 bottom-20 left-20"
        style={{ animationDelay: "-4s" }}
      />

      <div
        className="w-full max-w-md space-y-6 relative z-10"
        style={{ animation: "fade-up 0.5s ease-out both" }}
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />{" "}
          Back to chat
        </button>

        <div className="glass-card rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/20"
              style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
            >
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">
                Change Password
              </h1>
              <p className="text-xs text-muted-foreground">
                Update your account password
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Current Password</Label>
              <div className="relative">
                <input
                  type={showOld ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="auth-input pr-10"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showOld ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">New Password</Label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="auth-input pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNew ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Confirm New Password
              </Label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="auth-input"
                placeholder="Confirm new password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-display shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Changing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Change Password
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
