"use client";

import { useState, useCallback } from 'react';
import { KeyBinding, GameAction, DEFAULT_KEY_BINDINGS } from '@/lib/types';

const STORAGE_KEY = 'finesse-key-bindings';
const STORAGE_VERSION_KEY = 'finesse-key-bindings-version';
const CURRENT_VERSION = 2; // v2 uses event.code instead of event.key

function getInitialBindings(): KeyBinding[] {
  if (typeof window === 'undefined') return DEFAULT_KEY_BINDINGS;

  // Check version - if old format, clear and use defaults
  const version = localStorage.getItem(STORAGE_VERSION_KEY);
  if (version !== String(CURRENT_VERSION)) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
    return DEFAULT_KEY_BINDINGS;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_KEY_BINDINGS;
    }
  }
  return DEFAULT_KEY_BINDINGS;
}

export function useKeyBindings() {
  const [bindings, setBindings] = useState<KeyBinding[]>(getInitialBindings);
  const [listening, setListening] = useState<GameAction | null>(null);

  // Save bindings to localStorage
  const saveBindings = useCallback((newBindings: KeyBinding[]) => {
    setBindings(newBindings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBindings));
    localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
  }, []);

  // Start listening for a key
  const startListening = useCallback((action: GameAction) => {
    setListening(action);
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    setListening(null);
  }, []);

  // Update a specific binding
  const updateBinding = useCallback((action: GameAction, newKey: string) => {
    const newBindings = bindings.map(b =>
      b.action === action ? { ...b, key: newKey } : b
    );
    saveBindings(newBindings);
    stopListening();
  }, [bindings, saveBindings, stopListening]);

  // Reset to defaults
  const resetBindings = useCallback(() => {
    saveBindings(DEFAULT_KEY_BINDINGS);
  }, [saveBindings]);

  // Get action for a key code
  const getAction = useCallback((code: string): GameAction | undefined => {
    return bindings.find(b => b.key === code)?.action;
  }, [bindings]);

  // Get key for an action
  const getKey = useCallback((action: GameAction): string | undefined => {
    return bindings.find(b => b.action === action)?.key;
  }, [bindings]);

  return {
    bindings,
    listening,
    startListening,
    stopListening,
    updateBinding,
    resetBindings,
    getAction,
    getKey,
  };
}
