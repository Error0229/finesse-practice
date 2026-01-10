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
 * Simplified - removed border glow effects that looked like miss indicators
 */
export function ScreenEffects({ children }: { children: React.ReactNode }) {
  const { state } = useVisualEffects();
  const { activeEffects, screenShake } = state;

  // Find flash effect
  const flashEffect = activeEffects.find(e => e.type === 'SCREEN_FLASH');
  const flashOpacity = flashEffect
    ? flashEffect.intensity * (1 - (performance.now() - flashEffect.startTime) / flashEffect.duration)
    : 0;

  return (
    <div
      className="relative transition-transform duration-75"
      style={{
        transform: `translate(${screenShake.x}px, ${screenShake.y}px)`,
      }}
    >
      {/* Content */}
      {children}

      {/* Flash overlay - very subtle */}
      {flashOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none z-20 rounded-lg animate-screen-flash"
          style={{
            backgroundColor: flashEffect?.color || 'white',
            opacity: flashOpacity * 0.3, // Reduced opacity
          }}
        />
      )}
    </div>
  );
}

/**
 * Streak fire border effect - disabled to reduce visual noise
 */
export function StreakFireBorder() {
  return null;
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
