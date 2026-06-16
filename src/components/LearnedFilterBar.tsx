import type { LearnedFilter } from '../utils/learnedItems';

interface LearnedFilterBarProps {
  filter: LearnedFilter;
  onChange: (filter: LearnedFilter) => void;
  learnedCount: number;
  totalCount: number;
  className?: string;
}

const OPTIONS: { value: LearnedFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'unlearned', label: '미배움' },
  { value: 'learned', label: '배움' },
];

export default function LearnedFilterBar({
  filter,
  onChange,
  learnedCount,
  totalCount,
  className = '',
}: LearnedFilterBarProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <div className="flex flex-wrap gap-1.5">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
              filter === opt.value
                ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <span className="text-sm text-gray-500">
        배움 <span className="font-semibold text-emerald-700">{learnedCount}</span>
        {' / '}
        {totalCount}
      </span>
    </div>
  );
}
