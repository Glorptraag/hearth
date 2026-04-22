import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth/admin';
import InventoryClient from './InventoryClient';

export default async function ContentInventoryPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  if (!isAdmin(userId)) redirect('/dashboard');

  return <InventoryClient />;
}
