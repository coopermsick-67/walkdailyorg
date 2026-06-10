import type { Metadata } from "next";
import PrayerPage from "./PrayerPage";

export const metadata: Metadata = {
  title: "Prayer — Walk Daily",
  description:
    "Share prayer requests and pray for others in the Walk Daily community",
};

export default function PrayerPageServer() {
  return <PrayerPage />;
}
