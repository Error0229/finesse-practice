"use client";

import { useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { TetrominoType, TETROMINO_SHAPES } from '@/lib/types';

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const CELL_SIZE = 28;

// Colors for each tetromino type
const TETROMINO_COLORS: Record<TetrominoType, [number, number, number]> = {
  I: [0, 240, 240],   // Cyan
  O: [240, 240, 0],   // Yellow
  T: [160, 0, 240],   // Purple
  S: [0, 240, 0],     // Green
  Z: [240, 0, 0],     // Red
  J: [0, 0, 240],     // Blue
  L: [240, 160, 0],   // Orange
};

interface Piece {
  type: TetrominoType;
  rotation: number;
  x: number;
  y: number;
}

interface TetrisCanvasProps {
  grid: (TetrominoType | null)[][];
  currentPiece: Piece | null;
  targetPiece: Piece | null;
  showGhost: boolean;
  gameMode: string;
}

// Calculate ghost Y position synchronously from the piece and grid
function calculateGhostY(piece: Piece, grid: (TetrominoType | null)[][]): number {
  const shape = TETROMINO_SHAPES[piece.type][piece.rotation];
  let ghostY = piece.y;

  while (true) {
    const testY = ghostY + 1;
    let collision = false;

    for (let py = 0; py < shape.length && !collision; py++) {
      for (let px = 0; px < shape[py].length && !collision; px++) {
        if (shape[py][px]) {
          const gx = piece.x + px;
          const gy = testY + py;
          if (gy >= GRID_HEIGHT || (gy >= 0 && grid[gy]?.[gx])) {
            collision = true;
          }
        }
      }
    }

    if (collision) break;
    ghostY = testY;
  }

  return ghostY;
}

export function TetrisCanvas({
  grid,
  currentPiece,
  targetPiece,
  showGhost,
  gameMode,
}: TetrisCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);

  // Vertex shader
  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec4 a_color;
    uniform vec2 u_resolution;
    varying vec4 v_color;

    void main() {
      vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      v_color = a_color;
    }
  `;

  // Fragment shader
  const fragmentShaderSource = `
    precision mediump float;
    varying vec4 v_color;

    void main() {
      gl_FragColor = v_color;
    }
  `;

  const createShader = useCallback((gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }, []);

  const createProgram = useCallback((gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }, []);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    glRef.current = gl;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;
    programRef.current = program;

    gl.useProgram(program);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }, [createShader, createProgram]);

  // Render loop - use useLayoutEffect to draw synchronously before browser paint
  // This prevents the one-frame delay where old content would be visible
  useLayoutEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;
    if (!gl || !program || !canvas) return;

    // Clear
    gl.clearColor(0.05, 0.05, 0.08, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const vertices: number[] = [];
    const colors: number[] = [];

    const addCell = (x: number, y: number, r: number, g: number, b: number, a: number) => {
      const x1 = x * CELL_SIZE + 1;
      const y1 = y * CELL_SIZE + 1;
      const x2 = x1 + CELL_SIZE - 2;
      const y2 = y1 + CELL_SIZE - 2;

      // Two triangles for a quad
      vertices.push(x1, y1, x2, y1, x1, y2);
      vertices.push(x1, y2, x2, y1, x2, y2);

      // Colors for each vertex (6 vertices per cell)
      for (let i = 0; i < 6; i++) {
        colors.push(r, g, b, a);
      }
    };

    const addCellBorder = (x: number, y: number, r: number, g: number, b: number, a: number) => {
      const x1 = x * CELL_SIZE;
      const y1 = y * CELL_SIZE;
      const x2 = x1 + CELL_SIZE;
      const y2 = y1 + CELL_SIZE;
      const borderWidth = 2;

      // Top border
      vertices.push(x1, y1, x2, y1, x1, y1 + borderWidth);
      vertices.push(x1, y1 + borderWidth, x2, y1, x2, y1 + borderWidth);
      // Bottom border
      vertices.push(x1, y2 - borderWidth, x2, y2 - borderWidth, x1, y2);
      vertices.push(x1, y2, x2, y2 - borderWidth, x2, y2);
      // Left border
      vertices.push(x1, y1, x1 + borderWidth, y1, x1, y2);
      vertices.push(x1, y2, x1 + borderWidth, y1, x1 + borderWidth, y2);
      // Right border
      vertices.push(x2 - borderWidth, y1, x2, y1, x2 - borderWidth, y2);
      vertices.push(x2 - borderWidth, y2, x2, y1, x2, y2);

      for (let i = 0; i < 24; i++) {
        colors.push(r, g, b, a);
      }
    };

    // Draw grid lines (subtle)
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const x1 = x * CELL_SIZE;
        const y1 = y * CELL_SIZE;
        const x2 = x1 + CELL_SIZE;
        const y2 = y1 + CELL_SIZE;

        // Right edge
        vertices.push(x2 - 1, y1, x2, y1, x2 - 1, y2);
        vertices.push(x2 - 1, y2, x2, y1, x2, y2);
        // Bottom edge
        vertices.push(x1, y2 - 1, x2, y2 - 1, x1, y2);
        vertices.push(x1, y2, x2, y2 - 1, x2, y2);

        for (let i = 0; i < 12; i++) {
          colors.push(0.15, 0.15, 0.18, 1);
        }
      }
    }

    // Draw target piece (if in finesse mode)
    if (targetPiece && gameMode !== 'FREE_STACK') {
      const shape = TETROMINO_SHAPES[targetPiece.type][targetPiece.rotation];
      for (let py = 0; py < shape.length; py++) {
        for (let px = 0; px < shape[py].length; px++) {
          if (shape[py][px]) {
            const gx = targetPiece.x + px;
            const gy = targetPiece.y + py;
            if (gy >= 0 && gy < GRID_HEIGHT && gx >= 0 && gx < GRID_WIDTH) {
              // Check if there's no piece here
              if (!grid[gy][gx]) {
                addCellBorder(gx, gy, 1, 1, 1, 0.6);
              }
            }
          }
        }
      }
    }

    // Draw ghost piece
    if (currentPiece && showGhost) {
      const ghostY = calculateGhostY(currentPiece, grid);
      const shape = TETROMINO_SHAPES[currentPiece.type][currentPiece.rotation];
      const [r, g, b] = TETROMINO_COLORS[currentPiece.type];
      for (let py = 0; py < shape.length; py++) {
        for (let px = 0; px < shape[py].length; px++) {
          if (shape[py][px]) {
            const gx = currentPiece.x + px;
            const gy = ghostY + py;
            if (gy >= 0 && gy < GRID_HEIGHT && gx >= 0 && gx < GRID_WIDTH) {
              // Check if there's no locked piece here
              if (!grid[gy][gx]) {
                addCell(gx, gy, r / 255 * 0.4, g / 255 * 0.4, b / 255 * 0.4, 1);
              }
            }
          }
        }
      }
    }

    // Draw locked cells
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = grid[y][x];
        if (cell) {
          const [r, g, b] = TETROMINO_COLORS[cell];
          addCell(x, y, r / 255, g / 255, b / 255, 1);
        }
      }
    }

    // Draw current piece
    if (currentPiece) {
      const shape = TETROMINO_SHAPES[currentPiece.type][currentPiece.rotation];
      const [r, g, b] = TETROMINO_COLORS[currentPiece.type];
      for (let py = 0; py < shape.length; py++) {
        for (let px = 0; px < shape[py].length; px++) {
          if (shape[py][px]) {
            const gx = currentPiece.x + px;
            const gy = currentPiece.y + py;
            if (gy >= 0 && gy < GRID_HEIGHT && gx >= 0 && gx < GRID_WIDTH) {
              addCell(gx, gy, r / 255, g / 255, b / 255, 1);
            }
          }
        }
      }
    }

    // Create and bind buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const colorLocation = gl.getAttribLocation(program, 'a_color');
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);

    // Cleanup
    gl.deleteBuffer(positionBuffer);
    gl.deleteBuffer(colorBuffer);
  }, [grid, currentPiece, targetPiece, showGhost, gameMode]);

  return (
    <canvas
      ref={canvasRef}
      width={GRID_WIDTH * CELL_SIZE}
      height={GRID_HEIGHT * CELL_SIZE}
      className="rounded"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
