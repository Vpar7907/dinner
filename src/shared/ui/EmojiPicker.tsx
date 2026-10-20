import { motion } from 'framer-motion';
import { cn } from '@/shared/lib';

export interface EmojiPickerProps {
  options: string[];
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ options, value, onChange }: EmojiPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((emoji) => {
        const active = emoji === value;
        return (
          <motion.button
            key={emoji}
            type="button"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(emoji)}
            aria-pressed={active}
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-colors',
              active ? 'bg-brand-50' : 'hover:bg-cream-100',
            )}
          >
            {active && (
              <motion.span
                layoutId="emoji-picker-ring"
                className="absolute inset-0 rounded-xl ring-2 ring-brand-400"
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              />
            )}
            <span className="relative">{emoji}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
