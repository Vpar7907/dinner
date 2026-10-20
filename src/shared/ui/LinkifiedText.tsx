import { ExternalLink } from 'lucide-react';
import { cn, linkify, linkLabel } from '@/shared/lib';

export interface LinkifiedTextProps {
  text: string;
  className?: string;
  /** Show links as their host name ("eda.ru") instead of the full URL. */
  shortLinks?: boolean;
}

/** Plain text with clickable links that open in a new tab and do not trigger parent click handlers. */
export function LinkifiedText({ text, className, shortLinks }: LinkifiedTextProps) {
  return (
    <span className={cn('whitespace-pre-line break-words', className)}>
      {linkify(text).map((part, index) =>
        part.type === 'text' ? (
          <span key={index}>{part.value}</span>
        ) : (
          <a
            key={index}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center gap-0.5 font-semibold text-brand-600 underline decoration-brand-200 underline-offset-2 transition hover:text-brand-700 hover:decoration-brand-500"
          >
            {shortLinks ? linkLabel(part.href) : part.value}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ),
      )}
    </span>
  );
}
