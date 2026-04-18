import { Bot } from "lucide-react";

export function Loader() {
  return (
    <div
      className="flex gap-3 max-w-[85%] mr-auto"
      style={{ animation: "fade-up 0.3s ease-out both" }}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-secondary border border-border/50 mt-1">
        <Bot className="w-4 h-4 text-primary animate-pulse" />
      </div>
      <div className="bg-secondary rounded-2xl rounded-tl-sm px-5 py-3.5 flex items-center gap-2 border border-border/30 shadow-sm">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-primary/50"
            style={{
              animation: "dot-bounce 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
