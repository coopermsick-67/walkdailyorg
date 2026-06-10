import type { Metadata } from "next";
import SubscriptionsPage from "./SubscriptionsPage";

export const metadata: Metadata = {
  title: "Subscriptions — Walk Daily",
  description:
    "Manage your Walk Daily subscription and billing",
};

export default function SubscriptionsPageServer() {
  return <SubscriptionsPage />;
}
