import { Children, isValidElement, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownProseProps {
  source: string;
  className?: string;
}

const SPEAKER_PRESET: Record<string, { bubble: string; label: string }> = {
  alice: { bubble: 'border-violet-400 bg-violet-50/80', label: 'bg-violet-100 text-violet-800' },
  bob: { bubble: 'border-emerald-400 bg-emerald-50/80', label: 'bg-emerald-100 text-emerald-800' },
  charlie: { bubble: 'border-amber-400 bg-amber-50/80', label: 'bg-amber-100 text-amber-800' },
  dana: { bubble: 'border-sky-400 bg-sky-50/80', label: 'bg-sky-100 text-sky-800' },
  eve: { bubble: 'border-rose-400 bg-rose-50/80', label: 'bg-rose-100 text-rose-800' },
};

const SPEAKER_FALLBACK = [
  { bubble: 'border-indigo-400 bg-indigo-50/80', label: 'bg-indigo-100 text-indigo-800' },
  { bubble: 'border-teal-400 bg-teal-50/80', label: 'bg-teal-100 text-teal-800' },
  { bubble: 'border-orange-400 bg-orange-50/80', label: 'bg-orange-100 text-orange-800' },
  { bubble: 'border-fuchsia-400 bg-fuchsia-50/80', label: 'bg-fuchsia-100 text-fuchsia-800' },
];

function hashSpeaker(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getSpeakerStyle(speaker: string) {
  const preset = SPEAKER_PRESET[speaker.toLowerCase()];
  if (preset) return preset;
  const idx = hashSpeaker(speaker.toLowerCase()) % SPEAKER_FALLBACK.length;
  return SPEAKER_FALLBACK[idx];
}

function getSpeakerLabel(child: ReactNode): string | null {
  if (!isValidElement(child) || child.type !== 'strong') return null;
  const text = String(child.props.children ?? '');
  if (/^[A-Za-z]+:$/.test(text)) return text.slice(0, -1);
  return null;
}

function trimDialogueLead(nodes: ReactNode[]): ReactNode[] {
  if (nodes.length === 0) return nodes;
  const first = nodes[0];
  if (typeof first === 'string' && /^\s+$/.test(first)) return nodes.slice(1);
  return nodes;
}

function DialogueLine({ speaker, children }: { speaker: string; children: ReactNode }) {
  const { bubble, label } = getSpeakerStyle(speaker);

  return (
    <div className={`learn-dialogue mb-2.5 rounded-2xl border-l-4 px-4 py-3 last:mb-0 ${bubble}`}>
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className={`learn-dialogue__speaker inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide ${label}`}
        >
          {speaker}
        </span>
      </div>
      <div className="learn-dialogue__text text-[15px] leading-[1.75] text-gray-800">{children}</div>
    </div>
  );
}

function PanelBreak() {
  return (
    <div className="learn-panel-break my-7 flex items-center gap-3" role="separator" aria-hidden="true">
      <span className="h-0 flex-1 border-t-2 border-dashed border-gray-300" />
      <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
        cut
      </span>
      <span className="h-0 flex-1 border-t-2 border-dashed border-gray-300" />
    </div>
  );
}

export default function MarkdownProse({ source, className = '' }: MarkdownProseProps) {
  if (!source.trim()) return null;

  return (
    <div className={`learn-prose text-[15px] text-gray-800 leading-[1.75] ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => {
            const nodes = Children.toArray(children);
            const speaker = nodes.length > 0 ? getSpeakerLabel(nodes[0]) : null;
            if (speaker) {
              return (
                <DialogueLine speaker={speaker}>{trimDialogueLead(nodes.slice(1))}</DialogueLine>
              );
            }
            return <p className="mb-4 last:mb-0">{children}</p>;
          },
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          em: ({ children }) => (
            <em className="not-italic text-sm text-gray-500 before:content-['—_'] after:content-['_—']">
              {children}
            </em>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-gray-900 mt-6 mb-2 first:mt-0">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-gray-900 mt-5 mb-1.5 first:mt-0">{children}</h4>
          ),
          ul: ({ children }) => <ul className="mb-4 list-disc space-y-1.5 pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1.5 pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          hr: () => <PanelBreak />,
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-2 border-gray-300 pl-4 text-sm italic text-gray-600 last:mb-0">
              {children}
            </blockquote>
          ),
        }}
      >
        {source.trim()}
      </ReactMarkdown>
    </div>
  );
}
