import { UiAddButton } from '@/shared/ui/ui-add-button';
import { UiButton } from '@/shared/ui/ui-button';
import { UiDropdown } from '@/shared/ui/ui-dropdown';
import { UiInput } from '@/shared/ui/ui-input';
import { UiLink } from '@/shared/ui/ui-link';
import { UiLogo } from '@/shared/ui/ui-logo';
import { UiSearch } from '@/shared/ui/ui-search';
import { UiStepper } from '@/shared/ui/ui-stepper';
import { UiTabBar } from '@/shared/ui/ui-tab-bar';
import { UiTableHeader } from '@/shared/ui/ui-table-header';
import { UiTableRow } from '@/shared/ui/ui-table-row';

const sessionTabs = [
  { value: 'last', label: 'Last session' },
  { value: '7', label: '7 sessions' },
  { value: '30', label: '30 sessions' },
];

export function UiKitPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white sm:items-start">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-6">
            <UiButton variant="primary">Primary</UiButton>
            <UiButton variant="link">Link</UiButton>
            <UiButton variant="cancel">Cancel</UiButton>
          </div>
          <div className="flex items-center gap-6">
            <UiButton variant="primary" disabled>
              Primary
            </UiButton>
            <UiButton variant="link" disabled>
              Link
            </UiButton>
            <UiButton variant="cancel" disabled>
              Cancel
            </UiButton>
          </div>
          <div className="flex items-center gap-6">
            <UiLink href="#">Forgot Password</UiLink>
            <UiLink href="#" size="lg">
              Terms of Use
            </UiLink>
          </div>
          <div className="flex items-center gap-6">
            <UiAddButton />
            <UiAddButton disabled />
          </div>
          <div className="flex items-start gap-6">
            <div className="w-44.75">
              <UiDropdown
                placeholder="Month"
                options={[
                  { value: 'jan', label: 'January' },
                  { value: 'feb', label: 'February' },
                  { value: 'mar', label: 'March' },
                ]}
              />
            </div>
            <div className="w-48">
              <UiDropdown
                size="sm"
                placeholder="Your Patients"
                options={[
                  { value: 'all', label: 'All Providers' },
                  { value: 'sarah', label: 'Sarah Smith' },
                  { value: 'jack', label: 'Jack Daniels' },
                ]}
              />
            </div>
          </div>
          <div className="flex items-start gap-6">
            <UiDropdown
              size="xs"
              label="Date of Birth"
              placeholder="Month"
              defaultValue="sep"
              className="w-33.5"
              options={[
                { value: 'aug', label: 'August' },
                { value: 'sep', label: 'September' },
              ]}
            />
            <UiDropdown
              size="xs"
              label="Weight"
              defaultValue="220"
              className="w-24.75"
              options={[
                { value: '200', label: '200 lbs' },
                { value: '220', label: '220 lbs' },
              ]}
            />
            <UiDropdown
              size="xs"
              label="State"
              defaultValue="co"
              className="w-55"
              options={[
                { value: 'co', label: 'Colorado' },
                { value: 'ca', label: 'California' },
              ]}
            />
            <UiDropdown
              size="xs"
              label="Sex"
              defaultValue="male"
              className="w-43.25"
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
            />
          </div>
          <div className="flex flex-col gap-6">
            <UiTabBar tabs={sessionTabs} defaultValue="last" />
            <UiTabBar tabs={sessionTabs} defaultValue="7" />
            <UiTabBar tabs={sessionTabs} defaultValue="30" />
          </div>
          <div className="flex w-90.25 flex-col gap-6">
            <UiSearch />
            <UiSearch disabled />
            <div className="h-43.5">
              <UiSearch
                defaultValue="Flo"
                results={['Florida CPAP', 'Florida State CPAP', 'Flows CPAP']}
              />
            </div>
          </div>
          <div className="max-w-full overflow-x-auto">
            <div className="flex w-243 flex-col gap-6 bg-grey-200 p-3">
              <UiTableHeader variant="provider" />
              <UiTableHeader variant="portal-admin" />
              <UiTableHeader variant="super-admin" />
              <UiTableRow
                status="active"
                hasMessage
                name="Andrea Andersson"
                phone="(303) 555-9442"
                email="andreaandersson@gmail.com"
                date="August 2, 2021"
              />
              <UiTableRow
                status="active"
                name="Wayne Bernard"
                phone="(303) 941-5543"
                email="waynebernard@gmail.com"
                date="July 26, 2021"
              />
              <UiTableRow
                status="inactive"
                name="Maya Cristoph"
                phone="(720) 236-6250"
                email="mayacristoph@icloud.com"
                date="July 26, 2021"
              />
              <UiTableRow
                status="unregistered"
                name="Wayne Bernard"
                phone="(303) 941-5543"
                email="waynebernard@gmail.com"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <UiLogo size="lg" />
            <UiLogo size="sm" />
          </div>
          <div className="flex w-82 flex-col gap-6">
            <UiStepper steps={3} current={1} />
            <UiStepper steps={3} current={2} />
            <UiStepper steps={3} current={3} />
            <UiStepper steps={4} current={1} />
            <UiStepper steps={4} current={2} />
            <UiStepper steps={4} current={3} />
            <UiStepper steps={4} current={4} />
            <UiStepper steps={5} current={1} />
            <UiStepper steps={5} current={2} />
            <UiStepper steps={5} current={3} />
            <UiStepper steps={5} current={4} />
            <UiStepper steps={5} current={5} />
          </div>
          <div className="flex w-81.75 flex-col gap-6">
            <UiInput type="email" label="Email" placeholder="Your email" />
            <UiInput
              type="email"
              label="Email"
              defaultValue="soudykhan@email.com"
            />
            <UiInput
              type="email"
              label="Email"
              defaultValue="elayneburgess2gmail.com"
              error="Invalid email format"
            />
            <UiInput
              type="password"
              label="Password"
              placeholder="Your password"
            />
            <UiInput
              type="password"
              label="Password"
              defaultValue="password1"
            />
            <UiInput
              type="email"
              label="Email (disabled)"
              placeholder="Your email"
              disabled
            />
          </div>
          <div className="flex w-55 flex-col gap-6">
            <UiInput size="sm" label="First Name" placeholder="Your name" />
            <UiInput size="sm" label="First Name" defaultValue="Wayne" />
            <UiInput
              size="sm"
              label="First Name"
              defaultValue="Wayne"
              error="Invalid name"
            />
            <UiInput
              size="sm"
              type="password"
              label="Password"
              defaultValue="password1"
            />
            <UiInput
              size="sm"
              label="First Name"
              placeholder="Your name"
              disabled
            />
          </div>
        </div>
      </main>
    </div>
  );
}
