"use client";

import { useGameSettings } from "@/hooks/use-game-settings";
import { useKeyBindings } from "@/hooks/use-key-bindings";
import { GameAction } from "@/lib/types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Slider } from "./ui/slider";
import { RotateCcw, Settings2, X, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const ACTION_LABELS: Record<GameAction, string> = {
  MOVE_LEFT: "Move Left",
  MOVE_RIGHT: "Move Right",
  SOFT_DROP: "Soft Drop",
  HARD_DROP: "Hard Drop",
  ROTATE_CW: "Rotate CW",
  ROTATE_CCW: "Rotate CCW",
  ROTATE_180: "Rotate 180°",
  HOLD: "Hold",
  RESET: "Reset",
  CHANGE_MODE: "Mode",
};

function formatKey(code: string): string {
  const keyMap: Record<string, string> = {
    'Space': 'SPACE',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Escape': 'ESC',
    'Tab': 'TAB',
    'ShiftLeft': 'L-SHIFT',
    'ShiftRight': 'R-SHIFT',
    'ControlLeft': 'L-CTRL',
    'ControlRight': 'R-CTRL',
    'AltLeft': 'L-ALT',
    'AltRight': 'R-ALT',
    'Backspace': 'BKSP',
    'Enter': 'ENTER',
    'Semicolon': ';',
    'Quote': "'",
    'Comma': ',',
    'Period': '.',
    'Slash': '/',
    'Backquote': '`',
    'BracketLeft': '[',
    'BracketRight': ']',
    'Backslash': '\\',
    'Minus': '-',
    'Equal': '=',
  };
  if (keyMap[code]) return keyMap[code];
  // Handle KeyA -> A, KeyZ -> Z, Digit1 -> 1, etc.
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'NUM' + code.slice(6);
  return code.toUpperCase();
}

interface GameSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GameSettings({ isOpen, onClose }: GameSettingsProps) {
  const { settings, updateSetting, resetSettings } = useGameSettings();
  const {
    bindings,
    listening,
    startListening,
    stopListening,
    updateBinding,
    resetBindings,
  } = useKeyBindings();

  // Convert slider value to actual value (slider uses 0 for instant, actual uses -1)
  const sliderToValue = (sliderVal: number) => sliderVal === 0 ? -1 : sliderVal;
  const valueToSlider = (val: number) => val === -1 ? 0 : val;

  // Handle key binding capture
  useEffect(() => {
    if (!listening) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.code === 'Escape') {
        stopListening();
        return;
      }
      // Use e.code to match how keys are looked up in tetris-board
      updateBinding(listening, e.code);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [listening, updateBinding, stopListening]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-80 bg-background border-l z-50 shadow-xl transition-transform duration-300 ease-in-out overflow-y-auto",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              <h2 className="text-xl font-bold font-[family-name:var(--font-display)]">
                SETTINGS
              </h2>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetSettings}
                className="gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Handling Settings */}
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-primary">HANDLING</h3>

            {/* DAS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  DAS (Delayed Auto Shift)
                </Label>
                <Badge variant="secondary" className="font-mono font-bold min-w-[80px] justify-center">
                  {settings.DAS} {settings.DAS === 1 ? 'frame' : 'frames'}
                </Badge>
              </div>
              <Slider
                value={[settings.DAS]}
                min={0}
                max={20}
                step={1}
                onValueChange={([val]) => updateSetting('DAS', val)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Frames before auto-repeat starts (0-20 typical)
              </p>
            </div>

            {/* ARR */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  ARR (Auto Repeat Rate)
                </Label>
                <Badge variant="secondary" className="font-mono font-bold min-w-[80px] justify-center">
                  {settings.ARR === -1 ? 'INSTANT' : `${settings.ARR} ${settings.ARR === 1 ? 'frame' : 'frames'}`}
                </Badge>
              </div>
              <Slider
                value={[valueToSlider(settings.ARR)]}
                min={0}
                max={10}
                step={1}
                onValueChange={([val]) => updateSetting('ARR', sliderToValue(val))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                0 = Instant, 1-10 = frames between repeats
              </p>
            </div>

            {/* SDR */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  SDR (Soft Drop Rate)
                </Label>
                <Badge variant="secondary" className="font-mono font-bold min-w-[80px] justify-center">
                  {settings.SDR === -1 ? 'INSTANT' : `${settings.SDR} ${settings.SDR === 1 ? 'frame' : 'frames'}`}
                </Badge>
              </div>
              <Slider
                value={[valueToSlider(settings.SDR)]}
                min={0}
                max={10}
                step={1}
                onValueChange={([val]) => updateSetting('SDR', sliderToValue(val))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                0 = Instant, 1-10 = frames between drops
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

          <Separator />

          {/* Keyboard Bindings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                <h3 className="text-lg font-bold text-primary">CONTROLS</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetBindings}
                className="gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {bindings.map(({ key, action }) => (
                <button
                  key={action}
                  onClick={() => startListening(action)}
                  className={cn(
                    "flex flex-col items-center p-2 rounded border text-center transition-all",
                    "hover:border-primary hover:bg-accent",
                    listening === action && "border-primary bg-primary/10 animate-pulse"
                  )}
                  disabled={listening !== null && listening !== action}
                >
                  <span className="text-xs font-medium">
                    {ACTION_LABELS[action]}
                  </span>
                  {listening === action ? (
                    <span className="text-xs text-primary font-bold mt-1">
                      Press key...
                    </span>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="text-xs px-2 py-0.5 font-mono font-bold mt-1"
                    >
                      {formatKey(key)}
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Click to remap, ESC to cancel
            </p>
          </div>
        </div>
      </div>
    </>
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
      <div className="space-y-1 flex-1 min-w-0">
        <Label className="text-sm font-semibold cursor-pointer" onClick={() => onChange(!value)}>
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>
      <Button
        variant={value ? "default" : "outline"}
        size="sm"
        onClick={() => onChange(!value)}
        className="min-w-[50px] ml-2 shrink-0"
      >
        {value ? 'ON' : 'OFF'}
      </Button>
    </div>
  );
}
