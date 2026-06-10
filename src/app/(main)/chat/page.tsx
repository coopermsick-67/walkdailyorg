import type { Metadata } from "next";
import ChatPage from "./ChatPage";

export const metadata: Metadata = {
  title: "Chat - Walk Daily",
  description:
    "Chat with Grace, your AI Bible study assistant. Ask questions about Scripture and faith",
};

export default function ChatPageServer() {
  return <ChatPage />;
}
