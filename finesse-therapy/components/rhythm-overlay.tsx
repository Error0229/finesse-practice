"use client";

import { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import { HitJudgment, JUDGMENT_COLORS, TIMING_BAR_MAX_TIME, useRhythmSystem } from '@/hooks/use-rhythm-system';

interface RhythmOverlayProps {
  targetX: number;  // Target piece X position in grid units
  targetY: number;  // Target piece Y position in grid units
  cellSize: number;
  active: boolean;
}

/**
 * Timing ring that shrinks around the target position
 * Uses direct DOM manipulation for smooth animation
 */
export function TimingRing({ targetX, targetY, cellSize, active }: RhythmOverlayProps) {
  const { state, getPatternStartTime } = useRhythmSystem();
  const { ringActive, patternStartTime } = state;
  const containerRef = useRef<HTMLDivElement>(null);
  const outerCircleRef = useRef<SVGCircleElement>(null);
  const innerCircleRef = useRef<SVGCircleElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Calculate center position (convert grid units to pixels)
  const centerX = (targetX + 2) * cellSize;
  const centerY = (targetY + 1) * cellSize;
  const maxRadius = cellSize * 4;
  const minRadius = cellSize * 1.5;

  // Animation loop - directly updates DOM
  useEffect(() => {
    if (!active || !ringActive) {
      return;
    }

    const getColor = (progress: number) => {
      if (progress < 0.2) return '#ffd700';  // PERFECT - gold
      if (progress < 0.4) return '#22c55e';  // GREAT - green
      if (progress < 0.75) return '#3b82f6'; // GOOD - blue
      return '#f97316';                      // TOO SLOW - orange
    };

    const animate = () => {
      const startTime = getPatternStartTime();
      if (startTime !== null && containerRef.current) {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / TIMING_BAR_MAX_TIME, 1);
        const currentRadius = maxRadius - (maxRadius - minRadius) * progress;
        const color = getColor(progress);
        const opacity = Math.max(0.3, 1 - progress * 0.5);

        containerRef.current.style.left = `${centerX - currentRadius}px`;
        containerRef.current.style.top = `${centerY - currentRadius}px`;
        containerRef.current.style.width = `${currentRadius * 2}px`;
        containerRef.current.style.height = `${currentRadius * 2}px`;

        if (outerCircleRef.current) {
          outerCircleRef.current.setAttribute('stroke', color);
          outerCircleRef.current.setAttribute('opacity', String(opacity));
        }
        if (innerCircleRef.current) {
          innerCircleRef.current.setAttribute('stroke', color);
          innerCircleRef.current.setAttribute('opacity', String(opacity * 0.7));
        }
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [active, ringActive, patternStartTime, getPatternStartTime, centerX, centerY, maxRadius, minRadius]);

  if (!active || !ringActive) return null;

  return (
    <div
      ref={containerRef}
      className="absolute pointer-events-none"
      style={{
        left: centerX - maxRadius,
        top: centerY - maxRadius,
        width: maxRadius * 2,
        height: maxRadius * 2,
      }}
    >
      <svg
        className="w-full h-full animate-pulse"
        viewBox="0 0 100 100"
      >
        <circle
          ref={outerCircleRef}
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#ffd700"
          strokeWidth="3"
          opacity="1"
          strokeDasharray="10 5"
          className="animate-spin"
          style={{ animationDuration: '3s' }}
        />
        <circle
          ref={innerCircleRef}
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke="#ffd700"
          strokeWidth="2"
          opacity="0.7"
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
  const [fading, setFading] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (lastJudgment && judgmentTimestamp) {
      setVisible(true);
      setFading(false);
      setAnimationKey(prev => prev + 1);

      // Start fadeout after display time
      const fadeTimer = setTimeout(() => {
        setFading(true);
      }, 600);

      // Hide completely after fadeout completes
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setFading(false);
      }, 900);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [lastJudgment, judgmentTimestamp]);

  if (!visible || !lastJudgment) return null;

  const color = JUDGMENT_COLORS[lastJudgment];
  // Display "TOO SLOW" with a space for readability
  const displayText = lastJudgment === 'TOO_SLOW' ? 'TOO SLOW' : lastJudgment;
  const scale = lastJudgment === 'PERFECT' ? 1.2 : lastJudgment === 'GREAT' ? 1.1 : 1;

  return (
    <div
      key={animationKey}
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20"
      style={{
        opacity: fading ? 0 : 1,
        transition: 'opacity 300ms ease-out',
      }}
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
        {displayText}!
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
    tooSlowCount,
    missCount,
    rhythmCombo,
    maxRhythmCombo,
    currentMultiplier,
    estimatedBPM,
  } = state;

  const totalJudgments = perfectCount + greatCount + goodCount + tooSlowCount + missCount;
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
        <JudgmentStat label="SLOW" count={tooSlowCount} color={JUDGMENT_COLORS.TOO_SLOW} />
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
 * Uses direct DOM manipulation for smooth 60fps animation
 */
export function TimingBar() {
  const { state } = useRhythmSystem();
  const { ringActive, patternStartTime } = state;
  const indicatorRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const localStartTimeRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);

  // Use layout effect to ensure DOM is ready before animation starts
  useLayoutEffect(() => {
    // Cancel any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isAnimatingRef.current = false;

    if (!ringActive) {
      // Reset indicator position when inactive
      if (indicatorRef.current) {
        indicatorRef.current.style.left = '0%';
      }
      return;
    }

    // Capture start time immediately when pattern becomes active
    localStartTimeRef.current = performance.now();

    // Reset to start position immediately
    if (indicatorRef.current) {
      indicatorRef.current.style.left = '0%';
    }

    isAnimatingRef.current = true;

    const animate = () => {
      if (!isAnimatingRef.current) return;

      if (indicatorRef.current) {
        const elapsed = performance.now() - localStartTimeRef.current;
        const progress = Math.min(elapsed / TIMING_BAR_MAX_TIME, 1);
        indicatorRef.current.style.left = `${progress * 100}%`;
      }

      if (isAnimatingRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    // Start animation on next frame
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      isAnimatingRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [ringActive, patternStartTime]);

  if (!ringActive) return null;

  // Zones - last zone is SLOW (timing expired) not MISS (wrong move)
  const zones = [
    { name: 'PERFECT', end: 0.2, color: JUDGMENT_COLORS.PERFECT },
    { name: 'GREAT', end: 0.4, color: JUDGMENT_COLORS.GREAT },
    { name: 'GOOD', end: 0.75, color: JUDGMENT_COLORS.GOOD },
    { name: 'SLOW', end: 1.0, color: JUDGMENT_COLORS.TOO_SLOW },
  ];

  return (
    <div className="relative h-3 bg-muted rounded-full overflow-hidden border">
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

      {/* Progress indicator - uses ref for direct DOM updates */}
      <div
        ref={indicatorRef}
        className="absolute top-0 bottom-0 w-1 bg-white"
        style={{
          left: '0%',
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
