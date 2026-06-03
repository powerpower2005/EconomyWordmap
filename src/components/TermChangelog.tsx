import { useState } from 'react';
import { Term, TermChangeEntry } from '../types';
import { fieldChangePreview, formatTermDate, getTermUpdatedLabel } from '../utils/termDisplay';

interface TermChangelogProps {
  term: Term;
  compact?: boolean;
  // true면 가장 최근 변경 1건만 표시
  latestOnly?: boolean;
}

function ChangeDiff({ entry }: { entry: TermChangeEntry }) {
  return (
    <div className="space-y-3">
      {entry.changes.map((change, idx) => (
        <div key={`${entry.date}-${change.field}-${idx}`} className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-3 py-1.5 bg-gray-50 text-sm font-medium text-gray-700">{change.label}</div>
          {change.before ? (
            <div className="px-3 py-2 text-sm border-t border-gray-100">
              <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">이전</span>
              <p className="mt-1 text-gray-600 whitespace-pre-wrap break-words">{change.before}</p>
            </div>
          ) : null}
          {change.after ? (
            <div className={`px-3 py-2 text-sm ${change.before ? 'border-t border-gray-100' : ''}`}>
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                {change.before ? '이후' : '내용'}
              </span>
              <p className="mt-1 text-gray-800 whitespace-pre-wrap break-words">{change.after}</p>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function TermChangelog({ term, compact = false, latestOnly = false }: TermChangelogProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const fullChangelog = term.changelog ?? [];
  const changelog = latestOnly ? fullChangelog.slice(0, 1) : fullChangelog;
  const updatedLabel = getTermUpdatedLabel(term);

  if (!updatedLabel && changelog.length === 0) {
    return (
      <p className="text-sm text-gray-500">Git 이력에 기록된 수정 내역이 없습니다.</p>
    );
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {updatedLabel && (
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-800">{updatedLabel}</span>
          {changelog[0]?.summary && (
            <span className="text-gray-500"> · {changelog[0].summary}</span>
          )}
        </p>
      )}

      {changelog.length > 0 && (
        <div className="space-y-2">
          {!compact && <h3 className="text-lg font-bold text-gray-800">변경 이력</h3>}
          <ul className="space-y-2">
            {changelog.map((entry, index) => {
              const isOpen = expandedIndex === index;
              const dateLabel = formatTermDate(entry.date);
              return (
                <li
                  key={`${entry.date}-${entry.commit ?? index}`}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(isOpen ? null : index)}
                    className="w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{entry.summary}</span>
                        {dateLabel && (
                          <span className="text-xs text-gray-500">{dateLabel}</span>
                        )}
                        {entry.commit && (
                          <span className="text-xs font-mono text-gray-400">{entry.commit}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {fieldChangePreview(entry)}
                        {entry.message ? ` · ${entry.message}` : ''}
                      </p>
                    </div>
                    <span className="text-gray-400 text-sm shrink-0">{isOpen ? '▲' : '▼'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 border-t border-gray-100 bg-gray-50/50">
                      <ChangeDiff entry={entry} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
