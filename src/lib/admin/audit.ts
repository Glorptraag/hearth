import { db } from '@/lib/db';
import { adminAuditLog } from '@/lib/db/schema';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';

interface LogAdminActionParams {
  adminUserId: string;
  adminEmail: string;
  action: string;
  targetResource?: string;
  targetId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAdminAction(
  params: LogAdminActionParams,
  tx?: NeonHttpDatabase<Record<string, never>>
) {
  const target = tx ?? db;
  await target.insert(adminAuditLog).values({
    adminUserId: params.adminUserId,
    adminEmail: params.adminEmail,
    action: params.action,
    targetResource: params.targetResource,
    targetId: params.targetId,
    reason: params.reason,
    metadata: params.metadata,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    mfaSatisfied: false,
  });
}
