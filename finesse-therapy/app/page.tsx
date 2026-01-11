"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { GameSettings } from "@/components/game-settings";
import { TetrisBoard } from "@/components/tetris-board";
import { LearningProgress } from "@/components/learning-progress";
import { GamificationPanel } from "@/components/gamification-panel";
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
    <div className="h-screen flex flex-col overflow-hidden bg-background text-foreground text-xs">
      {/* Compact Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-background/50 backdrop-blur-md shrink-0 z-10 h-10">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold tracking-tight">
            Finesse <span className="text-primary">Therapy</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
          <ThemeSwitcher />
        </div>
      </header>

      <GameSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Main Centered "Cockpit" Layout */}
      <div className="flex-1 flex justify-center items-start gap-4 p-4 overflow-hidden">
        
        {/* Left Column: Dashboard */}
        <div className="flex flex-col gap-3 w-[240px] shrink-0 h-full overflow-y-auto pr-1 custom-scrollbar">
          {/* Game Control Card */}
          <Card className="p-3 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="text-[9px] font-bold mb-1.5 text-muted-foreground tracking-wider uppercase">Game Mode</div>
            <Select
              value={game.gameMode}
              onValueChange={(value) => game.setMode(value as GameMode)}
            >
              <SelectTrigger className="w-full h-7 text-xs">
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

             <div className="flex gap-2 mt-2">
              <Button className="flex-1 gap-2 h-7 text-xs" onClick={game.startGame} variant={game.gameOver ? "default" : "secondary"}>
                <Play className="h-3 w-3" />
                {game.gameOver ? "START" : "RESTART"}
              </Button>
            </div>
          </Card>

          {game.gameMode === "FREE_STACK" && (
            <Card className="p-3 bg-card/50 backdrop-blur-sm border-border/50">
              <div className="text-[9px] font-bold mb-1.5 text-muted-foreground tracking-wider uppercase">Hold</div>
              <div
                className={`h-16 border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center bg-background/30 ${
                  !game.canHold ? "opacity-40" : ""
                }`}
              >
                {game.holdPiece ? (
                  <div className="scale-100">
                     {game.renderPiecePreview(game.holdPiece)}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-[9px] font-medium">EMPTY</span>
                )}
              </div>
            </Card>
          )}

          {/* Gamification / Stats */}
           {game.gameMode === "LEARNING" ? (
             <GamificationPanel />
           ) : (
            <Card className="p-3 bg-card/50 backdrop-blur-sm border-border/50">
              <div className="text-[9px] font-bold mb-2 text-muted-foreground tracking-wider uppercase">Statistics</div>
              <div className="space-y-2">
                <StatRow label="Combo" value={game.score.combo} highlight={game.score.combo > 0} />
                <StatRow label="Best" value={game.score.topCombo} />
                <div className="h-px bg-border/50 my-1.5" />
                <StatRow label="Pieces" value={game.score.total} />
                <StatRow label="Correct" value={game.score.correct} />
                <StatRow label="Finesse" value={`${finessePercent}%`} highlight />
                <StatRow label="KPP" value={game.score.kpp.toFixed(2)} />
              </div>
            </Card>
           )}
        </div>

        {/* Center Column: Game Board - Fixed Size */}
        <div ref={game.gameContainerRef} className="flex flex-col items-center gap-2 shrink-0 pt-2">
            {/* Timing bar only in learning mode */}
            {game.gameMode === "LEARNING" && !game.gameOver && (
              <div className="w-[360px] h-1.5 bg-muted/30 rounded-full overflow-hidden">
                {game.renderTimingBar()}
              </div>
            )}

            <div className="relative p-1 rounded-xl bg-gradient-to-b from-border/20 to-border/5 shadow-2xl">
              <Card className="p-1 border-0 bg-black/80 shadow-inner">
                {game.renderGrid()}
                {game.renderPauseOverlay()}
                {game.gameOver && (
                  <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
                    <div className="text-center space-y-3 p-5 bg-card border rounded-xl shadow-2xl transform transition-all animate-in fade-in zoom-in duration-300">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-primary">Finesse Therapy</h2>
                        <p className="text-muted-foreground text-[10px] mt-0.5">Master your movement</p>
                      </div>
                      
                      <div className="py-2">
                        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-0.5">Mode</div>
                        <div className="font-bold text-sm">{game.modeName}</div>
                      </div>

                      <Button size="sm" className="w-full gap-2" onClick={game.startGame}>
                        <Play className="h-3 w-3" />
                        SPACE to Start
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
            
            <div className="text-[10px] text-muted-foreground font-mono opacity-50">
              {game.gameMode === "LEARNING" ? "Follow the rhythm" : "Survival mode"}
            </div>
        </div>

        {/* Right Column: Guidance & Progress */}
        <div className="flex flex-col gap-3 w-[240px] shrink-0 h-full overflow-y-auto pl-1 custom-scrollbar">
           {game.gameMode !== "FREE_STACK" && (
            <Card className="p-3 bg-card/50 backdrop-blur-sm border-border/50 flex flex-col h-[140px]">
              <div className="text-[9px] font-bold mb-2 text-muted-foreground tracking-wider uppercase shrink-0">Target</div>
              <div className="bg-background/50 rounded-lg p-2 flex-1 flex items-center justify-center border border-border/50 overflow-y-auto custom-scrollbar">
                {game.renderTargetMoves() || (
                  <div className="text-[10px] text-muted-foreground italic">
                    Start game to see moves
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card className="p-3 bg-card/50 backdrop-blur-sm border-border/50 flex flex-col h-[100px]">
            <div className="text-[9px] font-bold mb-2 text-muted-foreground tracking-wider uppercase shrink-0">Inputs</div>
            <div className="bg-background/50 rounded-lg p-2 flex-1 flex items-center justify-center border border-border/50 overflow-hidden relative">
               <div className="absolute inset-x-0 bottom-0 top-0 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center">
                  {game.renderInputSequence()}
               </div>
            </div>
          </Card>

          {game.gameMode !== "LEARNING" ? (
             <Card className="p-3 bg-card/50 backdrop-blur-sm border-border/50">
              <div className="text-[9px] font-bold mb-2 text-muted-foreground tracking-wider uppercase">Next</div>
              <div className="grid grid-cols-1 gap-1.5">
                {game.nextQueue.slice(0, 5).map((piece, i) => (
                  <div
                    key={i}
                    className="h-10 border border-border/40 bg-background/30 rounded-md flex items-center justify-center relative overflow-hidden"
                  >
                     <div className="absolute left-2 text-[8px] text-muted-foreground/30 font-mono">0{i+1}</div>
                     <div className="scale-75">
                      {game.renderPiecePreview(piece, true)}
                     </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <div className="flex-1 min-h-[200px]">
               <LearningProgress className="h-full" />
            </div>
          )}
        </div>

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
