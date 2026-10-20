export const ROUTES = {
  menu: '/',
  dishes: '/dishes',
  /** Legacy address: redirects to Settings → Side dishes. */
  sides: '/sides',
  pantry: '/pantry',
  shopping: '/shopping',
  settings: '/settings',
  settingsLimits: '/settings/limits',
  settingsSides: '/settings/sides',
  settingsData: '/settings/data',
  settingsCalories: '/settings/calories',
} as const;

export type RouteKey = keyof typeof ROUTES;
