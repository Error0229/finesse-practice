"use client";

import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  GameSettings,
  GameSettingsContext,
  DEFAULT_SETTINGS,
  STORAGE_KEY
} from '@/hooks/use-game-settings';

function getInitialSettings(): GameSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
}

export function GameSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GameSettings>(getInitialSettings);
  const mountedRef = useRef(true);

  // Save to localStorage
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
