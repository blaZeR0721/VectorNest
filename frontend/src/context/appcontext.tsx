import React, {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: string[];
}

export interface Settings {
  k: number;
  mode: "summary" | "detailed";
}

export type Theme = "light" | "dark";

interface AppState {
  messages: Message[];
  settings: Settings;
  theme: Theme;
  setTheme: (t: Theme) => void;
  addMessage: (
    msg: Omit<Message, "id" | "timestamp"> & { id?: string }
  ) => void;
  updateMessage: (id: string, chunk: string) => void;
  replaceMessage: (id: string, content: string) => void;
  clearHistory: () => void;
  updateSettings: (s: Partial<Settings>) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<Settings>({
    k: 5,
    mode: "detailed",
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved =
        (localStorage.getItem("vectornest-theme") as Theme) || "dark";
      document.documentElement.classList.toggle("dark", saved === "dark");
      return saved;
    }
    return "dark";
  });

  const setTheme = useCallback((t: Theme) => {
    const root = document.documentElement;
    root.classList.add("theme-transitioning");
    root.classList.toggle("dark", t === "dark");
    localStorage.setItem("vectornest-theme", t);
    setThemeState(t);
    setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 450);
  }, []);

  const addMessage = useCallback(
    (msg: Omit<Message, "id" | "timestamp"> & { id?: string }) => {
      setMessages((prev) => [
        ...prev,
        { ...msg, id: msg.id ?? crypto.randomUUID(), timestamp: new Date() },
      ]);
    },
    []
  );

  const updateMessage = useCallback((id: string, chunk: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: m.content + chunk } : m))
    );
  }, []);

  const replaceMessage = useCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content } : m))
    );
  }, []);

  const clearHistory = useCallback(() => setMessages([]), []);

  const updateSettings = useCallback(
    (s: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...s })),
    []
  );

  return (
    <AppContext.Provider
      value={{
        messages,
        settings,
        theme,
        setTheme,
        addMessage,
        updateMessage,
        replaceMessage,
        clearHistory,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
