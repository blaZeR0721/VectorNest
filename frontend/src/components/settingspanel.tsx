import { useState } from "react";

import { KeyRound, LogOut, Moon, Settings, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useApp } from "@/context/appcontext";

interface SettingsPanelProps {
  onLogout: () => void;
  onChangePassword: () => void;
  loggingOut: boolean;
}

export function SettingsPanel({
  onLogout,
  onChangePassword,
  loggingOut,
}: SettingsPanelProps) {
  const { theme, setTheme } = useApp();
  const isDark = theme === "dark";
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1.5 space-y-1.5 rounded-lg border border-border/40 bg-background/95 p-1.5 shadow-md z-20">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 justify-start rounded-md text-xs border-border/40"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? (
              <Moon className="w-3.5 h-3.5 mr-2" />
            ) : (
              <Sun className="w-3.5 h-3.5 mr-2" />
            )}
            {isDark ? "Dark mode" : "Light mode"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 justify-start rounded-md text-xs border-border/40"
            onClick={onChangePassword}
          >
            <KeyRound className="w-3.5 h-3.5 mr-2" />
            Change password
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 justify-start rounded-md text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-border/40"
            onClick={onLogout}
            disabled={loggingOut}
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            {loggingOut ? "Logging out..." : "Log out"}
          </Button>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full h-9 justify-start rounded-lg text-xs border-border/40"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Settings className="w-3.5 h-3.5 mr-2" />
        Settings
      </Button>
    </div>
  );
}
