"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface GameSettings {
  DAS: number;      // Delayed Auto Shift (frames before auto-repeat starts)
  ARR: number;      // Auto Repeat Rate (frames between repeats, -1 = instant)
  SDR: number;      // Soft Drop Rate (frames between soft drops, -1 = instant)
  retryOnFault: boolean;
  showGhost: boolean;
  masterMode: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  DAS: 10,
  ARR: -1,  // Instant by default for finesse practice
  SDR: -1,  // Instant by default for finesse practice
  retryOnFault: false,
  showGhost: true,
  masterMode: false,
};

export const STORAGE_KEY = 'finesse-game-settings';

export interface GameSettingsContextType {
  settings: GameSettings;
  updateSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
  resetSettings: () => void;
}

export const GameSettingsContext = createContext<GameSettingsContextType | null>(null);

export function useGameSettings() {
  const context = useContext(GameSettingsContext);
  if (!context) {
    throw new Error('useGameSettings must be used within a GameSettingsProvider');
  }
  return context;
}
