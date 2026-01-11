"use client";

import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  GameSettings,
  GameSettingsContext,
  DEFAULT_SETTINGS,
  STORAGE_KEY
} from '@/hooks/use-game-settings';

export function GameSettingsProvider({ children }: { children: ReactNode }) {
  // Always start with defaults to avoid hydration mismatch
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const mountedRef = useRef(false);

  // Load from localStorage on mount (client-only)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
      } catch {
        // Invalid stored data, keep defaults
      }
    }
    mountedRef.current = true;
  }, []);

  // Save to localStorage after initial mount
  useEffect(() => {
    if (mountedRef.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return (
    <GameSettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </GameSettingsContext.Provider>
  );
}
