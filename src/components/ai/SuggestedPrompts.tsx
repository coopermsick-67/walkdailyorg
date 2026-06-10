"use client";

import type { AIAction } from "@/types/ai";
import {
  BookOpen,
  Heart,
  Sparkles,
  MessageCircle,
  Brain,
} from "lucide-react";

interface SuggestedPrompt {
  icon: React.ReactNode;
  label: string;
  action: AIAction;
  topic: string;
}

const PROMPTS: SuggestedPrompt[] = [
  {
    icon: <BookOpen size={18} />,
    label: "Explain John 3:16 in depth",
    action: "chat",
    topic: "Explain John 3:16 in depth - what does it mean and why is it so important to the Christian faith?",
  },
  {
    icon: <Heart size={18} />,
    label: "What does the Bible say about anxiety?",
    action: "chat",
    topic: "What does the Bible say about anxiety and worry? Please share relevant verses and a comforting perspective.",
  },
  {
    icon: <Sparkles size={18} />,
    label: "Give me a devotional for today",
    action: "devotional",
    topic: "Give me a devotional for today",
  },
  {
    icon: <MessageCircle size={18} />,
    label: "Help me understand the Book of Romans",
    action: "study",
    topic: "Help me understand the Book of Romans - its main themes, key passages, and significance for Christians today.",
  },
  {
    icon: <Brain size={18} />,
    label: "What's the meaning of life according to Ecclesiastes?",
    action: "chat",
    topic: "What is the meaning of life according to Ecclesiastes? What lessons can we draw for our daily lives?",
  },
];

interface SuggestedPromptsProps {
  onSelect: (prompt: SuggestedPrompt) => void;
}

/**
 * Grid of suggested prompt cards. Only shown when the chat is empty.
 */
export default function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Greeting */}
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
          Good {timeOfDay()}, friend.
        </h2>
        <p
          className="text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          How can I help you grow in your faith today?
        </p>
      </div>

      {/* Prompt grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
        {PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSelect(prompt)}
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
  );
}

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

export type { SuggestedPrompt };
