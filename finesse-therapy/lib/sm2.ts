/**
 * SM-2 Spaced Repetition Algorithm Implementation
 *
 * Based on the SuperMemo SM-2 algorithm for optimal learning intervals.
 * Adapted for finesse pattern training.
 */

import type { TetrominoType } from './types';

/**
 * Represents a single pattern's learning state
 */
export interface SM2Card {
  patternId: string;           // Format: "Z_0_0" (piece_column_rotation)
  easiness: number;            // Easiness factor (minimum 1.3, starts at 2.5)
  interval: number;            // Repetitions until next review
  repetitions: number;         // Consecutive correct reviews
  successCount: number;        // Total correct attempts
  failCount: number;           // Total incorrect attempts
  lastReviewed: number;        // Timestamp of last review
  nextReviewAt: number;        // Scheduled next review (in repetition count)
}

/**
 * Session record for history tracking
 */
export interface SessionRecord {
  timestamp: number;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  patternsReviewed: number;
  newPatternsMastered: number;
}

/**
 * Quality rating for SM-2 algorithm
 * 0 = Complete failure
 * 3 = Correct but difficult
 * 5 = Perfect recall
 */
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

// Default easiness factor for new cards
const DEFAULT_EASINESS = 2.5;
// Minimum easiness factor
const MIN_EASINESS = 1.3;
// Initial interval for new cards (in repetitions)
const INITIAL_INTERVAL = 1;
// Mastery threshold (accuracy percentage)
export const MASTERY_THRESHOLD = 0.90;
// Minimum attempts before a pattern can be considered mastered
export const MIN_ATTEMPTS_FOR_MASTERY = 5;
// Review interval range for mastered patterns (in repetitions)
export const MASTERED_REVIEW_MIN = 10;
export const MASTERED_REVIEW_MAX = 20;

/**
 * Create a pattern ID from piece type, column, and rotation
 */
export function createPatternId(piece: TetrominoType, column: number, rotation: number): string {
  return `${piece}_${column}_${rotation}`;
}

/**
 * Parse a pattern ID back to its components
 */
export function parsePatternId(id: string): { piece: TetrominoType; column: number; rotation: number } {
  const [piece, col, rot] = id.split('_');
  return {
    piece: piece as TetrominoType,
    column: parseInt(col, 10),
    rotation: parseInt(rot, 10),
  };
}

/**
 * Initialize a new SM-2 card for a pattern
 */
export function initCard(patternId: string, globalRepetitionCount: number = 0): SM2Card {
  return {
    patternId,
    easiness: DEFAULT_EASINESS,
    interval: INITIAL_INTERVAL,
    repetitions: 0,
    successCount: 0,
    failCount: 0,
    lastReviewed: Date.now(),
    nextReviewAt: globalRepetitionCount + INITIAL_INTERVAL,
  };
}

/**
 * Convert correct/incorrect to SM-2 quality rating
 * - correct: Quality 4 (good)
 * - incorrect: Quality 0 (complete failure)
 */
export function getQuality(correct: boolean): Quality {
  return correct ? 4 : 0;
}

/**
 * Calculate new easiness factor based on quality
 * Modified to be more forgiving - failures reduce easiness less harshly
 * Original: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 */
function calculateNewEasiness(currentEasiness: number, quality: Quality): number {
  if (quality < 3) {
    // Failure: reduce easiness gently (only 0.1 reduction instead of ~0.8)
    return Math.max(MIN_EASINESS, currentEasiness - 0.1);
  }
  // Success: use standard SM-2 formula
  const newEasiness = currentEasiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  return Math.max(MIN_EASINESS, newEasiness);
}

/**
 * Calculate next interval based on current state and quality
 */
function calculateNextInterval(card: SM2Card, quality: Quality): number {
  if (quality < 3) {
    // Failed review - reset interval
    return INITIAL_INTERVAL;
  }

  if (card.repetitions === 0) {
    return 1;
  } else if (card.repetitions === 1) {
    return 6;
  } else {
    return Math.round(card.interval * card.easiness);
  }
}

/**
 * Review a card and update its SM-2 state
 * Modified to be more forgiving - failures don't completely reset progress
 */
export function reviewCard(
  card: SM2Card,
  correct: boolean,
  globalRepetitionCount: number
): SM2Card {
  const quality = getQuality(correct);
  const newEasiness = calculateNewEasiness(card.easiness, quality);

  let newRepetitions: number;
  let newInterval: number;

  if (quality < 3) {
    // Failed - but don't completely reset progress (keep at least half of repetitions)
    // This encourages continued learning without being too punishing
    newRepetitions = Math.max(0, Math.floor(card.repetitions / 2));
    // Reduce interval but don't reset completely - use at least 2 for reviewed patterns
    newInterval = Math.max(2, Math.floor(card.interval / 2));
  } else {
    // Passed - increment repetitions
    newRepetitions = card.repetitions + 1;
    newInterval = calculateNextInterval(card, quality);
  }

  return {
    ...card,
    easiness: newEasiness,
    interval: newInterval,
    repetitions: newRepetitions,
    successCount: correct ? card.successCount + 1 : card.successCount,
    failCount: correct ? card.failCount : card.failCount + 1,
    lastReviewed: Date.now(),
    nextReviewAt: globalRepetitionCount + newInterval,
  };
}

/**
 * Get the accuracy of a card (0-1)
 */
export function getCardAccuracy(card: SM2Card): number {
  const total = card.successCount + card.failCount;
  if (total === 0) return 0;
  return card.successCount / total;
}

/**
 * Check if a card is considered "mastered"
 */
export function isCardMastered(card: SM2Card): boolean {
  const total = card.successCount + card.failCount;
  if (total < MIN_ATTEMPTS_FOR_MASTERY) return false;
  return getCardAccuracy(card) >= MASTERY_THRESHOLD;
}

/**
 * Get cards that are due for review
 */
export function getDueCards(
  cards: Record<string, SM2Card>,
  globalRepetitionCount: number
): SM2Card[] {
  return Object.values(cards).filter(card => card.nextReviewAt <= globalRepetitionCount);
}

/**
 * Get all unmastered cards
 */
export function getUnmasteredCards(cards: Record<string, SM2Card>): SM2Card[] {
  return Object.values(cards).filter(card => !isCardMastered(card));
}

/**
 * Get all mastered cards
 */
export function getMasteredCards(cards: Record<string, SM2Card>): SM2Card[] {
  return Object.values(cards).filter(card => isCardMastered(card));
}

/**
 * Select the next pattern to practice using SM-2 scheduling
 *
 * Priority (optimized for expanding capability first):
 * 1. Unreviewed patterns (introduce new patterns to expand capability)
 * 2. Due cards that need reinforcement
 * 3. Unmastered cards (continue learning in-progress patterns)
 * 4. Mastered cards due for review (10-20 interval)
 */
export function selectNextPattern(
  cards: Record<string, SM2Card>,
  allPatternIds: string[],
  globalRepetitionCount: number,
  lastMasteredReview: number
): string | null {
  // 1. PRIORITY: Introduce new patterns first (expand capability)
  const reviewedPatternIds = new Set(Object.keys(cards));
  const unreviewed = allPatternIds.filter(id => !reviewedPatternIds.has(id));
  if (unreviewed.length > 0) {
    // Introduce one new pattern at a time (random selection for variety)
    return unreviewed[Math.floor(Math.random() * unreviewed.length)];
  }

  // 2. Check for due cards that need reinforcement
  const dueCards = getDueCards(cards, globalRepetitionCount);
  if (dueCards.length > 0) {
    // Sort by number of attempts (fewer first) to balance exposure
    // Then by accuracy (lower first) as secondary sort
    dueCards.sort((a, b) => {
      const attemptsA = a.successCount + a.failCount;
      const attemptsB = b.successCount + b.failCount;
      if (attemptsA !== attemptsB) return attemptsA - attemptsB;
      return getCardAccuracy(a) - getCardAccuracy(b);
    });
    return dueCards[0].patternId;
  }

  // 3. Continue with unmastered cards (in-progress patterns)
  const unmastered = getUnmasteredCards(cards);
  if (unmastered.length > 0) {
    // Sort by attempts (fewer first) to ensure all patterns get exposure
    unmastered.sort((a, b) => {
      const attemptsA = a.successCount + a.failCount;
      const attemptsB = b.successCount + b.failCount;
      if (attemptsA !== attemptsB) return attemptsA - attemptsB;
      return getCardAccuracy(a) - getCardAccuracy(b);
    });
    return unmastered[0].patternId;
  }

  // 4. All patterns mastered - review mastered at intervals
  const mastered = getMasteredCards(cards);
  if (mastered.length > 0) {
    const reviewInterval = MASTERED_REVIEW_MIN + Math.floor(Math.random() * (MASTERED_REVIEW_MAX - MASTERED_REVIEW_MIN));
    if (globalRepetitionCount - lastMasteredReview >= reviewInterval) {
      // Select random mastered pattern for review
      return mastered[Math.floor(Math.random() * mastered.length)].patternId;
    }
  }

  // Fallback: random pattern
  if (allPatternIds.length > 0) {
    return allPatternIds[Math.floor(Math.random() * allPatternIds.length)];
  }

  return null;
}

/**
 * Calculate overall mastery statistics
 */
export function calculateMasteryStats(cards: Record<string, SM2Card>, totalPatterns: number): {
  masteredCount: number;
  inProgressCount: number;
  notStartedCount: number;
  overallAccuracy: number;
  totalAttempts: number;
} {
  const cardList = Object.values(cards);
  const masteredCount = cardList.filter(isCardMastered).length;
  const inProgressCount = cardList.length - masteredCount;
  const notStartedCount = totalPatterns - cardList.length;

  let totalSuccess = 0;
  let totalFail = 0;
  cardList.forEach(card => {
    totalSuccess += card.successCount;
    totalFail += card.failCount;
  });

  const totalAttempts = totalSuccess + totalFail;
  const overallAccuracy = totalAttempts > 0 ? totalSuccess / totalAttempts : 0;

  return {
    masteredCount,
    inProgressCount,
    notStartedCount,
    overallAccuracy,
    totalAttempts,
  };
}

/**
 * Create a session record
 */
export function createSessionRecord(
  totalAttempts: number,
  correctAttempts: number,
  patternsReviewed: number,
  newPatternsMastered: number
): SessionRecord {
  return {
    timestamp: Date.now(),
    totalAttempts,
    correctAttempts,
    accuracy: totalAttempts > 0 ? correctAttempts / totalAttempts : 0,
    patternsReviewed,
    newPatternsMastered,
  };
}
