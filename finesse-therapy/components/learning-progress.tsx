"use client";

import { useMemo, useState } from "react";
import { useLearningProgress, MasteryGridData } from "@/hooks/use-learning-progress";
import { MASTERY_THRESHOLD } from "@/lib/sm2";
import { RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

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

/**
 * Get color based on mastery level
 */
function getMasteryColor(accuracy: number, mastered: boolean): string {
  if (accuracy < 0) return "rgba(255,255,255,0.05)"; // Not started
  if (mastered) return "#22c55e"; // Green - mastered
  if (accuracy >= 0.8) return "#84cc16"; // Lime
  if (accuracy >= 0.6) return "#eab308"; // Yellow
  if (accuracy >= 0.4) return "#f97316"; // Orange
  if (accuracy >= 0.2) return "#ef4444"; // Red
  return "#dc2626"; // Dark red
}

function getMasteryGlow(accuracy: number, mastered: boolean): string {
  if (accuracy < 0) return "none";
  if (mastered) return "0 0 6px #22c55e, 0 0 12px rgba(34,197,94,0.3)";
  if (accuracy >= 0.6) return `0 0 4px ${getMasteryColor(accuracy, mastered)}`;
  return "none";
}

interface LearningProgressProps {
  className?: string;
}

export function LearningProgress({ className }: LearningProgressProps) {
  const { progress, getMasteryGrid, getOverallStats, resetProgress } = useLearningProgress();
  const [expanded, setExpanded] = useState(false);
  const [hoveredPattern, setHoveredPattern] = useState<string | null>(null);

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
    <div className={`${className} font-mono text-xs`}>
      {/* Compact Header Stats */}
      <div className="bg-black/40 backdrop-blur border border-white/10 rounded-lg p-3 mb-2">
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-white/60">Learning</span>
          </div>
          <button
            onClick={resetProgress}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Reset progress"
          >
            <RotateCcw className="w-3 h-3 text-white/40 hover:text-white/80" />
          </button>
        </div>

        {/* Progress ring and stats */}
        <div className="flex items-center gap-3">
          {/* Circular progress */}
          <div className="relative w-14 h-14 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3"
              />
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${masteryPercent * 0.94} 100`}
                style={{ filter: "drop-shadow(0 0 4px rgba(34,197,94,0.5))" }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{Math.round(masteryPercent)}%</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="flex-1 space-y-1">
            <StatItem label="Mastered" value={stats.masteredCount} total={stats.totalPatterns} color="text-green-400" />
            <StatItem label="Learning" value={stats.inProgressCount} color="text-yellow-400" />
            <StatItem label="Session" value={sessionStats.correct} total={sessionStats.attempts} color="text-cyan-400" />
          </div>
        </div>
      </div>

      {/* 3D Isometric Visualization */}
      <div className="bg-black/40 backdrop-blur border border-white/10 rounded-lg p-3 mb-2">
        <div
          className="flex items-center justify-between cursor-pointer mb-2"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-[10px] uppercase tracking-widest text-white/60">Mastery Cube</span>
          {expanded ? (
            <ChevronUp className="w-3 h-3 text-white/40" />
          ) : (
            <ChevronDown className="w-3 h-3 text-white/40" />
          )}
        </div>

        {/* Isometric 3D Grid */}
        <div
          className="relative overflow-hidden transition-all duration-300"
          style={{ height: expanded ? "280px" : "140px" }}
        >
          <IsometricCube
            masteryGrid={masteryGrid}
            hoveredPattern={hoveredPattern}
            setHoveredPattern={setHoveredPattern}
            expanded={expanded}
          />
        </div>

        {/* Hover tooltip */}
        {hoveredPattern && (
          <div className="mt-2 px-2 py-1 bg-white/5 rounded text-[10px] text-white/70 text-center">
            {hoveredPattern}
          </div>
        )}
      </div>

      {/* Piece Legend - compact horizontal */}
      <div className="bg-black/40 backdrop-blur border border-white/10 rounded-lg p-2">
        <div className="flex justify-between items-center">
          {PIECES.map((piece) => {
            const pieceData = masteryGrid.pieces.find(p => p.piece === piece);
            const totalPatterns = pieceData?.rotations.reduce((sum, r) => sum + r.columns.length, 0) || 0;
            const masteredPatterns = pieceData?.rotations.reduce((sum, r) =>
              sum + r.columns.filter(c => c.mastered).length, 0) || 0;

            return (
              <div key={piece} className="flex flex-col items-center gap-0.5">
                <div
                  className="w-4 h-4 rounded-sm transition-all hover:scale-125"
                  style={{
                    backgroundColor: PIECE_COLORS[piece].base,
                    boxShadow: masteredPatterns === totalPatterns && totalPatterns > 0
                      ? PIECE_COLORS[piece].glow
                      : "none",
                    opacity: masteredPatterns > 0 ? 1 : 0.4
                  }}
                />
                <span className="text-[8px] text-white/50">{masteredPatterns}/{totalPatterns}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact stat item
 */
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
    <div className="flex justify-between items-center">
      <span className="text-white/40 text-[10px]">{label}</span>
      <span className={`${color} font-medium`}>
        {value}{total !== undefined && <span className="text-white/30">/{total}</span>}
      </span>
    </div>
  );
}

/**
 * Isometric 3D Cube Visualization
 * X-axis: Column (0-9)
 * Y-axis: Rotation (0-3)
 * Z-axis: Piece type (stacked layers)
 */
function IsometricCube({
  masteryGrid,
  hoveredPattern,
  setHoveredPattern,
  expanded
}: {
  masteryGrid: MasteryGridData;
  hoveredPattern: string | null;
  setHoveredPattern: (pattern: string | null) => void;
  expanded: boolean;
}) {
  // Isometric projection settings
  const cellSize = expanded ? 8 : 6;
  const layerGap = expanded ? 28 : 20;
  const offsetX = expanded ? 100 : 80;
  const offsetY = expanded ? 20 : 10;

  // Convert to isometric coordinates
  const toIso = (x: number, y: number, z: number) => {
    const isoX = (x - y) * cellSize * 0.866 + offsetX;
    const isoY = (x + y) * cellSize * 0.5 + z * layerGap + offsetY;
    return { x: isoX, y: isoY };
  };

  return (
    <svg
      className="w-full h-full"
      viewBox={expanded ? "0 0 200 280" : "0 0 180 140"}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Render each piece layer */}
      {PIECES.map((piece, pieceIndex) => {
        const pieceData = masteryGrid.pieces.find(p => p.piece === piece);
        if (!pieceData) return null;

        const z = PIECES.length - 1 - pieceIndex; // Reverse so Z is at bottom

        return (
          <g key={piece}>
            {/* Layer label */}
            <text
              x={toIso(-1.5, 0, z).x}
              y={toIso(-1.5, 0, z).y + 3}
              className="text-[8px] font-bold"
              fill={PIECE_COLORS[piece].base}
              style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.8))" }}
            >
              {piece}
            </text>

            {/* Render rotation × column grid for this piece */}
            {pieceData.rotations.map((rotData, rotIndex) => (
              <g key={rotIndex}>
                {rotData.columns.map((colData, colIndex) => {
                  const pos = toIso(colIndex, rotIndex, z);
                  const color = getMasteryColor(colData.accuracy, colData.mastered);
                  const glow = getMasteryGlow(colData.accuracy, colData.mastered);
                  const patternId = `${piece} R${rotData.rotation} C${colData.column}`;
                  const isHovered = hoveredPattern === patternId;

                  return (
                    <g
                      key={`${rotIndex}-${colIndex}`}
                      onMouseEnter={() => setHoveredPattern(patternId)}
                      onMouseLeave={() => setHoveredPattern(null)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Isometric cube cell */}
                      <IsometricCell
                        x={pos.x}
                        y={pos.y}
                        size={cellSize}
                        color={color}
                        glow={glow}
                        isHovered={isHovered}
                        opacity={colData.accuracy < 0 ? 0.15 : 0.9}
                      />
                    </g>
                  );
                })}
              </g>
            ))}
          </g>
        );
      })}

      {/* Axis labels */}
      <text x={offsetX + 40} y={expanded ? 270 : 135} className="text-[7px]" fill="rgba(255,255,255,0.3)">
        Col →
      </text>
      <text x={offsetX - 30} y={expanded ? 250 : 125} className="text-[7px]" fill="rgba(255,255,255,0.3)">
        ← Rot
      </text>
    </svg>
  );
}

/**
 * Single isometric cell (diamond shape)
 */
function IsometricCell({
  x, y, size, color, glow, isHovered, opacity
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  glow: string;
  isHovered: boolean;
  opacity: number;
}) {
  // Diamond points for isometric view
  const halfW = size * 0.866;
  const halfH = size * 0.5;

  const points = [
    `${x},${y - halfH}`,           // Top
    `${x + halfW},${y}`,           // Right
    `${x},${y + halfH}`,           // Bottom
    `${x - halfW},${y}`,           // Left
  ].join(" ");

  return (
    <polygon
      points={points}
      fill={color}
      opacity={isHovered ? 1 : opacity}
      stroke={isHovered ? "white" : "rgba(0,0,0,0.3)"}
      strokeWidth={isHovered ? 1 : 0.5}
      style={{
        filter: glow !== "none" || isHovered ? "url(#glow)" : "none",
        transition: "all 0.15s ease",
        transform: isHovered ? "scale(1.2)" : "scale(1)",
        transformOrigin: `${x}px ${y}px`,
      }}
    />
  );
}
