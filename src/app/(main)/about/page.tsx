import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — Walk Daily',
  description: 'Learn about Walk Daily, the free AI-powered Bible companion for daily spiritual growth.',
}

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
        About Walk Daily
      </h1>

      <div className="space-y-6 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        <p>
          Walk Daily is a free, AI-powered Christian app designed to help you read the Bible,
          pray, journal, and grow in your faith — every single day.
        </p>

        <p>
          We believe everyone should have access to powerful Bible study tools without paying
          a cent. That is why Walk Daily is free forever, supported by a community that
          believes in making Scripture accessible to all.
        </p>

        <h2 className="text-xl font-semibold pt-4" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
          Our Mission
        </h2>
        <p>
          To help millions of people build a daily habit of reading God&apos;s Word,
          praying with intention, and growing deeper in their faith through technology
          that feels personal and alive.
        </p>

        <h2 className="text-xl font-semibold pt-4" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
          What We Offer
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Bible Reader with 1500+ translations</li>
          <li>AI Bible study assistant named Grace</li>
          <li>Prayer Wall for community prayer</li>
          <li>Faith Journal with mood tracking</li>
          <li>Verse Memory with spaced repetition</li>
          <li>Daily devotionals personalized to you</li>
          <li>Reading plans with streak tracking</li>
          <li>Works offline as a Progressive Web App</li>
        </ul>

        <h2 className="text-xl font-semibold pt-4" style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}>
          Contact
        </h2>
        <p>
          Have questions or feedback? Reach us at{' '}
          <a href="mailto:hello@walkdaily.app" className="underline" style={{ color: 'var(--color-primary-500)' }}>
            hello@walkdaily.app
          </a>
        </p>

        <p className="pt-8 text-sm" style={{ color: 'var(--text-faint)' }}>
          Walk Daily v1.0.0 — Made with love for the Church.
        </p>
      </div>
    </div>
  )
}
