import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Walk Daily',
  description: 'Walk Daily terms of service.',
}

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
        Terms of Service
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-faint)' }}>Last updated: June 2026</p>

      <div className="space-y-6 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        <section>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
            Acceptance of Terms
          </h2>
          <p>
            By using Walk Daily, you agree to these terms. If you do not agree, please do
            not use the app. These terms apply to all users of the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
            Use of the Service
          </h2>
          <p>
            Walk Daily is provided free of charge for personal, non-commercial use. You agree to:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Use the service in a manner consistent with its intended purpose</li>
            <li>Not attempt to reverse engineer, hack, or disrupt the service</li>
            <li>Not post content that is hateful, abusive, or harmful to others</li>
            <li>Respect the faith community and use the Prayer Wall with kindness</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
            User Content
          </h2>
          <p>
            You retain ownership of your journal entries, prayer requests, and other content
            you create. By posting to the Prayer Wall, you grant Walk Daily a license to
            display that content within the app. You can delete your content at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
            AI Features
          </h2>
          <p>
            Grace, the AI Bible assistant, provides responses based on Scripture and
            Christian teaching. AI responses are for educational and devotional purposes
            and should not replace pastoral counsel or professional advice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
            Moderation
          </h2>
          <p>
            We reserve the right to remove content that violates these terms or is reported
            by the community. Posts with 5 or more flags are automatically hidden. Users who
            repeatedly violate these terms may have their accounts suspended.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
            Disclaimer
          </h2>
          <p>
            Walk Daily is provided &quot;as is&quot; without warranties of any kind. We do not guarantee
            uninterrupted service or error-free operation. The Bible translations provided are
            from third-party APIs and may contain variations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
            Changes to Terms
          </h2>
          <p>
            We may update these terms from time to time. Continued use of Walk Daily after
            changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
            Contact
          </h2>
          <p>
            For questions about these terms, email{' '}
            <a href="mailto:hello@walkdaily.app" className="underline" style={{ color: 'var(--color-primary-500)' }}>
              hello@walkdaily.app
            </a>.
          </p>
        </section>
      </div>
    </div>
  )
}
