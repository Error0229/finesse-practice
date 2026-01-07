"use client";

import { useDifficultySystem, DifficultyTier, DIFFICULTY_TIERS } from '@/hooks/use-difficulty-system';

/**
 * Compact difficulty tier indicator
 */
export function DifficultyIndicator() {
  const { state, tierSettings } = useDifficultySystem();
  const { difficultyTier, isInFlow, currentDifficulty, flowStreak } = state;

  return (
    <div className="flex items-center gap-2">
      {/* Tier badge */}
      <div
        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
        style={{
          backgroundColor: tierSettings.color + '20',
          color: tierSettings.color,
          border: `1px solid ${tierSettings.color}40`,
        }}
      >
        {tierSettings.name}
      </div>

      {/* Flow indicator */}
      {isInFlow && (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/40">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-[10px] font-bold text-yellow-400">
            FLOW x{flowStreak}
          </span>
        </div>
      )}

      {/* Difficulty score */}
      <div className="text-[10px] text-white/40">
        Lv.{currentDifficulty}
      </div>
    </div>
  );
}

/**
 * Full difficulty stats panel
 */
export function DifficultyStats() {
  const { state, tierSettings, setDifficultyTier } = useDifficultySystem();
  const {
    currentAccuracy,
    averageResponseTime,
    consistencyScore,
    isInFlow,
    flowStreak,
    currentDifficulty,
    difficultyTier,
    adaptiveSpeed,
  } = state;

  const tiers: DifficultyTier[] = ['CASUAL', 'STANDARD', 'HARDCORE', 'INSANE'];

  return (
    <div className="bg-black/60 backdrop-blur border border-white/10 rounded-lg p-3 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: tierSettings.color }}
          />
          <span className="text-[10px] uppercase tracking-widest text-white/60">Difficulty</span>
        </div>

        {/* Flow state badge */}
        {isInFlow && (
          <div
            className="px-2 py-0.5 rounded text-[9px] font-black uppercase animate-streak-glow"
            style={{ color: '#ffd700' }}
          >
            IN THE ZONE
          </div>
        )}
      </div>

      {/* Difficulty level bar */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-white/60">Level</span>
          <span className="font-bold" style={{ color: tierSettings.color }}>
            {currentDifficulty}/100
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${currentDifficulty}%`,
              background: `linear-gradient(90deg, ${DIFFICULTY_TIERS.CASUAL.color}, ${DIFFICULTY_TIERS.STANDARD.color}, ${DIFFICULTY_TIERS.HARDCORE.color}, ${DIFFICULTY_TIERS.INSANE.color})`,
            }}
          />
        </div>
        {/* Tier markers */}
        <div className="flex justify-between mt-0.5 text-[8px] text-white/30">
          <span>Casual</span>
          <span>Standard</span>
          <span>Hardcore</span>
          <span>Insane</span>
        </div>
      </div>

      {/* Current tier info */}
      <div
        className="p-2 rounded mb-3"
        style={{
          backgroundColor: tierSettings.color + '10',
          border: `1px solid ${tierSettings.color}30`,
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold" style={{ color: tierSettings.color }}>
            {tierSettings.name}
          </span>
          {adaptiveSpeed !== 1 && (
            <span className={`text-[9px] ${adaptiveSpeed > 1 ? 'text-green-400' : 'text-yellow-400'}`}>
              {adaptiveSpeed > 1 ? 'Speed +20%' : 'Speed -20%'}
            </span>
          )}
        </div>
        <div className="text-[10px] text-white/50">
          {tierSettings.description}
        </div>
      </div>

      {/* Performance metrics */}
      <div className="space-y-1.5 mb-3">
        <MetricBar
          label="Accuracy"
          value={currentAccuracy}
          format={(v) => `${(v * 100).toFixed(0)}%`}
          thresholds={[0.5, 0.75, 0.9]}
        />
        <MetricBar
          label="Speed"
          value={Math.max(0, 1 - averageResponseTime / 2000)}
          format={() => `${Math.round(averageResponseTime)}ms`}
          thresholds={[0.25, 0.6, 0.8]}
          inverted
        />
        <MetricBar
          label="Consistency"
          value={consistencyScore}
          format={(v) => `${(v * 100).toFixed(0)}%`}
          thresholds={[0.4, 0.6, 0.8]}
        />
      </div>

      {/* Flow streak */}
      {flowStreak > 0 && (
        <div className="flex items-center justify-between p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
          <span className="text-yellow-400 text-[10px]">Flow Streak</span>
          <span className="text-yellow-400 font-bold">{flowStreak}</span>
        </div>
      )}

      {/* Tier selector */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="text-[10px] text-white/40 mb-2">Override Tier:</div>
        <div className="flex gap-1">
          {tiers.map((tier) => (
            <button
              key={tier}
              onClick={() => setDifficultyTier(tier)}
              className={`flex-1 px-1 py-1 rounded text-[9px] font-bold uppercase transition-all ${
                difficultyTier === tier
                  ? 'opacity-100'
                  : 'opacity-40 hover:opacity-70'
              }`}
              style={{
                backgroundColor: DIFFICULTY_TIERS[tier].color + '20',
                color: DIFFICULTY_TIERS[tier].color,
                border: difficultyTier === tier
                  ? `1px solid ${DIFFICULTY_TIERS[tier].color}`
                  : '1px solid transparent',
              }}
            >
              {tier.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Metric bar with color thresholds
 */
function MetricBar({
  label,
  value,
  format,
  thresholds,
  inverted = false,
}: {
  label: string;
  value: number;
  format: (v: number) => string;
  thresholds: [number, number, number];
  inverted?: boolean;
}) {
  const getColor = () => {
    const v = inverted ? 1 - value : value;
    if (v >= thresholds[2]) return '#22c55e'; // Green
    if (v >= thresholds[1]) return '#eab308'; // Yellow
    if (v >= thresholds[0]) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-white/50">{label}</span>
        <span style={{ color: getColor() }}>{format(value)}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${value * 100}%`,
            backgroundColor: getColor(),
          }}
        />
      </div>
    </div>
  );
}

/**
 * Compact flow indicator for header
 */
export function FlowIndicator() {
  const { state } = useDifficultySystem();
  const { isInFlow, flowStreak, currentDifficulty } = state;

  if (!isInFlow) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
      <div className="relative">
        <div className="w-2 h-2 rounded-full bg-yellow-400" />
        <div className="absolute inset-0 w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
      </div>
      <span className="text-yellow-400 font-bold text-xs">
        FLOW x{flowStreak}
      </span>
      <span className="text-white/40 text-[10px]">
        Lv.{currentDifficulty}
      </span>
    </div>
  );
}
