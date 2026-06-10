"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Screen0Welcome from "./steps/Screen0_Welcome";
import Step1_Name from "./steps/Step1_Name";
import Step2_AgeRange from "./steps/Step2_AgeRange";
import Step3_LifeStage from "./steps/Step3_LifeStage";
import Step4_FaithJourney from "./steps/Step4_FaithJourney";
import Step5_Denomination from "./steps/Step5_Denomination";
import Step6_Translation from "./steps/Step6_Translation";
import Step7_ReadingHistory from "./steps/Step7_ReadingHistory";
import Step8_ReadingFrequency from "./steps/Step8_ReadingFrequency";
import Step9_Challenges from "./steps/Step9_Challenges";
import Step10_ConnectionStyles from "./steps/Step10_ConnectionStyles";
import Step11_LearningStyle from "./steps/Step11_LearningStyle";
import Step12_PrayerStyle from "./steps/Step12_PrayerStyle";
import Step13_Accountability from "./steps/Step13_Accountability";
import Step14_ContentDepth from "./steps/Step14_ContentDepth";
import Step15_Interests from "./steps/Step15_Interests";
import Step16_AIGeneration from "./steps/Step16_AIGeneration";
import Step17_Preview from "./steps/Step17_Preview";
import Step18_Prayer from "./steps/Step18_Prayer";
import Step19_EnterApp from "./steps/Step19_EnterApp";

type OnboardingData = {
  display_name: string;
  age_range: string;
  life_stage: string;
  faith_journey_stage: string;
  denomination: string;
  preferred_translation: string;
  bible_reading_history: string;
  reading_frequency: string;
  reading_time_of_day: string;
  reminder_days: string[];
  spiritual_challenges: string[];
  connection_styles: string[];
  learning_style: string;
  prayer_style: string;
  accountability_preference: string;
  content_depth: number;
  interests: string[];
  ai_generation: {
    summary: string;
    verse: string;
    plan: string;
    aiTone: Record<string, unknown>;
  };
};

const INITIAL_DATA: OnboardingData = {
  display_name: "",
  age_range: "",
  life_stage: "",
  faith_journey_stage: "",
  denomination: "",
  preferred_translation: "ESV",
  bible_reading_history: "",
  reading_frequency: "",
  reading_time_of_day: "",
  reminder_days: [],
  spiritual_challenges: [],
  connection_styles: [],
  learning_style: "",
  prayer_style: "",
  accountability_preference: "",
  content_depth: 3,
  interests: [],
  ai_generation: {
    summary: "",
    verse: "",
    plan: "",
    aiTone: {},
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(-1); // -1 = loading, 0 = welcome, 1-16 = steps, 17 = preview, 18 = prayer, 19 = enter
  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [showResume, setShowResume] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");

  // Load user and existing progress
  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile) {
        setCurrentStep(0);
        return;
      }

      if (profile.has_completed_onboarding) {
        router.push("/home");
        return;
      }

      // Restore progress
      const step = profile.onboarding_step || 0;
      if (step > 0 && step < 19) {
        setShowResume(true);
      }

      // Restore saved data
      setData((prev) => ({
        ...prev,
        display_name: profile.display_name || prev.display_name,
        age_range: profile.age_range || prev.age_range,
        life_stage: profile.life_stage || prev.life_stage,
        faith_journey_stage: profile.faith_journey_stage || prev.faith_journey_stage,
        denomination: profile.denomination || prev.denomination,
        preferred_translation: profile.preferred_translation || prev.preferred_translation,
        bible_reading_history: profile.bible_reading_history || prev.bible_reading_history,
        reading_frequency: profile.reading_frequency || prev.reading_frequency,
        reading_time_of_day: profile.reading_time_of_day || prev.reading_time_of_day,
        reminder_days: profile.reminder_days || prev.reminder_days,
        spiritual_challenges: profile.spiritual_challenges || prev.spiritual_challenges,
        connection_styles: profile.connection_styles || prev.connection_styles,
        learning_style: profile.learning_style || prev.learning_style,
        prayer_style: profile.prayer_style || prev.prayer_style,
        accountability_preference: profile.accountability_preference || prev.accountability_preference,
        content_depth: profile.content_depth || prev.content_depth,
        interests: profile.interests || prev.interests,
        ai_generation: {
          summary: profile.onboarding_summary || "",
          verse: profile.onboarding_verse || "",
          plan: profile.onboarding_plan || "",
          aiTone: (profile.ai_tone as Record<string, unknown>) || {},
        },
      }));

      setCurrentStep(step === 0 ? 0 : -2); // -2 triggers resume screen
    }

    init();
  }, [router]);

  const saveProgress = useCallback(async (step: number, update: Partial<OnboardingData>) => {
    if (!userId) return;
    const supabase = createClient();

    // Map OnboardingData fields to Supabase column names
    const supabaseUpdate: Record<string, unknown> = {
      onboarding_step: step,
    };

    if (update.display_name !== undefined) supabaseUpdate.display_name = update.display_name;
    if (update.age_range !== undefined) supabaseUpdate.age_range = update.age_range;
    if (update.life_stage !== undefined) supabaseUpdate.life_stage = update.life_stage;
    if (update.faith_journey_stage !== undefined) supabaseUpdate.faith_journey_stage = update.faith_journey_stage;
    if (update.denomination !== undefined) supabaseUpdate.denomination = update.denomination === "__skip__" ? null : update.denomination;
    if (update.preferred_translation !== undefined) supabaseUpdate.preferred_translation = update.preferred_translation;
    if (update.bible_reading_history !== undefined) supabaseUpdate.bible_reading_history = update.bible_reading_history;
    if (update.reading_frequency !== undefined) supabaseUpdate.reading_frequency = update.reading_frequency;
    if (update.reading_time_of_day !== undefined) supabaseUpdate.reading_time_of_day = update.reading_time_of_day;
    if (update.reminder_days !== undefined) supabaseUpdate.reminder_days = update.reminder_days;
    if (update.spiritual_challenges !== undefined) supabaseUpdate.spiritual_challenges = update.spiritual_challenges;
    if (update.connection_styles !== undefined) supabaseUpdate.connection_styles = update.connection_styles;
    if (update.learning_style !== undefined) supabaseUpdate.learning_style = update.learning_style;
    if (update.prayer_style !== undefined) supabaseUpdate.prayer_style = update.prayer_style;
    if (update.accountability_preference !== undefined) supabaseUpdate.accountability_preference = update.accountability_preference;
    if (update.content_depth !== undefined) supabaseUpdate.content_depth = update.content_depth;
    if (update.interests !== undefined) supabaseUpdate.interests = update.interests;

    await supabase.from("profiles").update(supabaseUpdate).eq("id", userId);
  }, [userId]);

  const goToStep = useCallback((step: number, dir: "left" | "right" = "right") => {
    setDirection(dir);
    setCurrentStep(step);
  }, []);

  const handleNext = useCallback((step: number, value: unknown) => {
    setData((prev) => {
      const update: Partial<OnboardingData> = {};
      switch (step) {
        case 1: update.display_name = value as string; break;
        case 2: update.age_range = value as string; break;
        case 3: update.life_stage = value as string; break;
        case 4: update.faith_journey_stage = value as string; break;
        case 5: update.denomination = value as string; break;
        case 6: update.preferred_translation = value as string; break;
        case 7: update.bible_reading_history = value as string; break;
        case 8: {
          const v = value as { frequency: string; timeOfDay: string; days: string[] };
          update.reading_frequency = v.frequency;
          update.reading_time_of_day = v.timeOfDay;
          update.reminder_days = v.days;
          break;
        }
        case 9: update.spiritual_challenges = value as string[]; break;
        case 10: update.connection_styles = value as string[]; break;
        case 11: update.learning_style = value as string; break;
        case 12: update.prayer_style = value as string; break;
        case 13: update.accountability_preference = value as string; break;
        case 14: update.content_depth = value as number; break;
        case 15: update.interests = value as string[]; break;
        case 16: {
          const v = value as { summary: string; verse: string; plan: string; aiTone: Record<string, unknown> };
          update.ai_generation = v;
          break;
        }
      }
      saveProgress(step + 1, update);
      return { ...prev, ...update };
    });
    goToStep(step + 1);
  }, [saveProgress, goToStep]);

  const handleBack = useCallback((step: number) => {
    goToStep(step - 1, "left");
  }, [goToStep]);

  const handleResume = () => {
    // Find the furthest completed step
    if (data.interests.length > 0) goToStep(16);
    else if (data.content_depth) goToStep(15);
    else if (data.accountability_preference) goToStep(14);
    else if (data.prayer_style) goToStep(13);
    else if (data.learning_style) goToStep(12);
    else if (data.connection_styles.length > 0) goToStep(11);
    else if (data.spiritual_challenges.length > 0) goToStep(10);
    else if (data.reading_frequency) goToStep(9);
    else if (data.bible_reading_history) goToStep(8);
    else if (data.preferred_translation) goToStep(7);
    else if (data.denomination) goToStep(6);
    else if (data.faith_journey_stage) goToStep(5);
    else if (data.life_stage) goToStep(4);
    else if (data.age_range) goToStep(3);
    else if (data.display_name) goToStep(2);
    else goToStep(1);
    setShowResume(false);
  };

  const handleStartFresh = () => {
    setCurrentStep(0);
    setShowResume(false);
  };

  // Loading state
  if (currentStep === -1) {
    return (
      <div style={{ minHeight: "100dvh", background: "#0d1b2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c9a227", animation: "typing-dot 1.4s ease-in-out infinite" }} />
      </div>
    );
  }

  // Resume screen
  if (currentStep === -2) {
    return (
      <div style={{ minHeight: "100dvh", background: "#0d1b2e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(201,162,39,0.3)", position: "absolute", left: `${10 + (i * 7) % 80}%`, bottom: `-5%`, animation: `confetti-fall ${3 + (i % 4)}s ease-in infinite`, animationDelay: `${i * 0.3}s` }} />
        ))}
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: "#ffffff", marginBottom: 12, textAlign: "center" }}>
          Welcome back{data.display_name ? `, ${data.display_name}` : ""}
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 40, textAlign: "center" }}>
          You left off partway through setup. Pick up where you left off?
        </p>
        <button
          onClick={handleResume}
          style={{ width: "100%", maxWidth: 300, height: 52, borderRadius: 12, background: "#c9a227", color: "#0d1b2e", border: "none", fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500, cursor: "pointer", marginBottom: 12 }}
        >
          Resume where I left off
        </button>
        <button
          onClick={handleStartFresh}
          style={{ width: "100%", maxWidth: 300, height: 52, borderRadius: 12, background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)", fontFamily: 'var(--font-body)', fontSize: 15, cursor: "pointer" }}
        >
          Start fresh
        </button>
      </div>
    );
  }

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Screen0Welcome
            name={data.display_name}
            onNext={() => { saveProgress(1, {}); goToStep(1); }}
          />
        );
      case 1:
        return (
          <Step1_Name
            initialValue={data.display_name}
            onNext={(v) => handleNext(1, v)}
            onBack={() => handleBack(1)}
          />
        );
      case 2:
        return (
          <Step2_AgeRange
            initialValue={data.age_range}
            onNext={(v) => handleNext(2, v)}
            onBack={() => handleBack(2)}
          />
        );
      case 3:
        return (
          <Step3_LifeStage
            initialValue={data.life_stage}
            onNext={(v) => handleNext(3, v)}
            onBack={() => handleBack(3)}
          />
        );
      case 4:
        return (
          <Step4_FaithJourney
            initialValue={data.faith_journey_stage}
            onNext={(v) => handleNext(4, v)}
            onBack={() => handleBack(4)}
          />
        );
      case 5:
        return (
          <Step5_Denomination
            initialValue={data.denomination}
            onNext={(v) => handleNext(5, v)}
            onBack={() => handleBack(5)}
          />
        );
      case 6:
        return (
          <Step6_Translation
            initialValue={data.preferred_translation}
            onNext={(v) => handleNext(6, v)}
            onBack={() => handleBack(6)}
          />
        );
      case 7:
        return (
          <Step7_ReadingHistory
            initialValue={data.bible_reading_history}
            onNext={(v) => handleNext(7, v)}
            onBack={() => handleBack(7)}
          />
        );
      case 8:
        return (
          <Step8_ReadingFrequency
            initialValue={{
              frequency: data.reading_frequency,
              timeOfDay: data.reading_time_of_day,
              days: data.reminder_days,
            }}
            onNext={(v) => handleNext(8, v)}
            onBack={() => handleBack(8)}
          />
        );
      case 9:
        return (
          <Step9_Challenges
            initialValue={data.spiritual_challenges}
            onNext={(v) => handleNext(9, v)}
            onBack={() => handleBack(9)}
          />
        );
      case 10:
        return (
          <Step10_ConnectionStyles
            initialValue={data.connection_styles}
            onNext={(v) => handleNext(10, v)}
            onBack={() => handleBack(10)}
          />
        );
      case 11:
        return (
          <Step11_LearningStyle
            initialValue={data.learning_style}
            onNext={(v) => handleNext(11, v)}
            onBack={() => handleBack(11)}
          />
        );
      case 12:
        return (
          <Step12_PrayerStyle
            initialValue={data.prayer_style}
            onNext={(v) => handleNext(12, v)}
            onBack={() => handleBack(12)}
          />
        );
      case 13:
        return (
          <Step13_Accountability
            initialValue={data.accountability_preference}
            onNext={(v) => handleNext(13, v)}
            onBack={() => handleBack(13)}
          />
        );
      case 14:
        return (
          <Step14_ContentDepth
            initialValue={data.content_depth}
            onNext={(v) => handleNext(14, v)}
            onBack={() => handleBack(14)}
          />
        );
      case 15:
        return (
          <Step15_Interests
            initialValue={data.interests}
            onNext={(v) => handleNext(15, v)}
            onBack={() => handleBack(15)}
          />
        );
      case 16:
        return (
          <Step16_AIGeneration
            profile={data as unknown as Record<string, unknown>}
            onNext={(v) => handleNext(16, v)}
            onBack={() => handleBack(16)}
          />
        );
      case 17:
        return (
          <Step17_Preview
            data={data.ai_generation}
            onNext={() => { saveProgress(18, {}); goToStep(18); }}
            onBack={() => handleBack(17)}
          />
        );
      case 18:
        return (
          <Step18_Prayer
            challenges={data.spiritual_challenges}
            onNext={() => { saveProgress(19, {}); goToStep(19); }}
            onBack={() => handleBack(18)}
          />
        );
      case 19:
        return (
          <Step19_EnterApp
            name={data.display_name}
            verse={data.ai_generation.verse}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#0d1b2e",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          animation: direction === "right"
            ? "fade-in-up 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
            : "fade-in-up 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
        key={currentStep}
      >
        {renderStep()}
      </div>
    </div>
  );
}
