export function isAdmin(clerkUserId: string): boolean {
  const adminIds = (process.env.ADMIN_CLERK_IDS ?? '').split(',').filter(Boolean);
  return adminIds.includes(clerkUserId);
}
