import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth/admin';
import ProviderCodesClient from './ProviderCodesClient';

export default async function ProviderCodesPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  if (!isAdmin(userId)) redirect('/dashboard');

  return <ProviderCodesClient />;
}
