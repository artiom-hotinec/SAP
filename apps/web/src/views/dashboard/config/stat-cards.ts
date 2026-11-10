import type { ComponentType, SVGProps } from 'react';
import type { StatisticsDto } from '@/shared/api';
import { UiIconCamera } from '@/shared/ui/icons/ui-icon-camera';
import { UiIconFacility } from '@/shared/ui/icons/ui-icon-facility';
import { UiIconProvider } from '@/shared/ui/icons/ui-icon-provider';
import { UiIconUsers } from '@/shared/ui/icons/ui-icon-users';

export interface StatCardConfig {
  key: keyof StatisticsDto;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const STAT_CARDS: readonly StatCardConfig[] = [
  { key: 'patients', label: 'Patients', Icon: UiIconUsers },
  { key: 'facilities', label: 'Facilities', Icon: UiIconFacility },
  { key: 'providers', label: 'Providers', Icon: UiIconProvider },
  { key: 'devices', label: 'Devices', Icon: UiIconCamera },
];
