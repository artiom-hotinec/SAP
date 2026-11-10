import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, ROUTES } from '@/shared/config';

const PUBLIC_PATHS: string[] = [ROUTES.uiKit];
const AUTH_PATHS: string[] = [ROUTES.signIn];

/**
 * Optimistic auth redirects. Only checks that the auth cookie exists; the API
 * remains the source of truth and validates the token on every request.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const hasToken = request.cookies.has(AUTH_COOKIE_NAME);
  const isAuthPage = AUTH_PATHS.includes(pathname);

  if (!hasToken && !isAuthPage) {
    return NextResponse.redirect(new URL(ROUTES.signIn, request.url));
  }

  if (hasToken && isAuthPage) {
    return NextResponse.redirect(new URL(ROUTES.dashboard, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
};
