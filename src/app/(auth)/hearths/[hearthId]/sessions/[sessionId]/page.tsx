import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Paperclip, NotePencil, Lifebuoy } from '@/components/icons';
import { db } from '@/lib/db';
import {
  hearths,
  hearthSessions,
  sessionEvidence,
  suggestedObservations,
  families,
  learners,
} from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { getHearthMembership } from '@/lib/auth/hearth-helpers';
import { safeLoad } from '@/lib/server/safe-load';
import EmptyState from '@/components/ui/EmptyState';

function SessionErrorState({ hearthId }: { hearthId: string }) {
  return (
    <div className="mx-auto max-w-2xl px-lg py-2xl">
      <EmptyState
        icon={Lifebuoy}
        heading="Couldn't load this session"
        body="Something went wrong on our side. Try again in a moment."
        cta={{ label: 'Back to Hearth', href: `/hearths/${hearthId}` }}
      />
    </div>
  );
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ hearthId: string; sessionId: string }>;
}) {
  const { hearthId, sessionId } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const familyResult = await safeLoad('hearths/[hearthId]/sessions/[sessionId]', () =>
    getFamilyByClerkId(userId),
  );
  if (!familyResult.ok) return <SessionErrorState hearthId={hearthId} />;
  const family = familyResult.data;
  if (!family) redirect('/onboarding');

  const membershipResult = await safeLoad('hearths/[hearthId]/sessions/[sessionId]', () =>
    getHearthMembership(family.id, hearthId),
  );
  if (!membershipResult.ok) return <SessionErrorState hearthId={hearthId} />;
  const membership = membershipResult.data;
  if (!membership) redirect('/dashboard');

  const result = await safeLoad('hearths/[hearthId]/sessions/[sessionId]', async () => {
    const [hearth, session, evidence, observations, familyLearners] = await Promise.all([
      db.query.hearths.findFirst({ where: eq(hearths.id, hearthId) }),
      db.query.hearthSessions.findFirst({
        where: and(eq(hearthSessions.id, sessionId), eq(hearthSessions.hearthId, hearthId)),
      }),
      db.query.sessionEvidence.findMany({
        where: eq(sessionEvidence.sessionId, sessionId),
      }),
      // PRIVACY: only load observations targeting THIS family
      db.query.suggestedObservations.findMany({
        where: and(
          eq(suggestedObservations.sessionId, sessionId),
          eq(suggestedObservations.targetFamilyId, family.id),
        ),
      }),
      db.query.learners.findMany({
        where: eq(learners.familyId, family.id),
      }),
    ]);

    if (!hearth || !session) {
      return { hearth, session, evidence, observations, familyLearners, facilitatorFamily: null, observerFamilyMap: new Map<string, string>() };
    }

    // Load facilitator name
    const facilitatorFamily = await db.query.families.findFirst({
      where: eq(families.id, session.facilitatorFamilyId),
    });

    // Batch load observer families for observations
    let observerFamilyMap = new Map<string, string>();
    if (observations.length > 0) {
      const observerFamilyIds = [...new Set(observations.map((o) => o.observerFamilyId))];
      const observerFamilies = await db.query.families.findMany({
        where: inArray(families.id, observerFamilyIds),
      });
      observerFamilyMap = new Map(observerFamilies.map((f) => [f.id, f.familyName]));
    }

    return { hearth, session, evidence, observations, familyLearners, facilitatorFamily, observerFamilyMap };
  });

  if (!result.ok) return <SessionErrorState hearthId={hearthId} />;
  const { hearth, session, evidence, observations, familyLearners, facilitatorFamily, observerFamilyMap } = result.data;

  if (!hearth || !session) redirect(`/hearths/${hearthId}`);

  // Map learner IDs to learner records
  const learnerMap = new Map(familyLearners.map((l) => [l.id, l]));

  const isScaffoldReady = session.status === 'completed';

  const statusLabel =
    session.status === 'completed'
      ? 'Ready to log'
      : session.status === 'upcoming'
        ? 'Upcoming'
        : 'Logged';

  const statusClass =
    session.status === 'completed'
      ? 'bg-ember/15 text-ember'
      : session.status === 'upcoming'
        ? 'bg-child-blue/12 text-child-blue'
        : 'bg-sage/10 text-sage';

  // Format date for display
  const sessionDate = session.date
    ? new Date(session.date + 'T00:00:00').toLocaleDateString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const timeRange =
    session.timeStart && session.timeEnd
      ? `${session.timeStart} – ${session.timeEnd}`
      : session.timeStart
        ? session.timeStart
        : null;

  return (
    <div className="min-h-screen bg-surface-body">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back nav */}
        <Link
          href={`/hearths/${hearthId}`}
          className="flex items-center gap-sm text-text-muted font-sans text-sm cursor-pointer hover:text-ember transition-colors duration-200 mb-lg"
        >
          ← Back to {hearth.name}
        </Link>

        {/* Status badge + title */}
        <div className="flex items-start gap-3 mb-md">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-sans text-xs font-semibold uppercase tracking-wide shrink-0 mt-1 ${statusClass}`}
          >
            {statusLabel}
          </span>
        </div>
        <h1 className="font-serif text-3xl font-semibold text-text-primary mb-lg leading-snug">
          {session.title}
        </h1>

        {/* Meta grid */}
        <div className="flex flex-wrap gap-lg mb-xl">
          {sessionDate && (
            <div>
              <div className="font-sans text-xs uppercase tracking-wide text-text-muted mb-0.5">
                Date
              </div>
              <div className="font-serif text-[0.95rem] text-text-primary">{sessionDate}</div>
            </div>
          )}
          {timeRange && (
            <div>
              <div className="font-sans text-xs uppercase tracking-wide text-text-muted mb-0.5">
                Time
              </div>
              <div className="font-serif text-[0.95rem] text-text-primary">{timeRange}</div>
            </div>
          )}
          {session.location && (
            <div>
              <div className="font-sans text-xs uppercase tracking-wide text-text-muted mb-0.5">
                Location
              </div>
              <div className="font-serif text-[0.95rem] text-text-primary">{session.location}</div>
            </div>
          )}
          {facilitatorFamily && (
            <div>
              <div className="font-sans text-xs uppercase tracking-wide text-text-muted mb-0.5">
                Facilitated by
              </div>
              <div className="font-serif text-[0.95rem] text-text-primary">
                {facilitatorFamily.familyName}
              </div>
            </div>
          )}
        </div>

        {/* Shared Record section */}
        {(session.sharedRecord || session.description) && (
          <div className="mb-xl">
            <h2 className="font-serif text-lg font-semibold text-text-primary mb-md">
              Shared Record
            </h2>
            <div className="bg-surface-panel border border-border-subtle rounded-lg p-xl shadow-card">
              <p className="font-serif text-[0.95rem] text-text-secondary leading-relaxed whitespace-pre-wrap">
                {session.sharedRecord ?? session.description}
              </p>
            </div>
          </div>
        )}

        {/* Evidence grid */}
        {evidence.length > 0 && (
          <div className="mb-xl">
            <h2 className="font-serif text-lg font-semibold text-text-primary mb-md">
              Evidence
            </h2>
            <div className="grid grid-cols-3 gap-md mt-lg">
              {evidence.map((e) => (
                <div key={e.id}>
                  {e.fileType?.startsWith('image/') ? (
                    <div className="aspect-[4/3] rounded-[10px] border border-border-subtle overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={e.fileUrl}
                        alt={e.caption ?? 'Session evidence'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-surface-raised rounded-[10px] border border-border-subtle flex items-center justify-center text-text-secondary">
                      <Paperclip size={32} aria-hidden="true" />
                    </div>
                  )}
                  {e.caption && (
                    <p className="font-sans text-xs text-text-muted mt-xs truncate">{e.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observations section */}
        {observations.length > 0 && (
          <div className="mb-xl">
            <h2 className="font-serif text-lg font-semibold text-text-primary mb-md">
              Observations About Your Children
            </h2>
            <div className="flex flex-col gap-md">
              {observations.map((obs) => {
                const targetLearner = learnerMap.get(obs.targetLearnerId);
                const observerName =
                  observerFamilyMap.get(obs.observerFamilyId) ?? 'Another family';

                return (
                  <div
                    key={obs.id}
                    className="bg-surface-panel border border-border-subtle rounded-lg p-xl shadow-card"
                  >
                    {/* Observer + learner row */}
                    <div className="flex items-center justify-between mb-md">
                      <div className="flex items-center gap-sm">
                        {targetLearner && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full font-sans text-xs font-semibold"
                            style={
                              targetLearner.colourToken
                                ? {
                                    backgroundColor: `${targetLearner.colourToken}22`,
                                    color: targetLearner.colourToken,
                                  }
                                : undefined
                            }
                          >
                            {targetLearner.name.split(' ')[0]}
                          </span>
                        )}
                        <span className="font-sans text-xs text-text-muted">
                          observed by {observerName}
                        </span>
                      </div>
                      <span className="font-sans text-xs text-text-muted italic">
                        Awaiting your review
                      </span>
                    </div>

                    {/* Observation text */}
                    <p className="font-serif text-[0.95rem] text-text-secondary leading-relaxed">
                      {obs.observationText}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {isScaffoldReady && (
          <div className="flex items-center gap-md pt-md">
            <Link
              href={`/log?scaffold=${sessionId}&hearthId=${hearthId}`}
              className="inline-flex items-center gap-xs px-6 py-3 bg-ember text-text-inverse font-sans text-sm font-semibold rounded-[10px] hover:opacity-90 transition-opacity duration-200"
            >
              <NotePencil size={14} aria-hidden="true" /> Log this session
            </Link>
            <Link
              href={`/hearths/${hearthId}`}
              className="px-4 py-2 bg-surface-raised text-text-primary border border-border-subtle rounded-[10px] font-sans text-sm hover:border-border-medium transition-colors duration-200"
            >
              Skip for now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
