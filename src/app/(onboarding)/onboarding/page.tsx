"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import WelcomeStep from "./steps/WelcomeStep";
import FaithQuestionsStep, {
  type OnboardingData,
} from "./steps/FaithQuestionsStep";
import AIPersonalizationStep from "./steps/AIPersonalizationStep";
import PrayerStep from "./steps/PrayerStep";
import FinalStep from "./steps/FinalStep";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Step = 1 | 2 | 3 | 4 | 5;

const INITIAL_DATA: OnboardingData = {
  faithJourney: "",
  connectionMethods: [],
  spiritualChallenge: "",
  bibleTranslation: "",
  readingFrequency: "",
  readingReminder: "",
  readingDays: [],
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isAnimating, setIsAnimating] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [onboardingData, setOnboardingData] =
    useState<OnboardingData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth + onboarding status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          router.push("/auth/login?redirect=/onboarding");
          return;
        }

        // Check if already completed onboarding
        const { data: profile } = await supabase
          .from("profiles")
          .select("has_completed_onboarding, display_name")
          .eq("id", user.id)
          .single();

        if (profile?.has_completed_onboarding) {
          router.push("/home");
          return;
        }

        // Extract first name from display_name
        if (profile?.display_name) {
          const parts = profile.display_name.trim().split(/\s+/);
          setFirstName(parts[0]);
        }

        setIsLoading(false);
      } catch {
        router.push("/auth/login?redirect=/onboarding");
      }
    };

    checkAuth();
  }, [router]);

  const transitionTo = useCallback(
    (target: Step, dir: "forward" | "backward") => {
      if (isAnimating) return;
      setIsAnimating(true);
      setDirection(dir);

      // Exit animation
      setTimeout(() => {
        setCurrentStep(target);
        setIsAnimating(false);
      }, 250);
    },
    [isAnimating]
  );

  const goNext = useCallback(() => {
    if (currentStep < 5) {
      transitionTo((currentStep + 1) as Step, "forward");
    }
  }, [currentStep, transitionTo]);

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      transitionTo((currentStep - 1) as Step, "backward");
    }
  }, [currentStep, transitionTo]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        goBack();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goBack]);

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background:
              "linear-gradient(135deg, var(--color-primary-500, #1a3a6e), var(--color-primary-600, #16315e))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "pulse-glow 2s ease-in-out infinite",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect
              x="5"
              y="3"
              width="14"
              height="18"
              rx="2.5"
              stroke="white"
              strokeWidth="1.8"
            />
            <line x1="12" y1="3" x2="12" y2="21" stroke="white" strokeWidth="1.8" />
            <line
              x1="12"
              y1="4"
              x2="12"
              y2="2"
              stroke="var(--color-accent-500, #c9a227)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <p
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: "14px",
            fontFamily: 'var(--font-body, "Inter", system-ui, sans-serif)',
          }}
        >
          Preparing your journey...
        </p>
        <style>{`
          @keyframes pulse-glow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  // Page transition classes
  const pageClass =
    isAnimating
      ? direction === "forward"
        ? "page-exit-left"
        : "page-exit-right"
      : direction === "forward"
        ? "page-enter-right"
        : "page-enter-left";

  return (
    <div
      key={currentStep}
      className={pageClass}
      style={{
        minHeight: "100dvh",
        position: "relative",
        ...(isAnimating
          ? {}
          : {
              animation:
                direction === "forward"
                  ? "page-slide-right 0.4s cubic-bezier(0.22, 1, 0.36, 1) both"
                  : "page-slide-left 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
            }),
      }}
    >
      {/* Step 1: Welcome */}
      {currentStep === 1 && (
        <WelcomeStep firstName={firstName} onNext={goNext} />
      )}

      {/* Step 2: Faith Questions */}
      {currentStep === 2 && (
        <FaithQuestionsStep
          initialData={onboardingData}
          onNext={(data) => {
            setOnboardingData(data);
            goNext();
          }}
          onBack={goBack}
        />
      )}

      {/* Step 3: AI Personalization */}
      {currentStep === 3 && (
        <AIPersonalizationStep
          data={onboardingData}
          onNext={goNext}
          onBack={() => transitionTo(2, "backward")}
        />
      )}

      {/* Step 4: Prayer */}
      {currentStep === 4 && (
        <PrayerStep data={onboardingData} onNext={goNext} />
      )}

      {/* Step 5: Final */}
      {currentStep === 5 && <FinalStep data={onboardingData} />}

      {/* Global step transition animations */}
      <style>{`
        @keyframes page-slide-right {
          from {
            opacity: 0;
            transform: translateX(60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes page-slide-left {
          from {
            opacity: 0;
            transform: translateX(-60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
