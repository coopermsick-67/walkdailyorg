"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Mood = "peaceful" | "grateful" | "struggling" | "growing" | "seeking";

interface JournalEntry {
  id: string;
  title: string;
  body: string;
  mood: Mood | null;
  verse_tags: string[];
  is_public: boolean;
}

/* ------------------------------------------------------------------ */
/*  Bible books for verse tag autocomplete                             */
/* ------------------------------------------------------------------ */

const BIBLE_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
  "Ezra", "Nehemiah", "Esther", "Job", "Psalms",
  "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah",
  "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea",
  "Joel", "Amos", "Obadiah", "Jonah", "Micah",
  "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah",
  "Malachi", "Matthew", "Mark", "Luke", "John",
  "Acts", "Romans", "1 Corinthians", "2 Corinthians",
  "Galatians", "Ephesians", "Philippians", "Colossians",
  "1 Thessalonians", "2 Thessalonians", "1 Timothy",
  "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
  "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
  "Jude", "Revelation",
];

const MOODS: { value: Mood; label: string; icon: string }[] = [
  { value: "peaceful", label: "Peaceful", icon: "🙏" },
  { value: "grateful", label: "Grateful", icon: "😊" },
  { value: "struggling", label: "Struggling", icon: "😔" },
  { value: "growing", label: "Growing", icon: "🌱" },
  { value: "seeking", label: "Seeking", icon: "🔍" },
];

/* ------------------------------------------------------------------ */
/*  Simple rich text toolbar (no Tiptap dependency needed in prod)     */
/* We use a contentEditable div with execCommand for zero-dependency   */
/* rich text editing that works reliably.                              */
/* ------------------------------------------------------------------ */

interface JournalEditorProps {
  entry: JournalEntry | null;
  onSave: (data: Partial<JournalEntry>) => Promise<void>;
  onCancel: () => void;
}

export function JournalEditor({ entry, onSave, onCancel }: JournalEditorProps) {
  const [title, setTitle] = useState(entry?.title || "");
  const [mood, setMood] = useState<Mood | null>(entry?.mood || null);
  const [isPublic, setIsPublic] = useState(entry?.is_public || false);
  const [body, setBody] = useState(entry?.body || "");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Verse tags
  const [verseTags, setVerseTags] = useState<string[]>(entry?.verse_tags || []);
  const [verseInput, setVerseInput] = useState("");
  const [showVerseSuggestions, setShowVerseSuggestions] = useState(false);
  const [verseSuggestions, setVerseSuggestions] = useState<string[]>([]);

  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sanitize HTML to prevent XSS via stored content
  function sanitizeHtml(html: string): string {
    // Remove script tags and event handlers
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/javascript\s*:/gi, "");
  }

  // Restore body HTML into editor (sanitized)
  useEffect(() => {
    if (editorRef.current && entry?.body) {
      editorRef.current.innerHTML = sanitizeHtml(entry.body);
    }
  }, [entry?.body]);

  /* ---- Auto-save every 30 seconds ---- */

  const doAutoSave = useCallback(async () => {
    if (!editorRef.current) return;
    const currentBody = editorRef.current.innerHTML;

    if (!title.trim() && !currentBody.trim()) return;

    try {
      await onSave({
        title: title.trim(),
        body: currentBody,
        mood,
        verse_tags: verseTags,
        is_public: isPublic,
      });
      setLastSaved(new Date());
    } catch {
      // Auto-save failure is silent
    }
  }, [title, mood, verseTags, isPublic, onSave]);

  useEffect(() => {
    saveTimerRef.current = setInterval(doAutoSave, 30_000);
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [doAutoSave]);

  /* ---- Rich text commands ---- */

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setBody(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setBody(editorRef.current.innerHTML);
    }
  };

  /* ---- Verse tag autocomplete ---- */

  const handleVerseInput = (value: string) => {
    setVerseInput(value);
    setShowVerseSuggestions(true);

    // Check if user typed a book name pattern like "John 3" or "Psalm"
    const match = value.match(/^(\d?\s?\w+)\s*(\d*)/i);
    if (!match) {
      setVerseSuggestions([]);
      return;
    }

    const bookPart = match[1].trim();
    const chapterPart = match[2];

    const suggestions = BIBLE_BOOKS
      .filter((b) => b.toLowerCase().startsWith(bookPart.toLowerCase()))
      .slice(0, 8)
      .map((b) =>
        chapterPart ? `${b} ${chapterPart}:` : b,
      );

    setVerseSuggestions(suggestions);
  };

  const addVerseTag = (tag: string) => {
    const formattedVerse = tag.endsWith(":") ? tag.slice(0, -1) : tag;
    if (!verseTags.includes(formattedVerse)) {
      setVerseTags([...verseTags, formattedVerse]);
    }
    setVerseInput("");
    setVerseSuggestions([]);
    setShowVerseSuggestions(false);
  };

  const removeVerseTag = (tag: string) => {
    setVerseTags(verseTags.filter((t) => t !== tag));
  };

  const handleVerseKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && verseInput.trim()) {
      e.preventDefault();
      if (verseSuggestions.length > 0) {
        addVerseTag(verseSuggestions[0]);
      } else {
        addVerseTag(verseInput.trim());
      }
    } else if (e.key === "Escape") {
      setShowVerseSuggestions(false);
    }
  };

  /* ---- Save ---- */

  const handleSave = async () => {
    if (!editorRef.current) return;
    const currentBody = editorRef.current.innerHTML;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        body: currentBody,
        mood,
        verse_tags: verseTags,
        is_public: isPublic,
      });
      setLastSaved(new Date());
    } catch {
      // Error handled by parent
    }
    setSaving(false);
  };

  /* ---- Render ---- */

  return (
    <div className="p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-lg font-semibold font-heading"
          style={{ color: "var(--text-primary)" }}
        >
          {entry ? "Edit Entry" : "New Journal Entry"}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 rounded-full"
          style={{
            minWidth: 44,
            minHeight: 44,
            color: "var(--text-secondary)",
          }}
          aria-label="Close"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="4" y1="4" x2="16" y2="16" />
            <line x1="16" y1="4" x2="4" y2="16" />
          </svg>
        </button>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Entry title (optional)"
        className="w-full px-4 py-3 rounded-xl text-base mb-3 font-heading font-semibold"
        style={{
          background: "var(--input-bg)",
          border: "1px solid var(--input-border)",
          color: "var(--text-primary)",
          minHeight: 44,
        }}
      />

      {/* Mood selector */}
      <div className="mb-4">
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text-secondary)" }}
        >
          How are you feeling?
        </label>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(mood === m.value ? null : m.value)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background:
                  mood === m.value
                    ? "var(--color-accent-500)"
                    : "var(--input-bg)",
                color:
                  mood === m.value
                    ? "#fff"
                    : "var(--text-secondary)",
                border: "1px solid",
                borderColor:
                  mood === m.value
                    ? "var(--color-accent-500)"
                    : "var(--input-border)",
                minHeight: 44,
              }}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Verse tags */}
      <div className="mb-4">
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text-secondary)" }}
        >
          Verse references
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {verseTags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                background: "rgba(201, 162, 39, 0.1)",
                color: "var(--color-accent-500)",
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19,2L19,22L12,19L5,22L5,2L19,2Z" />
              </svg>
              {tag}
              <button
                onClick={() => removeVerseTag(tag)}
                className="ml-0.5 rounded-full"
                style={{ minWidth: 18, minHeight: 18 }}
                aria-label={`Remove ${tag}`}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="4" y1="4" x2="16" y2="16" />
                  <line x1="16" y1="4" x2="4" y2="16" />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            value={verseInput}
            onChange={(e) => handleVerseInput(e.target.value)}
            onKeyDown={handleVerseKeyDown}
            onFocus={() => verseInput && setShowVerseSuggestions(true)}
            onBlur={() => setTimeout(() => setShowVerseSuggestions(false), 200)}
            placeholder="Type a Bible reference (e.g. John 3:16)"
            className="w-full px-4 py-2.5 rounded-xl text-sm"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text-primary)",
              minHeight: 44,
            }}
          />
          {showVerseSuggestions && verseSuggestions.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-xl py-1 z-20 max-h-40 overflow-y-auto"
              style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-md)",
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {verseSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => addVerseTag(s)}
                  className="w-full text-left px-4 py-2 text-sm hover:opacity-80"
                  style={{
                    color: "var(--text-primary)",
                    minHeight: 36,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div
        className="flex items-center gap-1 p-1.5 rounded-xl mb-2 flex-wrap"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <ToolbarButton
          onClick={() => execCommand("bold")}
          ariaLabel="Bold"
          title="Bold (Ctrl+B)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => execCommand("italic")}
          ariaLabel="Italic"
          title="Italic (Ctrl+I)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="19" y1="4" x2="10" y2="4" />
            <line x1="14" y1="20" x2="5" y2="20" />
            <line x1="15" y1="4" x2="9" y2="20" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => execCommand("underline")}
          ariaLabel="Underline"
          title="Underline (Ctrl+U)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
            <line x1="4" y1="21" x2="20" y2="21" />
          </svg>
        </ToolbarButton>

        <div
          className="w-px h-5 mx-1"
          style={{ background: "var(--border)" }}
        />

        <ToolbarButton
          onClick={() => execCommand("formatBlock", "h2")}
          ariaLabel="Heading"
          title="Heading"
        >
          <span className="text-xs font-bold">H</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => execCommand("insertUnorderedList")}
          ariaLabel="Bullet list"
          title="Bullet List"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => execCommand("insertOrderedList")}
          ariaLabel="Numbered list"
          title="Numbered List"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => execCommand("formatBlock", "blockquote")}
          ariaLabel="Blockquote"
          title="Blockquote"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
          </svg>
        </ToolbarButton>

        <div
          className="w-px h-5 mx-1"
          style={{ background: "var(--border)" }}
        />

        <ToolbarButton
          onClick={() => {
            const ref = prompt("Enter Bible reference (e.g. John 3:16):");
            if (ref) {
              addVerseTag(ref.trim());
            }
          }}
          ariaLabel="Add verse tag"
          title="Add Verse Tag"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,2L19,22L12,19L5,22L5,2L19,2Z" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleEditorInput}
        className="w-full px-4 py-3 rounded-xl text-base min-h-[200px] max-h-[400px] overflow-y-auto focus:outline-none"
        style={{
          background: "var(--input-bg)",
          border: "1px solid var(--input-border)",
          color: "var(--text-primary)",
          lineHeight: 1.7,
        }}
        suppressContentEditableWarning
        data-placeholder="Write your thoughts, reflecting on what God is teaching you..."
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--text-muted);
          pointer-events: none;
        }
        [contenteditable] blockquote {
          border-left: 3px solid var(--color-accent-500);
          padding-left: 12px;
          margin: 8px 0;
          color: var(--text-secondary);
          font-style: italic;
        }
        [contenteditable] h2 {
          font-family: var(--font-heading);
          font-size: 1.25em;
          font-weight: 600;
          margin: 12px 0 8px;
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 24px;
          margin: 8px 0;
        }
      `}</style>

      {/* Options */}
      <div className="mt-4 flex items-center justify-between">
        <label
          className="flex items-center gap-3 cursor-pointer"
          style={{ minHeight: 44 }}
        >
          <div
            className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
            style={{
              borderColor: isPublic
                ? "var(--color-accent-500)"
                : "var(--input-border)",
              background: isPublic
                ? "var(--color-accent-500)"
                : "transparent",
            }}
          >
            {isPublic && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polyline points="2.5,6 5,9.5 9.5,3" />
              </svg>
            )}
          </div>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="sr-only"
          />
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Share publicly
          </span>
        </label>

        {lastSaved && (
          <span
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            Auto-saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Save buttons */}
      <div className="flex gap-2 mt-5">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3 rounded-xl font-semibold text-base disabled:opacity-60"
          style={{
            background: "var(--color-accent-500)",
            color: "#fff",
            minHeight: 48,
          }}
        >
          {saving ? "Saving..." : "Save Entry"}
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-3 rounded-xl text-sm font-medium"
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            minHeight: 48,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toolbar Button                                                     */
/* ------------------------------------------------------------------ */

function ToolbarButton({
  onClick,
  children,
  ariaLabel,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel: string;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg transition-colors hover:opacity-80"
      style={{
        minWidth: 36,
        minHeight: 36,
        color: "var(--text-secondary)",
      }}
      aria-label={ariaLabel}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}
