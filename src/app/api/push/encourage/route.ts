import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPush, type PushSubscriptionRecord } from "@/lib/push";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to_user_id } = await request.json();
  if (!to_user_id || to_user_id === user.id) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  // Verify they share a group
  const { data: senderGroups } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  const senderGroupIds = (senderGroups ?? []).map((r: Record<string, string>) => r.group_id);
  if (!senderGroupIds.length) {
    return NextResponse.json({ error: "Not in a group together" }, { status: 403 });
  }

  const { data: shared } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", to_user_id)
    .in("group_id", senderGroupIds)
    .limit(1);

  if (!shared?.length) {
    return NextResponse.json({ error: "Not in a group together" }, { status: 403 });
  }

  // Get sender's display name
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("display_name, streak_days")
    .eq("id", user.id)
    .single();

  const senderName = (senderProfile?.display_name as string | null) ?? "Someone from your group";
  const senderStreak = (senderProfile?.streak_days as number) ?? 0;

  const messages = [
    `${senderName} is cheering you on! Keep up your daily walk with God.`,
    `${senderName} sent you encouragement! You're not alone on this journey.`,
    `${senderName} (${senderStreak}🔥 streak) is praying for you today.`,
    `Your group is thinking of you! ${senderName} wants you to know you're doing great.`,
  ];
  const body = messages[Math.floor(Math.random() * messages.length)];

  // Get recipient's push subscriptions
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", to_user_id);

  if (!subs?.length) {
    // No subscriptions but still succeed silently
    return NextResponse.json({ ok: true, delivered: false });
  }

  let delivered = 0;
  for (const sub of subs as PushSubscriptionRecord[]) {
    try {
      await sendPush(sub, { title: "Walk Daily — Encouragement", body, url: "/groups" });
      delivered++;
    } catch {
      await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    }
  }

  return NextResponse.json({ ok: true, delivered });
}
