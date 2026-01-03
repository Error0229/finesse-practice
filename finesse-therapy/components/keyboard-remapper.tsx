"use client";

import { useKeyBindings } from "@/hooks/use-key-bindings";
import { GameAction } from "@/lib/types";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { useEffect } from "react";
import { RotateCcw, Keyboard } from "lucide-react";

const ACTION_LABELS: Record<GameAction, string> = {
  MOVE_LEFT: "Move Left",
  MOVE_RIGHT: "Move Right",
  SOFT_DROP: "Soft Drop",
  HARD_DROP: "Hard Drop",
  ROTATE_CW: "Rotate Clockwise",
  ROTATE_CCW: "Rotate Counter-CW",
  ROTATE_180: "Rotate 180°",
  HOLD: "Hold Piece",
  RESET: "Reset Game",
  CHANGE_MODE: "Change Mode",
};

function formatKey(code: string): string {
  // Map event.code to display-friendly names
  const codeMap: Record<string, string> = {
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
    'Comma': ',',
    'Period': '.',
    'Slash': '/',
    'Backquote': '`',
    'BracketLeft': '[',
    'BracketRight': ']',
    'Backslash': '\\',
    'Quote': "'",
    'Minus': '-',
    'Equal': '=',
  };

  if (codeMap[code]) return codeMap[code];

  // Handle letter keys (KeyA -> A, KeyZ -> Z)
  if (code.startsWith('Key')) return code.slice(3);

  // Handle digit keys (Digit1 -> 1, Numpad5 -> NUM5)
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'NUM' + code.slice(6);

  return code.toUpperCase();
}

export function KeyboardRemapper() {
  const {
    bindings,
    listening,
    startListening,
    stopListening,
    updateBinding,
    resetBindings,
  } = useKeyBindings();

  useEffect(() => {
    if (!listening) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.code === 'Escape') {
        stopListening();
        return;
      }
      updateBinding(listening, e.code);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [listening, updateBinding, stopListening]);

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Keyboard className="h-5 w-5" />
          <h2 className="text-2xl font-bold font-[family-name:var(--font-display)]">
            KEYBOARD REMAPPING
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetBindings}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {listening && (
        <div className="p-4 bg-primary/20 border-2 border-primary rounded-lg animate-pulse">
          <p className="text-center font-bold crt-effect">
            PRESS ANY KEY FOR: {ACTION_LABELS[listening]}
            <br />
            <span className="text-sm opacity-75">(ESC to cancel)</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {bindings.map(({ key, action }) => (
          <button
            key={action}
            onClick={() => startListening(action)}
            className="flex items-center justify-between p-4 rounded-lg border-2 border-border hover:border-primary transition-all hover:scale-105 active:scale-95 bg-card group"
            disabled={listening !== null && listening !== action}
          >
            <span className="font-semibold text-sm group-hover:text-primary transition-colors">
              {ACTION_LABELS[action]}
            </span>
            <Badge
              variant={listening === action ? "default" : "secondary"}
              className="text-lg px-4 py-2 font-mono font-bold min-w-[80px] justify-center"
            >
              {formatKey(key)}
            </Badge>
          </button>
        ))}
      </div>

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>Click any binding to remap it</p>
        <p>Press ESC while remapping to cancel</p>
      </div>
    </Card>
  );
}
