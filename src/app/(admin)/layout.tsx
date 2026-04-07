import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth/admin';
import ClerkThemeProvider from '@/components/ClerkThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import AdminShell from './admin/_components/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  if (!isAdmin(userId)) redirect('/dashboard');

  return (
    <ClerkThemeProvider>
      <ToastProvider>
        <AdminShell>{children}</AdminShell>
      </ToastProvider>
    </ClerkThemeProvider>
  );
}
