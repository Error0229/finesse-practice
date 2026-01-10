"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

/**
 * Difficulty tiers
 */
export type DifficultyTier = 'CASUAL' | 'STANDARD' | 'HARDCORE' | 'INSANE';

/**
 * Player performance state
 */
export interface PerformanceState {
  // Recent performance window (last N attempts)
  recentAccuracy: number[];      // Last 20 accuracy values (0 or 1)
  recentResponseTimes: number[]; // Last 20 response times in ms

  // Calculated metrics
  currentAccuracy: number;       // Rolling average (0-1)
  averageResponseTime: number;   // Rolling average in ms
  consistencyScore: number;      // How consistent the player is (0-1)

  // Flow state detection
  isInFlow: boolean;             // Player is "in the zone"
  flowStreak: number;            // Consecutive patterns while in flow

  // Adaptive difficulty
  currentDifficulty: number;     // 0-100 scale
  difficultyTier: DifficultyTier;
  adaptiveSpeed: number;         // Pattern introduction speed multiplier

  // Pattern selection bias
  weakPatternBias: number;       // How much to focus on weak patterns (0-1)
  newPatternRate: number;        // Rate of introducing new patterns (0-1)
}

const DEFAULT_PERFORMANCE: PerformanceState = {
  recentAccuracy: [],
  recentResponseTimes: [],
  currentAccuracy: 0.5,
  averageResponseTime: 1000,
  consistencyScore: 0.5,
  isInFlow: false,
  flowStreak: 0,
  currentDifficulty: 50,
  difficultyTier: 'STANDARD',
  adaptiveSpeed: 1,
  weakPatternBias: 0.5,
  newPatternRate: 0.2,
};

/**
 * Difficulty tier thresholds and settings
 */
export const DIFFICULTY_TIERS: Record<DifficultyTier, {
  name: string;
  description: string;
  accuracyThreshold: number;      // Minimum accuracy to stay in tier
  timeThreshold: number;          // Maximum response time in ms
  weakPatternBias: number;        // Focus on weak patterns
  newPatternRate: number;         // Rate of new patterns
  perfectRequired: boolean;       // Only PERFECT judgments count
  color: string;
}> = {
  CASUAL: {
    name: 'Casual',
    description: 'Relaxed timing, generous scoring',
    accuracyThreshold: 0,
    timeThreshold: 3000,
    weakPatternBias: 0.3,
    newPatternRate: 0.3,
    perfectRequired: false,
    color: '#22c55e',
  },
  STANDARD: {
    name: 'Standard',
    description: 'Normal SM-2 progression',
    accuracyThreshold: 0.5,
    timeThreshold: 1500,
    weakPatternBias: 0.5,
    newPatternRate: 0.2,
    perfectRequired: false,
    color: '#3b82f6',
  },
  HARDCORE: {
    name: 'Hardcore',
    description: 'Strict timing, harder patterns first',
    accuracyThreshold: 0.75,
    timeThreshold: 800,
    weakPatternBias: 0.7,
    newPatternRate: 0.1,
    perfectRequired: false,
    color: '#f97316',
  },
  INSANE: {
    name: 'Insane',
    description: 'Perfect inputs only, speed required',
    accuracyThreshold: 0.9,
    timeThreshold: 400,
    weakPatternBias: 0.8,
    newPatternRate: 0.05,
    perfectRequired: true,
    color: '#ef4444',
  },
};

/**
 * Context interface
 */
export interface DifficultySystemContextType {
  state: PerformanceState;
  tierSettings: typeof DIFFICULTY_TIERS[DifficultyTier];

  // Record performance
  recordAttempt: (correct: boolean, responseTime: number) => void;

  // Manual tier override
  setDifficultyTier: (tier: DifficultyTier) => void;

  // Get pattern selection parameters
  getPatternSelectionParams: () => {
    weakPatternBias: number;
    newPatternRate: number;
    shouldIntroduceNew: boolean;
  };

  // Reset
  resetPerformance: () => void;
}

export const DifficultySystemContext = createContext<DifficultySystemContextType | null>(null);

/**
 * Hook to access difficulty system
 */
export function useDifficultySystem(): DifficultySystemContextType {
  const context = useContext(DifficultySystemContext);
  if (!context) {
    throw new Error('useDifficultySystem must be used within a DifficultySystemProvider');
  }
  return context;
}

/**
 * Calculate rolling average
 */
function rollingAverage(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Calculate consistency (inverse of standard deviation, normalized)
 */
function calculateConsistency(arr: number[]): number {
  if (arr.length < 3) return 0.5;

  const mean = rollingAverage(arr);
  const squaredDiffs = arr.map(x => Math.pow(x - mean, 2));
  const variance = rollingAverage(squaredDiffs);
  const stdDev = Math.sqrt(variance);

  // Normalize: lower stdDev = higher consistency
  // For response times, stdDev of 200ms is "average" consistency
  const normalizedConsistency = Math.max(0, Math.min(1, 1 - (stdDev / 500)));
  return normalizedConsistency;
}

/**
 * Detect flow state based on recent performance
 */
function detectFlowState(
  accuracy: number,
  consistency: number,
  avgTime: number,
  currentStreak: number
): boolean {
  // Flow state requirements:
  // - High accuracy (>80%)
  // - Good consistency (>60%)
  // - Fast response (<1000ms)
  // - At least 5 correct in a row
  return accuracy > 0.8 && consistency > 0.6 && avgTime < 1000 && currentStreak >= 5;
}

/**
 * Calculate adaptive difficulty (0-100)
 */
function calculateDifficulty(
  accuracy: number,
  avgTime: number,
  consistency: number
): number {
  // Base difficulty from accuracy (40% weight)
  const accuracyScore = accuracy * 40;

  // Speed score (30% weight) - faster = harder difficulty earned
  // 2000ms = 0, 500ms = 30
  const speedScore = Math.max(0, Math.min(30, (2000 - avgTime) / 50));

  // Consistency score (30% weight)
  const consistencyScore = consistency * 30;

  return Math.round(accuracyScore + speedScore + consistencyScore);
}

/**
 * Determine tier from difficulty score
 */
function getTierFromDifficulty(difficulty: number): DifficultyTier {
  if (difficulty >= 80) return 'INSANE';
  if (difficulty >= 60) return 'HARDCORE';
  if (difficulty >= 35) return 'STANDARD';
  return 'CASUAL';
}

/**
 * Provider props
 */
interface DifficultySystemProviderProps {
  children: React.ReactNode;
}

const WINDOW_SIZE = 20; // Rolling window for averages

/**
 * Difficulty System Provider
 */
export function DifficultySystemProvider({ children }: DifficultySystemProviderProps) {
  const [state, setState] = useState<PerformanceState>(DEFAULT_PERFORMANCE);
  const [manualTier, setManualTier] = useState<DifficultyTier | null>(null);

  // Get current tier settings
  const tierSettings = useMemo(() => {
    return DIFFICULTY_TIERS[manualTier || state.difficultyTier];
  }, [manualTier, state.difficultyTier]);

  /**
   * Record an attempt and update performance metrics
   */
  const recordAttempt = useCallback((correct: boolean, responseTime: number) => {
    setState(prev => {
      // Update rolling windows
      const newAccuracy = [...prev.recentAccuracy, correct ? 1 : 0].slice(-WINDOW_SIZE);
      const newTimes = [...prev.recentResponseTimes, responseTime].slice(-WINDOW_SIZE);

      // Calculate metrics
      const currentAccuracy = rollingAverage(newAccuracy);
      const averageResponseTime = rollingAverage(newTimes);
      const consistencyScore = calculateConsistency(newTimes);

      // Update flow state
      const newFlowStreak = correct ? prev.flowStreak + 1 : 0;
      const isInFlow = detectFlowState(
        currentAccuracy,
        consistencyScore,
        averageResponseTime,
        newFlowStreak
      );

      // Calculate adaptive difficulty
      const currentDifficulty = calculateDifficulty(
        currentAccuracy,
        averageResponseTime,
        consistencyScore
      );

      // Determine tier (unless manually overridden)
      const difficultyTier = manualTier || getTierFromDifficulty(currentDifficulty);
      const settings = DIFFICULTY_TIERS[difficultyTier];

      // Calculate adaptive parameters
      // If in flow, maintain momentum (don't introduce too many new patterns)
      // If struggling, focus more on weak patterns
      const flowMultiplier = isInFlow ? 0.7 : 1;
      const struggleMultiplier = currentAccuracy < 0.5 ? 1.3 : 1;

      const weakPatternBias = Math.min(1, settings.weakPatternBias * struggleMultiplier);
      const newPatternRate = settings.newPatternRate * flowMultiplier;
      const adaptiveSpeed = isInFlow ? 1.2 : (currentAccuracy < 0.5 ? 0.8 : 1);

      return {
        recentAccuracy: newAccuracy,
        recentResponseTimes: newTimes,
        currentAccuracy,
        averageResponseTime,
        consistencyScore,
        isInFlow,
        flowStreak: newFlowStreak,
        currentDifficulty,
        difficultyTier,
        adaptiveSpeed,
        weakPatternBias,
        newPatternRate,
      };
    });
  }, [manualTier]);

  /**
   * Manual tier override
   */
  const setDifficultyTier = useCallback((tier: DifficultyTier) => {
    setManualTier(tier);
    setState(prev => ({
      ...prev,
      difficultyTier: tier,
      ...DIFFICULTY_TIERS[tier],
    }));
  }, []);

  /**
   * Get pattern selection parameters
   */
  const getPatternSelectionParams = useCallback(() => {
    const shouldIntroduceNew = Math.random() < state.newPatternRate;
    return {
      weakPatternBias: state.weakPatternBias,
      newPatternRate: state.newPatternRate,
      shouldIntroduceNew,
    };
  }, [state.weakPatternBias, state.newPatternRate]);

  /**
   * Reset performance tracking
   */
  const resetPerformance = useCallback(() => {
    setManualTier(null);
    setState(DEFAULT_PERFORMANCE);
  }, []);

  const value: DifficultySystemContextType = {
    state,
    tierSettings,
    recordAttempt,
    setDifficultyTier,
    getPatternSelectionParams,
    resetPerformance,
  };

  return (
    <DifficultySystemContext.Provider value={value}>
      {children}
    </DifficultySystemContext.Provider>
  );
}
