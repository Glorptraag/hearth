import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/admin';

interface AdminContext {
  userId: string;
  email: string;
}

export async function requireAdmin(): Promise<
  AdminContext | NextResponse
> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdmin(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let email = 'unknown';
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    email = user.emailAddresses[0]?.emailAddress ?? 'unknown';
  } catch {
    // Non-fatal — audit log will record 'unknown' email
  }

  return { userId, email };
}

export function isAdminContext(
  result: AdminContext | NextResponse
): result is AdminContext {
  return !(result instanceof NextResponse);
}
