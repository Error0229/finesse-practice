"use client";

import { useTetrisGame, GameMode } from "@/hooks/use-tetris-game";
import { useKeyBindings } from "@/hooks/use-key-bindings";
import { useGameSettings } from "@/hooks/use-game-settings";
import { useRhythmSystem, HitJudgment, TIMING_THRESHOLDS } from "@/hooks/use-rhythm-system";
import { useDifficultySystem } from "@/hooks/use-difficulty-system";
import { useVisualEffects } from "@/hooks/use-visual-effects";
import { TETROMINO_SHAPES, TetrominoType } from "@/lib/types";
import { MOVE_NAMES, FinesseMove } from "@/lib/finesse-data";
import { TetrisCanvas } from "@/components/tetris-canvas";
import { JudgmentDisplay, TimingBar, RhythmStats } from "@/components/rhythm-overlay";
import { DifficultyStats, DifficultyIndicator, FlowIndicator } from "@/components/difficulty-display";
import { VisualEffectsLayer, ParticleRenderer } from "@/components/visual-effects";
import { useEffect, useRef, useCallback } from "react";

const MODE_NAMES: Record<GameMode, string> = {
  'RANDOM': 'All Random',
  'Z_ONLY': 'Z Only',
  'S_ONLY': 'S Only',
  'I_ONLY': 'I Only',
  'T_ONLY': 'T Only',
  'O_ONLY': 'O Only',
  'L_ONLY': 'L Only',
  'J_ONLY': 'J Only',
  'FREE_STACK': 'Free Stack',
  'LEARNING': 'Learning Mode',
};

export function TetrisBoard() {
  const game = useTetrisGame();
  const { grid, currentPiece, currentPieceRef, nextQueue, holdPiece, canHold, score, gameOver, gameMode, target, currentMoves, startGame, handleAction, getTargetPiece, validateCurrentPlacement, resetPiece } = game;
  const { getAction } = useKeyBindings();
  const { settings } = useGameSettings();
  const rhythm = useRhythmSystem();
  const { startPattern, recordHit, resetRhythm, getCurrentTiming, pauseTimer, resumeTimer } = rhythm;
  const difficulty = useDifficultySystem();
  const visualEffects = useVisualEffects();

  // Track piece changes to start rhythm timing
  const lastDropTimeRef = useRef(0);
  const comboBeforeDropRef = useRef(0);
  const currentScoreRef = useRef(score);
  const gameStartedRef = useRef(false);

  // Start rhythm timing only on game start (first piece)
  // Subsequent pieces start timing after recordHit in handleActionWithRhythm
  useEffect(() => {
    if (currentPiece && gameMode === 'LEARNING' && !gameOver && !gameStartedRef.current) {
      gameStartedRef.current = true;
      startPattern();
    }
    // Reset flag when game ends so next game can start fresh
    if (gameOver) {
      gameStartedRef.current = false;
    }
  }, [currentPiece, gameMode, gameOver, startPattern]);

  // Reset rhythm when game restarts
  useEffect(() => {
    if (gameOver) {
      resetRhythm();
    }
  }, [gameOver, resetRhythm]);

  // Ref for game container to detect clicks outside
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Pause timer when window loses focus or clicking outside game area
  useEffect(() => {
    if (gameMode !== 'LEARNING') return;

    const handleBlur = () => {
      pauseTimer();
    };

    const handleClickOutside = (e: MouseEvent) => {
      // Check if click is outside the game container
      if (gameContainerRef.current && !gameContainerRef.current.contains(e.target as Node)) {
        pauseTimer();
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [gameMode, pauseTimer]);

  // Get rhythm state for pause detection
  const { ringActive, patternStartTime, isPaused } = rhythm.state;

  // Resume timer only when any key is pressed while paused
  useEffect(() => {
    if (gameMode !== 'LEARNING' || !isPaused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      resumeTimer();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameMode, isPaused, resumeTimer]);

  // Track previous combo for effect triggers
  const prevComboRef = useRef(0);

  // Trigger visual effects when combo changes
  useEffect(() => {
    if (score.combo > prevComboRef.current && score.combo > 0) {
      // Trigger combo effect for milestones
      visualEffects.triggerComboEffect(score.combo);
      visualEffects.triggerStreakEffect(score.combo);
    }
    prevComboRef.current = score.combo;
  }, [score.combo, visualEffects]);

  // Keep score ref in sync with latest state
  useEffect(() => {
    currentScoreRef.current = score;
    comboBeforeDropRef.current = score.combo;
  }, [score]);

  // Auto-trigger TOO_SLOW when timing expires (no key press needed)
  useEffect(() => {
    // Only run when timing is active and not paused
    if (gameMode !== 'LEARNING' || gameOver || !ringActive || !patternStartTime || isPaused) {
      return;
    }

    // Calculate how long until timeout based on current elapsed time
    const currentElapsed = getCurrentTiming();
    const timeUntilTimeout = TIMING_THRESHOLDS.GOOD - currentElapsed + 50; // +50ms buffer

    if (timeUntilTimeout <= 0) {
      // Already timed out
      const judgment = recordHit(false, 'timeout');
      visualEffects.triggerJudgmentEffect(judgment, 140, 280);
      difficulty.recordAttempt(false, currentElapsed);
      resetPiece(false);
      startPattern();
      return;
    }

    // Schedule timeout trigger
    const timeoutId = setTimeout(() => {
      const currentTiming = getCurrentTiming();
      if (currentTiming > TIMING_THRESHOLDS.GOOD) {
        const judgment = recordHit(false, 'timeout');
        visualEffects.triggerJudgmentEffect(judgment, 140, 280);
        difficulty.recordAttempt(false, currentTiming);
        resetPiece(false);
        startPattern();
      }
    }, timeUntilTimeout);

    return () => clearTimeout(timeoutId);
  }, [gameMode, gameOver, ringActive, patternStartTime, isPaused, getCurrentTiming, recordHit, visualEffects, difficulty, resetPiece, startPattern]);

  // Wrap handleAction to record rhythm hits and difficulty on hard drop
  const handleActionWithRhythm = useCallback((action: string, isKeyDown: boolean) => {
    if (action === 'HARD_DROP' && isKeyDown && !gameOver && gameMode === 'LEARNING') {
      const currentTiming = getCurrentTiming();
      const effectX = 140;
      const effectY = 280;

      // 1. Check if placement would be correct BEFORE dropping
      const wouldBeCorrect = validateCurrentPlacement();

      if (!wouldBeCorrect) {
        // MISS takes priority - wrong placement/finesse (even if also too slow)
        const judgment = recordHit(false, 'wrong');
        visualEffects.triggerJudgmentEffect(judgment, effectX, effectY);
        difficulty.recordAttempt(false, currentTiming);
        resetPiece(false); // Reset piece position for retry
        startPattern();
        return;
      }

      // 2. Placement is correct - check timing
      if (currentTiming > TIMING_THRESHOLDS.GOOD) {
        // TOO_SLOW - correct placement but took too long
        const judgment = recordHit(false, 'timeout');
        visualEffects.triggerJudgmentEffect(judgment, effectX, effectY);
        difficulty.recordAttempt(false, currentTiming);
        resetPiece(false); // Reset piece position for retry
        startPattern();
        return;
      }

      // 3. Placement is correct and within time - proceed with drop
      handleAction(action, isKeyDown);

      // Record the correct hit with timing-based judgment
      const judgment = recordHit(true);
      visualEffects.triggerJudgmentEffect(judgment, effectX, effectY);
      difficulty.recordAttempt(true, currentTiming);

      // Start timing for next piece
      startPattern();
      return;
    }
    handleAction(action, isKeyDown);
  }, [handleAction, gameOver, gameMode, getCurrentTiming, recordHit, difficulty, visualEffects, startPattern, validateCurrentPlacement, resetPiece]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip browser key repeat - we handle repeat with DAS/ARR
      if (e.repeat) return;

      const action = getAction(e.code);
      if (action) {
        e.preventDefault();
        handleActionWithRhythm(action, true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const action = getAction(e.code);
      if (action) {
        e.preventDefault();
        handleActionWithRhythm(action, false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [getAction, handleActionWithRhythm]);

  const renderGrid = () => {
    const targetPiece = getTargetPiece();

    return (
      <VisualEffectsLayer>
        <div className="relative">
          <TetrisCanvas
            grid={grid}
            currentPieceRef={currentPieceRef}
            targetPiece={targetPiece}
            showGhost={settings.showGhost}
            gameMode={gameMode}
          />
          {/* Rhythm judgment overlay - only in Learning mode */}
          {gameMode === 'LEARNING' && <JudgmentDisplay />}
        </div>
      </VisualEffectsLayer>
    );
  };

  const renderTimingBar = () => {
    if (gameMode !== 'LEARNING') return null;
    return <TimingBar />;
  };

  const renderRhythmStats = () => {
    if (gameMode !== 'LEARNING') return null;
    return <RhythmStats />;
  };

  const renderDifficultyStats = () => {
    if (gameMode !== 'LEARNING') return null;
    return <DifficultyStats />;
  };

  const renderDifficultyIndicator = () => {
    if (gameMode !== 'LEARNING') return null;
    return <DifficultyIndicator />;
  };

  const renderFlowIndicator = () => {
    if (gameMode !== 'LEARNING') return null;
    return <FlowIndicator />;
  };

  const renderPiecePreview = (type: TetrominoType, small = false) => {
    if (!type || !TETROMINO_SHAPES[type]) return null;
    const shape = TETROMINO_SHAPES[type][0];
    const size = small ? 'w-3 h-3' : 'w-4 h-4';

    return (
      <div className="flex flex-col items-center justify-center">
        {shape.map((row, y) => (
          <div key={y} className="flex">
            {row.map((cell, x) => (
              <div key={x} className={`${size} ${cell ? `tetromino-${type.toLowerCase()}` : ''}`} />
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderTargetMoves = () => {
    if (!target || !target.moves || target.moves.length === 0 || gameMode === 'FREE_STACK') {
      return null;
    }

    // Convert consecutive C,C or CC,CC to 180 for display
    const formatMoves = (moves: FinesseMove[]): string[] => {
      const result: string[] = [];
      let i = 0;
      while (i < moves.length) {
        // Check for C,C -> 180
        if (i < moves.length - 1 && moves[i] === 'C' && moves[i + 1] === 'C') {
          result.push('180');
          i += 2;
        }
        // Check for CC,CC -> 180
        else if (i < moves.length - 1 && moves[i] === 'CC' && moves[i + 1] === 'CC') {
          result.push('180');
          i += 2;
        }
        else {
          result.push(MOVE_NAMES[moves[i]]);
          i++;
        }
      }
      return result;
    };

    return (
      <div className="space-y-2">
        {target.moves.map((sequence, seqIndex) => (
          <div key={seqIndex}>
            {seqIndex > 0 && <div className="text-xs text-muted-foreground text-center my-1">OR</div>}
            <div className="space-y-0.5">
              {formatMoves(sequence).map((moveName, moveIndex) => (
                <div key={moveIndex} className="text-xs font-mono">
                  {moveName}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Convert consecutive C,C or CC,CC to 180 for display
  const formatMovesForDisplay = (moves: FinesseMove[]): string[] => {
    const result: string[] = [];
    let i = 0;
    while (i < moves.length) {
      if (i < moves.length - 1 && moves[i] === 'C' && moves[i + 1] === 'C') {
        result.push('180');
        i += 2;
      } else if (i < moves.length - 1 && moves[i] === 'CC' && moves[i + 1] === 'CC') {
        result.push('180');
        i += 2;
      } else {
        result.push(MOVE_NAMES[moves[i]]);
        i++;
      }
    }
    return result;
  };

  const renderInputSequence = () => {
    if (currentMoves.length === 0) {
      return (
        <div className="text-xs text-muted-foreground">
          No inputs yet
        </div>
      );
    }

    const formattedMoves = formatMovesForDisplay(currentMoves);

    return (
      <div className="space-y-0.5">
        {formattedMoves.map((moveName, index) => (
          <div key={index} className="text-xs font-mono">
            {moveName}
          </div>
        ))}
      </div>
    );
  };

  const renderPauseOverlay = () => {
    if (!isPaused || gameMode !== 'LEARNING') return null;

    return (
      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-30 backdrop-blur-sm">
        <div className="text-3xl font-black text-white mb-4" style={{ textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>
          PAUSED
        </div>
        <div className="text-sm text-white/70">
          Press any key to continue
        </div>
      </div>
    );
  };

  return {
    grid,
    currentPiece,
    nextQueue,
    holdPiece,
    canHold,
    score,
    gameOver,
    gameMode,
    modeName: MODE_NAMES[gameMode],
    target,
    startGame,
    renderGrid,
    renderPiecePreview,
    renderTargetMoves,
    renderInputSequence,
    renderTimingBar,
    renderRhythmStats,
    renderDifficultyStats,
    renderDifficultyIndicator,
    renderFlowIndicator,
    renderPauseOverlay,
    gameContainerRef,
    rhythmState: rhythm.state,
    difficultyState: difficulty.state,
    cycleMode: game.cycleMode,
    setMode: game.setMode,
  };
}
