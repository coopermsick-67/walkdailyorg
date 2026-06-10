import type { Metadata } from "next";
import ProfilePage from "./ProfilePage";

export const metadata: Metadata = {
  title: "Profile — Walk Daily",
  description:
    "Manage your Walk Daily profile — update your name, denomination, faith journey, and spiritual goals",
};

export default function ProfilePageServer() {
  return <ProfilePage />;
}
