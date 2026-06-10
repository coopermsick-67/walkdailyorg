"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ChatBubble from "@/components/ai/ChatBubble";
import ChatInput from "@/components/ai/ChatInput";
import VerseModeToggle from "@/components/ai/VerseModeToggle";
import SuggestedPrompts, { type SuggestedPrompt } from "@/components/ai/SuggestedPrompts";
import { streamChat } from "@/lib/ai/client";
import { useToast } from "@/components/ui/Toast";
import { ChatMessageSkeleton } from "@/components/ui/Skeletons";
import type { AIMessage } from "@/types/ai";
import { Settings, MessageCircle, ChevronDown, BookOpen, Heart, Sparkles, MessageSquare, Brain, Share2, Briefcase } from "lucide-react";

const PAGE_SIZE = 50;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UserProfile {
  faith_journey: string | null;
  spiritual_challenge: string | null;
}

/* ------------------------------------------------------------------ */
/*  Personalized prompts                                               */
/* ------------------------------------------------------------------ */

interface PersonalizedPrompt {
  icon: React.ReactNode;
  label: string;
  topic: string;
}

function getPersonalizedPrompts(profile: UserProfile): PersonalizedPrompt[] {
  const challenge = profile.spiritual_challenge;

  const byChallenge: Record<string, PersonalizedPrompt> = {
    time: {
      icon: <BookOpen size={18} />,
      label: "Help me create a 7-day Bible reading plan",
      topic: "Help me create a 7-day Bible reading plan that fits into my busy schedule. I want to build a consistent habit of reading Scripture daily.",
    },
    understanding: {
      icon: <Brain size={18} />,
      label: "Explain the context of my current reading",
      topic: profile.faith_journey
        ? `I'm a ${profile.faith_journey} believer. Can you explain the deeper context of what I'm reading now in the Bible?`
        : "Can you explain the context of what I'm currently reading in the Bible? I want to understand the historical and cultural background.",
    },
    hardship: {
      icon: <Heart size={18} />,
      label: "What does God say about suffering?",
      topic: "What does God say about suffering? I'm going through a difficult time and I need to know what the Bible teaches about pain, trials, and enduring hardship with faith.",
    },
    prayer: {
      icon: <MessageSquare size={18} />,
      label: "Help me build a daily prayer routine",
      topic: "Help me build a daily prayer routine. I want to deepen my prayer life and be more consistent in talking to God throughout the day.",
    },
    daily_life: {
      icon: <Briefcase size={18} />,
      label: "How can I be a better witness at work?",
      topic: "How can I be a better witness at work? I want to live out my faith authentically in my workplace and share Christ's love with my colleagues.",
    },
    sharing: {
      icon: <Share2 size={18} />,
      label: "Give me courage to share my faith",
      topic: "Give me courage to share my faith with others. I feel anxious about talking about Jesus with people around me - how can I overcome this fear?",
    },
  };

  // Always include some universal prompts plus the personalized one for their challenge
  const universal: PersonalizedPrompt[] = [
    {
      icon: <Sparkles size={18} />,
      label: "Give me a devotional for today",
      topic: "Give me a devotional for today - include a Scripture reading, reflection, and prayer prompt.",
    },
    {
      icon: <BookOpen size={18} />,
      label: "Help me understand the Book of Romans",
      topic: "Help me understand the Book of Romans - its main themes, key passages, and significance for Christians today.",
    },
    {
      icon: <Heart size={18} />,
      label: "What does the Bible say about anxiety?",
      topic: "What does the Bible say about anxiety and worry? Please share relevant verses and a comforting perspective.",
    },
  ];

  const personalized = challenge && byChallenge[challenge] ? [byChallenge[challenge]] : [];

  // Combine: personalized first, then universal to fill to 6
  const combined = [...personalized, ...universal];
  return combined.slice(0, 6);
}

/* ------------------------------------------------------------------ */
/*  Personalized greeting                                              */
/* ------------------------------------------------------------------ */

function PersonalizedGreeting({ profile }: { profile: UserProfile | null }) {
  const challengeLabels: Record<string, string> = {
    time: "building a consistent quiet time",
    understanding: "deepening your understanding of Scripture",
    hardship: "finding hope during difficult seasons",
    prayer: "growing your prayer life",
    daily_life: "living out your faith at work",
    sharing: "stepping out in boldness to share the Gospel",
  };

  const subtitle = profile?.spiritual_challenge && challengeLabels[profile.spiritual_challenge]
    ? `I'm here to help you with ${challengeLabels[profile.spiritual_challenge]}.`
    : "How can I help you grow in your faith today?";

  return (
    <div className="text-center mb-8 mt-8">
      <div
        className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))",
          boxShadow: "0 4px 16px rgba(26,58,110,0.25)",
        }}
      >
        <Sparkles size={28} color="#fff" />
      </div>
      <h2
        className="font-heading text-xl font-bold mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        Welcome back.
      </h2>
      <p
        className="text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        {subtitle}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function ChatPage() {
  const supabase = createClient();
  const { success, error: toastError } = useToast();

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [verseMode, setVerseMode] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [oldestCursor, setOldestCursor] = useState<string | null>(null);

  // Profile state for personalized prompts
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const scrollPositionRef = useRef<{ top: number; height: number } | null>(null);

  /** Fetch user profile for personalized prompts */
  const loadProfile = useCallback(async () => {
    try {
      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) {
        setLoadingProfile(false);
        return;
      }
      const { data } = await client
        .from("profiles")
        .select("faith_journey, spiritual_challenge")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);
    } catch {
      /* silent */
    }
    setLoadingProfile(false);
  }, []);

  /** Fetch one page of chat messages. When `before` is provided, fetch rows
   *  with created_at < before (older); otherwise fetch the most recent page. */
  const fetchPage = useCallback(async (before: string | null, prepend: boolean) => {
    const client = createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return;

    let query = client
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data, error } = await query;
    if (error || !data) return;

    const mapped: AIMessage[] = data
      .map((m) => ({
        id: m.id,
        role: m.role as AIMessage["role"],
        content: m.content,
        created_at: m.created_at,
      }))
      .reverse();

    setMessages((prev) => (prepend ? [...mapped, ...prev] : mapped));
    setHasOlderMessages(data.length >= PAGE_SIZE);
    if (data.length > 0) {
      setOldestCursor(data[data.length - 1].created_at);
    } else {
      setOldestCursor(null);
    }
  }, []);

  /** Load initial data */
  useEffect(() => {
    (async () => {
      await loadProfile();
      await fetchPage(null, false);
      setLoadingHistory(false);
    })();
  }, [fetchPage, loadProfile]);

  /** Load older messages (Load More button) */
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasOlderMessages || !oldestCursor) return;
    setLoadingMore(true);
    if (scrollRef.current) {
      scrollPositionRef.current = {
        top: scrollRef.current.scrollTop,
        height: scrollRef.current.scrollHeight,
      };
    }
    await fetchPage(oldestCursor, true);
    requestAnimationFrame(() => {
      if (scrollRef.current && scrollPositionRef.current) {
        const newHeight = scrollRef.current.scrollHeight;
        const prev = scrollPositionRef.current;
        scrollRef.current.scrollTop = newHeight - prev.height + prev.top;
      }
    });
    setLoadingMore(false);
  }, [loadingMore, hasOlderMessages, oldestCursor, fetchPage]);

  // Auto-scroll to bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streamingContent]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      cancelRef.current?.();
    };
  }, []);

  const handleSend = useCallback(
    (text: string) => {
      if (isStreaming) return;

      const userMsg: AIMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      };

      const assistantMsg: AIMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStreamingContent("");
      setIsStreaming(true);

      const cancel = streamChat(
        text,
        { verseMode },
        {
          onDelta: (delta) => {
            setStreamingContent((prev) => prev + delta);
          },
          onDone: (fullText) => {
            setIsStreaming(false);
            setStreamingContent("");
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id
                  ? { ...m, content: fullText }
                  : m,
              ),
            );
          },
          onError: (error) => {
            setIsStreaming(false);
            setStreamingContent("");
            toastError(error.message || "Something went wrong. Please try again.");
            setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
          },
        },
      );

      cancelRef.current = cancel;
    },
    [isStreaming, verseMode, toastError],
  );

  const handlePromptSelect = useCallback(
    (prompt: SuggestedPrompt) => {
      handleSend(prompt.topic);
    },
    [handleSend],
  );

  const handleSaveToJournal = useCallback(
    async (content: string) => {
      try {
        const client = createClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) {
          toastError("Please sign in to save to journal");
          return;
        }

        // Find the preceding user message for context
        const assistantIdx = messages.findLastIndex(
          (m) => m.role === "assistant" && m.content === content
        );
        let userContext = "";
        if (assistantIdx > 0) {
          const prevUser = messages
            .slice(0, assistantIdx)
            .reverse()
            .find((m) => m.role === "user");
          if (prevUser) userContext = prevUser.content;
        }

        const title = userContext
          ? userContext.length > 60
            ? userContext.slice(0, 60) + "..."
            : userContext
          : "AI Faith Chat";

        const entryContent = userContext
          ? `**Question:** ${userContext}\n\n**AI Response:**\n\n${content}`
          : content;

        const { error } = await client.from("journal_entries").insert({
          user_id: user.id,
          title,
          content: entryContent,
          ai_generated: true,
        });

        if (error) throw error;

        success("Saved to journal!");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to save to journal";
        toastError(message);
      }
    },
    [messages, success, toastError],
  );

  const handleClearHistory = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", user.id);

    if (!error) {
      setMessages([]);
      success("Chat history cleared");
    } else {
      toastError("Failed to clear chat");
    }
  }, [supabase, success, toastError]);

  // Determine if we have onboarding data
  const hasOnboardingData = profile?.faith_journey || profile?.spiritual_challenge;
  const personalizedPrompts = hasOnboardingData && profile ? getPersonalizedPrompts(profile) : null;

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
        style={{
          background: "var(--nav-bg)",
          borderBottom: "1px solid var(--nav-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))",
            }}
          >
            <MessageCircle size={16} color="#fff" />
          </div>
          <div>
            <h1
              className="text-base font-bold font-heading"
              style={{ color: "var(--text-primary)" }}
            >
              AI Faith Chat
            </h1>
            <p
              className="text-[10px]"
              style={{ color: "var(--text-muted)" }}
            >
              Powered by Scripture
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <VerseModeToggle enabled={verseMode} onToggle={setVerseMode} />
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="p-2 rounded-lg transition-colors hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
              aria-label="Clear chat history"
            >
              <Settings size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        role="log"
        aria-live="polite"
      >
        {loadingHistory ? (
          <div className="space-y-4">
            <ChatMessageSkeleton variant="ai" />
            <ChatMessageSkeleton variant="user" />
            <ChatMessageSkeleton variant="ai" />
          </div>
        ) : messages.length === 0 && loadingProfile ? (
          // Show generic prompts while loading profile
          <SuggestedPrompts onSelect={handlePromptSelect} />
        ) : messages.length === 0 && personalizedPrompts ? (
          /* Personalized suggestion view */
          <div className="flex-1 flex flex-col">
            <PersonalizedGreeting profile={profile} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
              {personalizedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt.topic)}
                  className="flex items-start gap-3 p-4 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                  style={{
                    background: "var(--surface-card)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                  aria-label={prompt.label}
                >
                  <div
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                    style={{
                      background: "rgba(26,58,110,0.07)",
                      color: "var(--color-primary-500)",
                    }}
                  >
                    {prompt.icon}
                  </div>
                  <span
                    className="text-sm font-medium leading-snug"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {prompt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : messages.length === 0 ? (
          <SuggestedPrompts onSelect={handlePromptSelect} />
        ) : (
          <>
            {/* Load older messages — top of timeline */}
            {hasOlderMessages && (
              <div className="flex justify-center pt-2 pb-1">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
                  style={{
                    background: "var(--surface-card)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                    minHeight: 40,
                  }}
                >
                  {loadingMore ? (
                    <>
                      <span
                        className="w-3.5 h-3.5 border rounded-full animate-spin"
                        style={{
                          borderColor: "var(--border)",
                          borderTopColor: "var(--color-accent-500)",
                        }}
                      />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} />
                      Load older messages
                    </>
                  )}
                </button>
              </div>
            )}

            {messages.map((msg) => (
              <ChatBubble
                key={msg.id || crypto.randomUUID()}
                message={msg}
                isStreaming={
                  msg.role === "assistant" && msg.id === messages[messages.length - 1]?.id && isStreaming
                }
                onSaveToJournal={
                  msg.role === "assistant" ? handleSaveToJournal : undefined
                }
              />
            ))}
            {/* Streaming indicator for messages not yet persisted */}
            {isStreaming && streamingContent && (
              <div className="flex justify-start">
                <div
                  className="max-w-[85%] md:max-w-[75%] rounded-2xl rounded-bl-sm px-4 py-3"
                  style={{
                    background: "var(--surface-card)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{
                      color: "var(--text-primary)",
                      lineHeight: "1.7",
                    }}
                  >
                    {streamingContent}
                    <span
                      className="inline-block w-1.5 h-4 ml-0.5 align-middle"
                      style={{
                        background: "var(--color-accent-500)",
                        animation: "pulse 1s ease-in-out infinite",
                      }}
                    />
                  </p>
                </div>
              </div>
            )}

            {/* Typing indicator (AI is about to respond) */}
            {isStreaming && !streamingContent && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl rounded-bl-sm px-5 py-3"
                  style={{
                    background: "var(--surface-card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: "var(--color-primary-400)",
                        animation: "typing-dot 1.4s infinite ease-in-out",
                        animationDelay: "0s",
                      }}
                    />
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: "var(--color-primary-400)",
                        animation: "typing-dot 1.4s infinite ease-in-out",
                        animationDelay: "0.2s",
                      }}
                    />
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: "var(--color-primary-400)",
                        animation: "typing-dot 1.4s infinite ease-in-out",
                        animationDelay: "0.4s",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <div
        className="sticky bottom-0 px-4 py-3"
        style={{
          background: "var(--nav-bg)",
          borderTop: "1px solid var(--nav-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <ChatInput
          onSend={handleSend}
          disabled={isStreaming}
          placeholder={
            verseMode
              ? "Ask a question — I'll respond with Scripture..."
              : "Ask anything about faith or Scripture..."
          }
        />
        <p
          className="text-[10px] text-center mt-2"
          style={{ color: "var(--text-muted)" }}
        >
          AI responses are generated by language models. Always verify important theological questions against the Bible.
        </p>
      </div>
    </div>
  );
}
