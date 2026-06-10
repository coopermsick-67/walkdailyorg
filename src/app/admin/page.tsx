import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminClient from "./AdminClient";

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  source: string;
  invited: boolean;
  created_at: string;
}

interface ProfileEntry {
  id: string;
  email: string;
  display_name: string | null;
  denomination: string | null;
  streak_days: number;
  created_at: string;
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL;

  if (!user || user.email !== adminEmail) {
    redirect("/home");
  }

  // Load waitlist
  const { data: wlData } = await supabase
    .from("waitlist")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  // Load profiles
  const { data: profData } = await supabase
    .from("profiles")
    .select("id, email, display_name, denomination, streak_days, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const waitlist: WaitlistEntry[] = (wlData || []) as WaitlistEntry[];
  const profiles: ProfileEntry[] = (profData || []) as ProfileEntry[];

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "var(--bg)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="font-heading text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Admin Dashboard
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {adminEmail}
            </p>
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(22, 163, 74, 0.1)",
              color: "#16a34a",
              border: "1px solid rgba(22, 163, 74, 0.2)",
            }}
          >
            Admin
          </div>
        </div>

        <AdminClient
          initialWaitlist={waitlist}
          initialProfiles={profiles}
        />
      </div>
    </div>
  );
}
