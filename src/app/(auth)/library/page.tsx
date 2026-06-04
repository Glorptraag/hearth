import { Suspense } from 'react';
import LibraryClient from './LibraryClient';

export default function LibraryPage() {
  // LibraryClient reads ?tab= / ?subject= via useSearchParams, which needs a
  // Suspense boundary so the rest of the route isn't forced to client render.
  return (
    <Suspense>
      <LibraryClient />
    </Suspense>
  );
}
