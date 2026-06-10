"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Text input with send button. Enter sends; Shift+Enter inserts a newline.
 */
export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Ask anything about faith, Scripture, or life...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setValue("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleTextareaInput(): void {
    const el = textareaRef.current;
    if (!el) return;
    // Auto-grow up to ~120px
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div
      className="flex items-end gap-2 rounded-2xl p-2 transition-all duration-200"
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onInput={handleTextareaInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none px-2 py-2 min-h-[44px] max-h-[120px]"
        maxLength={2000}
        style={{
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
        }}
        aria-label="Chat message input"
      />
      <button
        onClick={handleSend}
        disabled={!canSend}
        className="flex-shrink-0 min-w-11 min-h-11 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: canSend
            ? "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))"
            : "var(--surface-elevated)",
          color: canSend ? "#ffffff" : "var(--text-muted)",
          boxShadow: canSend
            ? "0 2px 8px rgba(26,58,110,0.2)"
            : "none",
        }}
        aria-label="Send message"
      >
        <ArrowUp
          size={18}
          strokeWidth={2.5}
        />
      </button>
    </div>
  );
}
