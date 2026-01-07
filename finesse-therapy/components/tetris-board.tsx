"use client";

import { useTetrisGame, GameMode } from "@/hooks/use-tetris-game";
import { useKeyBindings } from "@/hooks/use-key-bindings";
import { useGameSettings } from "@/hooks/use-game-settings";
import { useRhythmSystem, HitJudgment } from "@/hooks/use-rhythm-system";
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
  const { grid, currentPiece, nextQueue, holdPiece, canHold, score, gameOver, gameMode, target, currentMoves, startGame, handleAction, getTargetPiece } = game;
  const { getAction } = useKeyBindings();
  const { settings } = useGameSettings();
  const rhythm = useRhythmSystem();
  const difficulty = useDifficultySystem();
  const visualEffects = useVisualEffects();

  // Track piece changes to start rhythm timing
  const prevPieceRef = useRef<typeof currentPiece>(null);
  const isDroppedRef = useRef(false);

  // Start rhythm timing when a new piece spawns
  useEffect(() => {
    // Detect new piece spawn (piece changed from null to something, or piece type changed)
    if (currentPiece && (!prevPieceRef.current || prevPieceRef.current.type !== currentPiece.type)) {
      if (!isDroppedRef.current && gameMode === 'LEARNING' && !gameOver) {
        rhythm.startPattern();
      }
      isDroppedRef.current = false;
    }
    prevPieceRef.current = currentPiece;
  }, [currentPiece, gameMode, gameOver, rhythm]);

  // Reset rhythm when game restarts
  useEffect(() => {
    if (gameOver) {
      rhythm.resetRhythm();
    }
  }, [gameOver, rhythm]);

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

  // Wrap handleAction to record rhythm hits and difficulty on hard drop
  const handleActionWithRhythm = useCallback((action: string, isKeyDown: boolean) => {
    if (action === 'HARD_DROP' && isKeyDown && !gameOver && gameMode === 'LEARNING') {
      isDroppedRef.current = true;
      const startTime = rhythm.getCurrentTiming();

      // Defer recording to after the drop completes
      setTimeout(() => {
        const newCombo = game.score.combo;
        const correct = newCombo > score.combo;
        const responseTime = startTime || 1000;

        // Record to rhythm system and get judgment
        const judgment = rhythm.recordHit(correct);

        // Trigger visual effects based on judgment
        // Center of game board approximately
        const effectX = 140;
        const effectY = 280;
        visualEffects.triggerJudgmentEffect(judgment, effectX, effectY);

        // Record to difficulty system
        difficulty.recordAttempt(correct, responseTime);
      }, 60);
    }
    handleAction(action, isKeyDown);
  }, [handleAction, gameOver, gameMode, score.combo, game.score, rhythm, difficulty, visualEffects]);

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
            currentPiece={currentPiece}
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
    rhythmState: rhythm.state,
    difficultyState: difficulty.state,
    cycleMode: game.cycleMode,
    setMode: game.setMode,
  };
}
