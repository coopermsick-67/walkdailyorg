/* ------------------------------------------------------------------ */
/*  Empty-state illustrations (pure CSS, no external images)          */
/* ------------------------------------------------------------------ */

interface EmptyStateProps {
  title: string;
  description: string;
  illustration: "bible" | "chat" | "prayer" | "journal" | "search" | "error";
  action?: React.ReactNode;
}

/** Reusable empty state component with a CSS-drawn illustration. */
export function EmptyState({
  title,
  description,
  illustration,
  action,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
      aria-label={title}
    >
      <EmptyIllustration type={illustration} />
      <h3
        className="font-heading text-lg font-semibold mt-5 mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h3>
      <p
        className="text-sm max-w-[280px] leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CSS Illustrations                                                 */
/* ------------------------------------------------------------------ */

function EmptyIllustration({ type }: { type: EmptyStateProps["illustration"] }) {
  return (
    <div className="w-20 h-20 flex items-center justify-center" aria-hidden="true">
      {illustrations[type]}
    </div>
  );
}

const illustrations: Record<EmptyStateProps["illustration"], React.ReactNode> = {
  bible: <BibleIllustration />,
  chat: <ChatIllustration />,
  prayer: <PrayerIllustration />,
  journal: <JournalIllustration />,
  search: <SearchIllustration />,
  error: <ErrorIllustration />,
};

/* Individual SVG illustrations — all themed via currentColor. */

function BibleIllustration() {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      className="w-full h-full"
      style={{ color: "var(--color-primary-300)" }}
    >
      {/* Book shape */}
      <rect
        x="18"
        y="14"
        width="44"
        height="52"
        rx="4"
        fill="currentColor"
        opacity="0.15"
      />
      <rect
        x="20"
        y="16"
        width="20"
        height="48"
        rx="2"
        fill="currentColor"
        opacity="0.3"
      />
      <rect
        x="40"
        y="16"
        width="20"
        height="48"
        rx="2"
        fill="currentColor"
        opacity="0.2"
      >
        {/* Spine line */}
      </rect>
      <line
        x1="40"
        y1="16"
        x2="40"
        y2="64"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
      {/* Cross on cover */}
      <line
        x1="36"
        y1="30"
        x2="44"
        y2="30"
        stroke="var(--color-accent-500)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="40"
        y1="26"
        x2="40"
        y2="34"
        stroke="var(--color-accent-500)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChatIllustration() {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      className="w-full h-full"
      style={{ color: "var(--color-primary-300)" }}
    >
      {/* Chat bubble */}
      <rect
        x="10"
        y="18"
        width="52"
        height="36"
        rx="12"
        fill="currentColor"
        opacity="0.2"
      />
      <polygon
        points="20,54 28,54 20,62"
        fill="currentColor"
        opacity="0.2"
      />
      {/* Dots */}
      <circle cx="24" cy="34" r="3" fill="var(--color-accent-500)" />
      <circle cx="36" cy="34" r="3" fill="var(--color-accent-500)" opacity="0.7" />
      <circle cx="48" cy="34" r="3" fill="var(--color-accent-500)" opacity="0.4" />
      {/* Sparkle accent */}
      <circle cx="62" cy="22" r="8" fill="currentColor" opacity="0.12" />
      <path
        d="M62 17 L62 27 M57 22 L67 22"
        stroke="var(--color-accent-500)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PrayerIllustration() {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      className="w-full h-full"
      style={{ color: "var(--color-primary-300)" }}
    >
      {/* Praying hands shape (simplified) */}
      <path
        d="M30 55 C30 55, 30 40, 40 35 C50 40, 50 55, 50 55"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M35 48 C35 48, 35 36, 40 32 C45 36, 45 48, 45 48"
        stroke="var(--color-accent-500)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="var(--color-accent-500)"
        opacity="0.15"
      />
      {/* Heart above */}
      <path
        d="M40 22 C36 16, 26 18, 26 26 C26 32, 40 40, 40 40 C40 40, 54 32, 54 26 C54 18, 44 16, 40 22Z"
        fill="var(--color-accent-500)"
        opacity="0.3"
      />
    </svg>
  );
}

function JournalIllustration() {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      className="w-full h-full"
      style={{ color: "var(--color-primary-300)" }}
    >
      {/* Notebook */}
      <rect
        x="16"
        y="12"
        width="42"
        height="56"
        rx="4"
        fill="currentColor"
        opacity="0.15"
      />
      <line
        x1="28"
        y1="12"
        x2="28"
        y2="68"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
      />
      {/* Lines */}
      <line x1="34" y1="26" x2="52" y2="26" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      <line x1="34" y1="34" x2="52" y2="34" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
      <line x1="34" y1="42" x2="48" y2="42" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
      {/* Pen */}
      <line
        x1="58"
        y1="16"
        x2="64"
        y2="60"
        stroke="var(--color-accent-500)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
      />
      <polygon
        points="64,58 67,64 61,62"
        fill="var(--color-accent-500)"
        opacity="0.6"
      />
    </svg>
  );
}

function SearchIllustration() {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      className="w-full h-full"
      style={{ color: "var(--color-primary-300)" }}
    >
      <circle
        cx="34"
        cy="34"
        r="18"
        stroke="currentColor"
        strokeWidth="3.5"
        fill="currentColor"
        opacity="0.15"
      />
      <line
        x1="48"
        y1="48"
        x2="64"
        y2="64"
        stroke="var(--color-accent-500)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Question mark hint */}
      <text
        x="34"
        y="40"
        textAnchor="middle"
        fontFamily="var(--font-heading)"
        fontSize="18"
        fontWeight="600"
        fill="currentColor"
        opacity="0.4"
      >
        ?
      </text>
    </svg>
  );
}

function ErrorIllustration() {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      className="w-full h-full"
      style={{ color: "var(--error-bg)" }}
    >
      <circle cx="40" cy="40" r="24" fill="currentColor" opacity="0.12" />
      <line x1="32" y1="32" x2="48" y2="48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="48" y1="32" x2="32" y2="48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
