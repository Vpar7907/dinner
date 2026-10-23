export const ROUTES = {
  menu: '/',
  dishes: '/dishes',
  sides: '/sides',
  pantry: '/pantry',
  shopping: '/shopping',
  settings: '/settings',
  settingsLimits: '/settings/limits',
  /** Legacy address from when side dishes lived in Settings: redirects to `sides`. */
  settingsSides: '/settings/sides',
  settingsData: '/settings/data',
  settingsCalories: '/settings/calories',
  settingsAbout: '/settings/about',
} as const;

export type RouteKey = keyof typeof ROUTES;
