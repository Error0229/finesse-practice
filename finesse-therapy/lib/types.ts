// Tetromino types
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

// Game actions
export type GameAction =
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'SOFT_DROP'
  | 'HARD_DROP'
  | 'ROTATE_CW'
  | 'ROTATE_CCW'
  | 'ROTATE_180'
  | 'HOLD'
  | 'RESET'
  | 'CHANGE_MODE';

// Key binding mapping
export interface KeyBinding {
  key: string;
  action: GameAction;
}

// Default key bindings
export const DEFAULT_KEY_BINDINGS: KeyBinding[] = [
  { key: 'ArrowLeft', action: 'MOVE_LEFT' },
  { key: 'ArrowRight', action: 'MOVE_RIGHT' },
  { key: 'ArrowDown', action: 'SOFT_DROP' },
  { key: 'ArrowUp', action: 'HARD_DROP' },
  { key: 'z', action: 'ROTATE_CCW' },
  { key: 'x', action: 'ROTATE_CW' },
  { key: 'c', action: 'ROTATE_180' },
  { key: ' ', action: 'HOLD' },
  { key: 'Escape', action: 'RESET' },
  { key: 'Tab', action: 'CHANGE_MODE' },
];

// Game modes
export type GameMode =
  | 'ALL_RANDOM'
  | 'Z_ONLY'
  | 'S_ONLY'
  | 'I_ONLY'
  | 'T_ONLY'
  | 'O_ONLY'
  | 'L_ONLY'
  | 'J_ONLY'
  | 'FREE_STACKING';

// Tetromino shapes (SRS)
export const TETROMINO_SHAPES: Record<TetrominoType, number[][][]> = {
  I: [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
    [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
  ],
  O: [
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]],
  ],
  T: [
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
  ],
  S: [
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
    [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
    [[1, 0, 0], [1, 1, 0], [0, 1, 0]],
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
    [[0, 1, 0], [1, 1, 0], [1, 0, 0]],
  ],
  J: [
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
    [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
  ],
  L: [
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
    [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
    [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
  ],
};

// Game state
export interface GameState {
  grid: (TetrominoType | null)[][];
  currentPiece: {
    type: TetrominoType;
    rotation: number;
    x: number;
    y: number;
  } | null;
  hold: TetrominoType | null;
  canHold: boolean;
  queue: TetrominoType[];
  score: {
    correct: number;
    total: number;
    combo: number;
    topCombo: number;
    kpp: number;
  };
  gameOver: boolean;
  mode: GameMode;
}

// Finesse move tracking
export type FinesseMove = 'LEFT' | 'RIGHT' | 'DAS_LEFT' | 'DAS_RIGHT' | 'SOFT_DROP' | 'HARD_DROP' | 'ROTATE_CW' | 'ROTATE_CCW' | 'ROTATE_180';

export interface FinesseTarget {
  col: number;
  rotation: number;
  row: number;
  moves: FinesseMove[][];
}
