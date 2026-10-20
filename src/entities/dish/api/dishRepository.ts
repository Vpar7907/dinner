import { createRepository } from '@/shared/api';
import type { Dish } from '../model/types';

export const dishRepository = createRepository<Dish>('dishes');
