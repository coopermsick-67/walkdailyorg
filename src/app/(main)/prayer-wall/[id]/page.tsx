import type { Metadata } from "next";
import PrayerDetailPage from "./PrayerDetailPage";

export const metadata: Metadata = {
  title: "Prayer Request — Walk Daily",
  description:
    "View and respond to a prayer request — leave comments, pray for the request, and join the community in lifting each other up",
};

export default function PrayerDetailPageServer() {
  return <PrayerDetailPage />;
}
