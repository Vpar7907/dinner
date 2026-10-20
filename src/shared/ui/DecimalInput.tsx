import { useEffect, useRef, useState, type InputHTMLAttributes } from 'react';
import { formatDecimal, parseDecimal } from '@/shared/lib';
import { Input } from './Field';

export interface DecimalInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number | null;
  /** Called with the parsed number (`null` when empty) on every valid edit. */
  onValueChange: (value: number | null) => void;
  /** Reports whether the current text is a valid number, e.g. to disable a submit button. */
  onValidityChange?: (valid: boolean) => void;
}

/**
 * Text field for fractional quantities. Unlike `type="number"` it accepts a comma
 * (the Russian decimal separator), simple fractions ("1/2", "1 1/2", "½") and keeps
 * intermediate input like "0," while typing.
 */
export function DecimalInput({ value, onValueChange, onValidityChange, onBlur, ...rest }: DecimalInputProps) {
  const [text, setText] = useState(formatDecimal(value));
  const lastEmitted = useRef<number | null>(value);
  const parsed = parseDecimal(text);
  const invalid = parsed === undefined;

  useEffect(() => {
    onValidityChange?.(!invalid);
  }, [invalid, onValidityChange]);

  // Follow outside changes (e.g. a suggestion filled the field) without fighting the user's typing.
  useEffect(() => {
    if (value === lastEmitted.current) return;
    // A parent may store "0" as empty; don't wipe the "0" the user is typing on the way to "0,5".
    if (value === null && lastEmitted.current === 0) return;
    lastEmitted.current = value;
    setText(formatDecimal(value));
  }, [value]);

  return (
    <Input
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      invalid={invalid}
      aria-invalid={invalid || undefined}
      title={invalid ? 'Введите число: 0,5 · 1.5 · 1/2 · 1 1/2' : rest.title}
      onChange={(event) => {
        const next = event.target.value;
        setText(next);
        const number = parseDecimal(next);
        if (number !== undefined && number !== lastEmitted.current) {
          lastEmitted.current = number;
          onValueChange(number);
        }
      }}
      onBlur={(event) => {
        // Normalise the text ("1/2" → "0,5") or drop an invalid entry back to the last valid value.
        setText(formatDecimal(invalid ? lastEmitted.current : parsed));
        onBlur?.(event);
      }}
    />
  );
}
