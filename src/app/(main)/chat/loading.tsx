import { ChatMessageSkeleton } from "@/components/ui/Skeletons";

/**
 * Chat-specific loading skeleton with message bubbles.
 * Shown while the chat page is loading history.
 */
export default function ChatLoading() {
  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
      {/* Header skeleton */}
      <div
        className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
        style={{
          background: "var(--nav-bg)",
          borderBottom: "1px solid var(--nav-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <div>
            <div className="skeleton" style={{ width: 80, height: 14, borderRadius: 4, marginBottom: 4 }} />
            <div className="skeleton" style={{ width: 50, height: 10, borderRadius: 4 }} />
          </div>
        </div>
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
      </div>

      {/* Message bubble skeletons */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <ChatMessageSkeleton variant="ai" />
        <ChatMessageSkeleton variant="user" />
        <ChatMessageSkeleton variant="ai" />
        <ChatMessageSkeleton variant="user" />
        <ChatMessageSkeleton variant="ai" />
      </div>

      {/* Input skeleton */}
      <div
        className="sticky bottom-0 px-4 py-3"
        style={{
          background: "var(--nav-bg)",
          borderTop: "1px solid var(--nav-border)",
        }}
      >
        <div className="skeleton" style={{ width: "100%", height: 44, borderRadius: 12 }} />
      </div>
    </div>
  );
}
