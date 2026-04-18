import { ReactNode } from "react";

import { MessageSquare, Shield, Sparkles, Zap } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  showBranding?: boolean;
}

const features = [
  { icon: Sparkles, label: "AI-Powered Search" },
  { icon: Shield, label: "Secure & Private" },
  { icon: Zap, label: "Instant Answers" },
];

export function AuthLayout({
  children,
  title,
  subtitle,
  showBranding = true,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left decorative panel */}
      {showBranding && (
        <div className="hidden lg:flex lg:w-[45%] bg-card items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 auth-panel-gradient" />
          <div className="floating-orb w-72 h-72 bg-primary/20 -top-20 -left-20" />
          <div
            className="floating-orb w-56 h-56 bg-primary/15 bottom-10 right-10"
            style={{ animationDelay: "-3s" }}
          />
          <div
            className="floating-orb w-40 h-40 bg-accent/10 top-1/2 left-1/3"
            style={{ animationDelay: "-6s" }}
          />

          <div
            className="relative z-10 text-center px-12"
            style={{ animation: "fade-up 0.6s ease-out both" }}
          >
            <div
              className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6 border border-primary/20"
              style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
            >
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground">
              <span className="text-primary">Vector</span>Nest
            </h2>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed max-w-sm mx-auto">
              RAG-powered document intelligence. Upload, ask, and get accurate
              answers from your documents.
            </p>
            <div className="flex gap-3 mt-8 justify-center">
              {features.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-xl bg-primary/8 border border-primary/15 text-primary font-display"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div
          className="w-full max-w-md space-y-8"
          style={{ animation: "fade-up 0.5s ease-out 0.1s both" }}
        >
          <div className="text-center lg:text-left">
            <div className="lg:hidden mb-6">
              <div
                className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto lg:mx-0 mb-3 border border-primary/20"
                style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
              >
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold">
                <span className="text-primary">Vector</span>
                <span className="text-foreground">Nest</span>
              </h1>
            </div>
            <h2 className="text-xl font-display font-bold text-foreground">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
