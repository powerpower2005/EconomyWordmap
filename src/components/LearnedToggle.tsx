interface LearnedToggleProps {
  learned: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export default function LearnedToggle({
  learned,
  onToggle,
  size = 'md',
  className = '',
}: LearnedToggleProps) {
  const box = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const icon = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation();
        onToggle();
      }}
      className={`shrink-0 rounded border transition-colors ${box} flex items-center justify-center ${
        learned
          ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600'
          : 'bg-white border-gray-300 text-transparent hover:border-emerald-400'
      } ${className}`}
      aria-label={learned ? '배움 — 체크 해제' : '미배움 — 배움으로 표시'}
      title={learned ? '배움' : '미배움'}
    >
      <span className={`${icon} leading-none font-bold`} aria-hidden>
        ✓
      </span>
    </button>
  );
}
