"use client";

import { useVisualEffects, Particle, ActiveEffect } from '@/hooks/use-visual-effects';
import { useMemo } from 'react';

/**
 * Particle renderer component
 */
export function ParticleRenderer() {
  const { state } = useVisualEffects();
  const { particles } = state;

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      <svg className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          {/* Glow filter for particles */}
          <filter id="particle-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {particles.map(particle => (
          <ParticleShape key={particle.id} particle={particle} />
        ))}
      </svg>
    </div>
  );
}

/**
 * Individual particle shape renderer
 */
function ParticleShape({ particle }: { particle: Particle }) {
  const { type, x, y, size, color, rotation, opacity } = particle;

  switch (type) {
    case 'SPARK':
      return (
        <circle
          cx={x}
          cy={y}
          r={size / 2}
          fill={color}
          opacity={opacity}
          filter="url(#particle-glow)"
        />
      );

    case 'STAR':
      // 4-pointed star
      const starSize = size;
      const starPoints = `
        ${x},${y - starSize}
        ${x + starSize * 0.3},${y - starSize * 0.3}
        ${x + starSize},${y}
        ${x + starSize * 0.3},${y + starSize * 0.3}
        ${x},${y + starSize}
        ${x - starSize * 0.3},${y + starSize * 0.3}
        ${x - starSize},${y}
        ${x - starSize * 0.3},${y - starSize * 0.3}
      `;
      return (
        <polygon
          points={starPoints}
          fill={color}
          opacity={opacity}
          transform={`rotate(${rotation} ${x} ${y})`}
          filter="url(#particle-glow)"
        />
      );

    case 'RING':
      return (
        <circle
          cx={x}
          cy={y}
          r={size}
          fill="none"
          stroke={color}
          strokeWidth={3}
          opacity={opacity * 0.5}
          filter="url(#particle-glow)"
        />
      );

    case 'BURST':
      return (
        <circle
          cx={x}
          cy={y}
          r={size / 2}
          fill={color}
          opacity={opacity}
          filter="url(#particle-glow)"
        />
      );

    case 'CONFETTI':
      // Rotating rectangle
      return (
        <rect
          x={x - size / 2}
          y={y - size / 4}
          width={size}
          height={size / 2}
          fill={color}
          opacity={opacity}
          transform={`rotate(${rotation} ${x} ${y})`}
          rx={1}
        />
      );

    default:
      return null;
  }
}

/**
 * Screen effects overlay (flash, shake container)
 */
export function ScreenEffects({ children }: { children: React.ReactNode }) {
  const { state } = useVisualEffects();
  const { activeEffects, screenShake, borderGlow, streakLevel } = state;

  // Find flash effect
  const flashEffect = activeEffects.find(e => e.type === 'SCREEN_FLASH');
  const flashOpacity = flashEffect
    ? flashEffect.intensity * (1 - (performance.now() - flashEffect.startTime) / flashEffect.duration)
    : 0;

  // Streak fire colors
  const streakColors = ['transparent', '#22c55e', '#eab308', '#f97316', '#ef4444'];
  const streakColor = streakColors[streakLevel] || 'transparent';

  return (
    <div
      className="relative transition-transform duration-75"
      style={{
        transform: `translate(${screenShake.x}px, ${screenShake.y}px)`,
      }}
    >
      {/* Border glow effect */}
      {(borderGlow.intensity > 0 || streakLevel > 0) && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none z-10 transition-all duration-200"
          style={{
            boxShadow: borderGlow.intensity > 0
              ? `inset 0 0 ${20 * borderGlow.intensity}px ${borderGlow.color},
                 0 0 ${30 * borderGlow.intensity}px ${borderGlow.color}`
              : streakLevel > 1
                ? `inset 0 0 ${10 * streakLevel}px ${streakColor},
                   0 0 ${15 * streakLevel}px ${streakColor}`
                : 'none',
          }}
        />
      )}

      {/* Content */}
      {children}

      {/* Flash overlay */}
      {flashOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none z-20 rounded-lg animate-screen-flash"
          style={{
            backgroundColor: flashEffect?.color || 'white',
            opacity: flashOpacity,
          }}
        />
      )}
    </div>
  );
}

/**
 * Streak fire border effect
 */
export function StreakFireBorder() {
  const { state } = useVisualEffects();
  const { streakLevel } = state;

  if (streakLevel < 2) return null;

  const colors = ['', '', '#22c55e', '#f97316', '#ef4444'];
  const color = colors[streakLevel];

  return (
    <div
      className="absolute inset-0 pointer-events-none z-5 rounded-lg"
      style={{
        background: `linear-gradient(180deg, ${color}20 0%, transparent 30%, transparent 70%, ${color}20 100%)`,
        animation: 'fire-flicker 0.5s ease-in-out infinite alternate',
      }}
    >
      {/* Animated fire particles at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-8 overflow-hidden">
        {[...Array(streakLevel * 3)].map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0 rounded-full animate-fire-rise"
            style={{
              left: `${10 + (i * 20) + Math.random() * 10}%`,
              width: `${4 + Math.random() * 4}px`,
              height: `${8 + Math.random() * 8}px`,
              backgroundColor: color,
              opacity: 0.6 + Math.random() * 0.4,
              animationDelay: `${Math.random() * 0.5}s`,
              animationDuration: `${0.5 + Math.random() * 0.3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Combo flash indicator
 */
export function ComboFlash() {
  const { state } = useVisualEffects();
  const { comboFlash } = state;

  if (!comboFlash) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-15 rounded-lg animate-combo-flash"
      style={{ backgroundColor: 'rgba(255, 215, 0, 0.3)' }}
    />
  );
}

/**
 * Milestone celebration overlay
 */
export function MilestoneCelebration() {
  const { state } = useVisualEffects();
  const milestoneEffect = state.activeEffects.find(e => e.type === 'MILESTONE');

  if (!milestoneEffect) return null;

  const progress = (performance.now() - milestoneEffect.startTime) / milestoneEffect.duration;
  const opacity = progress < 0.1 ? progress * 10 : progress > 0.8 ? (1 - progress) * 5 : 1;

  const type = milestoneEffect.data?.type as string || 'Achievement';
  const value = milestoneEffect.data?.value as number || 0;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
      style={{ opacity }}
    >
      <div className="text-center animate-judgment-pop">
        <div
          className="text-4xl font-black uppercase tracking-wider mb-2"
          style={{
            color: '#ffd700',
            textShadow: '0 0 20px #ffd700, 0 0 40px #ffd700, 0 0 60px #ffd700',
          }}
        >
          {type}!
        </div>
        {value > 0 && (
          <div
            className="text-2xl font-bold"
            style={{
              color: '#fff',
              textShadow: '0 0 10px rgba(255,255,255,0.8)',
            }}
          >
            {value}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Full visual effects layer - wrap around game board
 */
export function VisualEffectsLayer({ children }: { children: React.ReactNode }) {
  return (
    <ScreenEffects>
      <div className="relative">
        {children}
        <ParticleRenderer />
        <ComboFlash />
        <StreakFireBorder />
        <MilestoneCelebration />
      </div>
    </ScreenEffects>
  );
}
