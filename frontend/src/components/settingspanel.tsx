import { useApp } from "@/context/appcontext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Settings, Sun, Moon } from "lucide-react";

export function SettingsPanel() {
  const { settings, updateSettings, clearHistory, messages, theme, setTheme } = useApp();

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-2 text-sm font-display text-foreground">
        <Settings className="w-4 h-4 text-primary" />
        Settings
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
          {theme === "dark" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          {theme === "dark" ? "Dark mode" : "Light mode"}
        </Label>
        <Switch
          checked={theme === "dark"}
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        />
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={clearHistory}
        disabled={messages.length === 0}
      >
        <Trash2 className="w-3 h-3 mr-1.5" />
        Clear history
      </Button>
    </div>
  );
}
