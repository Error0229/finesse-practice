"use client";

import { useEffect, useState, useRef } from 'react';
import { HitJudgment, JUDGMENT_COLORS, useRhythmSystem } from '@/hooks/use-rhythm-system';

interface RhythmOverlayProps {
  targetX: number;  // Target piece X position in grid units
  targetY: number;  // Target piece Y position in grid units
  cellSize: number;
  active: boolean;
}

/**
 * Timing ring that shrinks around the target position
 */
export function TimingRing({ targetX, targetY, cellSize, active }: RhythmOverlayProps) {
  const { state } = useRhythmSystem();
  const { ringProgress, ringActive } = state;

  if (!active || !ringActive) return null;

  // Calculate center position (convert grid units to pixels)
  const centerX = (targetX + 2) * cellSize; // +2 to center on typical piece
  const centerY = (targetY + 1) * cellSize;

  // Ring starts large and shrinks
  const maxRadius = cellSize * 4;
  const minRadius = cellSize * 1.5;
  const currentRadius = maxRadius - (maxRadius - minRadius) * ringProgress;

  // Color changes based on progress
  const getColor = () => {
    if (ringProgress < 0.2) return '#ffd700'; // Gold - Perfect zone approaching
    if (ringProgress < 0.4) return '#22c55e'; // Green - Great zone
    if (ringProgress < 0.75) return '#3b82f6'; // Blue - Good zone
    return '#ef4444'; // Red - Miss zone
  };

  const opacity = Math.max(0.3, 1 - ringProgress * 0.5);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: centerX - currentRadius,
        top: centerY - currentRadius,
        width: currentRadius * 2,
        height: currentRadius * 2,
      }}
    >
      {/* Outer ring */}
      <svg
        className="w-full h-full animate-pulse"
        viewBox="0 0 100 100"
        style={{ filter: `drop-shadow(0 0 10px ${getColor()})` }}
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={getColor()}
          strokeWidth="3"
          opacity={opacity}
          strokeDasharray="10 5"
          className="animate-spin"
          style={{ animationDuration: '3s' }}
        />
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke={getColor()}
          strokeWidth="2"
          opacity={opacity * 0.7}
        />
      </svg>
    </div>
  );
}

/**
 * Hit judgment display with animation
 */
export function JudgmentDisplay() {
  const { state } = useRhythmSystem();
  const { lastJudgment, judgmentTimestamp, currentMultiplier, rhythmCombo } = state;
  const [visible, setVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (lastJudgment && judgmentTimestamp) {
      setVisible(true);
      setAnimationKey(prev => prev + 1);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [lastJudgment, judgmentTimestamp]);

  if (!visible || !lastJudgment) return null;

  const color = JUDGMENT_COLORS[lastJudgment];
  const scale = lastJudgment === 'PERFECT' ? 1.2 : lastJudgment === 'GREAT' ? 1.1 : 1;

  return (
    <div
      key={animationKey}
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20"
    >
      {/* Main judgment text */}
      <div
        className="font-black tracking-wider animate-judgment-pop"
        style={{
          color,
          fontSize: `${scale * 2.5}rem`,
          textShadow: `0 0 20px ${color}, 0 0 40px ${color}, 0 0 60px ${color}`,
          transform: `scale(${scale})`,
        }}
      >
        {lastJudgment}!
      </div>

      {/* Combo display */}
      {rhythmCombo > 1 && (
        <div
          className="font-bold text-lg mt-2 animate-fade-in"
          style={{
            color: '#fff',
            textShadow: '0 0 10px rgba(255,255,255,0.8)',
          }}
        >
          {rhythmCombo}x COMBO
        </div>
      )}

      {/* Multiplier display */}
      {currentMultiplier > 1 && (
        <div
          className="font-mono text-sm mt-1 animate-fade-in"
          style={{
            color: '#ffd700',
            textShadow: '0 0 5px rgba(255,215,0,0.8)',
          }}
        >
          {currentMultiplier}x MULTIPLIER
        </div>
      )}
    </div>
  );
}

/**
 * Rhythm stats panel
 */
export function RhythmStats() {
  const { state } = useRhythmSystem();
  const {
    totalScore,
    perfectCount,
    greatCount,
    goodCount,
    missCount,
    rhythmCombo,
    maxRhythmCombo,
    currentMultiplier,
    estimatedBPM,
  } = state;

  const totalJudgments = perfectCount + greatCount + goodCount + missCount;
  const accuracy = totalJudgments > 0
    ? ((perfectCount * 100 + greatCount * 75 + goodCount * 50) / (totalJudgments * 100) * 100)
    : 0;

  return (
    <div className="bg-black/60 backdrop-blur border border-white/10 rounded-lg p-3 font-mono text-xs">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
        <span className="text-[10px] uppercase tracking-widest text-white/60">Rhythm</span>
      </div>

      {/* Score display */}
      <div className="text-center mb-3">
        <div className="text-2xl font-black text-white" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>
          {totalScore.toLocaleString()}
        </div>
        <div className="text-[10px] text-white/40 uppercase tracking-wider">Score</div>
      </div>

      {/* Judgment counts */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <JudgmentStat label="PERFECT" count={perfectCount} color={JUDGMENT_COLORS.PERFECT} />
        <JudgmentStat label="GREAT" count={greatCount} color={JUDGMENT_COLORS.GREAT} />
        <JudgmentStat label="GOOD" count={goodCount} color={JUDGMENT_COLORS.GOOD} />
        <JudgmentStat label="MISS" count={missCount} color={JUDGMENT_COLORS.MISS} />
      </div>

      {/* Stats row */}
      <div className="space-y-1 border-t border-white/10 pt-2">
        <StatRow label="Accuracy" value={`${accuracy.toFixed(1)}%`} />
        <StatRow label="Combo" value={`${rhythmCombo}`} highlight={rhythmCombo > 0} />
        <StatRow label="Max Combo" value={`${maxRhythmCombo}`} />
        <StatRow label="Multiplier" value={`${currentMultiplier}x`} highlight={currentMultiplier > 1} />
        <StatRow label="BPM" value={`~${estimatedBPM}`} />
      </div>
    </div>
  );
}

function JudgmentStat({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
      />
      <span className="text-white/60 text-[10px]">{label}</span>
      <span className="ml-auto font-bold" style={{ color }}>{count}</span>
    </div>
  );
}

function StatRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/40">{label}</span>
      <span className={highlight ? 'text-yellow-400 font-bold' : 'text-white/80'}>{value}</span>
    </div>
  );
}

/**
 * Timing indicator bar (Guitar Hero style)
 */
export function TimingBar() {
  const { state } = useRhythmSystem();
  const { ringProgress, ringActive } = state;

  if (!ringActive) return null;

  // Zones
  const zones = [
    { name: 'PERFECT', end: 0.2, color: JUDGMENT_COLORS.PERFECT },
    { name: 'GREAT', end: 0.4, color: JUDGMENT_COLORS.GREAT },
    { name: 'GOOD', end: 0.75, color: JUDGMENT_COLORS.GOOD },
    { name: 'MISS', end: 1.0, color: JUDGMENT_COLORS.MISS },
  ];

  return (
    <div className="relative h-3 bg-black/40 rounded-full overflow-hidden border border-white/10">
      {/* Zone backgrounds */}
      {zones.map((zone, i) => {
        const start = i === 0 ? 0 : zones[i - 1].end;
        return (
          <div
            key={zone.name}
            className="absolute top-0 bottom-0"
            style={{
              left: `${start * 100}%`,
              width: `${(zone.end - start) * 100}%`,
              backgroundColor: zone.color,
              opacity: 0.3,
            }}
          />
        );
      })}

      {/* Progress indicator */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white transition-all duration-75"
        style={{
          left: `${ringProgress * 100}%`,
          boxShadow: '0 0 8px white, 0 0 16px white',
        }}
      />

      {/* Zone labels */}
      <div className="absolute inset-0 flex">
        {zones.map((zone, i) => {
          const start = i === 0 ? 0 : zones[i - 1].end;
          const width = zone.end - start;
          return (
            <div
              key={zone.name}
              className="flex items-center justify-center text-[8px] font-bold text-black/60"
              style={{ width: `${width * 100}%` }}
            >
              {zone.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
