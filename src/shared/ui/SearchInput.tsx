import { Search, X } from 'lucide-react';
import { cn } from '@/shared/lib';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Поиск…', className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl bg-white pl-11 pr-10 text-sm text-ink-900 shadow-soft ring-1 ring-ink-900/5 transition placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-400"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-500 hover:bg-ink-900/5"
          aria-label="Очистить поиск"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
