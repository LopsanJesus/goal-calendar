/**
 * Central localStorage abstraction.
 * All read/write operations go through here — never call localStorage directly.
 */

// ─── Generic helpers ──────────────────────────────────────────────────────────

export function storageGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function storageSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ─── Keys registry ────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  SESSIONS: "elreto-sessions",
  CHALLENGE_CONFIG: "elreto-config",
} as const;

// ─── Challenge config ─────────────────────────────────────────────────────────

export interface ChallengeConfig {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export const DEFAULT_CHALLENGE_CONFIG: ChallengeConfig = {
  startDate: "2026-03-07",
  endDate: "2026-03-28",
};

export function loadChallengeConfig(): ChallengeConfig {
  return storageGet<ChallengeConfig>(STORAGE_KEYS.CHALLENGE_CONFIG, DEFAULT_CHALLENGE_CONFIG);
}

export function saveChallengeConfig(config: ChallengeConfig): void {
  storageSet(STORAGE_KEYS.CHALLENGE_CONFIG, config);
}

/** Returns the current date. */
export function getCurrentDate(): Date {
  return new Date();
}
