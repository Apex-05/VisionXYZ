'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ActiveMode } from '@/types/modes';

const FAVORITES_KEY = 'visionxyz:favorites';
const RECENTS_KEY = 'visionxyz:recents';
const MAX_RECENTS = 6;

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded — ignore */ }
}

export function usePreferences() {
  // Start with empty arrays so server and initial client render match (no hydration mismatch).
  // Populate from localStorage only after mount.
  const [favorites, setFavoritesState] = useState<ActiveMode[]>([]);
  const [recents, setRecentsState] = useState<ActiveMode[]>([]);

  useEffect(() => {
    setFavoritesState(readStorage<ActiveMode[]>(FAVORITES_KEY, []));
    setRecentsState(readStorage<ActiveMode[]>(RECENTS_KEY, []));
  }, []);

  useEffect(() => { writeStorage(FAVORITES_KEY, favorites); }, [favorites]);
  useEffect(() => { writeStorage(RECENTS_KEY, recents); }, [recents]);

  const toggleFavorite = useCallback((mode: ActiveMode) => {
    setFavoritesState((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  }, []);

  const isFavorite = useCallback(
    (mode: ActiveMode) => favorites.includes(mode),
    [favorites]
  );

  const addRecent = useCallback((mode: ActiveMode) => {
    if (mode === 'passthrough') return;
    setRecentsState((prev) => {
      const filtered = prev.filter((m) => m !== mode);
      return [mode, ...filtered].slice(0, MAX_RECENTS);
    });
  }, []);

  return { favorites, recents, toggleFavorite, isFavorite, addRecent };
}
