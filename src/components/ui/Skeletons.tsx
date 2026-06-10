/* ------------------------------------------------------------------ */
/*  Skeleton loading placeholders                                     */
/*  All use the .skeleton class from globals.css (shimmer animation)  */
/* ------------------------------------------------------------------ */

/** Bible verse card skeleton — mimics a verse block with reference + text lines. */
export function BibleVerseSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{ background: "var(--surface-card)", boxShadow: "var(--shadow-sm)" }}
      aria-label="Loading verse"
      aria-busy="true"
    >
      <div className="skeleton skeleton-title" style={{ width: "45%" }} />
      <div className="skeleton skeleton-text" style={{ width: "90%" }} />
      <div className="skeleton skeleton-text" style={{ width: "85%" }} />
      <div className="skeleton skeleton-text" style={{ width: "60%" }} />
      <div className="flex gap-2 mt-3">
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
      </div>
    </div>
  );
}

/** Chat message skeleton — user bubble on right, AI bubble on left. */
export function ChatMessageSkeleton({ variant = "ai" }: { variant?: "ai" | "user" }) {
  const isUser = variant === "user";
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      aria-label="Loading message"
      aria-busy="true"
    >
      <div
        className="rounded-2xl px-4 py-3 max-w-[80%] space-y-2"
        style={{
          background: isUser
            ? "var(--color-primary-500)"
            : "var(--surface-card)",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        }}
      >
        <div
          className="skeleton skeleton-text"
          style={{
            width: isUser ? "120px" : "180px",
            background: isUser
              ? "rgba(255,255,255,0.2)"
              : undefined,
          }}
        />
        <div
          className="skeleton skeleton-text"
          style={{
            width: isUser ? "80px" : "140px",
            background: isUser
              ? "rgba(255,255,255,0.2)"
              : undefined,
          }}
        />
      </div>
    </div>
  );
}

/** Journal entry card skeleton. */
export function JournalEntrySkeleton() {
  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{ background: "var(--surface-card)", boxShadow: "var(--shadow-sm)" }}
      aria-label="Loading journal entry"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <div className="skeleton skeleton-avatar" />
        <div className="flex-1 space-y-2">
          <div className="skeleton skeleton-text" style={{ width: "40%" }} />
          <div className="skeleton skeleton-text" style={{ width: "25%" }} />
        </div>
      </div>
      <div className="skeleton skeleton-text" style={{ width: "95%" }} />
      <div className="skeleton skeleton-text" style={{ width: "80%" }} />
      <div className="skeleton skeleton-text" style={{ width: "50%" }} />
    </div>
  );
}

/** Prayer request card skeleton. */
export function PrayerRequestSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{ background: "var(--surface-card)", boxShadow: "var(--shadow-sm)" }}
      aria-label="Loading prayer request"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <div className="skeleton skeleton-avatar" />
        <div className="skeleton skeleton-text" style={{ width: "35%" }} />
      </div>
      <div className="skeleton skeleton-text" style={{ width: "90%" }} />
      <div className="skeleton skeleton-text" style={{ width: "75%" }} />
      <div className="flex gap-4 mt-2">
        <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 14 }} />
        <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 14 }} />
      </div>
    </div>
  );
}

/** Generic list skeleton — renders N placeholder rows. */
export function ListSkeleton({
  count = 3,
  variant = "card",
}: {
  count?: number;
  variant?: "card" | "verse" | "chat" | "journal" | "prayer";
}) {
  const Component = {
    card: () => (
      <div
        className="skeleton skeleton-card rounded-2xl"
        style={{ background: "var(--surface-card)" }}
      />
    ),
    verse: BibleVerseSkeleton,
    chat: ChatMessageSkeleton,
    journal: JournalEntrySkeleton,
    prayer: PrayerRequestSkeleton,
  }[variant];

  return (
    <div className="space-y-4" aria-label="Loading list" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
