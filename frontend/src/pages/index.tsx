import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ChatBubble } from "@/components/chatbubble";
import { ChatInput } from "@/components/chatinput";
import { FileUploader } from "@/components/fileuploader";
import { Loader } from "@/components/loader";
import { SettingsPanel } from "@/components/settingspanel";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/appcontext";
import { useAuth } from "@/context/authcontext";
import { cn } from "@/lib/utils";
import { sendChatMessageStream } from "@/services/chatservices";

export default function Index() {
  const {
    messages,
    addMessage,
    updateMessage,
    replaceMessage,
    settings,
    clearHistory,
  } = useApp();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isStreaming = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const handleSend = async (query: string) => {
    if (isStreaming.current) return;
    isStreaming.current = true;
    setStreaming(true);

    addMessage({ role: "user", content: query });
    setLoading(true);

    const assistantId = crypto.randomUUID();
    addMessage({ role: "assistant", content: "", id: assistantId });

    let firstChunk = true;

    try {
      await sendChatMessageStream(
        { query, k: settings.k, mode: settings.mode },
        (chunk) => {
          if (firstChunk) {
            setLoading(false);
            firstChunk = false;
          }
          updateMessage(assistantId, chunk);
        }
      );
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to get response";
      toast.error(errorMsg);
      replaceMessage(assistantId, `⚠️ ${errorMsg}`);
    } finally {
      setLoading(false);
      isStreaming.current = false;
      setStreaming(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      toast.error("Logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-300 shrink-0",
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        )}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b border-border/50">
          <h1 className="text-lg font-display font-bold tracking-tight">
            <span className="text-primary">Vector</span>
            <span className="text-foreground">Nest</span>
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            RAG-powered document intelligence
          </p>
        </div>

        {/* Documents */}
        <div className="border-b border-border/50">
          <FileUploader />
        </div>

        <div className="flex-1" />

        {/* Settings Menu */}
        <div className="border-t border-border/40 p-2.5 space-y-1.5">
          <SettingsPanel
            onLogout={handleLogout}
            onChangePassword={() => navigate("/change-password")}
            loggingOut={loggingOut}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 justify-start rounded-lg text-xs border-border/40"
            onClick={clearHistory}
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Clear chat
          </Button>
        </div>
      </aside>

      {/* Toggle sidebar */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-5 rounded-l-none rounded-r-md bg-card/80 backdrop-blur-sm border border-l-0 border-border/50"
        style={{ left: sidebarOpen ? "288px" : "0" }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </Button>

      {/* Chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="px-6 py-3 border-b border-border/50 flex items-center gap-2 bg-card/50 backdrop-blur-xl">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-display text-foreground">Chat</span>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin"
        >
          {messages.length === 0 && !loading && (
            <div
              className="flex flex-col items-center justify-center h-full text-center"
              style={{ animation: "fade-up 0.6s ease-out both" }}
            >
              <div className="relative mb-6">
                <div
                  className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20"
                  style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
                >
                  <MessageSquare className="w-10 h-10 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
              </div>
              <h2 className="text-xl font-display font-bold text-foreground">
                Welcome to VectorNest
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
                Upload documents and ask questions. Your AI assistant will
                retrieve relevant context and provide accurate answers.
              </p>
              <div className="flex gap-3 mt-6">
                {["Upload a File", "Ask a question", "Get insights"].map(
                  (hint, i) => (
                    <span
                      key={hint}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-primary/8 text-primary font-display border border-primary/15"
                      style={{
                        animation: `fade-up 0.5s ease-out ${0.3 + i * 0.1}s both`,
                      }}
                    >
                      {hint}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={msg.id}
              style={{
                animation: `fade-up 0.4s ease-out ${Math.min(i * 0.05, 0.3)}s both`,
              }}
            >
              <ChatBubble message={msg} />
            </div>
          ))}

          {loading && <Loader />}
        </div>

        <ChatInput onSend={handleSend} disabled={loading || streaming} />
      </main>
    </div>
  );
}
