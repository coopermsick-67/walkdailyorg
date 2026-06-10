import type { Metadata } from "next";
import DevotionalPage from "./DevotionalPage";

export const metadata: Metadata = {
  title: "Devotional — Walk Daily",
  description:
    "Start your day with God — generate personalized daily devotionals rooted in Scripture with reflections and prayer prompts",
};

export default function DevotionalPageServer() {
  return <DevotionalPage />;
}
