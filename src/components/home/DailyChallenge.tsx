"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Circle, Sparkles, BookOpen, Brain, Heart, MessageSquare, Users, Lightbulb, Sun, Moon } from "lucide-react";

interface DailyChallenge {
  id: string;
  type: "memorize" | "verse" | "prayer" | "reflection" | "share" | "worship" | "gratitude" | "community";
  title: string;
  description: string;
  verseRef?: string;
  completed: boolean;
}

const CHALLENGES: Omit<DailyChallenge, "id" | "completed">[] = [
  { type: "memorize", title: "Memorize a verse", description: "Practice one verse from your memory deck today", verseRef: "Psalm 23:1" },
  { type: "verse", title: "Read today's verse", description: "Spend 5 minutes meditating on today's daily verse" },
  { type: "prayer", title: "Pray for 5 minutes", description: "Set a timer and spend focused time in prayer" },
  { type: "reflection", title: "Write a journal entry", description: "Reflect on what God is teaching you today" },
  { type: "memorize", title: "Review 3 verses", description: "Go through 3 verses you have already learned" },
  { type: "verse", title: "Read a Psalm", description: "Read one Psalm and find one verse that speaks to you" },
  { type: "gratitude", title: "Thank God for 3 things", description: "Write down 3 things you are grateful for today" },
  { type: "share", title: "Share your faith", description: "Tell someone about something God has done for you recently" },
  { type: "worship", title: "Listen to worship music", description: "Spend 10 minutes in worship through song" },
  { type: "community", title: "Pray for the prayer wall", description: "Visit the prayer wall and pray for 3 requests" },
  { type: "reflection", title: "Read a devotional", description: "Read today's devotional and journal one takeaway" },
  { type: "prayer", title: "Pray for someone specific", description: "Choose one person and pray for them by name" },
  { type: "verse", title: "Read one chapter", description: "Read one full chapter of the Bible today" },
  { type: "gratitude", title: "Thank someone", description: "Send a message thanking someone who has blessed you" },
  { type: "memorize", title: "Teach a verse", description: "Share a memorized verse with a friend or family member" },
  { type: "worship", title: "Sing or hum a hymn", description: "Let worship fill your home today" },
  { type: "community", title: "Post a prayer request", description: "Share a prayer request on the prayer wall" },
  { type: "reflection", title: "Meditate on God's character", description: "Pick one attribute of God and meditate on it for 5 minutes" },
];

function getChallengeForDate(): DailyChallenge {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const challenge = CHALLENGES[dayOfYear % CHALLENGES.length];
  const id = `${today.toISOString().split("T")[0]}-${challenge.type}`;

  let completed = false;
  try {
    completed = localStorage.getItem(`daily-challenge-${id}`) === "true";
  } catch {
    /* ignore */
  }

  return { ...challenge, id, completed };
}

function getChallengeIcon(type: DailyChallenge["type"]) {
  switch (type) {
    case "memorize": return <Brain size={20} />;
    case "verse": return <BookOpen size={20} />;
    case "prayer": return <Heart size={20} />;
    case "reflection": return <Sparkles size={20} />;
    case "share": return <MessageSquare size={20} />;
    case "worship": return <Sun size={20} />;
    case "gratitude": return <Lightbulb size={20} />;
    case "community": return <Users size={20} />;
  }
}

function getChallengeColor(type: DailyChallenge["type"]): string {
  switch (type) {
    case "memorize": return "#8b5cf6";
    case "verse": return "#1a3a6e";
    case "prayer": return "#c9a227";
    case "reflection": return "#16a34a";
    case "share": return "#0ea5e9";
    case "worship": return "#f59e0b";
    case "gratitude": return "#ec4899";
    case "community": return "#6366f1";
  }
}


export default function DailyChallenge() {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setChallenge(getChallengeForDate());

    // Calculate challenge completion streak
    try {
      let count = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
        const ch = CHALLENGES[dayOfYear % CHALLENGES.length];
        const id = `${d.toISOString().split("T")[0]}-${ch.type}`;
        if (localStorage.getItem(`daily-challenge-${id}`) === "true") {
          count++;
        } else if (i > 0) {
          break;
        }
      }
      setStreak(count);
    } catch {
      /* ignore */
    }
  }, []);

  const handleComplete = useCallback(() => {
    if (!challenge || challenge.completed) return;
    try {
      localStorage.setItem(`daily-challenge-${challenge.id}`, "true");
    } catch {
      /* ignore */
    }
    setChallenge(prev => prev ? { ...prev, completed: true } : null);
    setShowCheckmark(true);
    setStreak(prev => prev + 1);
    setTimeout(() => setShowCheckmark(false), 2000);
  }, [challenge]);

  if (!challenge) return null;

  const color = getChallengeColor(challenge.type);
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: challenge.completed
          ? `linear-gradient(135deg, ${color}15, ${color}08)`
          : `linear-gradient(135deg, ${color}10, ${color}05)`,
        border: `1px solid ${challenge.completed ? color + "30" : color + "20"}`,
      }}
    >
      {/* Checkmark animation overlay */}
      {showCheckmark && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ background: "rgba(255,255,255,0.85)" }}
        >
          <div style={{ animation: "challenge-checkmark 0.5s ease-out" }}>
            <CheckCircle2 size={48} style={{ color }} />
          </div>
          <style>{`
            @keyframes challenge-checkmark {
              0% { transform: scale(0); opacity: 0; }
              50% { transform: scale(1.3); }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20`, color }}
        >
          {getChallengeIcon(challenge.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
              Today&apos;s Challenge
            </span>
            <span className="text-xs" aria-hidden="true">{getChallengeIcon(challenge.type)}</span>
            {challenge.completed && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
                Done
              </span>
            )}
            {streak >= 3 && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: "linear-gradient(135deg, rgba(201,162,39,0.15), rgba(251,146,60,0.1))",
                  color: "#c9a227",
                }}
              >
                {streak} day streak 🔥
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold font-heading mb-1" style={{ color: "var(--text-primary)" }}>
            {challenge.title}
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {challenge.description}
          </p>
          {challenge.verseRef && (
            <p className="text-xs mt-1 font-medium" style={{ color }}>
              {challenge.verseRef}
            </p>
          )}
        </div>
        <button
          onClick={handleComplete}
          disabled={challenge.completed}
          className="flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
          style={{ minWidth: 44, minHeight: 44 }}
          aria-label={challenge.completed ? "Challenge completed" : "Mark challenge as complete"}
        >
          {challenge.completed ? (
            <CheckCircle2 size={28} style={{ color }} />
          ) : (
            <Circle size={28} style={{ color: "var(--border-strong)" }} />
          )}
        </button>
      </div>
    </div>
  );
}
