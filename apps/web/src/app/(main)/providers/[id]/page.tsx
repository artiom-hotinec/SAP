import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProviderDetailsPage } from '@/views/provider-details';

export const metadata: Metadata = {
  title: 'Provider',
};

async function ProviderRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ProviderDetailsPage id={id} />;
}

// With `cacheComponents`, reading `params` has to happen under Suspense so the
// rest of the page can be prerendered.
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <ProviderRoute params={params} />
    </Suspense>
  );
}
