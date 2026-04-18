import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Eye, EyeOff, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { register } from "@/services/authservice";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const submitting = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    submitting.current = true;
    setLoading(true);
    try {
      await register(email, password);
      toast.success(
        "Account created! Check your email for the verification OTP."
      );
      navigate("/verify-email", { state: { email } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Get started with VectorNest in seconds"
    >
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

        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-medium">
            Password
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
              Creating account...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Sign Up
            </span>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
