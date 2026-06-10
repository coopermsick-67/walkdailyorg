import type { Metadata } from "next";
import HomePage from "./HomePage";

export const metadata: Metadata = {
  title: "Home — Walk Daily",
  description:
    "Your daily faith companion dashboard — track your Bible reading, prayer requests, journal, and verse memorization",
};

export default function HomePageServer() {
  return <HomePage />;
}
