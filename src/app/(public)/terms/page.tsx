import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Hearth',
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-lg py-3xl">
      <Link
        href="/"
        className="mb-xl inline-block font-sans text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        &larr; Back to Hearth
      </Link>

      <h1 className="mb-lg font-serif text-3xl font-semibold text-text-primary">
        Terms of Service
      </h1>
      <p className="mb-xl font-sans text-sm text-text-tertiary">
        Last updated: 6 April 2026
      </p>

      <div className="space-y-lg font-serif text-base leading-relaxed text-text-secondary">
        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Hearth (&quot;the Service&quot;), you agree to be bound by these Terms of
            Service. If you do not agree, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">2. Description of Service</h2>
          <p>
            Hearth is a learning management platform designed to help Australian homeschool families
            log, track, and reflect on their children&apos;s education. The Service includes learning
            logs, curriculum-aligned reporting, and content packs.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">3. User Accounts</h2>
          <p>
            You are responsible for maintaining the security of your account credentials. You must
            provide accurate information when creating an account and keep it up to date.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">4. Acceptable Use</h2>
          <p>
            You agree not to misuse the Service, including but not limited to: attempting to gain
            unauthorised access, interfering with other users, or using the Service for unlawful
            purposes.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">5. Intellectual Property</h2>
          <p>
            All content, design, and code comprising the Service remain the property of Hearth. Content
            you create (learning logs, entries, notes) remains yours.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">6. Limitation of Liability</h2>
          <p>
            The Service is provided &quot;as is&quot; without warranties of any kind. Hearth shall not be
            liable for any indirect, incidental, or consequential damages arising from your use of the
            Service.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">7. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Service after changes
            constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">8. Governing Law</h2>
          <p>
            These Terms are governed by the laws of Queensland, Australia.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">9. Contact</h2>
          <p>
            Questions about these Terms? Reach us at{' '}
            <a href="mailto:hello@hearthlearning.au" className="text-ember underline">
              hello@hearthlearning.au
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
