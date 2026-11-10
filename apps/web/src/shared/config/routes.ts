export const ROUTES = {
  dashboard: '/',
  patients: '/patients',
  facilities: '/facilities',
  providers: '/providers',
  devices: '/devices',
  settings: '/settings',
  signIn: '/sign-in',
  uiKit: '/ui-kit',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
