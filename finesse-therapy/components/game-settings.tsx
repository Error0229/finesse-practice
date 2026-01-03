"use client";

import { useGameSettings } from "@/hooks/use-game-settings";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { RotateCcw, Settings2, ChevronLeft, ChevronRight } from "lucide-react";

export function GameSettings() {
  const { settings, updateSetting, resetSettings } = useGameSettings();

  const adjustValue = (key: 'DAS' | 'ARR' | 'SDR', delta: number) => {
    const currentValue = settings[key];
    let newValue = currentValue + delta;

    // ARR and SDR can be -1 (instant)
    if (key === 'ARR' || key === 'SDR') {
      newValue = Math.max(-1, newValue);
    } else {
      newValue = Math.max(0, newValue);
    }

    updateSetting(key, newValue);
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          <h2 className="text-2xl font-bold font-[family-name:var(--font-display)]">
            GAME SETTINGS
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetSettings}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Handling Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-primary">HANDLING</h3>

        {/* DAS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="das" className="text-sm font-semibold">
              DAS (Delayed Auto Shift)
            </Label>
            <Badge variant="secondary" className="font-mono font-bold min-w-[120px] justify-center">
              {settings.DAS} {settings.DAS === 1 ? 'frame' : 'frames'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustValue('DAS', -1)}
              disabled={settings.DAS <= 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (settings.DAS / 20) * 100)}%` }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustValue('DAS', 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Frames before auto-repeat starts (0-20 typical)
          </p>
        </div>

        {/* ARR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="arr" className="text-sm font-semibold">
              ARR (Auto Repeat Rate)
            </Label>
            <Badge variant="secondary" className="font-mono font-bold min-w-[120px] justify-center">
              {settings.ARR === -1 ? 'INSTANT' : `${settings.ARR} ${settings.ARR === 1 ? 'frame' : 'frames'}`}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustValue('ARR', -1)}
              disabled={settings.ARR <= -1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary transition-all"
                style={{ width: settings.ARR === -1 ? '100%' : `${Math.min(100, (settings.ARR / 10) * 100)}%` }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustValue('ARR', 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Frames between auto-repeats (-1 = instant, 0-10 typical)
          </p>
        </div>

        {/* SDR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="sdr" className="text-sm font-semibold">
              SDR (Soft Drop Rate)
            </Label>
            <Badge variant="secondary" className="font-mono font-bold min-w-[120px] justify-center">
              {settings.SDR === -1 ? 'INSTANT' : `${settings.SDR} ${settings.SDR === 1 ? 'frame' : 'frames'}`}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustValue('SDR', -1)}
              disabled={settings.SDR <= -1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: settings.SDR === -1 ? '100%' : `${Math.min(100, (settings.SDR / 10) * 100)}%` }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustValue('SDR', 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Frames between soft drops (-1 = instant, 0-10 typical)
          </p>
        </div>
      </div>

      <Separator />

      {/* Other Settings */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-primary">OTHER</h3>

        <ToggleSetting
          label="Show Ghost"
          value={settings.showGhost}
          onChange={(v) => updateSetting('showGhost', v)}
          description="Display ghost piece showing where piece will land"
        />

        <ToggleSetting
          label="Retry on Finesse Fault"
          value={settings.retryOnFault}
          onChange={(v) => updateSetting('retryOnFault', v)}
          description="Automatically reset piece when finesse fault is detected"
        />

        <ToggleSetting
          label="Master Mode"
          value={settings.masterMode}
          onChange={(v) => updateSetting('masterMode', v)}
          description="Hide placed blocks for extra challenge"
        />
      </div>
    </Card>
  );
}

function ToggleSetting({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary transition-colors">
      <div className="space-y-1">
        <Label className="text-sm font-semibold cursor-pointer" onClick={() => onChange(!value)}>
          {label}
        </Label>
        <p className="text-xs text-muted-foreground max-w-xs">
          {description}
        </p>
      </div>
      <Button
        variant={value ? "default" : "outline"}
        size="sm"
        onClick={() => onChange(!value)}
        className="min-w-[60px]"
      >
        {value ? 'ON' : 'OFF'}
      </Button>
    </div>
  );
}
