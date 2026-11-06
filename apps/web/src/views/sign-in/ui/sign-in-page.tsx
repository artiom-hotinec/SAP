import Image from 'next/image';
import { SignInForm } from '@/features/auth/sign-in';
import { UiLink } from '@/shared/ui/ui-link';
import { UiLogo } from '@/shared/ui/ui-logo';

export function SignInPage() {
  return (
    <main className="flex min-h-screen bg-white">
      <aside
        aria-hidden="true"
        className="relative hidden w-[59.72%] overflow-hidden bg-grey-900 lg:block"
      >
        <div className="absolute inset-0 bg-[linear-gradient(114.22deg,rgba(33,33,33,0.6)_2.49%,rgba(117,117,117,0.6)_91.67%)] opacity-60" />
        <div className="absolute inset-x-0 top-[16.89%] bottom-0 bg-linear-to-b from-[rgba(17,24,39,0)] via-[rgba(17,24,39,0.69)] via-39% to-[rgba(17,24,39,0.63)]" />
        <Image
          src="/images/sign-in-pattern.svg"
          alt=""
          width={1331.05}
          height={785.742}
          className="absolute top-130.75 -left-118 max-w-none"
        />
        <UiLogo size="lg" className="absolute top-[34.78%] left-[21.05%]" />
      </aside>
      <section className="flex flex-1 justify-center">
        <div className="flex w-81.75 flex-col pt-25 pb-20.5">
          <h1 className="text-h2 leading-9.5 text-grey-800">Welcome to SAP</h1>
          <p className="mt-1.5 text-body-lg text-grey-800">Provider Portal</p>
          <div className="mt-9 flex flex-1 flex-col">
            <SignInForm>
              <p className="text-body-lg text-grey-800">
                By signing in, you are agreeing to our{' '}
                <UiLink href="#" size="lg">
                  Terms of Use
                </UiLink>{' '}
                and{' '}
                <UiLink href="#" size="lg">
                  Privacy Policy
                </UiLink>
              </p>
            </SignInForm>
          </div>
          <p className="mt-6 text-center text-body-md leading-5.5 text-grey-800">
            Don’t have an account? <UiLink href="#">Contact Sales</UiLink>
          </p>
        </div>
      </section>
    </main>
  );
}
