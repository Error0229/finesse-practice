"use client";

import { useTetrisGame, GameMode } from "@/hooks/use-tetris-game";
import { useKeyBindings } from "@/hooks/use-key-bindings";
import { useGameSettings } from "@/hooks/use-game-settings";
import { TETROMINO_SHAPES, TetrominoType } from "@/lib/types";
import { MOVE_NAMES, FinesseMove } from "@/lib/finesse-data";
import { TetrisCanvas } from "@/components/tetris-canvas";
import { useEffect } from "react";

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
};

export function TetrisBoard() {
  const game = useTetrisGame();
  const { grid, currentPiece, nextQueue, holdPiece, score, gameOver, gameMode, target, currentMoves, startGame, handleAction, getTargetPiece } = game;
  const { getAction } = useKeyBindings();
  const { settings } = useGameSettings();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip browser key repeat - we handle repeat with DAS/ARR
      if (e.repeat) return;

      const action = getAction(e.code);
      if (action) {
        e.preventDefault();
        handleAction(action, true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const action = getAction(e.code);
      if (action) {
        e.preventDefault();
        handleAction(action, false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [getAction, handleAction]);

  const renderGrid = () => {
    const targetPiece = getTargetPiece();

    return (
      <TetrisCanvas
        grid={grid}
        currentPiece={currentPiece}
        targetPiece={targetPiece}
        showGhost={settings.showGhost}
        gameMode={gameMode}
      />
    );
  };

  const renderPiecePreview = (type: TetrominoType, small = false) => {
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
    cycleMode: game.cycleMode,
    setMode: game.setMode,
  };
}
