"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { GameSettings } from "@/components/game-settings";
import { TetrisBoard } from "@/components/tetris-board";
import { LearningProgress } from "@/components/learning-progress";
import { GamificationPanel, StatsStrip } from "@/components/gamification-panel";
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
  { value: "LEARNING", label: "Learning Mode" },
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
      <header className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight">
            Finesse <span className="text-primary">Therapy</span>
          </h1>
          {game.renderFlowIndicator()}
        </div>
        <div className="flex items-center gap-2">
          {game.renderDifficultyIndicator()}
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

      <GameSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Main Game Area */}
      <div className="flex-1 flex justify-center items-start gap-3 overflow-hidden pt-2">
        {/* Left Panel - Mode + Stats */}
        <div className="flex flex-col gap-2 w-40 shrink-0">
          <Card className="p-2">
            <div className="text-xs font-bold mb-1.5 text-muted-foreground">MODE</div>
            <Select
              value={game.gameMode}
              onValueChange={(value) => game.setMode(value as GameMode)}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {game.gameMode === "FREE_STACK" && (
            <Card className="p-2">
              <div className="text-xs font-bold mb-1.5 text-muted-foreground">HOLD</div>
              <div
                className={`h-12 border rounded flex items-center justify-center ${
                  !game.canHold ? "opacity-40" : ""
                }`}
              >
                {game.holdPiece ? (
                  game.renderPiecePreview(game.holdPiece)
                ) : (
                  <span className="text-muted-foreground text-[10px]">EMPTY</span>
                )}
              </div>
            </Card>
          )}

          <Card className="p-2">
            <div className="text-xs font-bold mb-1.5 text-muted-foreground">STATS</div>
            <div className="space-y-1 text-[11px]">
              <StatRow label="Combo" value={game.score.combo} highlight={game.score.combo > 0} />
              <StatRow label="Best" value={game.score.topCombo} />
              <StatRow label="Pieces" value={game.score.total} />
              <StatRow label="Correct" value={game.score.correct} />
              <StatRow label="Finesse" value={`${finessePercent}%`} highlight />
              <StatRow label="KPP" value={game.score.kpp.toFixed(2)} />
            </div>
          </Card>

          {/* Gamification Panel - Learning Mode only */}
          {game.gameMode === "LEARNING" && <GamificationPanel />}
        </div>

        {/* Center - Game Board */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          {/* Timing bar */}
          {game.gameMode === "LEARNING" && !game.gameOver && (
            <div className="w-full max-w-[280px]">
              {game.renderTimingBar()}
            </div>
          )}

          <Card className="p-2 relative">
            {game.renderGrid()}
            {game.gameOver && (
              <div className="absolute inset-0 bg-background/90 flex items-center justify-center backdrop-blur-sm rounded">
                <div className="text-center">
                  <div className="text-2xl font-bold">Finesse Therapy</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Press SPACE to begin
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Mode: {game.modeName}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={game.startGame}>
              <Play className="h-3 w-3" />
              {game.gameOver ? "START" : "RESTART"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-3 w-3" />
              SETTINGS
            </Button>
          </div>

          {/* Stats strip below buttons - Learning mode only */}
          {game.gameMode === "LEARNING" && !game.gameOver && (
            <div className="mt-1">
              <StatsStrip />
            </div>
          )}
        </div>

        {/* Right Panel - Target + Input + Next */}
        <div className="flex flex-col gap-2 w-40 shrink-0">
          {game.gameMode !== "FREE_STACK" && (
            <Card className="p-2">
              <div className="text-xs font-bold mb-1.5 text-muted-foreground">TARGET</div>
              <div className="border rounded p-1.5 min-h-[60px] text-[11px]">
                {game.renderTargetMoves() || (
                  <div className="text-[10px] text-muted-foreground">
                    Start game to see moves
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card className="p-2">
            <div className="text-xs font-bold mb-1.5 text-muted-foreground">INPUT</div>
            <div className="border rounded p-1.5 min-h-[60px] text-[11px]">
              {game.renderInputSequence()}
            </div>
          </Card>

          <Card className="p-2">
            <div className="text-xs font-bold mb-1.5 text-muted-foreground">NEXT</div>
            <div className="space-y-1">
              {game.nextQueue.slice(0, 5).map((piece, i) => (
                <div
                  key={i}
                  className="h-8 border rounded flex items-center justify-center"
                  style={{ opacity: 1 - i * 0.15 }}
                >
                  {game.renderPiecePreview(piece, true)}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Far Right - Learning Progress (only in Learning mode) */}
        {game.gameMode === "LEARNING" && (
          <div className="w-44 shrink-0">
            <LearningProgress />
          </div>
        )}
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-bold ${highlight ? "text-primary" : ""}`}>
        {value}
      </span>
    </div>
  );
}
