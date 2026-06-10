import type { Metadata } from "next";
import PrayerWallPage from "./PrayerWallPage";

export const metadata: Metadata = {
  title: "Prayer Wall — Walk Daily",
  description:
    "Share prayer requests, pray for others, and celebrate answered prayers",
};

export default function PrayerWallPageServer() {
  return <PrayerWallPage />;
}
