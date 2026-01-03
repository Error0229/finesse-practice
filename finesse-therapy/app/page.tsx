"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { GameSettings } from "@/components/game-settings";
import { TetrisBoard } from "@/components/tetris-board";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Play } from "lucide-react";
import { useState } from "react";
import { GameMode } from "@/hooks/use-tetris-game";

const MODE_OPTIONS: { value: GameMode; label: string }[] = [
  { value: "RANDOM", label: "All Random" },
  { value: "Z_ONLY", label: "Z Only" },
  { value: "S_ONLY", label: "S Only" },
  { value: "I_ONLY", label: "I Only" },
  { value: "T_ONLY", label: "T Only" },
  { value: "O_ONLY", label: "O Only" },
  { value: "L_ONLY", label: "L Only" },
  { value: "J_ONLY", label: "J Only" },
  { value: "FREE_STACK", label: "Free Stack" },
];

export default function Page() {
  const [showSettings, setShowSettings] = useState(false);
  const game = TetrisBoard();

  const finessePercent =
    game.score.total > 0
      ? ((game.score.correct / game.score.total) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="h-screen flex flex-col overflow-hidden p-3">
      {/* Header */}
      <header className="flex items-center justify-between mb-3 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">
          Finesse <span className="text-primary">Therapy</span>
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Settings Sidebar */}
      <GameSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Main Game Area */}
      <div className="flex-1 flex justify-center items-center gap-4 overflow-hidden">
        {/* Left Panel - Hold + Stats */}
        <div className="flex flex-col gap-3 w-44 shrink-0">
          <Card className="p-3">
            <div className="text-sm font-bold mb-2">MODE</div>
            <Select
              value={game.gameMode}
              onValueChange={(value) => game.setMode(value as GameMode)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {game.gameMode === "FREE_STACK" && (
            <Card className="p-3">
              <div className="text-sm font-bold mb-2">HOLD</div>
              <div
                className={`h-16 border rounded flex items-center justify-center transition-opacity ${
                  !game.canHold ? "opacity-40" : ""
                }`}
              >
                {game.holdPiece ? (
                  game.renderPiecePreview(game.holdPiece)
                ) : (
                  <span className="text-muted-foreground text-xs">EMPTY</span>
                )}
              </div>
            </Card>
          )}

          <Card className="p-3">
            <div className="text-sm font-bold mb-2">STATS</div>
            <div className="space-y-1.5 text-xs">
              <StatItem
                label="Combo"
                value={game.score.combo.toString()}
                highlight={game.score.combo > 0}
              />
              <StatItem
                label="Top Combo"
                value={game.score.topCombo.toString()}
              />
              <StatItem label="Pieces" value={game.score.total.toString()} />
              <StatItem label="Correct" value={game.score.correct.toString()} />
              <StatItem
                label="Finesse"
                value={`${finessePercent}%`}
                highlight
              />
              <StatItem label="KPP" value={game.score.kpp.toFixed(2)} />
            </div>
          </Card>
        </div>

        {/* Center - Game Board */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <Card className="p-3 relative">
            {game.renderGrid()}
            {game.gameOver && (
              <div className="absolute inset-0 bg-background/90 flex items-center justify-center backdrop-blur-sm rounded">
                <div className="text-center">
                  <div className="text-3xl font-bold">Finesse Therapy</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Press HARD DROP key to begin
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Mode: {game.modeName}
                  </div>
                </div>
              </div>
            )}
          </Card>
          <div className="flex gap-3">
            <Button className="gap-2" onClick={game.startGame}>
              <Play className="h-4 w-4" />
              {game.gameOver ? "START" : "RESTART"}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
              SETTINGS
            </Button>
          </div>
        </div>

        {/* Right Panel - Target + Input + Next */}
        <div className="flex flex-col gap-3 w-36 shrink-0">
          {game.gameMode !== "FREE_STACK" && (
            <Card className="p-3">
              <div className="text-sm font-bold mb-2">TARGET MOVES</div>
              <div className="border rounded p-2 min-h-[80px]">
                {game.renderTargetMoves() || (
                  <div className="text-xs text-muted-foreground">
                    Start game to see moves
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card className="p-3">
            <div className="text-sm font-bold mb-2">YOUR INPUT</div>
            <div className="border rounded p-2 min-h-[80px]">
              {game.renderInputSequence()}
            </div>
          </Card>

          <Card className="p-3">
            <div className="text-sm font-bold mb-2">NEXT</div>
            <div className="space-y-2">
              {game.nextQueue.slice(0, 5).map((piece, i) => (
                <div
                  key={i}
                  className="h-10 border rounded flex items-center justify-center"
                  style={{ opacity: 1 - i * 0.1 }}
                >
                  {game.renderPiecePreview(piece, true)}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}:</span>
      <span
        className={`font-mono font-bold ${highlight ? "text-primary" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
