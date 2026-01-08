"use client";

import { useRhythmSystem, JUDGMENT_COLORS } from '@/hooks/use-rhythm-system';
import { useDifficultySystem, DIFFICULTY_TIERS } from '@/hooks/use-difficulty-system';

/**
 * Combined compact gamification stats panel
 * Merges Rhythm + Difficulty into one clean component
 */
export function GamificationPanel() {
  const { state: rhythmState } = useRhythmSystem();
  const { state: difficultyState, tierSettings } = useDifficultySystem();

  const {
    totalScore,
    perfectCount,
    greatCount,
    goodCount,
    missCount,
    rhythmCombo,
    currentMultiplier,
  } = rhythmState;

  const {
    currentAccuracy,
    averageResponseTime,
    currentDifficulty,
    isInFlow,
    flowStreak,
  } = difficultyState;

  const totalJudgments = perfectCount + greatCount + goodCount + missCount;

  return (
    <div className="bg-black/50 backdrop-blur border border-white/10 rounded-lg p-2.5 font-mono text-xs">
      {/* Score + Difficulty Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
            style={{
              backgroundColor: tierSettings.color + '25',
              color: tierSettings.color,
            }}
          >
            {tierSettings.name}
          </div>
          <span className="text-white/40 text-[10px]">Lv.{currentDifficulty}</span>
        </div>
        {isInFlow && (
          <div className="flex items-center gap-1 text-yellow-400">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-[9px] font-bold">FLOW x{flowStreak}</span>
          </div>
        )}
      </div>

      {/* Score display */}
      <div className="text-center py-2 mb-2 bg-white/5 rounded">
        <div className="text-xl font-black text-white" style={{ textShadow: '0 0 8px rgba(255,255,255,0.3)' }}>
          {totalScore.toLocaleString()}
        </div>
        <div className="flex items-center justify-center gap-2 mt-1">
          {rhythmCombo > 0 && (
            <span className="text-[10px] text-cyan-400">{rhythmCombo}x combo</span>
          )}
          {currentMultiplier > 1 && (
            <span className="text-[10px] text-yellow-400">{currentMultiplier}x mult</span>
          )}
        </div>
      </div>

      {/* Judgment counts - compact row */}
      <div className="flex justify-between mb-2 px-1">
        <JudgmentDot label="P" count={perfectCount} color={JUDGMENT_COLORS.PERFECT} />
        <JudgmentDot label="G" count={greatCount} color={JUDGMENT_COLORS.GREAT} />
        <JudgmentDot label="OK" count={goodCount} color={JUDGMENT_COLORS.GOOD} />
        <JudgmentDot label="X" count={missCount} color={JUDGMENT_COLORS.MISS} />
      </div>

      {/* Performance bars */}
      <div className="space-y-1.5">
        <MiniBar
          label="Accuracy"
          value={currentAccuracy}
          format={`${(currentAccuracy * 100).toFixed(0)}%`}
        />
        <MiniBar
          label="Speed"
          value={Math.max(0, 1 - averageResponseTime / 2000)}
          format={`${Math.round(averageResponseTime)}ms`}
        />
      </div>

      {/* Difficulty bar */}
      <div className="mt-2 pt-2 border-t border-white/10">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${currentDifficulty}%`,
              background: `linear-gradient(90deg, ${DIFFICULTY_TIERS.CASUAL.color}, ${DIFFICULTY_TIERS.STANDARD.color}, ${DIFFICULTY_TIERS.HARDCORE.color}, ${DIFFICULTY_TIERS.INSANE.color})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function JudgmentDot({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold text-black"
        style={{ backgroundColor: color }}
      >
        {label}
      </div>
      <span className="text-[10px] mt-0.5" style={{ color }}>{count}</span>
    </div>
  );
}

function MiniBar({ label, value, format }: { label: string; value: number; format: string }) {
  const getColor = () => {
    if (value >= 0.8) return '#22c55e';
    if (value >= 0.5) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-white/40 text-[10px] w-14">{label}</span>
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${value * 100}%`, backgroundColor: getColor() }}
        />
      </div>
      <span className="text-[10px] w-10 text-right" style={{ color: getColor() }}>{format}</span>
    </div>
  );
}

/**
 * Ultra-compact stats strip for below game board
 */
export function StatsStrip() {
  const { state: rhythmState } = useRhythmSystem();
  const { state: difficultyState, tierSettings } = useDifficultySystem();

  return (
    <div className="flex items-center justify-center gap-4 text-[10px] font-mono">
      <div className="flex items-center gap-1.5">
        <span className="text-white/40">Score:</span>
        <span className="text-white font-bold">{rhythmState.totalScore.toLocaleString()}</span>
      </div>
      <div className="w-px h-3 bg-white/20" />
      <div className="flex items-center gap-1.5">
        <span className="text-white/40">Combo:</span>
        <span className="text-cyan-400 font-bold">{rhythmState.rhythmCombo}</span>
      </div>
      <div className="w-px h-3 bg-white/20" />
      <div className="flex items-center gap-1.5">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: tierSettings.color }}
        />
        <span style={{ color: tierSettings.color }}>{tierSettings.name}</span>
      </div>
      {difficultyState.isInFlow && (
        <>
          <div className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-1 text-yellow-400">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="font-bold">FLOW</span>
          </div>
        </>
      )}
    </div>
  );
}
