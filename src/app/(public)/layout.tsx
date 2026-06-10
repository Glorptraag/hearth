import PostHogProvider from '@/components/analytics/PostHogProvider';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PostHogProvider>{children}</PostHogProvider>;
}
