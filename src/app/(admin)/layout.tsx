import ClerkThemeProvider from '@/components/ClerkThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ClerkThemeProvider>
  );
}
