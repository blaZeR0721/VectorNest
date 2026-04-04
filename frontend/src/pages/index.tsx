import { useEffect, useRef, useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

import { ChatBubble } from "@/components/chatbubble";
import { ChatInput } from "@/components/chatinput";
import { FileUploader } from "@/components/fileuploader";
import { Loader } from "@/components/loader";
import { SettingsPanel } from "@/components/settingspanel";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/appcontext";
import { cn } from "@/lib/utils";
import { sendChatMessageStream } from "@/services/chatservices";

export default function Index() {
  const { messages, addMessage, updateMessage, replaceMessage, settings } =
    useApp();
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

    addMessage({ role: "user", content: query });
    setLoading(true);

    const assistantId = crypto.randomUUID();
    addMessage({ role: "assistant", content: "", id: assistantId });

    let firstChunk = true;

    try {
      await sendChatMessageStream({ query }, async (chunk) => {
        if (firstChunk) {
          setLoading(false);
          firstChunk = false;
        }
        for (const char of chunk) {
          updateMessage(assistantId, char);
          await new Promise((r) => setTimeout(r, 15));
        }
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to get response";
      toast.error(errorMsg);
      replaceMessage(assistantId, `⚠️ ${errorMsg}`);
    } finally {
      setLoading(false);
      isStreaming.current = false;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-card transition-all duration-300 shrink-0",
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        )}
      >
        <div className="px-4 py-5 border-b border-border">
          <h1 className="text-lg font-display font-bold tracking-tight">
            <span className="text-primary">Vector</span>
            <span className="text-foreground">Nest</span>
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            RAG-powered document intelligence
          </p>
        </div>

        <div className="border-b border-border">
          <div className="flex items-center gap-2 px-4 py-2 text-xs font-display text-muted-foreground">
            <FileText className="w-3.5 h-3.5" />
            Documents
          </div>
          <FileUploader />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <SettingsPanel />
        </div>
      </aside>

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-5 rounded-l-none rounded-r-md bg-card border border-l-0 border-border"
        style={{ left: sidebarOpen ? "288px" : "0" }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </Button>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="px-6 py-3 border-b border-border flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-display text-foreground">Chat</span>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin"
        >
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div
                className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
                style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
              >
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-display font-bold text-foreground">
                Welcome to VectorNest
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Upload documents and ask questions. Your AI assistant will
                retrieve relevant context and answer.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {loading && <Loader />}
        </div>

        <ChatInput onSend={handleSend} disabled={loading} />
      </main>
    </div>
  );
}
