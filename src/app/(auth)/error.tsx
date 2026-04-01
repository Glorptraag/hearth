'use client';

import EmptyState from '@/components/ui/EmptyState';

export default function AuthError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-lg">
      <EmptyState
        emoji="🔥"
        heading="Something went wrong"
        body="An unexpected error occurred. Your learning data is safe."
        cta={{ label: 'Try again', onClick: reset }}
      />
    </div>
  );
}
