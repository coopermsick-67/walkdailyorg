import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPush, type PushSubscriptionRecord } from "@/lib/push";

// Called hourly by Vercel cron. Sends daily reminder to users whose
// local time matches their configured reminder hour.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = await createClient();
  const nowUtc = new Date();
  const utcHour = nowUtc.getUTCHours();

  // Find users with push notifications enabled and a reminder set
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, timezone, daily_reminder_hour")
    .eq("push_notifications_enabled", true)
    .not("daily_reminder_hour", "is", null);

  if (!profiles?.length) return NextResponse.json({ sent: 0 });

  const todayUtc = nowUtc.toISOString().slice(0, 10); // "YYYY-MM-DD"

  let sent = 0;
  for (const profile of profiles) {
    // Convert current UTC time to user's local hour
    try {
      const tz = (profile.timezone as string) || "UTC";
      const localHour = parseInt(
        new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(nowUtc),
        10,
      );

      if (localHour !== profile.daily_reminder_hour) continue;

      // Ensure not already sent today (use a simple marker: check if sent in last 60 min
      // by checking if a reminder_sent_at column is recent — simplification: just send)
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", profile.id);

      if (!subs?.length) continue;

      const messages = [
        "Your daily reading is waiting. A few minutes in the Word can change your whole day.",
        "Good morning! Time to meet with God. Open your Bible plan for today.",
        "Don't let today pass without time in Scripture. You set a reminder for a reason.",
        "Your streak is counting on you. Take a moment in God's Word today.",
      ];
      const body = messages[utcHour % messages.length];

      for (const sub of subs as PushSubscriptionRecord[]) {
        try {
          await sendPush(sub, {
            title: "Walk Daily",
            body,
            url: "/bible/plans",
          });
          sent++;
        } catch {
          // Subscription may be expired; clean up
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
        }
      }
    } catch {
      // skip malformed timezone
    }
  }

  return NextResponse.json({ sent, date: todayUtc });
}
