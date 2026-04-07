import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { hearthInvites, hearths, hearthMemberships } from '@/lib/db/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import JoinClient from './JoinClient';

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const family = await getFamilyByClerkId(userId);
  if (!family) redirect('/onboarding');

  const invite = await db.query.hearthInvites.findFirst({
    where: and(
      eq(hearthInvites.code, code),
      isNull(hearthInvites.usedByFamilyId),
      gt(hearthInvites.expiresAt, new Date()),
    ),
  });

  if (!invite) {
    return (
      <div className="max-w-lg mx-auto px-lg py-2xl">
        <div className="bg-surface-panel border border-border-subtle rounded-[10px] p-xl text-center shadow-soft">
          <div className="text-3xl mb-md">⏳</div>
          <h1 className="font-serif text-xl font-semibold text-text-primary mb-md">
            Invite expired or invalid
          </h1>
          <p className="font-serif text-text-secondary leading-relaxed mb-xl">
            This invite link is no longer valid. Ask the group coordinator for a new one.
          </p>
          <a
            href="/dashboard"
            className="inline-flex px-6 py-3 bg-ember text-text-inverse font-sans text-sm font-semibold rounded-[10px] hover:bg-ember-hover transition-all duration-200"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const existing = await db.query.hearthMemberships.findFirst({
    where: and(
      eq(hearthMemberships.hearthId, invite.hearthId),
      eq(hearthMemberships.familyId, family.id),
      eq(hearthMemberships.status, 'active'),
    ),
  });

  if (existing) {
    redirect(`/hearths/${invite.hearthId}`);
  }

  const hearth = await db.query.hearths.findFirst({
    where: eq(hearths.id, invite.hearthId),
  });

  if (!hearth) {
    redirect('/dashboard');
  }

  return (
    <JoinClient
      hearthId={hearth.id}
      hearthName={hearth.name}
      hearthDescription={hearth.description ?? null}
      code={code}
    />
  );
}
