import type { Metadata } from "next";
import PrayPage from "./PrayPage";

export const metadata: Metadata = {
  title: "Guided Prayer — Walk Daily",
  description:
    "AI-guided prayer experience with personalized prayer prompts and Scripture-based devotion",
};

export default function PrayPageServer() {
  return <PrayPage />;
}
