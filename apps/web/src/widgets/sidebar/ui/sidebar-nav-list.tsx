import clsx from 'clsx';
import Link from 'next/link';
import { ROUTES } from '@/shared/config';
import { SIDEBAR_NAV_ITEMS } from '../config/nav-items';

function isActive(pathname: string, href: string) {
  if (href === ROUTES.dashboard) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Pure markup; `pathname` is empty for the no-active-item Suspense fallback. */
export function SidebarNavList({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Main">
      <ul>
        {SIDEBAR_NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'relative flex h-12.75 items-center gap-3 px-5 text-h5 transition-colors hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-50',
                  active ? 'text-white' : 'text-white-medium',
                )}
              >
                {active ? (
                  <span
                    className="absolute top-3.5 left-0.5 h-5.5 w-0.75 rounded-[10px] bg-red-brand"
                    aria-hidden="true"
                  />
                ) : null}
                <span
                  className={clsx(
                    'flex size-6 shrink-0 items-center justify-center',
                    active && 'text-red-brand',
                  )}
                >
                  <Icon />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
