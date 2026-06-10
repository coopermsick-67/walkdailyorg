import type { Metadata } from "next";
import PlansPage from "./PlansPage";

export const metadata: Metadata = {
  title: "Reading Plans — Walk Daily",
  description:
    "Structured Bible reading plans — 7-day, 30-day, and yearly plans to guide your Scripture reading journey",
};

export default function PlansPageServer() {
  return <PlansPage />;
}
