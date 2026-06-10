import type { Metadata } from "next";
import MemorizePage from "./MemorizePage";

export const metadata: Metadata = {
  title: "Verse Memory — Walk Daily",
  description:
    "Memorize Scripture with spaced repetition — flashcards, fill-in-the-blank, word scrambles, and meaning matching exercises",
};

export default function MemorizePageServer() {
  return <MemorizePage />;
}
