"use client";

import { useEffect, useRef, useState } from "react";
import { Flame } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Milestone definitions                                              */
/* ------------------------------------------------------------------ */

interface Milestone {
  days: number;
  name: string;
  emoji: string;
  color: string;
  bg: string;
  message: string;
}

const MILESTONES: Milestone[] = [
  { days: 3, name: "Spark", emoji: "spark", color: "#f97316", bg: "linear-gradient(135deg, #fed7aa, #fdba74)", message: "Your faith journey is catching fire!" },
  { days: 7, name: "Week Warrior", emoji: "shield", color: "#c9a227", bg: "linear-gradient(135deg, #fef3c7, #fde68a)", message: "One whole week of walking with God!" },
  { days: 14, name: "Fortnight Faithful", emoji: "scroll", color: "#8b5cf6", bg: "linear-gradient(135deg, #ede9fe, #ddd6fe)", message: "Two weeks strong!" },
  { days: 30, name: "Monthly Devoted", emoji: "crown", color: "#1a3a6e", bg: "linear-gradient(135deg, #dbeafe, #bfdbfe)", message: "A month of daily devotion!" },
  { days: 60, name: "Steadfast Spirit", emoji: "heart", color: "#dc2626", bg: "linear-gradient(135deg, #fecaca, #fca5a5)", message: "60 days of faithfulness!" },
  { days: 100, name: "Century Saint", emoji: "star", color: "#c9a227", bg: "linear-gradient(135deg, #fef9c3, #fef08a)", message: "100 days! You are extraordinary!" },
  { days: 365, name: "Year of Grace", emoji: "crown", color: "#1a3a6e", bg: "linear-gradient(135deg, #c9a227, #fde68a, #c9a227)", message: "A full year! God is faithful!" },
];

function getMilestone(days: number): Milestone | null {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (days >= MILESTONES[i].days) return MILESTONES[i];
  }
  return null;
}

function getNextMilestone(days: number): Milestone | null {
  for (let i = 0; i < MILESTONES.length; i++) {
    if (MILESTONES[i].days > days) return MILESTONES[i];
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Count-up animation hook                                            */
/* ------------------------------------------------------------------ */

function useCountUp(target: number, duration = 600) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + (target - start) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

/* ------------------------------------------------------------------ */
/*  Badge glyph (pure CSS/SVG)                                         */
/* ------------------------------------------------------------------ */

function MilestoneGlyph({ milestone, size = 32 }: { milestone: Milestone; size?: number }) {
  const iconSize = size * 0.5;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill={milestone.color} opacity={0.15} />
      <circle cx="20" cy="20" r="14" fill={milestone.color} opacity={0.25} />
      {milestone.days === 3 && <FlameIcon size={iconSize} color={milestone.color} />}
      {milestone.days === 7 && <ShieldIcon size={iconSize} color={milestone.color} />}
      {milestone.days === 14 && <ScrollIcon size={iconSize} color={milestone.color} />}
      {milestone.days === 30 && <CrownIcon size={iconSize} color={milestone.color} />}
      {milestone.days === 60 && <HeartIcon size={iconSize} color={milestone.color} />}
      {milestone.days === 100 && <StarIcon size={iconSize} color={milestone.color} />}
      {milestone.days === 365 && <CrownIcon size={iconSize} color={milestone.color} />}
    </svg>
  );
}

function FlameIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" x={(40 - size) / 2} y={(40 - size) / 2} fill="none">
      <path d="M12 2C12 2 18 10 18 15C18 18.31 15.31 21 12 21C8.69 21 6 18.31 6 15C6 10 12 2 12 2Z" fill={color} opacity={0.8} />
      <path d="M12 21C10.34 21 9 19.66 9 18C9 16 11 14 11 14C11 14 13 16 13 18C13 19.66 11.66 21 12 21Z" fill="white" opacity={0.5} />
    </svg>
  );
}

function ShieldIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" x={(40 - size) / 2} y={(40 - size) / 2} fill="none">
      <path d="M12 2L4 6V12C4 16.42 7.43 20.54 12 22C16.57 20.54 20 16.42 20 12V6L12 2Z" fill={color} opacity={0.8} />
      <path d="M12 2L4 6V12C4 16.42 7.43 20.54 12 22" stroke="white" strokeWidth="1" opacity={0.3} />
    </svg>
  );
}

function ScrollIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" x={(40 - size) / 2} y={(40 - size) / 2} fill="none">
      <rect x="5" y="3" width="14" height="18" rx="2" fill={color} opacity={0.7} />
      <line x1="8" y1="8" x2="16" y2="8" stroke="white" strokeWidth="1.5" opacity={0.6} />
      <line x1="8" y1="12" x2="14" y2="12" stroke="white" strokeWidth="1.5" opacity={0.6} />
      <line x1="8" y1="16" x2="12" y2="16" stroke="white" strokeWidth="1.5" opacity={0.6} />
    </svg>
  );
}

function CrownIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" x={(40 - size) / 2} y={(40 - size) / 2} fill="none">
      <path d="M2 17L5 7L9 12L12 4L15 12L19 7L22 17H2Z" fill={color} opacity={0.8} />
      <rect x="2" y="17" width="20" height="4" rx="1" fill={color} opacity={0.6} />
    </svg>
  );
}

function HeartIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" x={(40 - size) / 2} y={(40 - size) / 2} fill="none">
      <path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.09C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14 14 21 12 21Z" fill={color} opacity={0.8} />
    </svg>
  );
}

function StarIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" x={(40 - size) / 2} y={(40 - size) / 2} fill="none">
      <path d="M12 2L14.9 8.2L22 9.3L17 14.1L18.2 21.2L12 18.5L5.8 21.2L7 14.1L2 9.3L9.1 8.2L12 2Z" fill={color} opacity={0.8} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Streak Badge Component                                             */
/* ------------------------------------------------------------------ */

interface StreakBadgeProps {
  streak: number;
  previousStreak?: number;
  onMilestoneReached?: (milestone: Milestone) => void;
}

export default function StreakBadge({ streak, previousStreak, onMilestoneReached }: StreakBadgeProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratingMilestone, setCelebratingMilestone] = useState<Milestone | null>(null);
  const [celebratedIds, setCelebratedIds] = useState<Set<number>>(new Set());
  const animatedStreak = useCountUp(streak, 600);
  const currentMilestone = getMilestone(streak);
  const nextMilestone = getNextMilestone(streak);

  // Detect milestone reached
  useEffect(() => {
    if (previousStreak !== undefined && streak > previousStreak) {
      const prevMilestone = getMilestone(previousStreak);
      const newMilestone = getMilestone(streak);
      if (newMilestone && (!prevMilestone || newMilestone.days !== prevMilestone.days) && !celebratedIds.has(newMilestone.days)) {
        setCelebratingMilestone(newMilestone);
        setShowCelebration(true);
        setCelebratedIds(prev => new Set([...prev, newMilestone.days]));
        onMilestoneReached?.(newMilestone);
      }
    }
  }, [streak, previousStreak, onMilestoneReached, celebratedIds]);

  if (streak === 0) {
    return (
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl"
        style={{
          background: "var(--surface-elevated)",
          border: "1px solid var(--border)",
        }}
        role="status"
        aria-label="Start your streak today"
      >
        <Flame size={22} style={{ color: "var(--text-muted)" }} />
        <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          Start your streak today
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Celebration overlay */}
      {showCelebration && celebratingMilestone && (
        <MilestoneCelebration
          milestone={celebratingMilestone}
          onClose={() => { setShowCelebration(false); setCelebratingMilestone(null); }}
        />
      )}

      {/* Streak badge */}
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl"
        style={{
          background: currentMilestone
            ? currentMilestone.bg
            : streak >= 3
              ? "linear-gradient(135deg, rgba(201,162,39,0.15), rgba(201,162,39,0.05))"
              : "var(--surface-elevated)",
          border: currentMilestone
            ? `2px solid ${currentMilestone.color}40`
            : "1px solid rgba(201,162,39,0.25)",
        }}
        role="status"
        aria-label={`${streak} day streak${currentMilestone ? `, ${currentMilestone.name} milestone` : ""}`}
      >
        <div className="relative">
          <Flame
            size={22}
            style={{
              color: currentMilestone?.color ?? "var(--color-accent-500)",
              animation: streak >= 3 ? "flame-pulse 2s ease-in-out infinite" : undefined,
            }}
          />
          {currentMilestone && (
            <div className="absolute -top-1 -right-1">
              <MilestoneGlyph milestone={currentMilestone} size={16} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tabular-nums" style={{ color: currentMilestone?.color ?? "var(--color-accent-500)" }}>
            {animatedStreak}
          </span>
          <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            {streak === 1 ? "day" : "days"} streak
          </span>
          {currentMilestone && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${currentMilestone.color}20`, color: currentMilestone.color }}
            >
              {currentMilestone.name}
            </span>
          )}
        </div>

        {nextMilestone && (
          <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>
            {nextMilestone.days - streak}d to {nextMilestone.name}
          </span>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Milestone Celebration Overlay                                       */
/* ------------------------------------------------------------------ */

function MilestoneCelebration({ milestone, onClose }: { milestone: Milestone; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", pointerEvents: "auto" }}
      onClick={onClose}
      role="dialog"
      aria-label={`Milestone reached: ${milestone.name}`}
      aria-modal="true"
    >
      {/* Confetti pieces */}
      {Array.from({ length: 40 }).map((_, i) => {
        const colors = [milestone.color, "#c9a227", "#1a3a6e", "#ffffff", "#d4b43a"];
        const color = colors[i % colors.length];
        const left = `${(i * 2.5 + Math.random() * 3) % 100}%`;
        const delay = `${Math.random() * 0.5}s`;
        const size = 6 + Math.random() * 8;
        return (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left,
              background: color,
              width: size,
              height: size,
              animationDelay: delay,
              borderRadius: size > 9 ? 2 : "50%",
              animationDuration: `${1 + Math.random() * 1}s`,
            }}
          />
        );
      })}

      {/* Badge reveal */}
      <div
        className="relative z-10 flex flex-col items-center animate-fade-in-up"
        style={{ padding: "2rem" }}
      >
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center mb-6"
          style={{
            background: milestone.bg,
            boxShadow: `0 0 40px ${milestone.color}40`,
            animation: "milestone-reveal 0.6s ease-out",
          }}
        >
          <MilestoneGlyph milestone={milestone} size={64} />
        </div>
        <p className="text-white/60 text-sm mb-2 uppercase tracking-widest font-medium">Milestone Reached!</p>
        <h2 className="text-white text-3xl font-bold font-heading mb-2 text-center">{milestone.days} Days</h2>
        <p className="text-2xl font-bold mb-3" style={{ color: milestone.color }}>{milestone.name}</p>
        <p className="text-white/80 text-base text-center max-w-xs mb-6">{milestone.message}</p>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="px-8 py-3 rounded-2xl font-semibold text-sm"
          style={{ background: milestone.color, color: "#fff", minHeight: 48 }}
        >
          Awesome!
        </button>
      </div>

      <style>{`
        @keyframes milestone-reveal {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          60% { transform: scale(1.15) rotate(10deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
