import ReactMarkdown from 'react-markdown';

interface MarkdownProseProps {
  source: string;
  className?: string;
}

export default function MarkdownProse({ source, className = '' }: MarkdownProseProps) {
  if (!source.trim()) return null;

  return (
    <div className={`learn-prose text-[15px] text-gray-800 leading-[1.75] ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-gray-900 mt-6 mb-2 first:mt-0">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-gray-900 mt-5 mb-1.5 first:mt-0">{children}</h4>
          ),
          ul: ({ children }) => <ul className="mb-4 list-disc space-y-1.5 pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1.5 pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          hr: () => <hr className="my-6 border-gray-200" />,
        }}
      >
        {source.trim()}
      </ReactMarkdown>
    </div>
  );
}
