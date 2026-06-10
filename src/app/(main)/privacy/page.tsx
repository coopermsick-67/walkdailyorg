import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Walk Daily',
  description: 'Walk Daily privacy policy. Learn how we protect your data.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
        Privacy Policy
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-faint)' }}>Last updated: June 2026</p>

      <div className="space-y-6 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        <section>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
            Information We Collect
          </h2>
          <p>
            We collect only what is needed to provide the Walk Daily experience: your email,
            display name, faith preferences, reading history, prayer requests you post,
            journal entries you write, and chat messages with Grace.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
            How We Use Your Data
          </h2>
          <p>Your data is used exclusively to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Personalize your Bible reading and devotional experience</li>
            <li>Track your reading plan progress and streaks</li>
            <li>Power AI chat responses from Grace</li>
            <li>Display community prayer requests you choose to share</li>
            <li>Improve the app through anonymous usage analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
            What We Never Do
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>We never sell your personal data to anyone</li>
            <li>We never use your journal entries or prayers for advertising</li>
            <li>We never share your data with third parties for marketing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
            Data Security
          </h2>
          <p>
            All data is stored in encrypted form using Supabase infrastructure. Communication
            between your device and our servers is encrypted via HTTPS. We use industry-standard
            security practices to protect your information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
            Your Rights
          </h2>
          <p>You can request deletion of all your data at any time by contacting us at{' '}
            <a href="mailto:hello@walkdaily.app" className="underline" style={{ color: 'var(--color-primary-500)' }}>
              hello@walkdaily.app
            </a>.
            We will complete deletion within 48 hours.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
            Children&apos;s Privacy
          </h2>
          <p>
            Walk Daily is designed for users of all ages. We do not knowingly collect data
            from children under 13 without parental consent. If you are a parent and believe
            your child has provided us data, please contact us for deletion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
            Contact
          </h2>
          <p>
            For privacy questions, email{' '}
            <a href="mailto:hello@walkdaily.app" className="underline" style={{ color: 'var(--color-primary-500)' }}>
              hello@walkdaily.app
            </a>.
          </p>
        </section>
      </div>
    </div>
  )
}
