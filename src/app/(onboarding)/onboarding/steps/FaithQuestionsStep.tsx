"use client";

import { useState, useCallback, useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface OnboardingData {
  faithJourney: string;
  connectionMethods: string[];
  spiritualChallenge: string;
  bibleTranslation: string;
  readingFrequency: string;
  readingReminder: string;
  readingDays: string[];
}

interface FaithQuestionsStepProps {
  initialData: OnboardingData;
  onNext: (data: OnboardingData) => void;
  onBack: () => void;
}

/* ------------------------------------------------------------------ */
/*  Question data                                                      */
/* ------------------------------------------------------------------ */

const FAITH_JOURNEY_OPTIONS = [
  { value: "exploring", emoji: "🌱", label: "Just starting to explore Christianity" },
  { value: "new", emoji: "📖", label: "I'm a newer believer (0-3 years)" },
  { value: "seasoned", emoji: "✝️", label: "I've been a Christian for a while" },
  { value: "deep", emoji: "🔥", label: "I'm deeply rooted and want to go deeper" },
];

const CONNECTION_OPTIONS = [
  { value: "scripture", emoji: "📚", label: "Reading Scripture" },
  { value: "prayer", emoji: "🙏", label: "Prayer and meditation" },
  { value: "worship", emoji: "🎵", label: "Worship music" },
  { value: "community", emoji: "👥", label: "Community and fellowship" },
  { value: "journaling", emoji: "✍️", label: "Journaling and reflection" },
  { value: "devotionals", emoji: "📿", label: "Structured devotionals" },
];

const CHALLENGE_OPTIONS = [
  { value: "time", emoji: "😓", label: "Finding time consistently" },
  { value: "understanding", emoji: "🤔", label: "Understanding Scripture" },
  { value: "hardship", emoji: "💔", label: "Hardship and doubt" },
  { value: "prayer_life", emoji: "🙏", label: "Developing prayer life" },
  { value: "applying", emoji: "🌍", label: "Applying faith daily" },
  { value: "sharing", emoji: "📣", label: "Sharing faith with others" },
];

const TRANSLATION_OPTIONS = [
  { value: "ESV", label: "ESV", desc: "English Standard Version — word-for-word accuracy" },
  { value: "NIV", label: "NIV", desc: "New International Version — balanced readability" },
  { value: "KJV", label: "KJV", desc: "King James Version — classic, poetic language" },
  { value: "NLT", label: "NLT", desc: "New Living Translation — easy to understand" },
  { value: "NASB", label: "NASB", desc: "New American Standard — literal precision" },
  { value: "MSG", label: "The Message", desc: "Contemporary paraphrase by Eugene Peterson" },
  { value: "Other", label: "Other", desc: "I have a different preference" },
];

const WEEKDAYS = [
  { value: "Mon", label: "M" },
  { value: "Tue", label: "T" },
  { value: "Wed", label: "W" },
  { value: "Thu", label: "T" },
  { value: "Fri", label: "F" },
  { value: "Sat", label: "S" },
  { value: "Sun", label: "S" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function FaithQuestionsStep({
  initialData,
  onNext,
  onBack,
}: FaithQuestionsStepProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isAnimating, setIsAnimating] = useState(false);

  // Form state
  const [faithJourney, setFaithJourney] = useState(initialData.faithJourney);
  const [connectionMethods, setConnectionMethods] = useState<string[]>(
    initialData.connectionMethods
  );
  const [spiritualChallenge, setSpiritualChallenge] = useState(
    initialData.spiritualChallenge
  );
  const [bibleTranslation, setBibleTranslation] = useState(
    initialData.bibleTranslation
  );
  const [readingFrequency, setReadingFrequency] = useState(
    initialData.readingFrequency
  );
  const [readingReminder, setReadingReminder] = useState(
    initialData.readingReminder
  );
  const [readingDays, setReadingDays] = useState<string[]>(
    initialData.readingDays
  );

  const contentRef = useRef<HTMLDivElement>(null);

  // Whether the current question has a valid answer
  const canProceed = (() => {
    switch (currentQ) {
      case 0:
        return faithJourney !== "";
      case 1:
        return connectionMethods.length > 0;
      case 2:
        return spiritualChallenge !== "";
      case 3:
        return bibleTranslation !== "";
      case 4:
        return readingFrequency !== "";
      default:
        return false;
    }
  })();

  const totalQuestions = 5;

  const goToQuestion = useCallback(
    (target: number, dir: "forward" | "backward") => {
      if (isAnimating) return;
      if (target < 0 || target >= totalQuestions) return;
      setIsAnimating(true);
      setDirection(dir);
      // Small delay to let exit animation play
      setTimeout(() => {
        setCurrentQ(target);
        setIsAnimating(false);
      }, 200);
    },
    [isAnimating]
  );

  const handleNext = () => {
    if (!canProceed) return;
    if (currentQ < totalQuestions - 1) {
      goToQuestion(currentQ + 1, "forward");
    } else {
      // Final submit
      onNext({
        faithJourney,
        connectionMethods,
        spiritualChallenge,
        bibleTranslation,
        readingFrequency,
        readingReminder,
        readingDays,
      });
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      goToQuestion(currentQ - 1, "backward");
    } else {
      onBack();
    }
  };

  const toggleConnection = (value: string) => {
    setConnectionMethods((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      }
      if (prev.length >= 3) return prev; // max 3
      return [...prev, value];
    });
  };

  const toggleDay = (value: string) => {
    setReadingDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    );
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && canProceed) {
        handleNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canProceed, currentQ, faithJourney, connectionMethods, spiritualChallenge, bibleTranslation, readingFrequency]);

  const slideClass =
    isAnimating
      ? direction === "forward"
        ? "slide-exit-left"
        : "slide-exit-right"
      : direction === "forward"
        ? "slide-enter-right"
        : "slide-enter-left";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        padding: "24px 20px",
        position: "relative",
      }}
    >
      {/* Progress indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "32px",
          paddingTop: "8px",
        }}
      >
        {Array.from({ length: totalQuestions }, (_, i) => (
          <div
            key={i}
            style={{
              width: i === currentQ ? "28px" : "8px",
              height: "8px",
              borderRadius: "4px",
              background:
                i === currentQ
                  ? "var(--color-accent-500, #c9a227)"
                  : i < currentQ
                    ? "rgba(201,162,39,0.4)"
                    : "rgba(255,255,255,0.15)",
              transition: "all 0.4s ease",
            }}
          />
        ))}
      </div>

      {/* Question counter */}
      <p
        style={{
          textAlign: "center",
          fontSize: "13px",
          color: "rgba(255,255,255,0.4)",
          marginBottom: "16px",
          fontFamily: 'var(--font-body, "Inter", system-ui, sans-serif)',
        }}
      >
        Question {currentQ + 1} of {totalQuestions}
      </p>

      {/* Question content with slide animation */}
      <div
        ref={contentRef}
        key={currentQ}
        className={slideClass}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          ...(isAnimating
            ? {}
            : {
                animation:
                  direction === "forward"
                    ? "slide-in-right 0.35s ease-out both"
                    : "slide-in-left 0.35s ease-out both",
              }),
        }}
      >
        {/* Q1: Faith Journey */}
        {currentQ === 0 && (
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
                fontSize: "clamp(22px, 5.5vw, 28px)",
                fontWeight: 700,
                color: "#fff",
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              Where are you in your faith journey?
            </h2>
            <p
              style={{
                textAlign: "center",
                color: "rgba(255,255,255,0.5)",
                fontSize: "14px",
                marginBottom: "28px",
              }}
            >
              There&apos;s no wrong answer — just where you are right now.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {FAITH_JOURNEY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFaithJourney(opt.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "16px 18px",
                    borderRadius: "14px",
                    border:
                      faithJourney === opt.value
                        ? "2px solid var(--color-accent-500, #c9a227)"
                        : "2px solid rgba(255,255,255,0.1)",
                    background:
                      faithJourney === opt.value
                        ? "rgba(201,162,39,0.12)"
                        : "rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                    width: "100%",
                    color: "#fff",
                    fontSize: "15px",
                    fontFamily:
                      'var(--font-body, "Inter", system-ui, sans-serif)',
                  }}
                >
                  <span style={{ fontSize: "22px", flexShrink: 0 }}>
                    {opt.emoji}
                  </span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Q2: Connection Methods */}
        {currentQ === 1 && (
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
                fontSize: "clamp(22px, 5.5vw, 28px)",
                fontWeight: 700,
                color: "#fff",
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              How do you connect with God?
            </h2>
            <p
              style={{
                textAlign: "center",
                color: "rgba(255,255,255,0.5)",
                fontSize: "14px",
                marginBottom: "28px",
              }}
            >
              Choose up to 3 that resonate most.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              {CONNECTION_OPTIONS.map((opt) => {
                const selected = connectionMethods.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleConnection(opt.value)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      padding: "16px 10px",
                      borderRadius: "14px",
                      border: selected
                        ? "2px solid var(--color-accent-500, #c9a227)"
                        : "2px solid rgba(255,255,255,0.1)",
                      background: selected
                        ? "rgba(201,162,39,0.12)"
                        : "rgba(255,255,255,0.04)",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s ease",
                      color: "#fff",
                      fontSize: "13px",
                      fontFamily:
                        'var(--font-body, "Inter", system-ui, sans-serif)',
                      opacity:
                        !selected && connectionMethods.length >= 3 ? 0.4 : 1,
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{opt.emoji}</span>
                    <span style={{ lineHeight: 1.3 }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
            {connectionMethods.length > 0 && (
              <p
                style={{
                  textAlign: "center",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.35)",
                  marginTop: "12px",
                }}
              >
                {connectionMethods.length}/3 selected
              </p>
            )}
          </div>
        )}

        {/* Q3: Spiritual Challenge */}
        {currentQ === 2 && (
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
                fontSize: "clamp(22px, 5.5vw, 28px)",
                fontWeight: 700,
                color: "#fff",
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              What&apos;s your biggest spiritual challenge?
            </h2>
            <p
              style={{
                textAlign: "center",
                color: "rgba(255,255,255,0.5)",
                fontSize: "14px",
                marginBottom: "28px",
              }}
            >
              We&apos;ll help you grow in this area.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {CHALLENGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSpiritualChallenge(opt.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 18px",
                    borderRadius: "14px",
                    border:
                      spiritualChallenge === opt.value
                        ? "2px solid var(--color-accent-500, #c9a227)"
                        : "2px solid rgba(255,255,255,0.1)",
                    background:
                      spiritualChallenge === opt.value
                        ? "rgba(201,162,39,0.12)"
                        : "rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                    width: "100%",
                    color: "#fff",
                    fontSize: "15px",
                    fontFamily:
                      'var(--font-body, "Inter", system-ui, sans-serif)',
                  }}
                >
                  <span style={{ fontSize: "22px", flexShrink: 0 }}>
                    {opt.emoji}
                  </span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Q4: Bible Translation */}
        {currentQ === 3 && (
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
                fontSize: "clamp(22px, 5.5vw, 28px)",
                fontWeight: 700,
                color: "#fff",
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              Which Bible translation do you prefer?
            </h2>
            <p
              style={{
                textAlign: "center",
                color: "rgba(255,255,255,0.5)",
                fontSize: "14px",
                marginBottom: "28px",
              }}
            >
              You can change this anytime in settings.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {TRANSLATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setBibleTranslation(opt.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    borderRadius: "14px",
                    border:
                      bibleTranslation === opt.value
                        ? "2px solid var(--color-accent-500, #c9a227)"
                        : "2px solid rgba(255,255,255,0.1)",
                    background:
                      bibleTranslation === opt.value
                        ? "rgba(201,162,39,0.12)"
                        : "rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                    width: "100%",
                    color: "#fff",
                    fontFamily:
                      'var(--font-body, "Inter", system-ui, sans-serif)',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        marginBottom: "2px",
                      }}
                    >
                      {opt.label}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.45)",
                      }}
                    >
                      {opt.desc}
                    </div>
                  </div>
                  {bibleTranslation === opt.value && (
                    <span
                      style={{
                        color: "var(--color-accent-500, #c9a227)",
                        fontSize: "18px",
                        flexShrink: 0,
                        marginLeft: "12px",
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Q5: Reading Frequency */}
        {currentQ === 4 && (
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
                fontSize: "clamp(22px, 5.5vw, 28px)",
                fontWeight: 700,
                color: "#fff",
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              How often would you like to read?
            </h2>
            <p
              style={{
                textAlign: "center",
                color: "rgba(255,255,255,0.5)",
                fontSize: "14px",
                marginBottom: "28px",
              }}
            >
              We&apos;ll send gentle reminders to keep you on track.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Every day */}
              <div>
                <button
                  onClick={() => setReadingFrequency("daily")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "16px 18px",
                    borderRadius: "14px",
                    border:
                      readingFrequency === "daily"
                        ? "2px solid var(--color-accent-500, #c9a227)"
                        : "2px solid rgba(255,255,255,0.1)",
                    background:
                      readingFrequency === "daily"
                        ? "rgba(201,162,39,0.12)"
                        : "rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                    width: "100%",
                    color: "#fff",
                    fontSize: "15px",
                    fontFamily:
                      'var(--font-body, "Inter", system-ui, sans-serif)',
                  }}
                >
                  <span style={{ fontSize: "22px" }}>📅</span>
                  <span>Every day</span>
                </button>
                {readingFrequency === "daily" && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "14px 18px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      animation: "fade-in-up 0.3s ease-out both",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.5)",
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      What time would you like a reminder?
                    </label>
                    <input
                      type="time"
                      value={readingReminder}
                      onChange={(e) => setReadingReminder(e.target.value)}
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        color: "#fff",
                        fontSize: "16px",
                        fontFamily:
                          'var(--font-body, "Inter", system-ui, sans-serif)',
                        outline: "none",
                        width: "100%",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* A few times a week */}
              <div>
                <button
                  onClick={() => setReadingFrequency("weekly")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "16px 18px",
                    borderRadius: "14px",
                    border:
                      readingFrequency === "weekly"
                        ? "2px solid var(--color-accent-500, #c9a227)"
                        : "2px solid rgba(255,255,255,0.1)",
                    background:
                      readingFrequency === "weekly"
                        ? "rgba(201,162,39,0.12)"
                        : "rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                    width: "100%",
                    color: "#fff",
                    fontSize: "15px",
                    fontFamily:
                      'var(--font-body, "Inter", system-ui, sans-serif)',
                  }}
                >
                  <span style={{ fontSize: "22px" }}>📅</span>
                  <span>A few times a week</span>
                </button>
                {readingFrequency === "weekly" && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "14px 18px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      animation: "fade-in-up 0.3s ease-out both",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.5)",
                        display: "block",
                        marginBottom: "10px",
                      }}
                    >
                      Which days?
                    </label>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        justifyContent: "center",
                      }}
                    >
                      {WEEKDAYS.map((day) => {
                        const selected = readingDays.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleDay(day.value)}
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "10px",
                              border: selected
                                ? "2px solid var(--color-accent-500, #c9a227)"
                                : "2px solid rgba(255,255,255,0.1)",
                              background: selected
                                ? "rgba(201,162,39,0.2)"
                                : "rgba(255,255,255,0.04)",
                              color: selected
                                ? "var(--color-accent-500, #c9a227)"
                                : "rgba(255,255,255,0.6)",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily:
                                'var(--font-body, "Inter", system-ui, sans-serif)',
                              transition: "all 0.2s ease",
                            }}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Whenever called */}
              <button
                onClick={() => setReadingFrequency("when_called")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "16px 18px",
                  borderRadius: "14px",
                  border:
                    readingFrequency === "when_called"
                      ? "2px solid var(--color-accent-500, #c9a227)"
                      : "2px solid rgba(255,255,255,0.1)",
                  background:
                    readingFrequency === "when_called"
                      ? "rgba(201,162,39,0.12)"
                      : "rgba(255,255,255,0.04)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  width: "100%",
                  color: "#fff",
                  fontSize: "15px",
                  fontFamily:
                    'var(--font-body, "Inter", system-ui, sans-serif)',
                }}
              >
                <span style={{ fontSize: "22px" }}>📅</span>
                <span>Whenever I feel called</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "20px",
          gap: "12px",
          marginTop: "auto",
        }}
      >
        <button
          onClick={handleBack}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "12px",
            padding: "14px 24px",
            color: "rgba(255,255,255,0.7)",
            fontSize: "15px",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily:
              'var(--font-body, "Inter", system-ui, sans-serif)',
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
        >
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed}
          style={{
            background: canProceed
              ? "var(--color-accent-500, #c9a227)"
              : "rgba(255,255,255,0.08)",
            border: "none",
            borderRadius: "12px",
            padding: "14px 28px",
            color: canProceed ? "#1a1a2e" : "rgba(255,255,255,0.3)",
            fontSize: "15px",
            fontWeight: 600,
            cursor: canProceed ? "pointer" : "not-allowed",
            fontFamily:
              'var(--font-body, "Inter", system-ui, sans-serif)',
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          {currentQ === totalQuestions - 1 ? "Continue" : "Next"}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
