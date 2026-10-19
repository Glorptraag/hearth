'use client';

import { useRouter } from 'next/navigation';
import { useLearnersFetch } from '@/hooks/use-learners-fetch';
import { BatchLogForm } from '@/components/logger/BatchLogForm';
import { SkeletonLoader } from '../_components/LoggerSkeleton';

/**
 * Batch log — several days of moments in one sitting. Lives on its own route
 * so the Logger itself stays a single short form; linked from the Logger's
 * "Catching up on a few days?" footer.
 */
export default function BatchLogPage() {
  const router = useRouter();
  const { learners, isLoading } = useLearnersFetch();
  const done = () => router.push('/log');

  if (isLoading) return <SkeletonLoader />;

  return (
    <div className="mx-auto w-full min-w-0 max-w-[560px] px-md py-lg xl:max-w-[600px]">
      <h1 className="mb-lg font-serif text-[1.1rem] font-semibold text-text-primary">Batch log</h1>
      <BatchLogForm
        learners={learners.map((l) => ({ id: l.id, name: l.name }))}
        onComplete={done}
        onCancel={done}
      />
    </div>
  );
}
