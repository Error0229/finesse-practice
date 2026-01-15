"use client";

import { useMemo } from "react";
import { useLearningProgress, MasteryGridData } from "@/hooks/use-learning-progress";
import { RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";

// Piece colors matching tetromino theme
const PIECE_COLORS: Record<string, { base: string; glow: string }> = {
  Z: { base: "#ef4444", glow: "0 0 8px #ef4444" },
  S: { base: "#22c55e", glow: "0 0 8px #22c55e" },
  I: { base: "#06b6d4", glow: "0 0 8px #06b6d4" },
  T: { base: "#a855f7", glow: "0 0 8px #a855f7" },
  O: { base: "#eab308", glow: "0 0 8px #eab308" },
  L: { base: "#f97316", glow: "0 0 8px #f97316" },
  J: { base: "#3b82f6", glow: "0 0 8px #3b82f6" },
};

const PIECES = ["Z", "S", "I", "T", "O", "L", "J"] as const;


interface LearningProgressProps {
  className?: string;
}

export function LearningProgress({ className }: LearningProgressProps) {
  const { progress, getMasteryGrid, getOverallStats, resetProgress } = useLearningProgress();

  const masteryGrid = useMemo(() => getMasteryGrid(), [getMasteryGrid]);
  const stats = useMemo(() => getOverallStats(), [getOverallStats]);

  const sessionStats = {
    attempts: progress.currentSession.attempts,
    correct: progress.currentSession.correct,
    accuracy: progress.currentSession.attempts > 0
      ? (progress.currentSession.correct / progress.currentSession.attempts * 100)
      : 0,
  };

  const masteryPercent = (stats.masteredCount / stats.totalPatterns) * 100;

  return (
    <div className={`${className} flex flex-col gap-4 font-mono text-xs h-full`}>
      {/* Header Stats */}
      <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            <span className="text-xs font-bold uppercase tracking-widest text-foreground">MASTERY PROGRESS</span>
          </div>
          <button
            onClick={resetProgress}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-muted-foreground hover:text-white"
            title="Reset progress"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Circular progress */}
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                className="stroke-muted/30"
                strokeWidth="2.5"
              />
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${masteryPercent * 0.94} 100`}
                style={{ filter: "drop-shadow(0 0 6px rgba(34,197,94,0.4))" }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-sm font-bold text-foreground">{Math.round(masteryPercent)}%</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
            <StatItem label="Mastered" value={stats.masteredCount} total={stats.totalPatterns} color="text-green-400" />
            <StatItem label="Learning" value={stats.inProgressCount} color="text-yellow-400" />
            <StatItem label="Session" value={sessionStats.correct} total={sessionStats.attempts} color="text-cyan-400" />
            <StatItem label="Accuracy" value={`${sessionStats.accuracy.toFixed(0)}%`} color={sessionStats.accuracy > 80 ? "text-green-400" : "text-orange-400"} />
          </div>
        </div>
      </Card>


      {/* Legend */}
      <div className="grid grid-cols-7 gap-1">
          {PIECES.map((piece) => {
            const pieceData = masteryGrid.pieces.find(p => p.piece === piece);
            const totalPatterns = pieceData?.rotations.reduce((sum, r) => sum + r.columns.length, 0) || 0;
            const masteredPatterns = pieceData?.rotations.reduce((sum, r) =>
              sum + r.columns.filter(c => c.mastered).length, 0) || 0;
            
            const isComplete = masteredPatterns === totalPatterns && totalPatterns > 0;

            return (
              <div key={piece} className={`
                flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all duration-300
                ${isComplete ? 'bg-primary/10 border-primary/30' : 'bg-card/30 border-transparent'}
              `}>
                <div
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    backgroundColor: PIECE_COLORS[piece].base,
                    boxShadow: isComplete ? PIECE_COLORS[piece].glow : "none",
                  }}
                />
                <span className={`text-[9px] font-bold ${isComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {masteredPatterns}/{totalPatterns}
                </span>
              </div>
            );
          })}
        </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  total,
  color
}: {
  label: string;
  value: number | string;
  total?: number;
  color: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-[9px] uppercase tracking-wider">{label}</span>
      <span className={`${color} font-mono font-bold text-sm tracking-tight`}>
        {value}{total !== undefined && <span className="text-muted-foreground/40 text-xs">/{total}</span>}
      </span>
    </div>
  );
}

