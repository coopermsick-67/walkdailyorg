"use client";

import { useEffect, useRef, useState } from "react";
import { Shield, Star, Crown, Flame, Zap } from "lucide-react";

interface LevelThreshold {
  level: number;
  name: string;
  minDays: number;
  icon: "shield" | "flame" | "star" | "crown" | "zap";
  color: string;
  bg: string;
}

const LEVELS: LevelThreshold[] = [
  { level: 1, name: "Seedling", minDays: 0, icon: "shield", color: "#16a34a", bg: "linear-gradient(135deg, #dcfce7, #bbf7d0)" },
  { level: 2, name: "Sprout", minDays: 3, icon: "shield", color: "#22c55e", bg: "linear-gradient(135deg, #dcfce7, #86efac)" },
  { level: 3, name: "Growing", minDays: 7, icon: "flame", color: "#f97316", bg: "linear-gradient(135deg, #fed7aa, #fdba74)" },
  { level: 4, name: "Rooted", minDays: 14, icon: "flame", color: "#ea580c", bg: "linear-gradient(135deg, #ffedd5, #fdba74)" },
  { level: 5, name: "Strong", minDays: 30, icon: "star", color: "#c9a227", bg: "linear-gradient(135deg, #fef3c7, #fde68a)" },
  { level: 6, name: "Faithful", minDays: 60, icon: "star", color: "#e8a317", bg: "linear-gradient(135deg, #fef9c3, #fef08a)" },
  { level: 7, name: "Devoted", minDays: 100, icon: "crown", color: "#8b5cf6", bg: "linear-gradient(135deg, #ede9fe, #ddd6fe)" },
  { level: 8, name: "Champion", minDays: 365, icon: "zap", color: "#1a3a6e", bg: "linear-gradient(135deg, #dbeafe, #bfdbfe)" },
];

function getLevel(days: number): LevelThreshold {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (days >= LEVELS[i].minDays) return LEVELS[i];
  }
  return LEVELS[0];
}

function getNextLevel(days: number): LevelThreshold | null {
  for (let i = 0; i < LEVELS.length; i++) {
    if (LEVELS[i].minDays > days) return LEVELS[i];
  }
  return null;
}

function LevelIcon({ icon, size, color }: { icon: LevelThreshold["icon"]; size: number; color: string }) {
  switch (icon) {
    case "shield": return <Shield size={size} color={color} />;
    case "flame": return <Flame size={size} color={color} />;
    case "star": return <Star size={size} color={color} />;
    case "crown": return <Crown size={size} color={color} />;
    case "zap": return <Zap size={size} color={color} />;
  }
}

interface LevelBadgeProps {
  readingDays: number;
  previousDays?: number;
}

export default function LevelBadge({ readingDays, previousDays }: LevelBadgeProps) {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<{ from: number; to: number } | null>(null);
  const celebratedLevelsRef = useRef<Set<number>>(new Set());

  const currentLevel = getLevel(readingDays);
  const nextLevel = getNextLevel(readingDays);
  const progress = nextLevel
    ? ((readingDays - currentLevel.minDays) / (nextLevel.minDays - currentLevel.minDays)) * 100
    : 100;

  useEffect(() => {
    if (previousDays !== undefined && readingDays > previousDays) {
      const prevLevel = getLevel(previousDays);
      if (currentLevel.level > prevLevel.level && !celebratedLevelsRef.current.has(currentLevel.level)) {
        celebratedLevelsRef.current.add(currentLevel.level);
        setLevelUpInfo({ from: prevLevel.level, to: currentLevel.level });
        setShowLevelUp(true);
      }
    }
  }, [readingDays, previousDays, currentLevel.level]);

  return (
    <>
      {/* Level-up celebration overlay */}
      {showLevelUp && levelUpInfo && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowLevelUp(false)}
          role="dialog"
          aria-label={`Level up! Level ${levelUpInfo.to}`}
          aria-modal="true"
        >
          {/* Confetti */}
          {Array.from({ length: 30 }).map((_, i) => {
            const colors = [currentLevel.color, "#c9a227", "#1a3a6e", "#ffffff"];
            return (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${(i * 3.33) % 100}%`,
                  background: colors[i % colors.length],
                  width: 6 + Math.random() * 6,
                  height: 6 + Math.random() * 6,
                  animationDelay: `${Math.random() * 0.3}s`,
                }}
              />
            );
          })}

          <div className="relative z-10 flex flex-col items-center animate-fade-in-up" style={{ padding: "2rem" }}>
            <p className="text-white/50 text-sm uppercase tracking-widest font-medium mb-4">Level Up!</p>
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
              style={{
                background: currentLevel.bg,
                boxShadow: `0 0 40px ${currentLevel.color}40`,
                animation: "milestone-reveal 0.6s ease-out",
              }}
            >
              <LevelIcon icon={currentLevel.icon} size={48} color={currentLevel.color} />
            </div>
            <p className="text-white/60 text-sm mb-1">Level {currentLevel.level}</p>
            <h2 className="text-white text-2xl font-bold font-heading mb-2">{currentLevel.name}</h2>
            <p className="text-white/60 text-sm mb-6">
              {nextLevel
                ? `${nextLevel.minDays - readingDays} more days to ${nextLevel.name}`
                : "Maximum level reached!"}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); setShowLevelUp(false); }}
              className="px-8 py-3 rounded-2xl font-semibold text-sm"
              style={{ background: currentLevel.color, color: "#fff", minHeight: 48 }}
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

      {/* Level badge */}
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl"
        style={{
          background: currentLevel.bg,
          border: `1px solid ${currentLevel.color}30`,
        }}
        role="status"
        aria-label={`Level ${currentLevel.level}: ${currentLevel.name}`}
      >
        <LevelIcon icon={currentLevel.icon} size={16} color={currentLevel.color} />
        <span className="text-xs font-bold" style={{ color: currentLevel.color }}>
          Lv.{currentLevel.level} {currentLevel.name}
        </span>
        {nextLevel && (
          <div
            className="w-12 h-1.5 rounded-full overflow-hidden"
            style={{ background: `${currentLevel.color}20` }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: currentLevel.color,
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}
