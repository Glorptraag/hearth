import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth/admin';
import SnapshotsClient from './SnapshotsClient';

export default async function SnapshotsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  if (!isAdmin(userId)) redirect('/dashboard');

  return <SnapshotsClient />;
}
