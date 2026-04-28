import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Hearth',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-lg py-3xl">
      <Link
        href="/"
        className="mb-xl inline-block font-sans text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        &larr; Back to Hearth
      </Link>

      <h1 className="mb-lg font-serif text-3xl font-semibold text-text-primary">
        Privacy Policy
      </h1>
      <p className="mb-xl font-sans text-sm text-text-tertiary">
        Last updated: 26 April 2026
      </p>

      <div className="space-y-lg font-serif text-base leading-relaxed text-text-secondary">
        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">1. Information We Collect</h2>
          <p>
            We collect information you provide directly: your name, email address, and account details
            via Clerk authentication. Within Hearth you create learning log entries, learner profiles,
            facilitator notes, photos and other media you choose to attach, and pedagogy preferences.
            We collect basic technical telemetry (request timing, error stack traces) needed to operate
            the service. We do not collect free-form learner names, entry content, or messages in any
            analytics event — see §3.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">2. How We Use Your Information</h2>
          <p>
            Your information is used to provide and improve the Service: displaying your learning logs,
            generating Australian Curriculum-aligned reports, suggesting relevant content, and powering
            AI-enriched summaries at write-time. We do not sell your personal information and we do not
            share it with advertisers or data brokers.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">3. Analytics &amp; Error Reporting</h2>
          <p>
            We use PostHog (self-hosted) for product analytics and Sentry for error reporting. Our
            posture for both:
          </p>
          <ul className="mt-xs ml-md list-disc space-y-xs">
            <li>
              <strong>No autocapture.</strong> We only send a small allowlist of events
              (e.g. <em>entry created</em>, <em>report exported</em>) — never autocaptured page contents
              or text inputs.
            </li>
            <li>
              <strong>Identifiers are hashed.</strong> Your account ID and your family ID are SHA-256
              hashed before they leave your browser, so the analytics service never sees the raw
              identifiers.
            </li>
            <li>
              <strong>No learner content in events.</strong> Entry text, learner names, photos, and
              free-form text are never sent to PostHog or Sentry.
            </li>
            <li>
              <strong>Family-level aggregation.</strong> Two parents on the same household are grouped
              under one anonymous family identifier so usage funnels reflect the household, not two
              separate persons.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">4. AI Processing</h2>
          <p>
            When you save a complete learning log entry, the entry text is sent once to Anthropic&apos;s
            Claude (Haiku model) to generate curriculum alignments and a summary. While drafting an
            entry, a debounced version may also fire to surface in-Logger reflection prompts. All AI
            calls happen at write-time; no runtime AI is wired into screens you read. Anthropic&apos;s
            terms forbid training on your content.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">5. Data Storage &amp; Hosting</h2>
          <p>
            User and transactional data is stored in Neon (serverless PostgreSQL) with encryption at
            rest. Application code runs on Vercel. Reusable learning content (modules, activities,
            capability threads) lives in Sanity CMS. Authentication is handled by Clerk. Photo and
            media evidence you attach to entries is stored in Vercel Blob. We choose Australian or
            nearby regions where the service provider exposes that option; specific region details
            are available on request.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">6. Data Sharing</h2>
          <p>
            We share data only with the service providers necessary to operate Hearth: Clerk
            (authentication), Neon (database), Vercel (hosting + media), Sanity (content),
            Anthropic (AI enrichment), Sentry (error reporting), and PostHog (analytics, self-hosted).
            Each provider is contractually bound to use the data only to provide their service to us.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">7. Children&apos;s Information</h2>
          <p>
            Hearth is used by parents and other authorised facilitators to log children&apos;s learning.
            Children do not create accounts and do not interact with the Service directly. All
            child-related data — names, photos, learning entries, badge progress — is controlled
            entirely by the family account holder, who can edit or delete it at any time.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">8. Your Rights (Australian Privacy Principles)</h2>
          <p>
            Under the Australian Privacy Principles, you have the right to access, correct, or delete
            your personal information.
          </p>
          <ul className="mt-xs ml-md list-disc space-y-xs">
            <li>
              <strong>Export everything.</strong> The Settings → Account screen calls{' '}
              <code className="rounded-sm bg-surface-raised px-xs py-[1px] font-mono text-[12px]">/api/account/export</code>{' '}
              to download a JSON archive of your family, learners, entries, planner, library, badges,
              and settings.
            </li>
            <li>
              <strong>Delete everything.</strong> The Settings → Account screen calls{' '}
              <code className="rounded-sm bg-surface-raised px-xs py-[1px] font-mono text-[12px]">/api/account/delete</code>{' '}
              after explicit confirmation. This irreversibly removes every family-scoped row across
              all of our internal tables. Authentication records held by Clerk should be removed
              separately via the Clerk-provided account-deletion flow.
            </li>
            <li>
              <strong>Correct anything.</strong> Edit profile data, learner profiles, and entries from
              within the app at any time.
            </li>
          </ul>
          <p className="mt-xs">
            If a self-service flow doesn&apos;t cover your request, email us at{' '}
            <a href="mailto:hello@hearthlearning.au" className="text-ember underline">
              hello@hearthlearning.au
            </a>{' '}
            and we&apos;ll respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">9. Retention</h2>
          <p>
            Data persists for as long as your account is active. After account deletion, the family
            cascade described in §8 is immediate. Operational backups (Neon point-in-time recovery)
            retain a rolling window — typically 7 days on our current plan — and roll off automatically.
            Stale draft modules you never published are removed after 90 days; expired notifications
            are dismissed weekly.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">10. Cookies</h2>
          <p>
            Hearth uses essential cookies for authentication, session management, and theme preference
            only. We do not use tracking or advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes
            via email and an in-app notice before they take effect.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">12. Contact</h2>
          <p>
            Privacy questions, complaints, or requests? Reach us at{' '}
            <a href="mailto:hello@hearthlearning.au" className="text-ember underline">
              hello@hearthlearning.au
            </a>
            . If you are not satisfied with our response, you may contact the{' '}
            <a
              href="https://www.oaic.gov.au/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ember underline"
            >
              Office of the Australian Information Commissioner
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
