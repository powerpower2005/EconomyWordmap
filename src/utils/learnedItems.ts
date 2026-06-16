const STORAGE_KEY = 'wordmap-learned-v1';

type Listener = () => void;
const listeners = new Set<Listener>();

export type LearnedFilter = 'all' | 'learned' | 'unlearned';

export function loadLearned(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function saveLearned(learned: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...learned]));
  listeners.forEach(fn => fn());
}

export function toggleLearned(id: string, learned: Set<string>): Set<string> {
  const next = new Set(learned);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  saveLearned(next);
  return next;
}

export function isLearned(id: string, learned: Set<string>): boolean {
  return learned.has(id);
}

export function subscribeLearned(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function countLearned(ids: string[], learned: Set<string>): number {
  return ids.filter(id => learned.has(id)).length;
}

export function filterByLearned<T extends { id: string }>(
  items: T[],
  learned: Set<string>,
  filter: LearnedFilter
): T[] {
  if (filter === 'all') return items;
  if (filter === 'learned') return items.filter(item => learned.has(item.id));
  return items.filter(item => !learned.has(item.id));
}
