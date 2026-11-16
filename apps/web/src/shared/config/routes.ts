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

/** Path of a single provider's details page. */
export const providerDetailsRoute = (id: string) =>
  `${ROUTES.providers}/${encodeURIComponent(id)}`;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
