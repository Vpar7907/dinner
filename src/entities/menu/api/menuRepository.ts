import { createRepository } from '@/shared/api';
import type { WeeklyMenu } from '../model/types';

export const menuRepository = createRepository<WeeklyMenu>('menus');
