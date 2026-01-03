"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { KeyboardRemapper } from "@/components/keyboard-remapper";
import { GameSettings } from "@/components/game-settings";
import { TetrisBoard } from "@/components/tetris-board";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Play, RotateCcw } from "lucide-react";
import { useState } from "react";

export default function Page() {
  const [showSettings, setShowSettings] = useState(false);
  const game = TetrisBoard();

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Scanlines effect */}
      <div className="scanlines fixed inset-0 z-50 pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <h1 className="text-4xl md:text-6xl font-bold font-[family-name:var(--font-display)] crt-effect glitch tracking-wider">
          FINESSE<span className="text-primary">.IO</span>
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-5 w-5" />
          </Button>
          <ThemeSwitcher />
        </div>
      </header>

      {showSettings ? (
        /* Settings View */
        <div className="max-w-4xl mx-auto space-y-6">
          <GameSettings />
          <KeyboardRemapper />
        </div>
      ) : (
        /* Game View */
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6">
          {/* Left Panel - Stats */}
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 font-[family-name:var(--font-display)]">
                STATISTICS
              </h2>
              <div className="space-y-3">
                <StatItem label="Mode" value="FREE PLAY" />
                <StatItem label="Top Combo" value={game.score.topCombo.toString()} highlight />
                <StatItem label="Current Combo" value={game.score.combo.toString()} />
                <StatItem label="Total Pieces" value={game.score.total.toString()} />
                <StatItem label="Finesse %" value={game.score.total > 0 ? ((game.score.correct / game.score.total) * 100).toFixed(1) : "0.0"} highlight />
                <StatItem label="KPP" value={game.score.kpp.toFixed(2)} />
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 font-[family-name:var(--font-display)]">
                HOLD
              </h2>
              <div className="aspect-square grid-container rounded-lg flex items-center justify-center">
                {game.holdPiece ? game.renderPiecePreview(game.holdPiece) : (
                  <div className="text-muted-foreground text-xs">EMPTY</div>
                )}
              </div>
            </Card>
          </div>

          {/* Center - Game Board */}
          <div className="flex flex-col items-center gap-4">
            <Card className="p-4">
              <div className="grid-container rounded-lg p-2">
                {game.renderGrid()}
              </div>

              {game.gameOver && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm rounded-lg">
                  <div className="text-center space-y-4">
                    <h2 className="text-4xl font-bold font-[family-name:var(--font-display)] crt-effect">
                      GAME OVER
                    </h2>
                    <p className="text-muted-foreground">Press START or SPACE to begin</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Controls */}
            <div className="flex gap-4">
              <Button size="lg" className="gap-2" onClick={game.startGame}>
                <Play className="h-5 w-5" />
                {game.gameOver ? 'START GAME' : 'RESTART'}
              </Button>
              <Button size="lg" variant="outline" className="gap-2" onClick={() => setShowSettings(!showSettings)}>
                <Settings className="h-5 w-5" />
                SETTINGS
              </Button>
            </div>
          </div>

          {/* Right Panel - Queue & Target */}
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 font-[family-name:var(--font-display)]">
                NEXT QUEUE
              </h2>
              <div className="space-y-3">
                {game.nextQueue.slice(0, 5).map((piece, i) => (
                  <div
                    key={i}
                    className="grid-container aspect-square rounded-lg flex items-center justify-center p-2"
                    style={{ opacity: 1 - i * 0.15 }}
                  >
                    {game.renderPiecePreview(piece, true)}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 font-[family-name:var(--font-display)]">
                TARGET
              </h2>
              <div className="grid-container aspect-square rounded-lg p-4">
                <div className="text-xs space-y-1 font-mono">
                  <div className="text-accent">→ DAS RIGHT</div>
                  <div className="text-accent">↻ ROTATE CW</div>
                  <div className="text-accent">⬇ HARD DROP</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-12 text-center text-xs text-muted-foreground space-y-2">
        <p>Practice Tetris finesse with real-time feedback</p>
        <p>Based on <a href="https://harddrop.com/wiki/Finesse" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">SRS Finesse Guidelines</a></p>
      </footer>
    </div>
  );
}

function StatItem({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <Badge
        variant={highlight ? "default" : "secondary"}
        className={`font-mono font-bold ${highlight ? 'stat-pulse' : ''}`}
      >
        {value}
      </Badge>
    </div>
  );
}
