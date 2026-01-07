"use client";

import { useState, useCallback, useEffect, useRef, useContext } from 'react';
import { TetrominoType, TETROMINO_SHAPES } from '@/lib/types';
import { FinesseMove, PieceIndex, generateTarget, compareMoves, getOptimalMoves } from '@/lib/finesse-data';
import { useGameSettings } from '@/hooks/use-game-settings';
import { LearningProgressContext } from '@/hooks/use-learning-progress';

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const STARTING_COL = 3;

type Cell = TetrominoType | null;

// SRS Wall Kick Data
// Format: [fromRotation][toRotation] = [[dx, dy], ...]
// Note: In our grid Y increases downward, so SRS Y offsets are negated
// For J, L, S, T, Z pieces
const JLSTZ_KICKS: [number, number][][][] = [
  // From state 0
  [
    [], // 0 -> 0 (no rotation)
    [[ 0, 0], [-1, 0], [-1,-1], [ 0, 2], [-1, 2]], // 0 -> R (CW)
    [[ 0, 0]], // 0 -> 2 (180) - simple, just try basic
    [[ 0, 0], [ 1, 0], [ 1,-1], [ 0, 2], [ 1, 2]], // 0 -> L (CCW)
  ],
  // From state R (1)
  [
    [[ 0, 0], [ 1, 0], [ 1, 1], [ 0,-2], [ 1,-2]], // R -> 0 (CCW)
    [], // R -> R (no rotation)
    [[ 0, 0], [ 1, 0], [ 1, 1], [ 0,-2], [ 1,-2]], // R -> 2 (CW)
    [[ 0, 0]], // R -> L (180)
  ],
  // From state 2
  [
    [[ 0, 0]], // 2 -> 0 (180)
    [[ 0, 0], [-1, 0], [-1,-1], [ 0, 2], [-1, 2]], // 2 -> R (CCW)
    [], // 2 -> 2 (no rotation)
    [[ 0, 0], [ 1, 0], [ 1,-1], [ 0, 2], [ 1, 2]], // 2 -> L (CW)
  ],
  // From state L (3)
  [
    [[ 0, 0], [-1, 0], [-1, 1], [ 0,-2], [-1,-2]], // L -> 0 (CW)
    [[ 0, 0]], // L -> R (180)
    [[ 0, 0], [-1, 0], [-1, 1], [ 0,-2], [-1,-2]], // L -> 2 (CCW)
    [], // L -> L (no rotation)
  ],
];

// For I piece - uses different kick table
const I_KICKS: [number, number][][][] = [
  // From state 0
  [
    [], // 0 -> 0
    [[ 0, 0], [-2, 0], [ 1, 0], [-2, 1], [ 1,-2]], // 0 -> R (CW)
    [[ 0, 0]], // 0 -> 2 (180)
    [[ 0, 0], [-1, 0], [ 2, 0], [-1,-2], [ 2, 1]], // 0 -> L (CCW)
  ],
  // From state R (1)
  [
    [[ 0, 0], [ 2, 0], [-1, 0], [ 2,-1], [-1, 2]], // R -> 0 (CCW)
    [], // R -> R
    [[ 0, 0], [-1, 0], [ 2, 0], [-1,-2], [ 2, 1]], // R -> 2 (CW)
    [[ 0, 0]], // R -> L (180)
  ],
  // From state 2
  [
    [[ 0, 0]], // 2 -> 0 (180)
    [[ 0, 0], [ 1, 0], [-2, 0], [ 1, 2], [-2,-1]], // 2 -> R (CCW)
    [], // 2 -> 2
    [[ 0, 0], [ 2, 0], [-1, 0], [ 2,-1], [-1, 2]], // 2 -> L (CW)
  ],
  // From state L (3)
  [
    [[ 0, 0], [ 1, 0], [-2, 0], [ 1, 2], [-2,-1]], // L -> 0 (CW)
    [[ 0, 0]], // L -> R (180)
    [[ 0, 0], [-2, 0], [ 1, 0], [-2, 1], [ 1,-2]], // L -> 2 (CCW)
    [], // L -> L
  ],
];

interface Piece {
  type: TetrominoType;
  rotation: number;
  x: number;
  y: number;
}

interface Target {
  column: number;
  rotation: number;
  moves: FinesseMove[][];
}

export type GameMode = 'RANDOM' | 'Z_ONLY' | 'S_ONLY' | 'I_ONLY' | 'T_ONLY' | 'O_ONLY' | 'L_ONLY' | 'J_ONLY' | 'FREE_STACK' | 'LEARNING';

const PIECE_MAP: Record<string, PieceIndex> = {
  'Z': 0, 'S': 1, 'I': 2, 'T': 3, 'O': 4, 'L': 5, 'J': 6
};

const MODE_PIECES: Record<GameMode, TetrominoType[] | null> = {
  'RANDOM': null,
  'Z_ONLY': ['Z'],
  'S_ONLY': ['S'],
  'I_ONLY': ['I'],
  'T_ONLY': ['T'],
  'O_ONLY': ['O'],
  'L_ONLY': ['L'],
  'J_ONLY': ['J'],
  'FREE_STACK': null,
  'LEARNING': null,
};

function createEmptyGrid(): Cell[][] {
  return Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(null));
}

function generateBag(mode: GameMode): TetrominoType[] {
  const pieces: TetrominoType[] = MODE_PIECES[mode] || ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const bag = [...pieces];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export function useTetrisGame() {
  const [grid, setGrid] = useState<Cell[][]>(createEmptyGrid());
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextQueue, setNextQueue] = useState<TetrominoType[]>([]);
  const [holdPiece, setHoldPiece] = useState<TetrominoType | null>(null);
  const [canHold, setCanHold] = useState(true);
  const [gameOver, setGameOver] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>('RANDOM');

  // Game settings
  const { settings } = useGameSettings();

  // Learning progress context (optional - only available when provider is mounted)
  const learningContext = useContext(LearningProgressContext);

  // Current learning target (for LEARNING mode)
  const learningTargetRef = useRef<{ piece: TetrominoType; column: number; rotation: number } | null>(null);

  // Target for finesse practice
  const [target, setTarget] = useState<Target | null>(null);

  // Stats
  const [score, setScore] = useState({
    correct: 0,
    total: 0,
    combo: 0,
    topCombo: 0,
    kpp: 0,
    totalKeys: 0
  });

  // Move tracking for display
  const [currentMoves, setCurrentMoves] = useState<FinesseMove[]>([]);

  // Refs for move tracking
  const moveListRef = useRef<FinesseMove[]>([]);
  const keyCountRef = useRef(0);
  const leftHeldRef = useRef(false);
  const rightHeldRef = useRef(false);
  const softDropHeldRef = useRef(false);
  const leftDasRef = useRef(false);
  const rightDasRef = useRef(false);
  const leftDasCounterRef = useRef(0);
  const rightDasCounterRef = useRef(0);
  const leftArrCounterRef = useRef(0);
  const rightArrCounterRef = useRef(0);
  const softDropCounterRef = useRef(0);

  const bagRef = useRef<TetrominoType[]>([]);
  const nextBagRef = useRef<TetrominoType[]>([]);

  // Refs for state to avoid stale closures in callbacks
  const gridRef = useRef(grid);
  const currentPieceRef = useRef(currentPiece);
  const gameOverRef = useRef(gameOver);

  // Sync refs with state in effect to avoid updating refs during render
  useEffect(() => {
    gridRef.current = grid;
    currentPieceRef.current = currentPiece;
    gameOverRef.current = gameOver;
  });

  const getNextPiece = useCallback(() => {
    if (bagRef.current.length === 0) {
      bagRef.current = nextBagRef.current.length > 0
        ? [...nextBagRef.current]
        : generateBag(gameMode);
      nextBagRef.current = generateBag(gameMode);
    }
    return bagRef.current.shift()!;
  }, [gameMode]);

  const selectTarget = useCallback((pieceType: TetrominoType) => {
    if (gameMode === 'FREE_STACK') {
      setTarget(null);
      learningTargetRef.current = null;
      return;
    }

    // In LEARNING mode, use the learning progress system to select target
    if (gameMode === 'LEARNING' && learningContext) {
      const learningTarget = learningContext.selectNextLearningPattern();
      if (learningTarget) {
        setTarget({
          column: learningTarget.column,
          rotation: learningTarget.rotation,
          moves: learningTarget.moves,
        });
        learningTargetRef.current = {
          piece: learningTarget.piece,
          column: learningTarget.column,
          rotation: learningTarget.rotation,
        };
        return;
      }
      // Fallback to random if no learning target available
    }

    // Default behavior for other modes
    const pieceIndex = PIECE_MAP[pieceType];
    const newTarget = generateTarget(pieceIndex);
    setTarget(newTarget);
    learningTargetRef.current = null;
  }, [gameMode, learningContext]);

  // Update next queue based on current bag state
  const updateNextQueue = useCallback(() => {
    const preview: TetrominoType[] = [];
    let bagIndex = 0;
    let nextBagIndex = 0;

    // Build preview of next 5 pieces
    while (preview.length < 5) {
      if (bagIndex < bagRef.current.length) {
        preview.push(bagRef.current[bagIndex]);
        bagIndex++;
      } else if (nextBagIndex < nextBagRef.current.length) {
        preview.push(nextBagRef.current[nextBagIndex]);
        nextBagIndex++;
      } else {
        // Generate more if needed - reset index since it's a fresh bag
        nextBagRef.current = generateBag(gameMode);
        nextBagIndex = 0;
        preview.push(nextBagRef.current[nextBagIndex]);
        nextBagIndex++;
      }
    }
    setNextQueue(preview);
  }, [gameMode]);

  const spawnPiece = useCallback((type?: TetrominoType) => {
    // For LEARNING mode, select target first to know which piece to spawn
    if (gameMode === 'LEARNING' && learningContext && !type) {
      const learningTarget = learningContext.selectNextLearningPattern();
      if (learningTarget) {
        const newPiece: Piece = {
          type: learningTarget.piece,
          rotation: 0,
          x: STARTING_COL,
          y: learningTarget.piece === 'I' ? -1 : 0
        };

        setCurrentPiece(newPiece);
        currentPieceRef.current = newPiece;
        setCanHold(true);
        moveListRef.current = [];
        setCurrentMoves([]);
        keyCountRef.current = 0;

        setTarget({
          column: learningTarget.column,
          rotation: learningTarget.rotation,
          moves: learningTarget.moves,
        });
        learningTargetRef.current = {
          piece: learningTarget.piece,
          column: learningTarget.column,
          rotation: learningTarget.rotation,
        };

        // Update next queue for preview (still use bag system for preview)
        updateNextQueue();
        return;
      }
    }

    const pieceType = type || getNextPiece();
    const newPiece: Piece = {
      type: pieceType,
      rotation: 0,
      x: STARTING_COL,
      y: pieceType === 'I' ? -1 : 0
    };

    setCurrentPiece(newPiece);
    // Update ref immediately so key handlers in same frame can see the new piece
    currentPieceRef.current = newPiece;
    setCanHold(true);
    moveListRef.current = [];
    setCurrentMoves([]);
    keyCountRef.current = 0;

    // Select target for finesse practice
    selectTarget(pieceType);

    // Update next queue preview
    if (!type) {
      updateNextQueue();
    }
  }, [gameMode, learningContext, getNextPiece, selectTarget, updateNextQueue]);

  // Reset piece to starting position (for retry on fault)
  const resetPiece = useCallback((resetCombo = true) => {
    if (!currentPiece) return;

    setCurrentPiece({
      type: currentPiece.type,
      rotation: 0,
      x: STARTING_COL,
      y: currentPiece.type === 'I' ? -1 : 0
    });
    moveListRef.current = [];
    setCurrentMoves([]);
    keyCountRef.current = 0;
    leftDasRef.current = false;
    rightDasRef.current = false;
    leftDasCounterRef.current = 0;
    rightDasCounterRef.current = 0;
    leftArrCounterRef.current = 0;
    rightArrCounterRef.current = 0;
    leftHeldRef.current = false;
    rightHeldRef.current = false;
    softDropHeldRef.current = false;

    // Reset combo when fault occurs
    if (resetCombo) {
      setScore(prev => ({ ...prev, combo: 0 }));
    }
  }, [currentPiece]);

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

  const movePiece = useCallback((dx: number, dy: number): boolean => {
    if (!currentPiece || gameOver) return false;

    if (!checkCollision(currentPiece, dx, dy)) {
      setCurrentPiece(prev => prev ? { ...prev, x: prev.x + dx, y: prev.y + dy } : null);
      return true;
    }
    return false;
  }, [currentPiece, checkCollision, gameOver]);

  // Get wall kick table for a piece type
  const getKickTable = useCallback((type: TetrominoType) => {
    if (type === 'I') return I_KICKS;
    if (type === 'O') return null; // O doesn't need kicks
    return JLSTZ_KICKS;
  }, []);

  const rotatePiece = useCallback((direction: 1 | -1) => {
    // Use ref to get latest piece (handles same-frame updates after hold)
    const piece = currentPieceRef.current;
    if (!piece || gameOverRef.current) return;

    const fromRotation = piece.rotation;
    const toRotation = (fromRotation + direction + 4) % 4;
    const kickTable = getKickTable(piece.type);

    // O piece doesn't rotate meaningfully
    if (piece.type === 'O') return;

    // Get kick tests for this rotation
    const kicks = kickTable ? kickTable[fromRotation][toRotation] : [[0, 0]];

    // Check collision using ref's grid
    const currentGrid = gridRef.current;
    const checkCollisionForPiece = (p: Piece, offsetX: number, offsetY: number, newRotation: number): boolean => {
      const shape = TETROMINO_SHAPES[p.type][newRotation];
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            const newX = p.x + x + offsetX;
            const newY = p.y + y + offsetY;
            if (newX < 0 || newX >= GRID_WIDTH || newY >= GRID_HEIGHT) {
              return true;
            }
            if (newY >= 0 && currentGrid[newY][newX]) {
              return true;
            }
          }
        }
      }
      return false;
    };

    // Try each kick offset
    for (const [dx, dy] of kicks) {
      if (!checkCollisionForPiece(piece, dx, dy, toRotation)) {
        const newPiece = {
          ...piece,
          rotation: toRotation,
          x: piece.x + dx,
          y: piece.y + dy
        };
        setCurrentPiece(newPiece);
        currentPieceRef.current = newPiece;
        keyCountRef.current++;
        const move: FinesseMove = direction === 1 ? 'C' : 'CC';
        moveListRef.current.push(move);
        setCurrentMoves([...moveListRef.current]);
        return;
      }
    }
  }, [getKickTable]);

  const rotate180 = useCallback(() => {
    if (!currentPiece || gameOver) return;

    // O piece doesn't rotate meaningfully
    if (currentPiece.type === 'O') return;

    const fromRotation = currentPiece.rotation;
    const toRotation = (fromRotation + 2) % 4;
    const kickTable = getKickTable(currentPiece.type);

    // Get kick tests for 180 rotation
    const kicks = kickTable ? kickTable[fromRotation][toRotation] : [[0, 0]];

    // Try each kick offset
    for (const [dx, dy] of kicks) {
      if (!checkCollision(currentPiece, dx, dy, toRotation)) {
        setCurrentPiece(prev => prev ? {
          ...prev,
          rotation: toRotation,
          x: prev.x + dx,
          y: prev.y + dy
        } : null);
        keyCountRef.current++;
        // 180 rotation counts as 2 rotations for finesse (C, C or CC, CC)
        moveListRef.current.push('C');
        moveListRef.current.push('C');
        setCurrentMoves([...moveListRef.current]);
        return;
      }
    }
  }, [currentPiece, checkCollision, gameOver, getKickTable]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver) return;

    let dropDistance = 0;
    while (!checkCollision(currentPiece, 0, dropDistance + 1)) {
      dropDistance++;
    }

    const finalPiece = { ...currentPiece, y: currentPiece.y + dropDistance };

    // Add DROP to move list
    moveListRef.current.push('DROP');
    keyCountRef.current++;
    setCurrentMoves([...moveListRef.current]);

    // Check finesse
    let isCorrect = false;

    // Calculate the leftmost filled column of the piece
    const shape = TETROMINO_SHAPES[finalPiece.type][finalPiece.rotation];
    let leftmostFilledCol = shape[0].length;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] && x < leftmostFilledCol) {
          leftmostFilledCol = x;
        }
      }
    }
    // The actual column is the bounding box x plus the leftmost filled offset
    const actualColumn = finalPiece.x + leftmostFilledCol;

    if (target && gameMode !== 'FREE_STACK') {
      // Check if position matches target (comparing actual leftmost columns)
      // For Z, S, I pieces: rotations 0/2 are equivalent, and rotations 1/3 are equivalent
      const pieceType = finalPiece.type;
      const isTwoRotationPiece = pieceType === 'Z' || pieceType === 'S' || pieceType === 'I';
      const rotationMatches = isTwoRotationPiece
        ? (finalPiece.rotation % 2) === (target.rotation % 2)
        : finalPiece.rotation === target.rotation;
      const positionCorrect = actualColumn === target.column && rotationMatches;

      // For Z, S, I pieces, check moves against both equivalent rotations (1 and 3)
      // since CW and CCW both reach valid vertical positions with different finesse
      let movesCorrect = compareMoves(moveListRef.current, target.moves);
      if (!movesCorrect && isTwoRotationPiece && rotationMatches) {
        // Get moves for the player's actual rotation
        const pieceIndex = PIECE_MAP[currentPiece.type];
        const playerRotationMoves = getOptimalMoves(pieceIndex, actualColumn, finalPiece.rotation);
        movesCorrect = compareMoves(moveListRef.current, playerRotationMoves);
      }

      isCorrect = positionCorrect && movesCorrect;
    } else if (gameMode === 'FREE_STACK') {
      // In free stack, check finesse for the actual position
      const pieceIndex = PIECE_MAP[currentPiece.type];
      const optimalMoves = getOptimalMoves(pieceIndex, actualColumn, finalPiece.rotation);
      isCorrect = compareMoves(moveListRef.current, optimalMoves);
    }

    // Update stats
    const newTotal = score.total + 1;
    const newCorrect = score.correct + (isCorrect ? 1 : 0);
    const newCombo = isCorrect ? score.combo + 1 : 0;
    const newTopCombo = Math.max(score.topCombo, newCombo);
    const newTotalKeys = score.totalKeys + keyCountRef.current;

    setScore({
      correct: newCorrect,
      total: newTotal,
      combo: newCombo,
      topCombo: newTopCombo,
      kpp: newTotalKeys / newTotal,
      totalKeys: newTotalKeys
    });

    // Record result in learning progress for LEARNING mode
    if (gameMode === 'LEARNING' && learningContext && learningTargetRef.current) {
      learningContext.recordResult(
        learningTargetRef.current.piece,
        learningTargetRef.current.column,
        learningTargetRef.current.rotation,
        isCorrect
      );
    }

    // If retry on fault is enabled and finesse was incorrect, reset piece
    if (settings.retryOnFault && !isCorrect && gameMode !== 'FREE_STACK') {
      resetPiece(false); // Don't reset combo again, already done above
      return;
    }

    // Clear current piece immediately to prevent ghost from showing during spawn delay
    setCurrentPiece(null);
    currentPieceRef.current = null;

    // In finesse practice modes, reset board and spawn next piece
    if (gameMode !== 'FREE_STACK') {
      setGrid(createEmptyGrid());
      setTimeout(() => spawnPiece(), 50);
    } else {
      // In free stack mode, place piece and check for lines
      const shape = TETROMINO_SHAPES[finalPiece.type][finalPiece.rotation];
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        for (let y = 0; y < shape.length; y++) {
          for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] && finalPiece.y + y >= 0) {
              newGrid[finalPiece.y + y][finalPiece.x + x] = finalPiece.type;
            }
          }
        }
        // Clear lines - check from bottom, re-check same row after clear
        let y = GRID_HEIGHT - 1;
        while (y >= 0) {
          if (newGrid[y].every(cell => cell !== null)) {
            newGrid.splice(y, 1);
            newGrid.unshift(Array(GRID_WIDTH).fill(null));
            // Don't decrement y - check same index again since rows shifted
          } else {
            y--;
          }
        }
        return newGrid;
      });
      setTimeout(() => spawnPiece(), 50);
    }
  }, [currentPiece, checkCollision, gameOver, target, gameMode, score, spawnPiece, settings, resetPiece, learningContext]);

  const hold = useCallback(() => {
    if (!currentPiece || !canHold || gameOver || gameMode !== 'FREE_STACK') return;

    if (holdPiece === null) {
      setHoldPiece(currentPiece.type);
      spawnPiece();
    } else {
      const tempType = holdPiece;
      setHoldPiece(currentPiece.type);
      spawnPiece(tempType);
    }
    setCanHold(false);
  }, [currentPiece, holdPiece, canHold, gameOver, gameMode, spawnPiece]);

  // Stable movePiece for DAS loop and key handlers - uses refs to avoid dependency changes
  const stableMovePiece = useCallback((dx: number, dy: number): boolean => {
    const piece = currentPieceRef.current;
    const currentGrid = gridRef.current;
    if (!piece || gameOverRef.current) return false;

    // Check collision
    const shape = TETROMINO_SHAPES[piece.type][piece.rotation];
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = piece.x + x + dx;
          const newY = piece.y + y + dy;
          if (newX < 0 || newX >= GRID_WIDTH || newY >= GRID_HEIGHT) {
            return false;
          }
          if (newY >= 0 && currentGrid[newY][newX]) {
            return false;
          }
        }
      }
    }

    setCurrentPiece(prev => prev ? { ...prev, x: prev.x + dx, y: prev.y + dy } : null);
    return true;
  }, []);

  // Key press handlers for move tracking
  const handleLeftPress = useCallback(() => {
    if (gameOverRef.current || !currentPieceRef.current) return;
    leftHeldRef.current = true;
    leftDasRef.current = false;
    leftDasCounterRef.current = 0;
    leftArrCounterRef.current = 0;
    stableMovePiece(-1, 0);
  }, [stableMovePiece]);

  const handleLeftRelease = useCallback(() => {
    leftHeldRef.current = false;
    if (leftDasRef.current) {
      moveListRef.current.push('DL');
    } else {
      moveListRef.current.push('L');
    }
    keyCountRef.current++;
    leftDasRef.current = false;
    setCurrentMoves([...moveListRef.current]);
  }, []);

  const handleRightPress = useCallback(() => {
    if (gameOverRef.current || !currentPieceRef.current) return;
    rightHeldRef.current = true;
    rightDasRef.current = false;
    rightDasCounterRef.current = 0;
    rightArrCounterRef.current = 0;
    stableMovePiece(1, 0);
  }, [stableMovePiece]);

  const handleRightRelease = useCallback(() => {
    rightHeldRef.current = false;
    if (rightDasRef.current) {
      moveListRef.current.push('DR');
    } else {
      moveListRef.current.push('R');
    }
    keyCountRef.current++;
    rightDasRef.current = false;
    setCurrentMoves([...moveListRef.current]);
  }, []);

  // Move piece all the way in a direction (for instant ARR)
  const movePieceToWall = useCallback((direction: -1 | 1) => {
    // Use ref to get latest piece (handles same-frame updates after hold)
    const piece = currentPieceRef.current;
    if (!piece) return;

    const currentGrid = gridRef.current;
    let newX = piece.x;

    while (true) {
      const testX = newX + direction;
      const shape = TETROMINO_SHAPES[piece.type][piece.rotation];
      let collision = false;

      for (let y = 0; y < shape.length && !collision; y++) {
        for (let x = 0; x < shape[y].length && !collision; x++) {
          if (shape[y][x]) {
            const gridX = testX + x;
            const gridY = piece.y + y;
            if (gridX < 0 || gridX >= GRID_WIDTH || (gridY >= 0 && currentGrid[gridY]?.[gridX])) {
              collision = true;
            }
          }
        }
      }

      if (collision) break;
      newX = testX;
    }

    const newPiece = { ...piece, x: newX };
    setCurrentPiece(newPiece);
    currentPieceRef.current = newPiece;
  }, []);

  // Move piece all the way down (for instant SDR)
  const softDropToBottom = useCallback(() => {
    // Use ref to get latest piece (handles same-frame updates after hold)
    const piece = currentPieceRef.current;
    if (!piece) return;

    const currentGrid = gridRef.current;
    let newY = piece.y;

    while (true) {
      const testY = newY + 1;
      const shape = TETROMINO_SHAPES[piece.type][piece.rotation];
      let collision = false;

      for (let y = 0; y < shape.length && !collision; y++) {
        for (let x = 0; x < shape[y].length && !collision; x++) {
          if (shape[y][x]) {
            const gridX = piece.x + x;
            const gridY = testY + y;
            if (gridY >= GRID_HEIGHT || (gridY >= 0 && currentGrid[gridY]?.[gridX])) {
              collision = true;
            }
          }
        }
      }

      if (collision) break;
      newY = testY;
    }

    const newPiece = { ...piece, y: newY };
    setCurrentPiece(newPiece);
    currentPieceRef.current = newPiece;
  }, []);

  // Track if there's an active piece (for dependency without causing re-runs on every move)
  const hasActivePiece = !!currentPiece;

  // DAS update loop - simple approach: check held keys each frame and apply movement
  useEffect(() => {
    if (gameOver || !hasActivePiece) return;

    const DAS_DELAY = settings.DAS;
    const ARR = settings.ARR;
    const SDR = settings.SDR;

    const interval = setInterval(() => {
      // Left movement
      if (leftHeldRef.current) {
        if (leftDasCounterRef.current < DAS_DELAY) {
          leftDasCounterRef.current++;
        }
        if (leftDasCounterRef.current >= DAS_DELAY) {
          leftDasRef.current = true;
          if (ARR === -1) {
            // Instant - move to wall every frame (idempotent if already there)
            movePieceToWall(-1);
          } else if (ARR === 0) {
            stableMovePiece(-1, 0);
          } else {
            leftArrCounterRef.current++;
            if (leftArrCounterRef.current >= ARR) {
              leftArrCounterRef.current = 0;
              stableMovePiece(-1, 0);
            }
          }
        }
      }

      // Right movement
      if (rightHeldRef.current) {
        if (rightDasCounterRef.current < DAS_DELAY) {
          rightDasCounterRef.current++;
        }
        if (rightDasCounterRef.current >= DAS_DELAY) {
          rightDasRef.current = true;
          if (ARR === -1) {
            // Instant - move to wall every frame (idempotent if already there)
            movePieceToWall(1);
          } else if (ARR === 0) {
            stableMovePiece(1, 0);
          } else {
            rightArrCounterRef.current++;
            if (rightArrCounterRef.current >= ARR) {
              rightArrCounterRef.current = 0;
              stableMovePiece(1, 0);
            }
          }
        }
      }

      // Soft drop
      if (softDropHeldRef.current) {
        if (SDR === -1) {
          // Instant - drop to bottom every frame (idempotent if already there)
          softDropToBottom();
        } else if (SDR === 0) {
          stableMovePiece(0, 1);
        } else {
          softDropCounterRef.current++;
          if (softDropCounterRef.current >= SDR) {
            softDropCounterRef.current = 0;
            stableMovePiece(0, 1);
          }
        }
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [gameOver, hasActivePiece, stableMovePiece, movePieceToWall, softDropToBottom, settings]);

  const startGame = useCallback(() => {
    setGrid(createEmptyGrid());
    setHoldPiece(null);
    setCanHold(true);
    setScore({ correct: 0, total: 0, combo: 0, topCombo: 0, kpp: 0, totalKeys: 0 });
    setGameOver(false);
    bagRef.current = [];
    nextBagRef.current = [];
    moveListRef.current = [];
    spawnPiece();
  }, [spawnPiece]);

  const cycleMode = useCallback(() => {
    const modes: GameMode[] = ['RANDOM', 'Z_ONLY', 'S_ONLY', 'I_ONLY', 'T_ONLY', 'O_ONLY', 'L_ONLY', 'J_ONLY', 'FREE_STACK', 'LEARNING'];
    const currentIndex = modes.indexOf(gameMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setGameMode(nextMode);
    // Restart with new mode
    setGrid(createEmptyGrid());
    setHoldPiece(null);
    setScore({ correct: 0, total: 0, combo: 0, topCombo: 0, kpp: 0, totalKeys: 0 });
    setGameOver(true);
  }, [gameMode]);

  const setMode = useCallback((mode: GameMode) => {
    setGameMode(mode);
    // Reset with new mode
    setGrid(createEmptyGrid());
    setHoldPiece(null);
    setScore({ correct: 0, total: 0, combo: 0, topCombo: 0, kpp: 0, totalKeys: 0 });
    setGameOver(true);
  }, []);

  const handleAction = useCallback((action: string, isKeyDown: boolean) => {
    switch (action) {
      case 'MOVE_LEFT':
        if (isKeyDown) handleLeftPress();
        else handleLeftRelease();
        break;
      case 'MOVE_RIGHT':
        if (isKeyDown) handleRightPress();
        else handleRightRelease();
        break;
      case 'SOFT_DROP':
        if (isKeyDown) {
          softDropHeldRef.current = true;
          softDropCounterRef.current = 0;
          movePiece(0, 1);
          moveListRef.current.push('SD');
          keyCountRef.current++;
          setCurrentMoves([...moveListRef.current]);
        } else {
          softDropHeldRef.current = false;
        }
        break;
      case 'HARD_DROP':
        if (isKeyDown) {
          if (gameOver) {
            startGame();
          } else {
            hardDrop();
          }
        }
        break;
      case 'ROTATE_CW':
        if (isKeyDown) rotatePiece(1);
        break;
      case 'ROTATE_CCW':
        if (isKeyDown) rotatePiece(-1);
        break;
      case 'ROTATE_180':
        if (isKeyDown) rotate180();
        break;
      case 'HOLD':
        if (isKeyDown) hold();
        break;
      case 'RESET':
        if (isKeyDown) startGame();
        break;
      case 'CHANGE_MODE':
        if (isKeyDown) cycleMode();
        break;
    }
  }, [handleLeftPress, handleLeftRelease, handleRightPress, handleRightRelease, movePiece, hardDrop, rotatePiece, rotate180, hold, gameOver, startGame, cycleMode]);

  // Get target piece for rendering
  const getTargetPiece = useCallback((): Piece | null => {
    if (!target || !currentPiece || gameMode === 'FREE_STACK') return null;

    // Calculate proper Y position based on piece shape
    const shape = TETROMINO_SHAPES[currentPiece.type][target.rotation];

    // Find the lowest row in the shape that has filled cells
    let lowestFilledRow = 0;
    for (let y = shape.length - 1; y >= 0; y--) {
      if (shape[y].some(cell => cell)) {
        lowestFilledRow = y;
        break;
      }
    }

    // Find the leftmost column in the shape that has filled cells
    let leftmostFilledCol = shape[0].length;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] && x < leftmostFilledCol) {
          leftmostFilledCol = x;
        }
      }
    }

    // Position so the bottom of the piece sits at the bottom of the grid
    const yPos = (GRID_HEIGHT - 1) - lowestFilledRow;

    // The target column refers to where the leftmost filled cell should be
    // So we need to subtract the leftmost filled column offset
    const xPos = target.column - leftmostFilledCol;

    return {
      type: currentPiece.type,
      rotation: target.rotation,
      x: xPos,
      y: yPos,
    };
  }, [target, currentPiece, gameMode]);

  return {
    grid,
    currentPiece,
    nextQueue,
    holdPiece,
    canHold,
    score,
    gameOver,
    gameMode,
    target,
    currentMoves,
    startGame,
    handleAction,
    getTargetPiece,
    cycleMode,
    setMode,
  };
}
