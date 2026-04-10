'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { useTheme } from '@/hooks/use-theme';
import { getClerkAppearance } from '@/app/clerk-theme';

export default function ClerkThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();

  return (
    <ClerkProvider
      appearance={getClerkAppearance(theme)}
      signInFallbackRedirectUrl="/welcome"
      signUpFallbackRedirectUrl="/welcome"
    >
      {children}
    </ClerkProvider>
  );
}
