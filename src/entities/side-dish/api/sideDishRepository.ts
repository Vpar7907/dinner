import { createRepository } from '@/shared/api';
import type { SideDish } from '../model/types';

export const sideDishRepository = createRepository<SideDish>('sides');
