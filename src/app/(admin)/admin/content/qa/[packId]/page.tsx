import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth/admin';
import PackDetailClient from './PackDetailClient';

export default async function PackDetailPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  if (!isAdmin(userId)) redirect('/dashboard');

  const { packId } = await params;
  return <PackDetailClient packId={packId} />;
}
