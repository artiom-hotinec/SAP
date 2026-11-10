import { UiPageTitle } from './ui-page-title';

export interface UiPagePlaceholderProps {
  title: string;
}

export function UiPagePlaceholder({ title }: UiPagePlaceholderProps) {
  return (
    <>
      <UiPageTitle>{title}</UiPageTitle>
      <p className="mt-4 text-body-md text-grey-600">
        This page is under construction.
      </p>
    </>
  );
}
