"use client";

import { useState, useEffect, useCallback } from 'react';

export interface GameSettings {
  DAS: number;      // Delayed Auto Shift (frames before auto-repeat starts)
  ARR: number;      // Auto Repeat Rate (frames between repeats, -1 = instant)
  SDR: number;      // Soft Drop Rate (frames between soft drops, -1 = instant)
  retryOnFault: boolean;
  showGhost: boolean;
  masterMode: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  DAS: 12,
  ARR: 1,
  SDR: 1,
  retryOnFault: false,
  showGhost: true,
  masterMode: false,
};

const STORAGE_KEY = 'finesse-game-settings';

export function useGameSettings() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch (e) {
        console.error('Failed to load game settings', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings, mounted]);

  const updateSetting = useCallback(<K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
  };
}
