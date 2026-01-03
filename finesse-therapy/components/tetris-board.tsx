"use client";

import { useTetrisGame } from "@/hooks/use-tetris-game";
import { useKeyBindings } from "@/hooks/use-key-bindings";
import { useGameSettings } from "@/hooks/use-game-settings";
import { TETROMINO_SHAPES, TetrominoType } from "@/lib/types";
import { useEffect, useCallback } from "react";

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;

export function TetrisBoard() {
  const { grid, currentPiece, nextQueue, holdPiece, score, gameOver, startGame, handleAction, getGhostY } = useTetrisGame();
  const { getAction } = useKeyBindings();
  const { settings } = useGameSettings();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const action = getAction(e.key);
      if (action) {
        e.preventDefault();
        handleAction(action);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [getAction, handleAction]);

  const renderCell = useCallback((cell: TetrominoType | null, isGhost = false) => {
    if (!cell) return null;
    return (
      <div
        className={`tetromino-${cell.toLowerCase()} rounded-sm transition-all ${
          isGhost ? 'opacity-30' : ''
        }`}
        style={{
          boxShadow: isGhost ? 'none' : '0 0 10px var(--grid-border)'
        }}
      />
    );
  }, []);

  const renderGrid = () => {
    const displayGrid = grid.map(row => [...row]);

    // Add current piece
    if (currentPiece) {
      const shape = TETROMINO_SHAPES[currentPiece.type][currentPiece.rotation];
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x] && currentPiece.y + y >= 0 && currentPiece.y + y < GRID_HEIGHT) {
            displayGrid[currentPiece.y + y][currentPiece.x + x] = currentPiece.type;
          }
        }
      }

      // Add ghost piece
      if (settings.showGhost) {
        const ghostY = getGhostY();
        for (let y = 0; y < shape.length; y++) {
          for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] && ghostY + y >= 0 && ghostY + y < GRID_HEIGHT) {
              if (!displayGrid[ghostY + y][ghostY + x]) {
                // Mark as ghost
              }
            }
          }
        }
      }
    }

    return displayGrid.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div key={x} className="w-6 h-6 border border-border/20 relative">
            {cell && renderCell(cell)}
          </div>
        ))}
      </div>
    ));
  };

  const renderPiecePreview = (type: TetrominoType, small = false) => {
    const shape = TETROMINO_SHAPES[type][0];
    const size = small ? 'w-3 h-3' : 'w-4 h-4';

    return (
      <div className="flex flex-col items-center justify-center">
        {shape.map((row, y) => (
          <div key={y} className="flex">
            {row.map((cell, x) => (
              <div key={x} className={`${size} ${cell ? `tetromino-${type.toLowerCase()} rounded-sm` : ''}`} />
            ))}
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
    startGame,
    renderGrid,
    renderPiecePreview,
  };
}
