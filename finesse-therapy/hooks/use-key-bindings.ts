"use client";

import { useState, useEffect, useCallback } from 'react';
import { KeyBinding, GameAction, DEFAULT_KEY_BINDINGS } from '@/lib/types';

const STORAGE_KEY = 'finesse-key-bindings';

export function useKeyBindings() {
  const [bindings, setBindings] = useState<KeyBinding[]>(DEFAULT_KEY_BINDINGS);
  const [listening, setListening] = useState<GameAction | null>(null);

  // Load bindings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setBindings(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load key bindings', e);
      }
    }
  }, []);

  // Save bindings to localStorage
  const saveBindings = useCallback((newBindings: KeyBinding[]) => {
    setBindings(newBindings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBindings));
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

  // Get action for a key
  const getAction = useCallback((key: string): GameAction | undefined => {
    return bindings.find(b => b.key === key)?.action;
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
