import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PatientDetailsPage } from '@/views/patient-details';

export const metadata: Metadata = {
  title: 'Patient',
};

async function PatientRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <PatientDetailsPage id={id} />;
}

// With `cacheComponents`, reading `params` has to happen under Suspense so the
// rest of the page can be prerendered.
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <PatientRoute params={params} />
    </Suspense>
  );
}
