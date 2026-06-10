"use client";

import { useCallback, useRef, useState } from "react";
import ChatInput from "@/components/ai/ChatInput";
import StreamingText from "@/components/ai/StreamingText";
import { streamStudy } from "@/lib/ai/client";
import { useToast } from "@/components/ui/Toast";
import { BookOpen, ChevronRight, Save } from "lucide-react";

const POPULAR_PASSAGES = [
  { label: "Romans 8:28-39", value: "Romans 8:28-39" },
  { label: "John 1:1-18", value: "John 1:1-18" },
  { label: "Psalm 23", value: "Psalm 23:1-6" },
  { label: "Ephesians 2:1-10", value: "Ephesians 2:1-10" },
  { label: "Philippians 4:4-13", value: "Philippians 4:4-13" },
  { label: "Colossians 1:15-23", value: "Colossians 1:15-23" },
];

interface StudySection {
  heading: string;
  icon: string;
  content: string;
}

function parseStudySections(text: string): StudySection[] {
  const sections: StudySection[] = [];
  const sectionRegex = /SECTION:(.*?)\n([\s\S]*?)(?=SECTION:|$)/g;
  let match;

  while ((match = sectionRegex.exec(text)) !== null) {
    const heading = match[1].trim();
    const content = match[2].trim();
    // Extract icon from heading (first emoji)
    const iconMatch = heading.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\w)/u);
    const icon = iconMatch ? iconMatch[1] : "";
    const label = heading.replace(icon, "").trim();
    sections.push({ heading: label, icon, content });
  }

  if (sections.length === 0) {
    // Fallback: treat entire text as one section
    sections.push({ heading: "Study", icon: "📖", content: text });
  }

  return sections;
}

export default function StudyPage() {
  const { success, error: toastError } = useToast();

  const [passage, setPassage] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [parsedSections, setParsedSections] = useState<StudySection[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [activeInput, setActiveInput] = useState("");

  const cancelRef = useRef<(() => void) | null>(null);

  const startStudy = useCallback(
    (input?: string) => {
      const ref = input || activeInput.trim();
      if (!ref || isStreaming) return;

      setPassage(ref);
      setStreamingText("");
      setParsedSections([]);
      setIsStreaming(true);
      setHasResult(true);

      const cancel = streamStudy(ref, {
        onDelta: (delta) => {
          setStreamingText((prev) => prev + delta);
        },
        onDone: (fullText) => {
          setIsStreaming(false);
          setParsedSections(parseStudySections(fullText));
        },
        onError: (error) => {
          setIsStreaming(false);
          toastError(error.message || "Study failed. Please try again.");
          setStreamingText("");
        },
      });

      cancelRef.current = cancel;
    },
    [activeInput, isStreaming, toastError],
  );

  const handleSaveToJournal = useCallback(() => {
    if (!streamingText) return;
    navigator.clipboard.writeText(streamingText).then(() => {
      success("Study notes copied — paste them into your journal!");
    }).catch(() => {
      toastError("Failed to copy");
    });
  }, [streamingText, success, toastError]);

  const scrollRef = useRef<HTMLDivElement>(null);

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
            <BookOpen size={16} color="#fff" />
          </div>
          <div>
            <h1
              className="text-base font-bold font-heading"
              style={{ color: "var(--text-primary)" }}
            >
              Bible Study
            </h1>
            <p
              className="text-[10px]"
              style={{ color: "var(--text-muted)" }}
            >
              Deep powered study
            </p>
          </div>
        </div>
        {hasResult && !isStreaming && (
          <button
            onClick={handleSaveToJournal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
            style={{
              background: "rgba(201,162,39,0.08)",
              color: "var(--color-accent-600)",
            }}
          >
            <Save size={13} />
            Save
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {/* Input area */}
        {!hasResult && (
          <div className="mb-6">
            <h2
              className="font-heading text-xl font-bold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Deep Bible Study
            </h2>
            <p
              className="text-sm mb-6"
              style={{ color: "var(--text-secondary)" }}
            >
              Enter a Scripture passage to get a detailed study with context, themes, application, and cross-references.
            </p>

            {/* Popular passages */}
            <div className="flex flex-wrap gap-2 mb-5">
              {POPULAR_PASSAGES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => {
                    setActiveInput(p.value);
                    startStudy(p.value);
                  }}
                  disabled={isStreaming}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
                  style={{
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {p.label}
                  <ChevronRight size={12} />
                </button>
              ))}
            </div>

            <ChatInput
              onSend={(text) => {
                setActiveInput(text);
                startStudy(text);
              }}
              disabled={isStreaming}
              placeholder='e.g. "Romans 8:28-39" or "John 1:1-18" or "Psalm 23"'
            />
          </div>
        )}

        {/* Passage being studied (header once we have a result) */}
        {hasResult && (
          <div className="mb-6">
            <div
              className="rounded-2xl p-5 mb-4"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))",
                boxShadow: "0 4px 16px rgba(26,58,110,0.2)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                Studying
              </p>
              <h2
                className="font-heading text-lg font-bold"
                style={{ color: "#ffffff" }}
              >
                {passage}
              </h2>
            </div>

            {/* New study input (compact) */}
            <ChatInput
              onSend={(text) => {
                setActiveInput(text);
                startStudy(text);
              }}
              disabled={isStreaming}
              placeholder="Study a different passage..."
            />
          </div>
        )}

        {/* Streaming result */}
        {isStreaming && streamingText && (
          <div className="mb-6">
            <div
              className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
              style={{ color: "var(--color-primary-500)" }}
            >
              <div
                className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{
                  borderColor: "var(--color-primary-200)",
                  borderTopColor: "var(--color-primary-500)",
                }}
              />
              Generating study...
            </div>
            <StreamingText text={streamingText} speed={10} />
          </div>
        )}

        {/* Parsed sections */}
        {!isStreaming && parsedSections.length > 0 && (
          <div
            className="space-y-4 animate-fade-in-up"
          >
            {parsedSections.map((section, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 animate-fade-in-up"
                style={{
                  background: "var(--surface-card)",
                  boxShadow: "var(--shadow-sm)",
                  border: "1px solid var(--border)",
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  {section.icon && (
                    <span className="text-lg" aria-hidden="true">{section.icon}</span>
                  )}
                  <h3
                    className="font-heading text-base font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {section.heading}
                  </h3>
                </div>
                <div
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "1.8",
                  }}
                >
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
