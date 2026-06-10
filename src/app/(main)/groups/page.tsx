import type { Metadata } from "next";
import GroupsPage from "./GroupsPage";

export const metadata: Metadata = {
  title: "Groups — Walk Daily",
  description:
    "Join or create Bible study groups, prayer circles, and faith communities",
};

export default function GroupsPageServer() {
  return <GroupsPage />;
}
