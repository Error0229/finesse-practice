"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hit judgment types - from best to worst
 */
export type HitJudgment = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

/**
 * Timing thresholds in milliseconds
 */
const TIMING_THRESHOLDS = {
  PERFECT: 400,   // Under 0.4s = Perfect
  GREAT: 800,     // Under 0.8s = Great
  GOOD: 1500,     // Under 1.5s = Good
  // Above 1.5s = Miss (timeout) or wrong input
};

/**
 * Points awarded for each judgment
 */
export const JUDGMENT_POINTS: Record<HitJudgment, number> = {
  PERFECT: 100,
  GREAT: 75,
  GOOD: 50,
  MISS: 0,
};

/**
 * Judgment colors for visual feedback
 */
export const JUDGMENT_COLORS: Record<HitJudgment, string> = {
  PERFECT: '#ffd700',  // Gold
  GREAT: '#22c55e',    // Green
  GOOD: '#3b82f6',     // Blue
  MISS: '#ef4444',     // Red
};

/**
 * Max time for timing bar animation
 */
export const TIMING_BAR_MAX_TIME = TIMING_THRESHOLDS.GOOD + 500;

/**
 * Rhythm state for the current pattern
 */
export interface RhythmState {
  // Timing
  patternStartTime: number | null;

  // Judgments
  lastJudgment: HitJudgment | null;
  judgmentTimestamp: number | null;

  // Stats
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  totalScore: number;

  // Combo & multiplier
  rhythmCombo: number;
  maxRhythmCombo: number;
  currentMultiplier: number;

  // BPM tracking
  recentHitTimes: number[];
  estimatedBPM: number;

  // Ring animation - only tracks active state, progress is calculated on demand
  ringActive: boolean;
}

const DEFAULT_RHYTHM_STATE: RhythmState = {
  patternStartTime: null,
  lastJudgment: null,
  judgmentTimestamp: null,
  perfectCount: 0,
  greatCount: 0,
  goodCount: 0,
  missCount: 0,
  totalScore: 0,
  rhythmCombo: 0,
  maxRhythmCombo: 0,
  currentMultiplier: 1,
  recentHitTimes: [],
  estimatedBPM: 120,
  ringActive: false,
};

/**
 * Rhythm system context
 */
export interface RhythmSystemContextType {
  state: RhythmState;

  // Core methods
  startPattern: () => void;
  recordHit: (correct: boolean) => HitJudgment;
  resetRhythm: () => void;

  // Get timing info
  getCurrentTiming: () => number;
  getJudgmentForTime: (ms: number, correct: boolean) => HitJudgment;

  // Ring animation - get start time for components to calculate their own progress
  getPatternStartTime: () => number | null;
}

export const RhythmSystemContext = createContext<RhythmSystemContextType | null>(null);

/**
 * Hook to access rhythm system
 */
export function useRhythmSystem(): RhythmSystemContextType {
  const context = useContext(RhythmSystemContext);
  if (!context) {
    throw new Error('useRhythmSystem must be used within a RhythmSystemProvider');
  }
  return context;
}

/**
 * Calculate multiplier based on combo
 */
function getMultiplierForCombo(combo: number): number {
  if (combo >= 50) return 5;
  if (combo >= 30) return 4;
  if (combo >= 20) return 3;
  if (combo >= 10) return 2;
  if (combo >= 5) return 1.5;
  return 1;
}

/**
 * Estimate BPM from recent hit times
 */
function estimateBPM(hitTimes: number[]): number {
  if (hitTimes.length < 3) return 120;

  // Calculate intervals between hits
  const intervals: number[] = [];
  for (let i = 1; i < hitTimes.length; i++) {
    intervals.push(hitTimes[i] - hitTimes[i - 1]);
  }

  // Average interval
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

  // Convert to BPM (60000ms / interval)
  const bpm = Math.round(60000 / avgInterval);

  // Clamp to reasonable range
  return Math.max(60, Math.min(300, bpm));
}

/**
 * Provider props
 */
interface RhythmSystemProviderProps {
  children: React.ReactNode;
}

/**
 * Rhythm System Provider
 */
export function RhythmSystemProvider({ children }: RhythmSystemProviderProps) {
  const [state, setState] = useState<RhythmState>(DEFAULT_RHYTHM_STATE);
  const startTimeRef = useRef<number | null>(null);

  /**
   * Start timing for a new pattern
   */
  const startPattern = useCallback(() => {
    const now = performance.now();
    startTimeRef.current = now;
    setState(prev => ({
      ...prev,
      patternStartTime: now,
      ringActive: true,
      lastJudgment: null,
    }));
  }, []);

  /**
   * Get judgment based on timing and correctness
   */
  const getJudgmentForTime = useCallback((ms: number, correct: boolean): HitJudgment => {
    if (!correct) return 'MISS';
    if (ms <= TIMING_THRESHOLDS.PERFECT) return 'PERFECT';
    if (ms <= TIMING_THRESHOLDS.GREAT) return 'GREAT';
    if (ms <= TIMING_THRESHOLDS.GOOD) return 'GOOD';
    return 'MISS';
  }, []);

  /**
   * Record a hit and return the judgment
   */
  const recordHit = useCallback((correct: boolean): HitJudgment => {
    const now = performance.now();
    const elapsed = startTimeRef.current !== null
      ? now - startTimeRef.current
      : TIMING_THRESHOLDS.GOOD + 1;

    const judgment = getJudgmentForTime(elapsed, correct);
    const points = JUDGMENT_POINTS[judgment];

    setState(prev => {
      const newCombo = judgment !== 'MISS' ? prev.rhythmCombo + 1 : 0;
      const multiplier = getMultiplierForCombo(newCombo);
      const earnedPoints = Math.floor(points * multiplier);

      // Update recent hit times for BPM calculation
      const newHitTimes = [...prev.recentHitTimes, now].slice(-10);
      const newBPM = estimateBPM(newHitTimes);

      return {
        ...prev,
        lastJudgment: judgment,
        judgmentTimestamp: now,
        perfectCount: prev.perfectCount + (judgment === 'PERFECT' ? 1 : 0),
        greatCount: prev.greatCount + (judgment === 'GREAT' ? 1 : 0),
        goodCount: prev.goodCount + (judgment === 'GOOD' ? 1 : 0),
        missCount: prev.missCount + (judgment === 'MISS' ? 1 : 0),
        totalScore: prev.totalScore + earnedPoints,
        rhythmCombo: newCombo,
        maxRhythmCombo: Math.max(prev.maxRhythmCombo, newCombo),
        currentMultiplier: multiplier,
        recentHitTimes: newHitTimes,
        estimatedBPM: newBPM,
        ringActive: false,
      };
    });

    // Reset start time for next pattern
    startTimeRef.current = null;

    return judgment;
  }, [getJudgmentForTime]);

  /**
   * Get current timing in ms
   */
  const getCurrentTiming = useCallback((): number => {
    if (startTimeRef.current === null) return 0;
    return performance.now() - startTimeRef.current;
  }, []);

  /**
   * Get pattern start time for components to calculate their own animation progress
   */
  const getPatternStartTime = useCallback((): number | null => {
    return startTimeRef.current;
  }, []);

  /**
   * Reset all rhythm stats
   */
  const resetRhythm = useCallback(() => {
    startTimeRef.current = null;
    setState(DEFAULT_RHYTHM_STATE);
  }, []);

  const value: RhythmSystemContextType = {
    state,
    startPattern,
    recordHit,
    resetRhythm,
    getCurrentTiming,
    getJudgmentForTime,
    getPatternStartTime,
  };

  return (
    <RhythmSystemContext.Provider value={value}>
      {children}
    </RhythmSystemContext.Provider>
  );
}
