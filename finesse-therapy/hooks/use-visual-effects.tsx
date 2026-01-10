"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { HitJudgment, JUDGMENT_COLORS } from './use-rhythm-system';

/**
 * Particle types
 */
export type ParticleType = 'SPARK' | 'STAR' | 'RING' | 'BURST' | 'CONFETTI';

/**
 * Effect types
 */
export type EffectType =
  | 'SCREEN_FLASH'
  | 'SCREEN_SHAKE'
  | 'BORDER_GLOW'
  | 'COMBO_BURST'
  | 'STREAK_FIRE'
  | 'PERFECT_BURST'
  | 'LEVEL_UP'
  | 'MILESTONE';

/**
 * Particle definition
 */
export interface Particle {
  id: string;
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  opacity: number;
}

/**
 * Active effect
 */
export interface ActiveEffect {
  id: string;
  type: EffectType;
  startTime: number;
  duration: number;
  intensity: number;
  color: string;
  data?: Record<string, unknown>;
}

/**
 * Visual state
 */
export interface VisualState {
  particles: Particle[];
  activeEffects: ActiveEffect[];
  screenShake: { x: number; y: number };
  borderGlow: { color: string; intensity: number };
  streakLevel: number; // 0-4 for fire intensity
  comboFlash: boolean;
}

const DEFAULT_VISUAL_STATE: VisualState = {
  particles: [],
  activeEffects: [],
  screenShake: { x: 0, y: 0 },
  borderGlow: { color: 'transparent', intensity: 0 },
  streakLevel: 0,
  comboFlash: false,
};

/**
 * Context interface
 */
export interface VisualEffectsContextType {
  state: VisualState;

  // Trigger effects
  triggerJudgmentEffect: (judgment: HitJudgment, x: number, y: number) => void;
  triggerComboEffect: (combo: number) => void;
  triggerStreakEffect: (streak: number) => void;
  triggerMilestoneEffect: (type: string, value: number) => void;
  triggerScreenFlash: (color: string, duration?: number) => void;
  triggerScreenShake: (intensity?: number, duration?: number) => void;

  // Spawn particles
  spawnParticles: (type: ParticleType, count: number, x: number, y: number, color: string) => void;

  // Reset
  clearEffects: () => void;
}

export const VisualEffectsContext = createContext<VisualEffectsContextType | null>(null);

/**
 * Hook to access visual effects
 */
export function useVisualEffects(): VisualEffectsContextType {
  const context = useContext(VisualEffectsContext);
  if (!context) {
    throw new Error('useVisualEffects must be used within a VisualEffectsProvider');
  }
  return context;
}

// Particle system constants
const MAX_PARTICLES = 200;
const PARTICLE_CONFIGS: Record<ParticleType, {
  minSize: number;
  maxSize: number;
  minLife: number;
  maxLife: number;
  gravity: number;
  speed: number;
}> = {
  SPARK: { minSize: 2, maxSize: 6, minLife: 300, maxLife: 600, gravity: 0.1, speed: 8 },
  STAR: { minSize: 8, maxSize: 16, minLife: 400, maxLife: 800, gravity: 0, speed: 3 },
  RING: { minSize: 20, maxSize: 60, minLife: 500, maxLife: 800, gravity: 0, speed: 0 },
  BURST: { minSize: 4, maxSize: 12, minLife: 200, maxLife: 500, gravity: 0.2, speed: 12 },
  CONFETTI: { minSize: 6, maxSize: 12, minLife: 1500, maxLife: 3000, gravity: 0.05, speed: 6 },
};

// Effect configurations
const EFFECT_CONFIGS: Record<EffectType, { defaultDuration: number; defaultIntensity: number }> = {
  SCREEN_FLASH: { defaultDuration: 150, defaultIntensity: 0.3 },
  SCREEN_SHAKE: { defaultDuration: 200, defaultIntensity: 5 },
  BORDER_GLOW: { defaultDuration: 500, defaultIntensity: 1 },
  COMBO_BURST: { defaultDuration: 300, defaultIntensity: 1 },
  STREAK_FIRE: { defaultDuration: 1000, defaultIntensity: 1 },
  PERFECT_BURST: { defaultDuration: 500, defaultIntensity: 1 },
  LEVEL_UP: { defaultDuration: 2000, defaultIntensity: 1 },
  MILESTONE: { defaultDuration: 3000, defaultIntensity: 1 },
};

// Confetti colors
const CONFETTI_COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#a855f7', '#f472b6'];

let particleIdCounter = 0;
let effectIdCounter = 0;

/**
 * Provider props
 */
interface VisualEffectsProviderProps {
  children: React.ReactNode;
}

/**
 * Visual Effects Provider
 */
export function VisualEffectsProvider({ children }: VisualEffectsProviderProps) {
  const [state, setState] = useState<VisualState>(DEFAULT_VISUAL_STATE);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(performance.now());

  // Animation loop for particles and effects
  useEffect(() => {
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastFrameTimeRef.current;
      lastFrameTimeRef.current = currentTime;

      setState(prev => {
        // Update particles
        const updatedParticles = prev.particles
          .map(p => ({
            ...p,
            x: p.x + p.vx * (deltaTime / 16),
            y: p.y + p.vy * (deltaTime / 16),
            vy: p.vy + p.gravity * (deltaTime / 16),
            life: p.life - deltaTime,
            rotation: p.rotation + p.rotationSpeed * (deltaTime / 16),
            opacity: Math.max(0, p.life / p.maxLife),
            size: p.type === 'RING'
              ? p.size + (deltaTime / 16) * 2  // Rings expand
              : p.size * (0.99 ** (deltaTime / 16)),  // Others shrink slightly
          }))
          .filter(p => p.life > 0);

        // Update active effects
        const now = performance.now();
        const updatedEffects = prev.activeEffects.filter(
          e => now - e.startTime < e.duration
        );

        // Calculate screen shake from active effects
        const shakeEffect = updatedEffects.find(e => e.type === 'SCREEN_SHAKE');
        const screenShake = shakeEffect
          ? {
              x: (Math.random() - 0.5) * shakeEffect.intensity * 2,
              y: (Math.random() - 0.5) * shakeEffect.intensity * 2,
            }
          : { x: 0, y: 0 };

        // Calculate border glow from active effects
        const glowEffect = updatedEffects.find(e => e.type === 'BORDER_GLOW' || e.type === 'STREAK_FIRE');
        const borderGlow = glowEffect
          ? {
              color: glowEffect.color,
              intensity: glowEffect.intensity * (1 - (now - glowEffect.startTime) / glowEffect.duration),
            }
          : { color: 'transparent', intensity: 0 };

        return {
          ...prev,
          particles: updatedParticles,
          activeEffects: updatedEffects,
          screenShake,
          borderGlow,
        };
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  /**
   * Spawn particles at a position
   */
  const spawnParticles = useCallback((
    type: ParticleType,
    count: number,
    x: number,
    y: number,
    color: string
  ) => {
    const config = PARTICLE_CONFIGS[type];
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = config.speed * (0.5 + Math.random() * 0.5);

      newParticles.push({
        id: `particle-${particleIdCounter++}`,
        type,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'CONFETTI' ? 3 : 0),
        size: config.minSize + Math.random() * (config.maxSize - config.minSize),
        color: type === 'CONFETTI' ? CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] : color,
        life: config.minLife + Math.random() * (config.maxLife - config.minLife),
        maxLife: config.maxLife,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        gravity: config.gravity,
        opacity: 1,
      });
    }

    setState(prev => ({
      ...prev,
      particles: [...prev.particles, ...newParticles].slice(-MAX_PARTICLES),
    }));
  }, []);

  /**
   * Add an active effect
   */
  const addEffect = useCallback((
    type: EffectType,
    color: string,
    duration?: number,
    intensity?: number,
    data?: Record<string, unknown>
  ) => {
    const config = EFFECT_CONFIGS[type];
    const effect: ActiveEffect = {
      id: `effect-${effectIdCounter++}`,
      type,
      startTime: performance.now(),
      duration: duration ?? config.defaultDuration,
      intensity: intensity ?? config.defaultIntensity,
      color,
      data,
    };

    setState(prev => ({
      ...prev,
      activeEffects: [...prev.activeEffects, effect],
    }));
  }, []);

  /**
   * Trigger judgment effect based on hit quality
   * Simplified effects - removed distracting border glows
   */
  const triggerJudgmentEffect = useCallback((judgment: HitJudgment, x: number, y: number) => {
    const color = JUDGMENT_COLORS[judgment];

    switch (judgment) {
      case 'PERFECT':
        // Burst of golden particles (no border glow)
        spawnParticles('BURST', 16, x, y, color);
        spawnParticles('STAR', 4, x, y, color);
        break;

      case 'GREAT':
        // Medium burst of green particles
        spawnParticles('BURST', 10, x, y, color);
        break;

      case 'GOOD':
        // Small burst of blue sparks
        spawnParticles('SPARK', 8, x, y, color);
        break;

      case 'MISS':
      case 'TOO_SLOW':
        // Minimal feedback - just a small shake, no red flash
        addEffect('SCREEN_SHAKE', color, 100, 3);
        break;
    }
  }, [spawnParticles, addEffect]);

  /**
   * Trigger combo milestone effects - simplified
   */
  const triggerComboEffect = useCallback((combo: number) => {
    // Subtle flash effect on combo
    setState(prev => ({ ...prev, comboFlash: true }));
    setTimeout(() => {
      setState(prev => ({ ...prev, comboFlash: false }));
    }, 100);

    // Only celebrate big milestones with minimal effects
    if (combo === 25) {
      spawnParticles('STAR', 8, 140, 280, '#ffd700');
    } else if (combo === 50) {
      spawnParticles('STAR', 12, 140, 280, '#ffd700');
    } else if (combo === 100) {
      spawnParticles('STAR', 16, 140, 280, '#ffd700');
      spawnParticles('CONFETTI', 20, 140, 100, '#ffd700');
    }
  }, [spawnParticles]);

  /**
   * Update streak effect - simplified, no border fire
   */
  const triggerStreakEffect = useCallback((streak: number) => {
    // Calculate streak level (0-4) but don't show fire effects
    let level = 0;
    if (streak >= 50) level = 4;
    else if (streak >= 25) level = 3;
    else if (streak >= 10) level = 2;
    else if (streak >= 5) level = 1;

    setState(prev => ({ ...prev, streakLevel: level }));
    // No fire border effects - too distracting
  }, []);

  /**
   * Trigger milestone celebration
   */
  const triggerMilestoneEffect = useCallback((type: string, value: number) => {
    // Big celebration with confetti
    spawnParticles('CONFETTI', 80, 140, 0, '#ffd700');
    spawnParticles('STAR', 20, 140, 200, '#ffd700');
    spawnParticles('RING', 2, 140, 280, '#22c55e');
    addEffect('SCREEN_FLASH', '#ffd700', 200, 0.3);
    addEffect('SCREEN_SHAKE', '#ffd700', 300, 5);
    addEffect('BORDER_GLOW', '#22c55e', 1500, 1);
    addEffect('MILESTONE', '#ffd700', 3000, 1, { type, value });
  }, [spawnParticles, addEffect]);

  /**
   * Trigger screen flash
   */
  const triggerScreenFlash = useCallback((color: string, duration = 150) => {
    addEffect('SCREEN_FLASH', color, duration, 0.3);
  }, [addEffect]);

  /**
   * Trigger screen shake
   */
  const triggerScreenShake = useCallback((intensity = 5, duration = 200) => {
    addEffect('SCREEN_SHAKE', '#fff', duration, intensity);
  }, [addEffect]);

  /**
   * Clear all effects
   */
  const clearEffects = useCallback(() => {
    setState(DEFAULT_VISUAL_STATE);
  }, []);

  const value: VisualEffectsContextType = {
    state,
    triggerJudgmentEffect,
    triggerComboEffect,
    triggerStreakEffect,
    triggerMilestoneEffect,
    triggerScreenFlash,
    triggerScreenShake,
    spawnParticles,
    clearEffects,
  };

  return (
    <VisualEffectsContext.Provider value={value}>
      {children}
    </VisualEffectsContext.Provider>
  );
}
