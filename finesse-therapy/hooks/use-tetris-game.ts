"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { TetrominoType, TETROMINO_SHAPES, GameAction } from '@/lib/types';

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const VISIBLE_HEIGHT = 20;

type Cell = TetrominoType | null;

interface Piece {
  type: TetrominoType;
  rotation: number;
  x: number;
  y: number;
}

function createEmptyGrid(): Cell[][] {
  return Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(null));
}

function getRandomPiece(): TetrominoType {
  const pieces: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  return pieces[Math.floor(Math.random() * pieces.length)];
}

function generateBag(): TetrominoType[] {
  const pieces: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return pieces;
}

export function useTetrisGame() {
  const [grid, setGrid] = useState<Cell[][]>(createEmptyGrid());
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextQueue, setNextQueue] = useState<TetrominoType[]>([]);
  const [holdPiece, setHoldPiece] = useState<TetrominoType | null>(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState({ correct: 0, total: 0, combo: 0, topCombo: 0, kpp: 0 });
  const [gameOver, setGameOver] = useState(true);
  const [inputCount, setInputCount] = useState(0);

  const bagRef = useRef<TetrominoType[]>([]);

  const getNextPiece = useCallback(() => {
    if (bagRef.current.length === 0) {
      bagRef.current = generateBag();
    }
    return bagRef.current.shift()!;
  }, []);

  const spawnPiece = useCallback((type?: TetrominoType) => {
    const pieceType = type || getNextPiece();
    const newPiece: Piece = {
      type: pieceType,
      rotation: 0,
      x: Math.floor(GRID_WIDTH / 2) - 1,
      y: pieceType === 'I' ? -1 : 0
    };

    setCurrentPiece(newPiece);
    setCanHold(true);

    if (!type) {
      setNextQueue(prev => {
        const newQueue = [...prev];
        if (newQueue.length < 5) {
          while (newQueue.length < 5) {
            newQueue.push(getNextPiece());
          }
        }
        return newQueue;
      });
    }
  }, [getNextPiece]);

  const checkCollision = useCallback((piece: Piece, offsetX = 0, offsetY = 0, newRotation?: number): boolean => {
    const rotation = newRotation ?? piece.rotation;
    const shape = TETROMINO_SHAPES[piece.type][rotation];

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = piece.x + x + offsetX;
          const newY = piece.y + y + offsetY;

          if (newX < 0 || newX >= GRID_WIDTH || newY >= GRID_HEIGHT) {
            return true;
          }

          if (newY >= 0 && grid[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }, [grid]);

  const movePiece = useCallback((dx: number, dy: number) => {
    if (!currentPiece || gameOver) return false;

    if (!checkCollision(currentPiece, dx, dy)) {
      setCurrentPiece(prev => prev ? { ...prev, x: prev.x + dx, y: prev.y + dy } : null);
      if (dx !== 0 || dy > 0) {
        setInputCount(c => c + 1);
      }
      return true;
    }
    return false;
  }, [currentPiece, checkCollision, gameOver]);

  const rotatePiece = useCallback((direction: 1 | -1) => {
    if (!currentPiece || gameOver) return;

    const newRotation = (currentPiece.rotation + direction + 4) % 4;

    if (!checkCollision(currentPiece, 0, 0, newRotation)) {
      setCurrentPiece(prev => prev ? { ...prev, rotation: newRotation } : null);
      setInputCount(c => c + 1);
    }
  }, [currentPiece, checkCollision, gameOver]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver) return;

    let dropDistance = 0;
    while (!checkCollision(currentPiece, 0, dropDistance + 1)) {
      dropDistance++;
    }

    const newPiece = { ...currentPiece, y: currentPiece.y + dropDistance };
    const shape = TETROMINO_SHAPES[newPiece.type][newPiece.rotation];

    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x] && newPiece.y + y >= 0) {
            newGrid[newPiece.y + y][newPiece.x + x] = newPiece.type;
          }
        }
      }

      // Clear lines
      for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
        if (newGrid[y].every(cell => cell !== null)) {
          newGrid.splice(y, 1);
          newGrid.unshift(Array(GRID_WIDTH).fill(null));
        }
      }

      return newGrid;
    });

    setScore(prev => ({
      ...prev,
      total: prev.total + 1,
      kpp: prev.total > 0 ? inputCount / (prev.total + 1) : 0
    }));
    setInputCount(0);

    // Spawn next piece
    setTimeout(() => spawnPiece(), 100);
  }, [currentPiece, checkCollision, gameOver, spawnPiece, inputCount]);

  const hold = useCallback(() => {
    if (!currentPiece || !canHold || gameOver) return;

    if (holdPiece === null) {
      setHoldPiece(currentPiece.type);
      spawnPiece();
    } else {
      const tempType = holdPiece;
      setHoldPiece(currentPiece.type);
      spawnPiece(tempType);
    }
    setCanHold(false);
  }, [currentPiece, holdPiece, canHold, gameOver, spawnPiece]);

  const handleAction = useCallback((action: GameAction) => {
    switch (action) {
      case 'MOVE_LEFT':
        movePiece(-1, 0);
        break;
      case 'MOVE_RIGHT':
        movePiece(1, 0);
        break;
      case 'SOFT_DROP':
        movePiece(0, 1);
        break;
      case 'HARD_DROP':
        hardDrop();
        break;
      case 'ROTATE_CW':
        rotatePiece(1);
        break;
      case 'ROTATE_CCW':
        rotatePiece(-1);
        break;
      case 'ROTATE_180':
        rotatePiece(1);
        setTimeout(() => rotatePiece(1), 0);
        break;
      case 'HOLD':
        hold();
        break;
      case 'RESET':
        startGame();
        break;
    }
  }, [movePiece, hardDrop, rotatePiece, hold]);

  const startGame = useCallback(() => {
    setGrid(createEmptyGrid());
    setHoldPiece(null);
    setCanHold(true);
    setScore({ correct: 0, total: 0, combo: 0, topCombo: 0, kpp: 0 });
    setGameOver(false);
    setInputCount(0);
    bagRef.current = [];
    setNextQueue([]);
    spawnPiece();
  }, [spawnPiece]);

  const getGhostY = useCallback(() => {
    if (!currentPiece) return 0;

    let ghostY = currentPiece.y;
    while (!checkCollision(currentPiece, 0, ghostY - currentPiece.y + 1)) {
      ghostY++;
    }
    return ghostY;
  }, [currentPiece, checkCollision]);

  return {
    grid,
    currentPiece,
    nextQueue,
    holdPiece,
    score,
    gameOver,
    startGame,
    handleAction,
    getGhostY,
  };
}
