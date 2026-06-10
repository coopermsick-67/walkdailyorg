"use client";

import { useState } from "react";

interface Step8ReadingFrequencyProps {
  initialValue: { frequency?: string; timeOfDay?: string; days?: string[] };
  onNext: (value: { frequency: string; timeOfDay: string; days: string[] }) => void;
  onBack: () => void;
}

const FREQUENCIES = [
  { id: "daily", label: "Every day", desc: "Build a consistent habit" },
  { id: "few-times-week", label: "A few times a week", desc: "Steady but flexible" },
  { id: "weekends", label: "Weekends", desc: "Saturday and/or Sunday" },
  { id: "when-i-can", label: "When I can", desc: "No set schedule" },
];

const TIMES_OF_DAY = ["Morning", "Midday", "Evening", "Before bed"];

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Step8ReadingFrequency({ initialValue, onNext, onBack }: Step8ReadingFrequencyProps) {
  const [frequency, setFrequency] = useState(initialValue.frequency || "");
  const [timeOfDay, setTimeOfDay] = useState(initialValue.timeOfDay || "");
  const [selectedDays, setSelectedDays] = useState<string[]>(initialValue.days || []);
  const [subScreen, setSubScreen] = useState<"frequency" | "time" | "days">(
    !initialValue.frequency ? "frequency" : !initialValue.timeOfDay ? "time" : "days"
  );

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleFrequencySelect = (freq: string) => {
    setFrequency(freq);
    setSubScreen("time");
  };

  const handleTimeSelect = (time: string) => {
    setTimeOfDay(time);
    setSubScreen("days");
  };

  const handleDaysContinue = () => {
    if (frequency && timeOfDay) {
      onNext({ frequency, timeOfDay, days: selectedDays });
    }
  };

  const subStep = subScreen === "frequency" ? 1 : subScreen === "time" ? 2 : 3;

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#0d1b2e", padding: "60px 24px 0", position: "relative" }}>
      <button onClick={subScreen === "frequency" ? onBack : () => subScreen === "days" ? setSubScreen("time") : setSubScreen("frequency")} style={{ position: "absolute", top: 20, left: 16, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 8 }} aria-label="Go back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <span style={{ position: "absolute", top: 28, right: 20, fontFamily: 'var(--font-body)', fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Step 8 of 16</span>

      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(201,162,39,0.3)", position: "absolute", left: `${10 + (i * 7) % 80}%`, bottom: `-5%`, animation: `confetti-fall ${3 + (i % 4)}s ease-in infinite`, animationDelay: `${i * 0.3}s` }} />
      ))}

      {/* Progress dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
        {[1, 2, 3].map((dot) => (
          <div key={dot} style={{ width: 8, height: 8, borderRadius: "50%", background: dot <= subStep ? "#c9a227" : "rgba(255,255,255,0.15)", transition: "background 0.3s" }} />
        ))}
      </div>

      {subScreen === "frequency" && (
        <>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 500, color: "#ffffff", textAlign: "center", marginBottom: 8 }}>
            How often would you like to read?
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", fontStyle: "italic", marginBottom: 32 }}>
            We&apos;ll help you build a sustainable rhythm.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            {FREQUENCIES.map((f) => (
              <button
                key={f.id}
                onClick={() => handleFrequencySelect(f.id)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4,
                  background: frequency === f.id ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.05)",
                  border: frequency === f.id ? "1.5px solid #c9a227" : "1.5px solid rgba(255,255,255,0.08)",
                  borderRadius: 16, padding: "16px 20px",
                  cursor: "pointer", transition: "all 0.2s ease", textAlign: "left", width: "100%",
                }}
              >
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{f.label}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{f.desc}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {subScreen === "time" && (
        <>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 500, color: "#ffffff", textAlign: "center", marginBottom: 8 }}>
            What time of day works best?
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", fontStyle: "italic", marginBottom: 32 }}>
            We&apos;ll send a gentle reminder at this time.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            {TIMES_OF_DAY.map((t) => (
              <button
                key={t}
                onClick={() => handleTimeSelect(t)}
                style={{
                  background: timeOfDay === t ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.05)",
                  border: timeOfDay === t ? "1.5px solid #c9a227" : "1.5px solid rgba(255,255,255,0.08)",
                  borderRadius: 16, padding: "16px 20px",
                  cursor: "pointer", transition: "all 0.2s ease",
                  fontFamily: 'var(--font-body)', fontSize: 15, color: "rgba(255,255,255,0.85)",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </>
      )}

      {subScreen === "days" && (
        <>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 500, color: "#ffffff", textAlign: "center", marginBottom: 8 }}>
            Which days work for you?
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", fontStyle: "italic", marginBottom: 32 }}>
            Select all that apply. You can change this later.
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", flex: 1, alignContent: "start" }}>
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: selectedDays.includes(day) ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.05)",
                  border: selectedDays.includes(day) ? "1.5px solid #c9a227" : "1.5px solid rgba(255,255,255,0.08)",
                  cursor: "pointer", transition: "all 0.2s ease",
                  fontFamily: 'var(--font-body)', fontSize: 14, color: "rgba(255,255,255,0.85)",
                }}
              >
                {day}
              </button>
            ))}
          </div>

          <button
            onClick={handleDaysContinue}
            disabled={!frequency || !timeOfDay}
            style={{
              width: "100%", height: 52, borderRadius: 12,
              background: frequency && timeOfDay ? "#c9a227" : "rgba(201,162,39,0.3)",
              color: frequency && timeOfDay ? "#0d1b2e" : "rgba(13,27,46,0.5)",
              border: "none", fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500,
              cursor: frequency && timeOfDay ? "pointer" : "not-allowed", marginBottom: 40, marginTop: 16,
            }}
          >
            Continue
          </button>
        </>
      )}

      {subScreen !== "days" && <div style={{ height: 92 }} />}
    </div>
  );
}
