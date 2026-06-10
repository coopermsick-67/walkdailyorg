import type { Metadata } from "next";
import BiblePage from "./BiblePage";

export const metadata: Metadata = {
  title: "Bible - Walk Daily",
  description:
    "Read the Bible in 1500+ translations with offline reading, highlights, and AI-powered study",
};

export default function BiblePageServer() {
  return <BiblePage />;
}
