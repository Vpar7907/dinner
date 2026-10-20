import { createRepository } from '@/shared/api';
import type { PantryItem } from '../model/types';

export const pantryRepository = createRepository<PantryItem>('pantry');
