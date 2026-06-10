import type { Metadata } from "next";
import StudyPage from "./StudyPage";

export const metadata: Metadata = {
  title: "Bible Study — Walk Daily",
  description:
    "AI-powered Bible study — ask questions about Scripture, get verse-by-verse explanations, and explore the context of any passage",
};

export default function StudyPageServer() {
  return <StudyPage />;
}
