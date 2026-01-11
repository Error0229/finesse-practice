"use client";

import { useMemo, useState } from "react";
import { useLearningProgress, MasteryGridData } from "@/hooks/use-learning-progress";
import { RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";

// Piece colors matching tetromino theme
const PIECE_COLORS: Record<string, { base: string; glow: string }> = {
  Z: { base: "#ef4444", glow: "0 0 8px #ef4444" },
  S: { base: "#22c55e", glow: "0 0 8px #22c55e" },
  I: { base: "#06b6d4", glow: "0 0 8px #06b6d4" },
  T: { base: "#a855f7", glow: "0 0 8px #a855f7" },
  O: { base: "#eab308", glow: "0 0 8px #eab308" },
  L: { base: "#f97316", glow: "0 0 8px #f97316" },
  J: { base: "#3b82f6", glow: "0 0 8px #3b82f6" },
};

const PIECES = ["Z", "S", "I", "T", "O", "L", "J"] as const;

/**
 * Get color based on mastery level
 */
function getMasteryColor(accuracy: number, mastered: boolean): string {
  if (accuracy < 0) return "rgba(128,128,128,0.15)"; // Not started - neutral gray
  if (mastered) return "#22c55e"; // Green - mastered
  if (accuracy >= 0.8) return "#84cc16"; // Lime
  if (accuracy >= 0.6) return "#eab308"; // Yellow
  if (accuracy >= 0.4) return "#f97316"; // Orange
  if (accuracy >= 0.2) return "#ef4444"; // Red
  return "#dc2626"; // Dark red
}

function getMasteryGlow(accuracy: number, mastered: boolean): string {
  if (accuracy < 0) return "none";
  if (mastered) return "0 0 6px #22c55e, 0 0 12px rgba(34,197,94,0.3)";
  if (accuracy >= 0.6) return `0 0 4px ${getMasteryColor(accuracy, mastered)}`;
  return "none";
}

interface LearningProgressProps {
  className?: string;
}

export function LearningProgress({ className }: LearningProgressProps) {
  const { progress, getMasteryGrid, getOverallStats, resetProgress } = useLearningProgress();
  const [hoveredPattern, setHoveredPattern] = useState<string | null>(null);

  const masteryGrid = useMemo(() => getMasteryGrid(), [getMasteryGrid]);
  const stats = useMemo(() => getOverallStats(), [getOverallStats]);

  const sessionStats = {
    attempts: progress.currentSession.attempts,
    correct: progress.currentSession.correct,
    accuracy: progress.currentSession.attempts > 0
      ? (progress.currentSession.correct / progress.currentSession.attempts * 100)
      : 0,
  };

  const masteryPercent = (stats.masteredCount / stats.totalPatterns) * 100;

  return (
    <div className={`${className} flex flex-col gap-4 font-mono text-xs h-full`}>
      {/* Header Stats */}
      <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            <span className="text-xs font-bold uppercase tracking-widest text-foreground">MASTERY PROGRESS</span>
          </div>
          <button
            onClick={resetProgress}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-muted-foreground hover:text-white"
            title="Reset progress"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Circular progress */}
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                className="stroke-muted/30"
                strokeWidth="2.5"
              />
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${masteryPercent * 0.94} 100`}
                style={{ filter: "drop-shadow(0 0 6px rgba(34,197,94,0.4))" }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-sm font-bold text-foreground">{Math.round(masteryPercent)}%</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
            <StatItem label="Mastered" value={stats.masteredCount} total={stats.totalPatterns} color="text-green-400" />
            <StatItem label="Learning" value={stats.inProgressCount} color="text-yellow-400" />
            <StatItem label="Session" value={sessionStats.correct} total={sessionStats.attempts} color="text-cyan-400" />
            <StatItem label="Accuracy" value={`${sessionStats.accuracy.toFixed(0)}%`} color={sessionStats.accuracy > 80 ? "text-green-400" : "text-orange-400"} />
          </div>
        </div>
      </Card>

      {/* 3D Visualization */}
      <Card className="flex-1 min-h-[300px] bg-card/50 backdrop-blur-sm border-border/50 relative overflow-hidden flex flex-col">
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-bold border border-border/30 px-2 py-1 rounded bg-black/20">
            3D VISUALIZATION
          </span>
        </div>

        <div className="absolute top-3 right-3 z-10 pointer-events-none text-[9px] text-muted-foreground/50 text-right">
           DRAG TO ROTATE<br/>SCROLL TO ZOOM
        </div>

        <div className="flex-1 w-full relative">
           <InteractiveCube
            masteryGrid={masteryGrid}
            hoveredPattern={hoveredPattern}
            setHoveredPattern={setHoveredPattern}
           />
        </div>
        
         {/* Hover tooltip - fixed at bottom */}
         <div className="h-8 border-t border-border/30 bg-black/20 flex items-center justify-center">
            {hoveredPattern ? (
              <span className="text-xs font-bold text-cyan-400 animate-in fade-in slide-in-from-bottom-2">
                {hoveredPattern}
              </span>
            ) : (
               <span className="text-[10px] text-muted-foreground/50">
                 Hover over nodes to see details
               </span>
            )}
         </div>
      </Card>

      {/* Legend */}
      <div className="grid grid-cols-7 gap-1">
          {PIECES.map((piece) => {
            const pieceData = masteryGrid.pieces.find(p => p.piece === piece);
            const totalPatterns = pieceData?.rotations.reduce((sum, r) => sum + r.columns.length, 0) || 0;
            const masteredPatterns = pieceData?.rotations.reduce((sum, r) =>
              sum + r.columns.filter(c => c.mastered).length, 0) || 0;
            
            const isComplete = masteredPatterns === totalPatterns && totalPatterns > 0;

            return (
              <div key={piece} className={`
                flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all duration-300
                ${isComplete ? 'bg-primary/10 border-primary/30' : 'bg-card/30 border-transparent'}
              `}>
                <div
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    backgroundColor: PIECE_COLORS[piece].base,
                    boxShadow: isComplete ? PIECE_COLORS[piece].glow : "none",
                  }}
                />
                <span className={`text-[9px] font-bold ${isComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {masteredPatterns}/{totalPatterns}
                </span>
              </div>
            );
          })}
        </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  total,
  color
}: {
  label: string;
  value: number | string;
  total?: number;
  color: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-[9px] uppercase tracking-wider">{label}</span>
      <span className={`${color} font-mono font-bold text-sm tracking-tight`}>
        {value}{total !== undefined && <span className="text-muted-foreground/40 text-xs">/{total}</span>}
      </span>
    </div>
  );
}

/**
 * Interactive 3D Cube Visualization
 */
function InteractiveCube({
  masteryGrid,
  hoveredPattern,
  setHoveredPattern,
}: {
  masteryGrid: MasteryGridData;
  hoveredPattern: string | null;
  setHoveredPattern: (pattern: string | null) => void;
}) {
    // Rotation state
    const [rot, setRot] = useState({ x: -20, y: 45 });
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setLastMouse({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - lastMouse.x;
        const deltaY = e.clientY - lastMouse.y;
        
        setRot(prev => ({
            x: Math.max(-90, Math.min(90, prev.x + deltaY * 0.5)),
            y: prev.y + deltaX * 0.5
        }));
        setLastMouse({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleMouseLeave = () => setIsDragging(false);
    
    // 3D Projection Logic
    const project = (x: number, y: number, z: number) => {
        // Convert degrees to radians
        const radX = (rot.x * Math.PI) / 180;
        const radY = (rot.y * Math.PI) / 180;

        // Rotate around Y axis
        let x1 = x * Math.cos(radY) - z * Math.sin(radY);
        let z1 = x * Math.sin(radY) + z * Math.cos(radY);

        // Rotate around X axis
        let y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
        let z2 = y * Math.sin(radX) + z1 * Math.cos(radX);

        // Perspective projection (simple)
        const scale = 400 / (400 - z2) * zoom; // Perspective depth
        
        return {
            x: x1 * scale,
            y: y2 * scale,
            z: z2, // Store depth for z-sorting if needed
            scale
        };
    };

   // Prepare elements to render
   const elements: any[] = [];
   const SPACING = 25; // Space between nodes
   const LAYER_HEIGHT = 40; // Space between piece layers
   
   PIECES.forEach((piece, pIndex) => {
       const pieceData = masteryGrid.pieces.find(p => p.piece === piece);
       if(!pieceData) return;
       
       // Center the model roughly
       const layerY = (pIndex - 3) * LAYER_HEIGHT; 

       pieceData.rotations.forEach((rotData, rIndex) => {
           rotData.columns.forEach((colData, cIndex) => {
             // Center grid
             const posX = (cIndex - 4.5) * SPACING;
             const posZ = (rIndex - 1.5) * SPACING;
             
             const projected = project(posX, layerY, posZ);
             
             elements.push({
                 id: `${piece}-${rIndex}-${cIndex}`,
                 patternId: `${piece} R${rotData.rotation} C${colData.column}`,
                 x: projected.x,
                 y: projected.y,
                 z: projected.z,
                 scale: projected.scale,
                 color: getMasteryColor(colData.accuracy, colData.mastered),
                 glow: getMasteryGlow(colData.accuracy, colData.mastered),
                 accuracy: colData.accuracy,
                 pieceColor: PIECE_COLORS[piece].base
             });
           });
       });
   });

   // Sort by Z (painter's algorithm) - draw furthest first
   elements.sort((a, b) => a.z - b.z);

   // Axes definition
   const axisLength = 120;
   const axes = [
       { id: 'x', x: axisLength, y: 0, z: 0, color: 'red', label: 'Rot' },
       { id: 'y', x: 0, y: axisLength, z: 0, color: 'green', label: 'Piece' }, // Y is down in SVG but up in our logic usually
       { id: 'z', x: 0, y: 0, z: axisLength, color: 'blue', label: 'Col' },
   ].map(axis => {
       const start = project(0, 0, 0);
       const end = project(axis.x, axis.y, axis.z);
       return { ...axis, x1: start.x, y1: start.y, x2: end.x, y2: end.y };
   });


    return (
        <div 
            className="w-full h-full cursor-move active:cursor-grabbing flex items-center justify-center p-4 bg-transparent"
             onMouseDown={handleMouseDown}
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseLeave}
             onWheel={(e) => setZoom(z => Math.max(0.5, Math.min(2, z - e.deltaY * 0.001)))}
        >
            <svg 
                width="100%" 
                height="100%" 
                viewBox="-200 -200 400 400" 
                preserveAspectRatio="xMidYMid meet"
                className="overflow-visible"
            >
                <defs>
                   <radialGradient id="nodeGlow">
                      <stop offset="0%" stopColor="white" stopOpacity="0.8"/>
                      <stop offset="100%" stopColor="white" stopOpacity="0"/>
                   </radialGradient>
                </defs>
                
                {/* Axes */}
                {axes.map(axis => (
                    <g key={axis.id} opacity={0.3}>
                        <line 
                            x1={axis.x1} y1={axis.y1} 
                            x2={axis.x2} y2={axis.y2} 
                            stroke={axis.color} 
                            strokeWidth={1} 
                        />
                        <text 
                            x={axis.x2} y={axis.y2} 
                            fill={axis.color} 
                            fontSize={10} 
                            fontFamily="monospace"
                            dx={5} dy={5}
                        >
                            {axis.label}
                        </text>
                    </g>
                ))}

                {/* Nodes */}
                {elements.map((el) => {
                    const isHovered = hoveredPattern === el.patternId;
                    const size = isHovered ? 8 : 4;
                    const opacity = el.accuracy < 0 ? 0.2 : 0.9;
                    
                    return (
                        <g 
                            key={el.id} 
                            transform={`translate(${el.x}, ${el.y})`}
                            onMouseEnter={() => setHoveredPattern(el.patternId)}
                            onMouseLeave={() => setHoveredPattern(null)}
                            style={{ cursor: "pointer" }}
                        >
                            {/* Glow effect */}
                            <circle 
                                r={size * 3 * el.scale} 
                                fill={el.color} 
                                opacity={isHovered ? 0.4 : 0}
                                style={{ filter: "blur(4px)" }}
                            />
                            
                            {/* Core Node */}
                            <circle
                                r={size * el.scale}
                                fill={isHovered ? "#fff" : el.color}
                                fillOpacity={opacity}
                                stroke={isHovered ? el.pieceColor : "none"}
                                strokeWidth={1}
                            />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
