import type { ComponentType, SVGProps } from 'react';
import { ROUTES } from '@/shared/config';
import { UiIconCamera } from '@/shared/ui/icons/ui-icon-camera';
import { UiIconFacility } from '@/shared/ui/icons/ui-icon-facility';
import { UiIconProvider } from '@/shared/ui/icons/ui-icon-provider';
import { UiIconSetting } from '@/shared/ui/icons/ui-icon-setting';
import { UiIconStats } from '@/shared/ui/icons/ui-icon-stats';
import { UiIconUsers } from '@/shared/ui/icons/ui-icon-users';

export interface SidebarNavItem {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const SIDEBAR_NAV_ITEMS: readonly SidebarNavItem[] = [
  { href: ROUTES.dashboard, label: 'Dashboard', Icon: UiIconStats },
  { href: ROUTES.patients, label: 'Patients', Icon: UiIconUsers },
  { href: ROUTES.facilities, label: 'Facilities', Icon: UiIconFacility },
  { href: ROUTES.providers, label: 'Providers', Icon: UiIconProvider },
  { href: ROUTES.devices, label: 'Devices', Icon: UiIconCamera },
  { href: ROUTES.settings, label: 'Settings', Icon: UiIconSetting },
];
