"use client";

import { useState, useCallback, useEffect, createContext, useContext, ReactNode } from 'react';
import { KeyBinding, GameAction, DEFAULT_KEY_BINDINGS } from '@/lib/types';

const STORAGE_KEY = 'finesse-key-bindings';
const STORAGE_VERSION_KEY = 'finesse-key-bindings-version';
const CURRENT_VERSION = 3; // v3 uses event.code and has migration

// Map old e.key values to e.code values for migration
function migrateKeyToCode(key: string): string {
  // Already in code format
  if (key.startsWith('Key') || key.startsWith('Digit') || key.startsWith('Arrow') ||
      key.startsWith('Numpad') || key === 'Space' || key === 'Tab' || key === 'Escape' ||
      key.startsWith('Shift') || key.startsWith('Control') || key.startsWith('Alt')) {
    return key;
  }

  // Single lowercase letter -> KeyX
  if (/^[a-z]$/.test(key)) {
    return 'Key' + key.toUpperCase();
  }

  // Single uppercase letter -> KeyX
  if (/^[A-Z]$/.test(key)) {
    return 'Key' + key;
  }

  // Single digit -> DigitX
  if (/^[0-9]$/.test(key)) {
    return 'Digit' + key;
  }

  // Special characters
  const specialMap: Record<string, string> = {
    ' ': 'Space',
    ';': 'Semicolon',
    "'": 'Quote',
    ',': 'Comma',
    '.': 'Period',
    '/': 'Slash',
    '`': 'Backquote',
    '[': 'BracketLeft',
    ']': 'BracketRight',
    '\\': 'Backslash',
    '-': 'Minus',
    '=': 'Equal',
    'Enter': 'Enter',
    'Backspace': 'Backspace',
    'Shift': 'ShiftLeft',
    'Control': 'ControlLeft',
    'Alt': 'AltLeft',
  };

  return specialMap[key] || key;
}

function loadBindingsFromStorage(): KeyBinding[] {
  const version = localStorage.getItem(STORAGE_VERSION_KEY);
  const stored = localStorage.getItem(STORAGE_KEY);

  // No stored data - use defaults
  if (!stored) {
    localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
    return DEFAULT_KEY_BINDINGS;
  }

  try {
    const parsed = JSON.parse(stored);

    // Validate structure
    if (!Array.isArray(parsed) || parsed.length !== DEFAULT_KEY_BINDINGS.length) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
      return DEFAULT_KEY_BINDINGS;
    }

    // Migrate old versions to e.code format
    if (version !== String(CURRENT_VERSION)) {
      const migrated = parsed.map((b: KeyBinding) => ({
        ...b,
        key: migrateKeyToCode(b.key)
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
      return migrated;
    }

    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
    return DEFAULT_KEY_BINDINGS;
  }
}

interface KeyBindingsContextType {
  bindings: KeyBinding[];
  listening: GameAction | null;
  startListening: (action: GameAction) => void;
  stopListening: () => void;
  updateBinding: (action: GameAction, newKey: string) => void;
  resetBindings: () => void;
  getAction: (code: string) => GameAction | undefined;
  getKey: (action: GameAction) => string | undefined;
}

const KeyBindingsContext = createContext<KeyBindingsContextType | null>(null);

export function KeyBindingsProvider({ children }: { children: ReactNode }) {
  const [bindings, setBindings] = useState<KeyBinding[]>(DEFAULT_KEY_BINDINGS);
  const [listening, setListening] = useState<GameAction | null>(null);

  // Load from localStorage after hydration
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: load persisted settings once on mount
    setBindings(loadBindingsFromStorage());
  }, []);

  const saveBindings = useCallback((newBindings: KeyBinding[]) => {
    setBindings(newBindings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBindings));
    localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
  }, []);

  const startListening = useCallback((action: GameAction) => {
    setListening(action);
  }, []);

  const stopListening = useCallback(() => {
    setListening(null);
  }, []);

  const updateBinding = useCallback((action: GameAction, newKey: string) => {
    setBindings(prev => {
      const newBindings = prev.map(b =>
        b.action === action ? { ...b, key: newKey } : b
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBindings));
      localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
      return newBindings;
    });
    setListening(null);
  }, []);

  const resetBindings = useCallback(() => {
    saveBindings(DEFAULT_KEY_BINDINGS);
  }, [saveBindings]);

  const getAction = useCallback((code: string): GameAction | undefined => {
    return bindings.find(b => b.key === code)?.action;
  }, [bindings]);

  const getKey = useCallback((action: GameAction): string | undefined => {
    return bindings.find(b => b.action === action)?.key;
  }, [bindings]);

  return (
    <KeyBindingsContext.Provider value={{
      bindings,
      listening,
      startListening,
      stopListening,
      updateBinding,
      resetBindings,
      getAction,
      getKey,
    }}>
      {children}
    </KeyBindingsContext.Provider>
  );
}

export function useKeyBindings() {
  const context = useContext(KeyBindingsContext);
  if (!context) {
    throw new Error('useKeyBindings must be used within KeyBindingsProvider');
  }
  return context;
}
