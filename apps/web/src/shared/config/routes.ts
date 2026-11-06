export const ROUTES = {
  home: '/',
  signIn: '/sign-in',
  uiKit: '/ui-kit',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
