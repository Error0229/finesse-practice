"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { TetrominoType } from '@/lib/types';
import {
  SM2Card,
  SessionRecord,
  initCard,
  reviewCard,
  selectNextPattern,
  createPatternId,
  parsePatternId,
  calculateMasteryStats,
  getCardAccuracy,
  isCardMastered,
  createSessionRecord,
} from '@/lib/sm2';
import { FINESSE_TARGETS, PieceIndex, getOptimalMoves, FinesseMove } from '@/lib/finesse-data';

// Storage key for localStorage
export const LEARNING_STORAGE_KEY = 'finesse-learning-progress';

// Maximum session history entries
const MAX_SESSION_HISTORY = 100;

/**
 * Learning progress state
 */
export interface LearningProgress {
  cards: Record<string, SM2Card>;
  sessionHistory: SessionRecord[];
  globalRepetitionCount: number;
  lastMasteredReview: number;
  // Current session stats
  currentSession: {
    startTime: number;
    attempts: number;
    correct: number;
    patternsReviewed: Set<string>;
    patternsMasteredThisSession: number;
  };
}

/**
 * Default empty learning progress
 */
const DEFAULT_PROGRESS: LearningProgress = {
  cards: {},
  sessionHistory: [],
  globalRepetitionCount: 0,
  lastMasteredReview: 0,
  currentSession: {
    startTime: Date.now(),
    attempts: 0,
    correct: 0,
    patternsReviewed: new Set(),
    patternsMasteredThisSession: 0,
  },
};

/**
 * Piece index to type mapping
 */
const PIECE_INDEX_TO_TYPE: Record<PieceIndex, TetrominoType> = {
  0: 'Z',
  1: 'S',
  2: 'I',
  3: 'T',
  4: 'O',
  5: 'L',
  6: 'J',
};

const PIECE_TYPE_TO_INDEX: Record<TetrominoType, PieceIndex> = {
  'Z': 0,
  'S': 1,
  'I': 2,
  'T': 3,
  'O': 4,
  'L': 5,
  'J': 6,
};

/**
 * Generate all valid pattern IDs from FINESSE_TARGETS
 */
function getAllPatternIds(): string[] {
  const ids: string[] = [];

  for (const pieceIndexStr of Object.keys(FINESSE_TARGETS)) {
    const pieceIndex = parseInt(pieceIndexStr, 10) as PieceIndex;
    const pieceType = PIECE_INDEX_TO_TYPE[pieceIndex];
    const rotations = FINESSE_TARGETS[pieceIndex];

    for (let rotIndex = 0; rotIndex < rotations.length; rotIndex++) {
      const positions = rotations[rotIndex];
      for (let colIndex = 0; colIndex < positions.length; colIndex++) {
        const [column, rotation] = positions[colIndex];
        ids.push(createPatternId(pieceType, column, rotation));
      }
    }
  }

  return ids;
}

// Cache all pattern IDs
const ALL_PATTERN_IDS = getAllPatternIds();

/**
 * Serialize learning progress for localStorage
 * Note: Sets need to be converted to arrays for JSON
 */
function serializeProgress(progress: LearningProgress): string {
  return JSON.stringify({
    cards: progress.cards,
    sessionHistory: progress.sessionHistory,
    globalRepetitionCount: progress.globalRepetitionCount,
    lastMasteredReview: progress.lastMasteredReview,
    // Don't persist currentSession - it's session-specific
  });
}

/**
 * Deserialize learning progress from localStorage
 */
function deserializeProgress(data: string): Partial<LearningProgress> {
  try {
    const parsed = JSON.parse(data);
    return {
      cards: parsed.cards || {},
      sessionHistory: parsed.sessionHistory || [],
      globalRepetitionCount: parsed.globalRepetitionCount || 0,
      lastMasteredReview: parsed.lastMasteredReview || 0,
    };
  } catch {
    return {};
  }
}

/**
 * Load progress from localStorage
 */
function loadProgress(): LearningProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;

  const stored = localStorage.getItem(LEARNING_STORAGE_KEY);
  if (stored) {
    const parsed = deserializeProgress(stored);
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      currentSession: {
        startTime: Date.now(),
        attempts: 0,
        correct: 0,
        patternsReviewed: new Set(),
        patternsMasteredThisSession: 0,
      },
    };
  }
  return DEFAULT_PROGRESS;
}

/**
 * Context for learning progress
 */
export interface LearningProgressContextType {
  progress: LearningProgress;
  // Pattern selection for LEARNING mode
  selectNextLearningPattern: () => { piece: TetrominoType; column: number; rotation: number; moves: FinesseMove[][] } | null;
  // Record result after a drop
  recordResult: (piece: TetrominoType, column: number, rotation: number, correct: boolean) => void;
  // Get stats for a specific pattern
  getPatternStats: (patternId: string) => { accuracy: number; attempts: number; mastered: boolean } | null;
  // Get mastery grid data for visualization
  getMasteryGrid: () => MasteryGridData;
  // Get overall statistics
  getOverallStats: () => {
    masteredCount: number;
    inProgressCount: number;
    notStartedCount: number;
    overallAccuracy: number;
    totalAttempts: number;
    totalPatterns: number;
  };
  // Start a new session
  startNewSession: () => void;
  // End current session and save to history
  endSession: () => void;
  // Reset all learning progress
  resetProgress: () => void;
}

/**
 * Mastery grid data structure for visualization
 * Organized as: piece -> rotation -> column -> accuracy
 */
export interface MasteryGridData {
  pieces: {
    piece: TetrominoType;
    rotations: {
      rotation: number;
      columns: {
        column: number;
        accuracy: number;
        attempts: number;
        mastered: boolean;
      }[];
    }[];
  }[];
}

export const LearningProgressContext = createContext<LearningProgressContextType | null>(null);

/**
 * Hook to access learning progress
 */
export function useLearningProgress(): LearningProgressContextType {
  const context = useContext(LearningProgressContext);
  if (!context) {
    throw new Error('useLearningProgress must be used within a LearningProgressProvider');
  }
  return context;
}

/**
 * Provider component props
 */
interface LearningProgressProviderProps {
  children: React.ReactNode;
}

/**
 * Learning Progress Provider Component
 */
export function LearningProgressProvider({ children }: LearningProgressProviderProps) {
  const [progress, setProgress] = useState<LearningProgress>(loadProgress);
  const mountedRef = useRef(true);

  // Save to localStorage when progress changes (excluding currentSession)
  useEffect(() => {
    if (mountedRef.current) {
      localStorage.setItem(LEARNING_STORAGE_KEY, serializeProgress(progress));
    }
  }, [progress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Select next pattern to practice using SM-2
   */
  const selectNextLearningPattern = useCallback(() => {
    const patternId = selectNextPattern(
      progress.cards,
      ALL_PATTERN_IDS,
      progress.globalRepetitionCount,
      progress.lastMasteredReview
    );

    if (!patternId) return null;

    const { piece, column, rotation } = parsePatternId(patternId);
    const pieceIndex = PIECE_TYPE_TO_INDEX[piece];

    // Get the optimal moves for this pattern
    // We need to find the column index within the rotation array
    const rotations = FINESSE_TARGETS[pieceIndex];

    // Map actual rotation value to array index
    let arrayIndex = 0;
    if (rotations.length === 1) {
      arrayIndex = 0; // O piece
    } else if (rotations.length === 2) {
      // Z, S, I - rotation 0/2 -> index 0, rotation 1/3 -> index 1
      arrayIndex = rotation % 2;
    } else {
      // T, L, J - rotation directly maps
      arrayIndex = rotation;
    }

    // Find the column index in the positions array
    const positions = rotations[arrayIndex];
    let colIndex = 0;
    for (let i = 0; i < positions.length; i++) {
      if (positions[i][0] === column && positions[i][1] === rotation) {
        colIndex = i;
        break;
      }
    }

    const moves = getOptimalMoves(pieceIndex, colIndex, arrayIndex);

    return { piece, column, rotation, moves };
  }, [progress.cards, progress.globalRepetitionCount, progress.lastMasteredReview]);

  /**
   * Record result after a piece drop
   */
  const recordResult = useCallback((
    piece: TetrominoType,
    column: number,
    rotation: number,
    correct: boolean
  ) => {
    const patternId = createPatternId(piece, column, rotation);

    setProgress(prev => {
      // Get or create card
      let card = prev.cards[patternId];
      const wasMastered = card ? isCardMastered(card) : false;

      if (!card) {
        card = initCard(patternId, prev.globalRepetitionCount);
      }

      // Update card with review result
      const updatedCard = reviewCard(card, correct, prev.globalRepetitionCount);
      const isNowMastered = isCardMastered(updatedCard);

      // Update mastered review timestamp if we're reviewing a mastered pattern
      let newLastMasteredReview = prev.lastMasteredReview;
      if (wasMastered) {
        newLastMasteredReview = prev.globalRepetitionCount;
      }

      // Update current session
      const newPatternsReviewed = new Set(prev.currentSession.patternsReviewed);
      newPatternsReviewed.add(patternId);

      return {
        ...prev,
        cards: {
          ...prev.cards,
          [patternId]: updatedCard,
        },
        globalRepetitionCount: prev.globalRepetitionCount + 1,
        lastMasteredReview: newLastMasteredReview,
        currentSession: {
          ...prev.currentSession,
          attempts: prev.currentSession.attempts + 1,
          correct: prev.currentSession.correct + (correct ? 1 : 0),
          patternsReviewed: newPatternsReviewed,
          patternsMasteredThisSession: prev.currentSession.patternsMasteredThisSession +
            (!wasMastered && isNowMastered ? 1 : 0),
        },
      };
    });
  }, []);

  /**
   * Get stats for a specific pattern
   */
  const getPatternStats = useCallback((patternId: string) => {
    const card = progress.cards[patternId];
    if (!card) return null;

    return {
      accuracy: getCardAccuracy(card),
      attempts: card.successCount + card.failCount,
      mastered: isCardMastered(card),
    };
  }, [progress.cards]);

  /**
   * Get mastery grid data organized by piece type
   */
  const getMasteryGrid = useCallback((): MasteryGridData => {
    const pieces: MasteryGridData['pieces'] = [];

    for (const pieceIndexStr of Object.keys(FINESSE_TARGETS)) {
      const pieceIndex = parseInt(pieceIndexStr, 10) as PieceIndex;
      const pieceType = PIECE_INDEX_TO_TYPE[pieceIndex];
      const pieceRotations = FINESSE_TARGETS[pieceIndex];

      const rotations: MasteryGridData['pieces'][0]['rotations'] = [];

      for (let rotIndex = 0; rotIndex < pieceRotations.length; rotIndex++) {
        const positions = pieceRotations[rotIndex];
        const columns: MasteryGridData['pieces'][0]['rotations'][0]['columns'] = [];

        for (let colIndex = 0; colIndex < positions.length; colIndex++) {
          const [column, rotation] = positions[colIndex];
          const patternId = createPatternId(pieceType, column, rotation);
          const card = progress.cards[patternId];

          columns.push({
            column,
            accuracy: card ? getCardAccuracy(card) : -1, // -1 means not started
            attempts: card ? card.successCount + card.failCount : 0,
            mastered: card ? isCardMastered(card) : false,
          });
        }

        // Use the actual rotation value from the first position (they're all the same)
        const rotationValue = positions.length > 0 ? positions[0][1] : rotIndex;

        rotations.push({
          rotation: rotationValue,
          columns,
        });
      }

      pieces.push({
        piece: pieceType,
        rotations,
      });
    }

    return { pieces };
  }, [progress.cards]);

  /**
   * Get overall statistics
   */
  const getOverallStats = useCallback(() => {
    const stats = calculateMasteryStats(progress.cards, ALL_PATTERN_IDS.length);
    return {
      ...stats,
      totalPatterns: ALL_PATTERN_IDS.length,
    };
  }, [progress.cards]);

  /**
   * Start a new session
   */
  const startNewSession = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      currentSession: {
        startTime: Date.now(),
        attempts: 0,
        correct: 0,
        patternsReviewed: new Set(),
        patternsMasteredThisSession: 0,
      },
    }));
  }, []);

  /**
   * End current session and save to history
   */
  const endSession = useCallback(() => {
    setProgress(prev => {
      if (prev.currentSession.attempts === 0) {
        // Don't save empty sessions
        return prev;
      }

      const sessionRecord = createSessionRecord(
        prev.currentSession.attempts,
        prev.currentSession.correct,
        prev.currentSession.patternsReviewed.size,
        prev.currentSession.patternsMasteredThisSession
      );

      // Add to history, keeping only the most recent sessions
      const newHistory = [sessionRecord, ...prev.sessionHistory].slice(0, MAX_SESSION_HISTORY);

      return {
        ...prev,
        sessionHistory: newHistory,
        currentSession: {
          startTime: Date.now(),
          attempts: 0,
          correct: 0,
          patternsReviewed: new Set(),
          patternsMasteredThisSession: 0,
        },
      };
    });
  }, []);

  /**
   * Reset all learning progress
   */
  const resetProgress = useCallback(() => {
    setProgress({
      ...DEFAULT_PROGRESS,
      currentSession: {
        startTime: Date.now(),
        attempts: 0,
        correct: 0,
        patternsReviewed: new Set(),
        patternsMasteredThisSession: 0,
      },
    });
  }, []);

  const value: LearningProgressContextType = {
    progress,
    selectNextLearningPattern,
    recordResult,
    getPatternStats,
    getMasteryGrid,
    getOverallStats,
    startNewSession,
    endSession,
    resetProgress,
  };

  return (
    <LearningProgressContext.Provider value={value}>
      {children}
    </LearningProgressContext.Provider>
  );
}
