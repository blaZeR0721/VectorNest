import { useState } from "react";

import { Bot, Check, Copy, User } from "lucide-react";

import type { Message } from "@/context/appcontext";
import { cn } from "@/lib/utils";

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  if (!isUser && !message.content) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex gap-3 max-w-[85%]",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-1",
          isUser ? "bg-primary/20" : "bg-secondary"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary" />
        ) : (
          <Bot className="w-4 h-4 text-primary" />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-secondary text-secondary-foreground rounded-tl-sm"
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {message.sources.map((src, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-display"
              >
                {src}
              </span>
            ))}
          </div>
        )}

        <div
          className={cn(
            "flex items-center gap-2",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span className="text-[10px] text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>

          {!isUser && (
            <button
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Copy response"
            >
              {copied ? (
                <Check className="w-3 h-3 text-primary" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
