/* ------------------------------------------------------------------ */
/*  AI types — shared across client and server                         */
/* ------------------------------------------------------------------ */

export type AIAction =
  | "chat"
  | "study"
  | "devotional"
  | "prayer"
  | "memory_quiz"
  | "journal_reflection"
  | "explain_verse";

export type AIRole = "user" | "assistant" | "system";

export interface AIMessage {
  id?: string;
  role: AIRole;
  content: string;
  created_at?: string;
}

export interface AIRequest {
  action: AIAction;
  messages?: AIMessage[];
  passage?: string;
  topic?: string;
  verse?: string;
  denomination?: string;
  prayer_style?: "conversational" | "liturgical" | "charismatic";
  verse_mode?: boolean;
}

export interface ChatMessage extends AIMessage {
  id: string;
  created_at: string;
}

export interface StudySection {
  heading: string;
  icon: string;
  content: string;
}

export interface StudyResult {
  passage: string;
  sections: StudySection[];
}

export interface Devotional {
  id?: string;
  date: string;
  scripture: string;
  reflection: string;
  prayer_prompt: string;
  action_step: string;
  denomination?: string;
}

export interface PrayerEntry {
  id?: string;
  topic: string;
  style: string;
  content: string;
  created_at?: string;
}

export interface MemoryCard {
  id: string;
  verse_reference: string;
  verse_text: string;
  exercises: MemoryExercise[];
  mastery: number;
  next_review: string;
  interval_days: number;
}

export interface MemoryExercise {
  type: "fill_blank" | "word_scramble" | "meaning_match";
  question: string;
  options?: string[];
  answer: string;
  hint?: string;
}

export interface MemoryQuizResult {
  card_id: string;
  score: number;
  total: number;
  correct_indices: number[];
}

export interface JournalReflection {
  entry_id: string;
  prompts: string[];
  ai_response: string;
}

export interface ExplainVerseResult {
  verse_reference: string;
  verse_text: string;
  explanation: string;
  applications: string[];
  cross_references: string[];
}

export interface AIUsage {
  user_id: string;
  date: string;
  count: number;
}

export interface AIStreamPayload {
  delta?: string;
  done?: boolean;
  error?: string;
}
