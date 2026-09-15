export interface ReadingState {
  sectionId: string;
  partId: string | null;
}

const KEY = 'wordmap-reader-v1';

export function loadReadingState(): ReadingState | null {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || 'null');
    return value && typeof value.sectionId === 'string' &&
      (value.partId === null || typeof value.partId === 'string') ? value : null;
  } catch { return null; }
}

export function saveReadingState(value: ReadingState): void {
  try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* Reading remains available without storage. */ }
}

export function loadReaderPreference(key: string, fallback: string): string {
  try { return localStorage.getItem(`wordmap-reader-${key}`) || fallback; } catch { return fallback; }
}

export function saveReaderPreference(key: string, value: string): void {
  try { localStorage.setItem(`wordmap-reader-${key}`, value); } catch { /* Optional preference. */ }
}
