import { useMemo, useState } from 'react';
import { loadDateIndex } from '../utils/dataLoader';
import { formatTermDate } from '../utils/termDisplay';
import { ContentKind, ContentChangeAction, DateIndexItem } from '../types';

type KindFilter = 'all' | ContentKind;

interface DateIndexPageProps {
  onOpenTerm: (termId: string) => void;
  onOpenProposition: (propositionId: string) => void;
  onOpenCurriculum: (sectionId: string) => void;
}

const KIND_LABELS: Record<ContentKind, string> = {
  term: '용어',
  relation: '관계',
  proposition: '명제',
  curriculum: '학습',
};

const KIND_STYLES: Record<ContentKind, string> = {
  term: 'bg-blue-50 text-blue-700 border-blue-100',
  relation: 'bg-amber-50 text-amber-800 border-amber-100',
  proposition: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  curriculum: 'bg-violet-50 text-violet-700 border-violet-100',
};

const ACTION_LABELS: Record<ContentChangeAction, string> = {
  added: '추가',
  updated: '수정',
  deleted: '삭제',
};

const ACTION_STYLES: Record<ContentChangeAction, string> = {
  added: 'text-green-700',
  updated: 'text-gray-600',
  deleted: 'text-red-600',
};

export default function DateIndexPage({
  onOpenTerm,
  onOpenProposition,
  onOpenCurriculum,
}: DateIndexPageProps) {
  const dateIndex = loadDateIndex();
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [expandedDate, setExpandedDate] = useState<string | null>(dateIndex[0]?.date ?? null);

  const filteredDays = useMemo(() => {
    if (kindFilter === 'all') return dateIndex;
    return dateIndex
      .map((day) => {
        const items = day.items.filter((item) => item.kind === kindFilter);
        if (items.length === 0) return null;
        return {
          ...day,
          items,
          counts: {
            term: items.filter((i) => i.kind === 'term').length,
            relation: items.filter((i) => i.kind === 'relation').length,
            proposition: items.filter((i) => i.kind === 'proposition').length,
            curriculum: items.filter((i) => i.kind === 'curriculum').length,
            total: items.length,
          },
        };
      })
      .filter((d): d is NonNullable<typeof d> => d != null);
  }, [dateIndex, kindFilter]);

  const totals = useMemo(() => {
    let term = 0;
    let relation = 0;
    let proposition = 0;
    let curriculum = 0;
    for (const day of dateIndex) {
      term += day.counts.term;
      relation += day.counts.relation;
      proposition += day.counts.proposition;
      curriculum += day.counts.curriculum;
    }
    return { term, relation, proposition, curriculum, days: dateIndex.length };
  }, [dateIndex]);

  const handleItemClick = (item: DateIndexItem) => {
    if (item.kind === 'term') {
      onOpenTerm(item.id);
      return;
    }
    if (item.kind === 'relation') {
      onOpenTerm(item.term1Id || item.id);
      return;
    }
    if (item.kind === 'proposition') {
      onOpenProposition(item.id);
      return;
    }
    if (item.kind === 'curriculum') {
      onOpenCurriculum(item.id);
    }
  };

  if (dateIndex.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900">날짜 인덱스</h2>
        <p className="text-sm text-gray-600 mt-2">
          Git 커밋 이력이 아직 없거나 빌드가 필요합니다. 데이터 YAML을 커밋한 뒤
          <code className="mx-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded">node build-data.js</code>
          를 실행하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">날짜 인덱스</h2>
        <p className="text-sm text-gray-600 mt-1">
          용어·관계·명제·학습 섹션이 언제 추가·수정됐는지 Git 이력 기준으로 모았습니다.
          항목을 누르면 해당 화면으로 이동합니다.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          {totals.days}일 · 용어 {totals.term} · 관계 {totals.relation} · 명제 {totals.proposition} ·
          학습 {totals.curriculum}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            ['all', '전체'],
            ['term', '용어'],
            ['relation', '관계'],
            ['proposition', '명제'],
            ['curriculum', '학습'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setKindFilter(key)}
            className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
              kindFilter === key
                ? 'bg-slate-800 border-slate-800 text-white'
                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredDays.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">해당 유형의 변경이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {filteredDays.map((day) => {
            const isOpen = expandedDate === day.date;
            const dateLabel = formatTermDate(day.date);
            return (
              <div key={day.date} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setExpandedDate(isOpen ? null : day.date)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-900">{dateLabel || day.date}</span>
                    <span className="ml-2 text-xs text-gray-500">{day.counts.total}건</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {day.counts.term > 0 && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-100">
                        용어 {day.counts.term}
                      </span>
                    )}
                    {day.counts.relation > 0 && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-100">
                        관계 {day.counts.relation}
                      </span>
                    )}
                    {day.counts.proposition > 0 && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded border bg-indigo-50 text-indigo-700 border-indigo-100">
                        명제 {day.counts.proposition}
                      </span>
                    )}
                    {day.counts.curriculum > 0 && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded border bg-violet-50 text-violet-700 border-violet-100">
                        학습 {day.counts.curriculum}
                      </span>
                    )}
                    <span className="text-gray-400 text-sm ml-1">{isOpen ? '▼' : '▶'}</span>
                  </div>
                </button>

                {isOpen && (
                  <ul className="border-t border-gray-100 divide-y divide-gray-50">
                    {day.items.map((item) => (
                      <li key={`${item.kind}-${item.id}`}>
                        <button
                          type="button"
                          onClick={() => handleItemClick(item)}
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-start gap-3"
                        >
                          <span
                            className={`mt-0.5 text-[11px] px-1.5 py-0.5 rounded border shrink-0 ${KIND_STYLES[item.kind]}`}
                          >
                            {KIND_LABELS[item.kind]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span className="text-sm font-medium text-gray-900 line-clamp-2">
                                {item.label}
                              </span>
                              <span className={`text-xs font-medium ${ACTION_STYLES[item.action]}`}>
                                {ACTION_LABELS[item.action]}
                              </span>
                            </div>
                            {item.summary && item.summary !== '신규 등록' && (
                              <p className="text-xs text-gray-500 mt-0.5">{item.summary}</p>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
