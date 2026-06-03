import { Term, TermChangeEntry } from '../types';

export function formatTermDate(iso?: string): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${y}년 ${m}월 ${d}일`;
}

export function getTermUpdatedLabel(term: Term): string | null {
  const formatted = formatTermDate(term.updatedAt);
  if (!formatted) return null;
  return `마지막 수정 ${formatted}`;
}

export function compareTermsByUpdated(a: Term, b: Term, ascending: boolean): number {
  const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
  const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
  if (ta === tb) return a.name.localeCompare(b.name, 'ko');
  return ascending ? ta - tb : tb - ta;
}

export function isTermUpdatedWithinDays(term: Term, days: number): boolean {
  if (!term.updatedAt || days <= 0) return false;
  const updated = new Date(term.updatedAt);
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days);
  return updated >= cutoff;
}

export function getLatestChangeSummary(term: Term): string | null {
  const latest = term.changelog?.[0];
  return latest?.summary ?? null;
}

export function fieldChangePreview(entry: TermChangeEntry): string {
  const parts = entry.changes.map((c) => {
    if (c.field === 'relation') {
      if (!c.before && c.after) return `${c.label} 연결 추가`;
      if (c.before && !c.after) return `${c.label} 연결 삭제`;
      return `${c.label} 수정`;
    }
    if (c.field === 'description' && c.before && c.after) {
      return `${c.label} 내용 변경`;
    }
    if (!c.before && c.after) return `${c.label} 추가`;
    if (c.before && !c.after) return `${c.label} 삭제`;
    return `${c.label} 변경`;
  });
  return parts.join(', ');
}
