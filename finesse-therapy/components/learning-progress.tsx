"use client";

import { useMemo } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useLearningProgress, MasteryGridData } from "@/hooks/use-learning-progress";
import { MASTERY_THRESHOLD } from "@/lib/sm2";
import { RotateCcw, TrendingUp, Target, Award } from "lucide-react";

// Piece display colors matching tetromino colors
const PIECE_COLORS: Record<string, string> = {
  Z: "bg-red-500",
  S: "bg-green-500",
  I: "bg-cyan-500",
  T: "bg-purple-500",
  O: "bg-yellow-500",
  L: "bg-orange-500",
  J: "bg-blue-500",
};

// Rotation labels
const ROTATION_LABELS: Record<number, string> = {
  0: "0°",
  1: "90°",
  2: "180°",
  3: "270°",
};

/**
 * Get color class based on accuracy
 * Red (not started/low) -> Yellow (medium) -> Green (high/mastered)
 */
function getAccuracyColor(accuracy: number, mastered: boolean): string {
  if (accuracy < 0) return "bg-muted"; // Not started
  if (mastered) return "bg-green-500";
  if (accuracy >= 0.8) return "bg-lime-400";
  if (accuracy >= 0.6) return "bg-yellow-400";
  if (accuracy >= 0.4) return "bg-orange-400";
  if (accuracy >= 0.2) return "bg-red-400";
  return "bg-red-600";
}

/**
 * Get opacity based on number of attempts
 * More attempts = more confident = more opaque
 */
function getAttemptOpacity(attempts: number): string {
  if (attempts === 0) return "opacity-30";
  if (attempts < 3) return "opacity-50";
  if (attempts < 5) return "opacity-70";
  if (attempts < 10) return "opacity-85";
  return "opacity-100";
}

interface LearningProgressProps {
  className?: string;
}

export function LearningProgress({ className }: LearningProgressProps) {
  const {
    progress,
    getMasteryGrid,
    getOverallStats,
    resetProgress,
  } = useLearningProgress();

  const masteryGrid = useMemo(() => getMasteryGrid(), [getMasteryGrid]);
  const stats = useMemo(() => getOverallStats(), [getOverallStats]);

  // Session stats from current session
  const sessionStats = {
    attempts: progress.currentSession.attempts,
    correct: progress.currentSession.correct,
    accuracy: progress.currentSession.attempts > 0
      ? (progress.currentSession.correct / progress.currentSession.attempts * 100).toFixed(1)
      : "0.0",
    patternsReviewed: progress.currentSession.patternsReviewed.size,
    newMastered: progress.currentSession.patternsMasteredThisSession,
  };

  return (
    <div className={className}>
      {/* Overall Stats Card */}
      <Card className="p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">PROGRESS</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetProgress}
            className="h-6 px-2"
            title="Reset all learning progress"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mastered:</span>
            <span className="font-mono font-bold text-green-500">
              {stats.masteredCount}/{stats.totalPatterns}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Accuracy:</span>
            <span className="font-mono font-bold text-primary">
              {(stats.overallAccuracy * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">In Progress:</span>
            <span className="font-mono font-bold text-yellow-500">
              {stats.inProgressCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Tries:</span>
            <span className="font-mono font-bold">
              {stats.totalAttempts}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
            style={{ width: `${(stats.masteredCount / stats.totalPatterns) * 100}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground text-center mt-1">
          {((stats.masteredCount / stats.totalPatterns) * 100).toFixed(0)}% Complete
        </div>
      </Card>

      {/* Session Stats */}
      <Card className="p-3 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold">THIS SESSION</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Attempts:</span>
            <span className="font-mono font-bold">{sessionStats.attempts}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Correct:</span>
            <span className="font-mono font-bold text-green-500">{sessionStats.correct}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Accuracy:</span>
            <span className="font-mono font-bold text-primary">{sessionStats.accuracy}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">New Mastered:</span>
            <span className="font-mono font-bold text-green-500">{sessionStats.newMastered}</span>
          </div>
        </div>
      </Card>

      {/* 3D Mastery Grid */}
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold">MASTERY GRID</span>
        </div>

        {/* Grid organized by piece type */}
        <div className="space-y-3">
          {masteryGrid.pieces.map((pieceData) => (
            <PieceMasteryGrid key={pieceData.piece} data={pieceData} />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t">
          <div className="text-xs text-muted-foreground mb-2">Legend:</div>
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted" />
              <span>Not started</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>&lt;40%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-400" />
              <span>40-80%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Mastered</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Session History */}
      {progress.sessionHistory.length > 0 && (
        <Card className="p-3 mt-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">HISTORY</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {progress.sessionHistory.slice(0, 10).map((session) => (
              <div
                key={session.timestamp}
                className="flex justify-between text-xs py-1 border-b border-border last:border-0"
              >
                <span className="text-muted-foreground">
                  {formatDate(session.timestamp)}
                </span>
                <span className="font-mono">
                  <span className={session.accuracy >= MASTERY_THRESHOLD ? "text-green-500" : "text-yellow-500"}>
                    {(session.accuracy * 100).toFixed(0)}%
                  </span>
                  <span className="text-muted-foreground mx-1">·</span>
                  {session.totalAttempts} tries
                  {session.newPatternsMastered > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                      +{session.newPatternsMastered}
                    </Badge>
                  )}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * Individual piece mastery grid component
 */
interface PieceMasteryGridProps {
  data: MasteryGridData['pieces'][0];
}

function PieceMasteryGrid({ data }: PieceMasteryGridProps) {
  return (
    <div className="space-y-1">
      {/* Piece header */}
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded ${PIECE_COLORS[data.piece]}`} />
        <span className="text-xs font-bold">{data.piece}</span>
        <span className="text-xs text-muted-foreground">
          ({data.rotations.reduce((sum, r) => sum + r.columns.length, 0)} patterns)
        </span>
      </div>

      {/* Rotation rows */}
      <div className="pl-6 space-y-1">
        {data.rotations.map((rotationData) => (
          <div key={rotationData.rotation} className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground w-8">
              {ROTATION_LABELS[rotationData.rotation] || `${rotationData.rotation}°`}
            </span>
            <div className="flex gap-0.5">
              {rotationData.columns.map((col) => (
                <div
                  key={`${rotationData.rotation}-${col.column}`}
                  className={`w-3 h-3 rounded-sm ${getAccuracyColor(col.accuracy, col.mastered)} ${getAttemptOpacity(col.attempts)} transition-all hover:scale-125`}
                  title={col.accuracy < 0
                    ? `Column ${col.column}: Not started`
                    : `Column ${col.column}: ${(col.accuracy * 100).toFixed(0)}% (${col.attempts} attempts)${col.mastered ? ' - MASTERED' : ''}`
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Format timestamp to relative or short date
 */
function formatDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  // Less than 1 hour
  if (diff < 60 * 60 * 1000) {
    const mins = Math.floor(diff / (60 * 1000));
    return `${mins}m ago`;
  }

  // Less than 24 hours
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours}h ago`;
  }

  // Format as date
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
