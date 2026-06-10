import type { Metadata } from "next";
import JournalPage from "./JournalPage";

export const metadata: Metadata = {
  title: "Journal - Walk Daily",
  description:
    "Your private faith journal with AI-powered spiritual reflection",
};

export default function JournalPageServer() {
  return <JournalPage />;
}
