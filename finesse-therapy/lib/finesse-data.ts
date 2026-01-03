// Finesse move types
export type FinesseMove = 'L' | 'R' | 'DL' | 'DR' | 'C' | 'CC' | 'DROP' | 'SD';

// Move display names
export const MOVE_NAMES: Record<FinesseMove, string> = {
  'L': 'LEFT',
  'R': 'RIGHT',
  'DL': 'DAS LEFT',
  'DR': 'DAS RIGHT',
  'C': 'CLOCKWISE',
  'CC': 'COUNTER-CW',
  'DROP': 'HARD DROP',
  'SD': 'SOFT DROP',
};

// Piece indices: Z=0, S=1, I=2, T=3, O=4, L=5, J=6
export type PieceIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Target positions: [column, rotation, row] for each piece and orientation
// Column is 0-9 (left to right), rotation is 0-3
export const FINESSE_TARGETS: Record<PieceIndex, [number, number][][]> = {
  // Z-mino
  0: [
    // horizontal (rotation 0)
    [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]],
    // vertical (rotation 3 - CCW from spawn)
    [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3]],
  ],
  // S-mino
  1: [
    [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]],
    [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3]],
  ],
  // I-mino
  2: [
    [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0]],
    [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3]],
  ],
  // T-mino
  3: [
    [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]],
    [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1]],
    [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2]],
    [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3]],
  ],
  // O-mino
  4: [
    [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0]],
  ],
  // L-mino
  5: [
    [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]],
    [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1]],
    [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2]],
    [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3]],
  ],
  // J-mino
  6: [
    [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]],
    [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1]],
    [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2]],
    [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3]],
  ],
};

// Optimal finesse moves for each piece, column index, and rotation
// Format: MOVES[pieceIndex][columnIndex][rotationIndex] = FinesseMove[][]
// Multiple arrays means multiple valid sequences (OR)
export const FINESSE_MOVES: Record<PieceIndex, FinesseMove[][][][]> = {
  // Z-mino
  0: [
    // horizontal positions (8 columns)
    [
      [['DL', 'DROP']],
      [['L', 'L', 'DROP'], ['DL', 'R', 'DROP']],
      [['L', 'DROP']],
      [['DROP']],
      [['R', 'DROP']],
      [['R', 'R', 'DROP']],
      [['DR', 'L', 'DROP']],
      [['DR', 'DROP']],
    ],
    // vertical positions (9 columns)
    [
      [['CC', 'DL', 'DROP']],
      [['DL', 'C', 'DROP']],
      [['CC', 'L', 'DROP']],
      [['CC', 'DROP']],
      [['C', 'DROP']],
      [['C', 'R', 'DROP']],
      [['C', 'R', 'R', 'DROP'], ['DR', 'L', 'CC', 'DROP']],
      [['DR', 'CC', 'DROP']],
      [['C', 'DR', 'DROP']],
    ],
  ],
  // S-mino
  1: [
    [
      [['DL', 'DROP']],
      [['L', 'L', 'DROP'], ['DL', 'R', 'DROP']],
      [['L', 'DROP']],
      [['DROP']],
      [['R', 'DROP']],
      [['R', 'R', 'DROP']],
      [['DR', 'L', 'DROP']],
      [['DR', 'DROP']],
    ],
    [
      [['CC', 'DL', 'DROP']],
      [['DL', 'C', 'DROP']],
      [['CC', 'L', 'DROP']],
      [['CC', 'DROP']],
      [['C', 'DROP']],
      [['C', 'R', 'DROP']],
      [['C', 'R', 'R', 'DROP'], ['DR', 'L', 'CC', 'DROP']],
      [['DR', 'CC', 'DROP']],
      [['C', 'DR', 'DROP']],
    ],
  ],
  // I-mino
  2: [
    [
      [['DL', 'DROP']],
      [['L', 'L', 'DROP'], ['DL', 'R', 'DROP']],
      [['L', 'DROP']],
      [['DROP']],
      [['R', 'DROP']],
      [['R', 'R', 'DROP'], ['DR', 'L', 'DROP']],
      [['DR', 'DROP']],
    ],
    [
      [['CC', 'DL', 'DROP']],
      [['DL', 'CC', 'DROP']],
      [['DL', 'C', 'DROP']],
      [['L', 'CC', 'DROP']],
      [['CC', 'DROP']],
      [['C', 'DROP']],
      [['R', 'C', 'DROP']],
      [['DR', 'CC', 'DROP']],
      [['DR', 'C', 'DROP']],
      [['C', 'DR', 'DROP']],
    ],
  ],
  // T-mino
  3: [
    // flat down
    [
      [['DL', 'DROP']],
      [['L', 'L', 'DROP'], ['DL', 'R', 'DROP']],
      [['L', 'DROP']],
      [['DROP']],
      [['R', 'DROP']],
      [['R', 'R', 'DROP']],
      [['DR', 'L', 'DROP']],
      [['DR', 'DROP']],
    ],
    // flat left
    [
      [['C', 'DL', 'DROP']],
      [['DL', 'C', 'DROP']],
      [['C', 'L', 'L', 'DROP'], ['DL', 'R', 'C', 'DROP']],
      [['C', 'L', 'DROP']],
      [['C', 'DROP']],
      [['C', 'R', 'DROP']],
      [['C', 'R', 'R', 'DROP']],
      [['C', 'DR', 'L', 'DROP']],
      [['DR', 'C', 'DROP']],
    ],
    // flat top
    [
      [['DL', 'C', 'C', 'DROP'], ['DL', 'CC', 'CC', 'DROP']],
      [['L', 'L', 'C', 'C', 'DROP'], ['DL', 'R', 'C', 'C', 'DROP']],
      [['L', 'C', 'C', 'DROP'], ['L', 'CC', 'CC', 'DROP']],
      [['C', 'C', 'DROP'], ['CC', 'CC', 'DROP']],
      [['R', 'C', 'C', 'DROP'], ['R', 'CC', 'CC', 'DROP']],
      [['R', 'R', 'C', 'C', 'DROP'], ['R', 'R', 'CC', 'CC', 'DROP']],
      [['DR', 'L', 'C', 'C', 'DROP'], ['DR', 'L', 'CC', 'CC', 'DROP']],
      [['DR', 'C', 'C', 'DROP'], ['DR', 'CC', 'CC', 'DROP']],
    ],
    // flat right
    [
      [['CC', 'DL', 'DROP']],
      [['CC', 'L', 'L', 'DROP'], ['DL', 'R', 'CC', 'DROP']],
      [['CC', 'L', 'DROP']],
      [['CC', 'DROP']],
      [['CC', 'R', 'DROP']],
      [['CC', 'R', 'R', 'DROP']],
      [['DR', 'L', 'CC', 'DROP']],
      [['DR', 'CC', 'DROP']],
      [['CC', 'DR', 'DROP']],
    ],
  ],
  // O-mino
  4: [
    [
      [['DL', 'DROP']],
      [['DL', 'R', 'DROP']],
      [['L', 'L', 'DROP']],
      [['L', 'DROP']],
      [['DROP']],
      [['R', 'DROP']],
      [['R', 'R', 'DROP']],
      [['DR', 'L', 'DROP']],
      [['DR', 'DROP']],
    ],
  ],
  // L-mino
  5: [
    [
      [['DL', 'DROP']],
      [['L', 'L', 'DROP'], ['DL', 'R', 'DROP']],
      [['L', 'DROP']],
      [['DROP']],
      [['R', 'DROP']],
      [['R', 'R', 'DROP']],
      [['DR', 'L', 'DROP']],
      [['DR', 'DROP']],
    ],
    [
      [['C', 'DL', 'DROP']],
      [['DL', 'C', 'DROP']],
      [['C', 'L', 'L', 'DROP'], ['DL', 'R', 'C', 'DROP']],
      [['C', 'L', 'DROP']],
      [['C', 'DROP']],
      [['C', 'R', 'DROP']],
      [['C', 'R', 'R', 'DROP']],
      [['C', 'DR', 'L', 'DROP']],
      [['DR', 'C', 'DROP']],
    ],
    [
      [['DL', 'C', 'C', 'DROP'], ['DL', 'CC', 'CC', 'DROP']],
      [['L', 'L', 'C', 'C', 'DROP'], ['DL', 'R', 'C', 'C', 'DROP']],
      [['L', 'C', 'C', 'DROP'], ['L', 'CC', 'CC', 'DROP']],
      [['C', 'C', 'DROP'], ['CC', 'CC', 'DROP']],
      [['R', 'C', 'C', 'DROP'], ['R', 'CC', 'CC', 'DROP']],
      [['R', 'R', 'C', 'C', 'DROP'], ['R', 'R', 'CC', 'CC', 'DROP']],
      [['DR', 'L', 'C', 'C', 'DROP'], ['DR', 'L', 'CC', 'CC', 'DROP']],
      [['DR', 'C', 'C', 'DROP'], ['DR', 'CC', 'CC', 'DROP']],
    ],
    [
      [['CC', 'DL', 'DROP']],
      [['CC', 'L', 'L', 'DROP'], ['DL', 'R', 'CC', 'DROP']],
      [['CC', 'L', 'DROP']],
      [['CC', 'DROP']],
      [['CC', 'R', 'DROP']],
      [['CC', 'R', 'R', 'DROP']],
      [['DR', 'L', 'CC', 'DROP']],
      [['DR', 'CC', 'DROP']],
      [['CC', 'DR', 'DROP']],
    ],
  ],
  // J-mino
  6: [
    [
      [['DL', 'DROP']],
      [['L', 'L', 'DROP'], ['DL', 'R', 'DROP']],
      [['L', 'DROP']],
      [['DROP']],
      [['R', 'DROP']],
      [['R', 'R', 'DROP']],
      [['DR', 'L', 'DROP']],
      [['DR', 'DROP']],
    ],
    [
      [['C', 'DL', 'DROP']],
      [['DL', 'C', 'DROP']],
      [['C', 'L', 'L', 'DROP'], ['DL', 'R', 'C', 'DROP']],
      [['C', 'L', 'DROP']],
      [['C', 'DROP']],
      [['C', 'R', 'DROP']],
      [['C', 'R', 'R', 'DROP']],
      [['C', 'DR', 'L', 'DROP']],
      [['DR', 'C', 'DROP']],
    ],
    [
      [['DL', 'C', 'C', 'DROP'], ['DL', 'CC', 'CC', 'DROP']],
      [['L', 'L', 'C', 'C', 'DROP'], ['DL', 'R', 'C', 'C', 'DROP']],
      [['L', 'C', 'C', 'DROP'], ['L', 'CC', 'CC', 'DROP']],
      [['C', 'C', 'DROP'], ['CC', 'CC', 'DROP']],
      [['R', 'C', 'C', 'DROP'], ['R', 'CC', 'CC', 'DROP']],
      [['R', 'R', 'C', 'C', 'DROP'], ['R', 'R', 'CC', 'CC', 'DROP']],
      [['DR', 'L', 'C', 'C', 'DROP'], ['DR', 'L', 'CC', 'CC', 'DROP']],
      [['DR', 'C', 'C', 'DROP'], ['DR', 'CC', 'CC', 'DROP']],
    ],
    [
      [['CC', 'DL', 'DROP']],
      [['CC', 'L', 'L', 'DROP'], ['DL', 'R', 'CC', 'DROP']],
      [['CC', 'L', 'DROP']],
      [['CC', 'DROP']],
      [['CC', 'R', 'DROP']],
      [['CC', 'R', 'R', 'DROP']],
      [['DR', 'L', 'CC', 'DROP']],
      [['DR', 'CC', 'DROP']],
      [['CC', 'DR', 'DROP']],
    ],
  ],
};

// Normalize moves - convert C,C to 180 for comparison if needed
function normalizeMoves(moves: FinesseMove[]): FinesseMove[] {
  const result: FinesseMove[] = [];
  for (let i = 0; i < moves.length; i++) {
    // Skip DROP and SD for prefix checking
    if (moves[i] === 'DROP' || moves[i] === 'SD') continue;
    result.push(moves[i]);
  }
  return result;
}

// Check if player moves are a valid prefix of any target sequence
// Used for retry-on-fault feature
export function isValidMovePrefix(playerMoves: FinesseMove[], targetMoves: FinesseMove[][]): boolean {
  if (!targetMoves || targetMoves.length === 0) return true;
  if (!playerMoves || playerMoves.length === 0) return true;

  // Normalize player moves (remove DROP/SD)
  const normalizedPlayer = normalizeMoves(playerMoves);
  if (normalizedPlayer.length === 0) return true;

  // Check if player moves are a prefix of any valid sequence
  for (const validSequence of targetMoves) {
    const normalizedValid = normalizeMoves(validSequence);

    // Check if player moves match the start of this sequence
    if (normalizedPlayer.length <= normalizedValid.length) {
      let isPrefix = true;
      for (let i = 0; i < normalizedPlayer.length; i++) {
        // Allow C,C as equivalent to 180 rotation target (if exists)
        if (normalizedPlayer[i] !== normalizedValid[i]) {
          isPrefix = false;
          break;
        }
      }
      if (isPrefix) return true;
    }

    // Also check sorted (order-independent for some moves)
    const sortedPlayer = [...normalizedPlayer].sort();
    const sortedValidPrefix = [...normalizedValid].slice(0, normalizedPlayer.length).sort();
    if (sortedPlayer.length === sortedValidPrefix.length &&
      sortedPlayer.every((m, i) => m === sortedValidPrefix[i])) {
      return true;
    }
  }

  return false;
}

// Compare player moves to target moves
export function compareMoves(playerMoves: FinesseMove[], targetMoves: FinesseMove[][]): boolean {
  if (!playerMoves || !targetMoves || targetMoves.length === 0) return false;

  // If player used fewer moves than optimal, count as correct (DAS preservation)
  if (playerMoves.length < targetMoves[0].length) {
    return true;
  }

  // If player used soft drop, count as correct
  if (playerMoves.includes('SD')) {
    return true;
  }

  // Check if player moves match any of the valid sequences
  for (const validSequence of targetMoves) {
    if (playerMoves.length === validSequence.length) {
      const sortedPlayer = [...playerMoves].sort();
      const sortedValid = [...validSequence].sort();
      if (sortedPlayer.every((m, i) => m === sortedValid[i])) {
        return true;
      }
    }
  }

  return false;
}

// Get optimal moves for a piece at a specific position
export function getOptimalMoves(
  pieceIndex: PieceIndex,
  columnIndex: number,
  rotationIndex: number
): FinesseMove[][] {
  const pieceData = FINESSE_MOVES[pieceIndex];
  if (!pieceData) return [];

  // Map rotation to array index based on piece type
  // Z, S, I only have 2 orientations (0=horizontal, 1=vertical)
  // For these pieces, rotation 0/2 map to index 0, rotation 1/3 map to index 1
  let arrayIndex = rotationIndex;
  if (pieceData.length === 1) {
    // O piece - only one orientation
    arrayIndex = 0;
  } else if (pieceData.length === 2) {
    // Z, S, I pieces - two orientations
    arrayIndex = rotationIndex % 2;
  }

  if (!pieceData[arrayIndex]) return [];
  const columnData = pieceData[arrayIndex][columnIndex];
  return columnData || [];
}

// Generate a random target for a piece
export function generateTarget(pieceIndex: PieceIndex): { column: number; rotation: number; moves: FinesseMove[][] } {
  const targets = FINESSE_TARGETS[pieceIndex];
  const rotationIndex = Math.floor(Math.random() * targets.length);
  const positions = targets[rotationIndex];
  const posIndex = Math.floor(Math.random() * positions.length);
  const [column, rotation] = positions[posIndex];

  const moves = getOptimalMoves(pieceIndex, posIndex, rotationIndex);

  return { column, rotation, moves };
}
