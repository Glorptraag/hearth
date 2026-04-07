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
        Last updated: 6 April 2026
      </p>

      <div className="space-y-lg font-serif text-base leading-relaxed text-text-secondary">
        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">1. Information We Collect</h2>
          <p>
            We collect information you provide directly: your name, email address, and account details
            via Clerk authentication. We also collect learning log entries, notes, and other content you
            create within Hearth.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">2. How We Use Your Information</h2>
          <p>
            Your information is used to provide and improve the Service, including: displaying your
            learning logs, generating curriculum-aligned reports, and powering AI-enriched summaries at
            write-time. We do not sell your personal information.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">3. AI Processing</h2>
          <p>
            When you save a learning log entry, it may be processed by Anthropic&apos;s Claude (Haiku
            model) to generate curriculum alignments and summaries. This processing happens once at
            write-time. Your data is not used to train AI models.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">4. Data Storage</h2>
          <p>
            User and transactional data is stored in Neon (serverless Postgres) with encryption at rest.
            Content data is stored in Sanity CMS. Authentication is handled by Clerk. All services are
            hosted in secure, SOC 2-compliant environments.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">5. Data Sharing</h2>
          <p>
            We share data only with the service providers necessary to operate Hearth: Clerk
            (authentication), Neon (database), Sanity (content), Anthropic (AI enrichment), and Vercel
            (hosting). We do not share your data with advertisers or data brokers.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">6. Children&apos;s Information</h2>
          <p>
            Hearth is used by parents to log their children&apos;s learning. Children do not create
            accounts or interact with the Service directly. Child-related data (names, learning entries)
            is controlled entirely by the parent account holder.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">7. Your Rights</h2>
          <p>
            Under Australian Privacy Principles, you have the right to access, correct, or delete your
            personal information. You may export or delete your data at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">8. Cookies</h2>
          <p>
            Hearth uses essential cookies for authentication and session management only. We do not use
            tracking or advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes
            via email or an in-app notice.
          </p>
        </section>

        <section>
          <h2 className="mb-sm font-serif text-xl font-semibold text-text-primary">10. Contact</h2>
          <p>
            Privacy questions? Reach us at{' '}
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
