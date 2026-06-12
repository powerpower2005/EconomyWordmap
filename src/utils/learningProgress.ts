const STORAGE_KEY = 'wordmap-learning-bookmarks-v1';

export function loadBookmarks(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function saveBookmarks(bookmarks: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...bookmarks]));
}

export function toggleBookmark(id: string, bookmarks: Set<string>): Set<string> {
  const next = new Set(bookmarks);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  saveBookmarks(next);
  return next;
}
