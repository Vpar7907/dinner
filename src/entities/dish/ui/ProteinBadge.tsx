import { Badge } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { PROTEIN_META } from '../model/protein';
import type { ProteinType } from '../model/types';

export interface ProteinBadgeProps {
  protein: ProteinType;
  compact?: boolean;
  className?: string;
}

export function ProteinBadge({ protein, compact, className }: ProteinBadgeProps) {
  const meta = PROTEIN_META[protein];
  return (
    <Badge className={cn(meta.badge, className)} title={meta.label}>
      <span>{meta.emoji}</span>
      {!compact && meta.label}
    </Badge>
  );
}
