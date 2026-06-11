"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  ArrowLeft,
  Copy,
  Check,
  Flame,
  LogIn,
  Heart,
  Send,
  Trash2,
  Crown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Group {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
  memberCount: number;
}

interface GroupMember {
  user_id: string;
  role: string;
  joined_at: string;
  display_name: string | null;
  streak_days: number;
  avatar_url: string | null;
}

interface GroupDetail extends Group {
  members: GroupMember[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Create Group Modal                                                 */
/* ------------------------------------------------------------------ */

function CreateGroupModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError("");
    try {
      await onCreate(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6"
        style={{ background: "var(--surface-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold font-heading mb-1" style={{ color: "var(--text-primary)" }}>
          Create a Group
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          Name your accountability group. Up to 5 members total.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning Seekers"
            maxLength={40}
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-sm mb-4"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text-primary)",
              minHeight: 48,
            }}
          />
          {error && (
            <p className="text-xs text-red-400 mb-3">{error}</p>
          )}
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="w-full py-3.5 rounded-xl font-semibold disabled:opacity-60 transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
              color: "#fff",
              minHeight: 52,
            }}
          >
            {creating ? "Creating…" : "Create Group"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Join Group Modal                                                   */
/* ------------------------------------------------------------------ */

function JoinGroupModal({
  onClose,
  onJoin,
}: {
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 6) return;
    setJoining(true);
    setError("");
    try {
      await onJoin(code.trim().toUpperCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join group");
      setJoining(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6"
        style={{ background: "var(--surface-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold font-heading mb-1" style={{ color: "var(--text-primary)" }}>
          Join a Group
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          Enter the 6-character invite code shared by your group leader.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. AB12CD"
            maxLength={6}
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-center text-xl font-mono font-bold tracking-widest mb-4"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text-primary)",
              minHeight: 52,
              letterSpacing: "0.25em",
            }}
          />
          {error && (
            <p className="text-xs text-red-400 mb-3 text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={joining || code.trim().length < 6}
            className="w-full py-3.5 rounded-xl font-semibold disabled:opacity-60 transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
              color: "#fff",
              minHeight: 52,
            }}
          >
            {joining ? "Joining…" : "Join Group"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Group Detail View                                                  */
/* ------------------------------------------------------------------ */

function GroupDetailView({
  group,
  currentUserId,
  onBack,
  onLeave,
  onDelete,
  onEncourage,
}: {
  group: GroupDetail;
  currentUserId: string;
  onBack: () => void;
  onLeave: () => void;
  onDelete: () => void;
  onEncourage: (toUserId: string, name: string) => Promise<void>;
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [encouraging, setEncouraging] = useState<string | null>(null);

  const isOwner = group.owner_id === currentUserId;
  const sortedMembers = [...group.members].sort((a, b) => b.streak_days - a.streak_days);

  const copyCode = async () => {
    await navigator.clipboard.writeText(group.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleEncourage = async (member: GroupMember) => {
    setEncouraging(member.user_id);
    try {
      await onEncourage(member.user_id, member.display_name ?? "your friend");
    } finally {
      setEncouraging(null);
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        {/* Sticky header */}
        <div
          className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
          style={{
            background: "var(--nav-bg)",
            borderBottom: "1px solid var(--nav-border)",
            backdropFilter: "blur(12px)",
          }}
        >
          <button
            onClick={onBack}
            className="p-2 rounded-lg"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h2
              className="text-base font-semibold font-heading truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {group.name}
            </h2>
          </div>
          {isOwner ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 rounded-lg"
              style={{ color: "var(--text-muted)" }}
              aria-label="Delete group"
            >
              <Trash2 size={18} />
            </button>
          ) : (
            <button
              onClick={() => setConfirmLeave(true)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              Leave
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {/* Invite code card */}
          <div
            className="rounded-2xl p-4 flex items-center justify-between"
            style={{ background: "var(--surface-card)", border: "1px solid var(--border)" }}
          >
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                INVITE CODE
              </p>
              <p
                className="text-2xl font-bold font-mono tracking-widest"
                style={{ color: "var(--color-accent-500)", letterSpacing: "0.2em" }}
              >
                {group.invite_code}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Share this with friends to join
              </p>
            </div>
            <button
              onClick={copyCode}
              className="p-3 rounded-xl transition-all"
              style={{
                background: copiedCode ? "rgba(201,162,39,0.15)" : "var(--surface-elevated)",
                color: copiedCode ? "var(--color-accent-500)" : "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
              aria-label="Copy invite code"
            >
              {copiedCode ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>

          {/* Members list */}
          <div>
            <p
              className="text-xs font-semibold mb-3 uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Members ({group.members.length}/5)
            </p>
            <div className="space-y-2">
              {sortedMembers.map((member, idx) => (
                <div
                  key={member.user_id}
                  className="rounded-xl p-4 flex items-center gap-3"
                  style={{
                    background: "var(--surface-card)",
                    border: `1px solid ${idx === 0 ? "rgba(201,162,39,0.25)" : "var(--border)"}`,
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{
                      background: idx === 0
                        ? "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-400))"
                        : "var(--surface-elevated)",
                      color: idx === 0 ? "#fff" : "var(--text-secondary)",
                    }}
                  >
                    {initials(member.display_name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {member.display_name ?? "Unnamed"}
                        {member.user_id === currentUserId && (
                          <span className="text-xs font-normal ml-1" style={{ color: "var(--text-muted)" }}>
                            (you)
                          </span>
                        )}
                      </p>
                      {member.user_id === group.owner_id && (
                        <Crown size={12} style={{ color: "var(--color-accent-500)", flexShrink: 0 }} />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Flame
                        size={12}
                        style={{ color: member.streak_days > 0 ? "#f97316" : "var(--text-muted)" }}
                      />
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {member.streak_days} day streak
                      </span>
                    </div>
                  </div>

                  {/* Encourage button (skip yourself) */}
                  {member.user_id !== currentUserId && (
                    <button
                      onClick={() => handleEncourage(member)}
                      disabled={encouraging === member.user_id}
                      className="p-2 rounded-lg transition-all disabled:opacity-60"
                      style={{
                        background: "rgba(201,162,39,0.1)",
                        color: "var(--color-accent-500)",
                      }}
                      aria-label={`Encourage ${member.display_name}`}
                      title="Send encouragement"
                    >
                      {encouraging === member.user_id ? (
                        <Send size={15} className="animate-pulse" />
                      ) : (
                        <Heart size={15} />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Invite prompt if under 5 members */}
          {group.members.length < 5 && (
            <div
              className="rounded-2xl p-4 text-center"
              style={{ background: "var(--surface-card)", border: "1px dashed var(--border-strong)" }}
            >
              <Users size={24} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Room for {5 - group.members.length} more member{5 - group.members.length !== 1 ? "s" : ""}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Share code <strong style={{ color: "var(--color-accent-500)" }}>{group.invite_code}</strong> to invite
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm modals */}
      <ConfirmModal
        isOpen={confirmLeave}
        title="Leave Group"
        message={`Leave "${group.name}"? You can rejoin with the invite code later.`}
        confirmLabel="Leave"
        cancelLabel="Stay"
        variant="danger"
        onConfirm={onLeave}
        onCancel={() => setConfirmLeave(false)}
      />
      <ConfirmModal
        isOpen={confirmDelete}
        title="Delete Group"
        message={`Delete "${group.name}"? All members will be removed. This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function GroupsPage() {
  const { success, error: toastError } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupDetail | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) { setLoading(false); return; }
    setCurrentUserId(user.id);

    // Get groups the user is a member of
    const { data: memberRows } = await client
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id);

    if (!memberRows?.length) { setGroups([]); setLoading(false); return; }

    const groupIds = memberRows.map((r) => r.group_id as string);
    const { data: groupRows } = await client
      .from("groups")
      .select("id, name, owner_id, invite_code, created_at")
      .in("id", groupIds);

    if (!groupRows?.length) { setGroups([]); setLoading(false); return; }

    // Get member counts
    const withCounts = await Promise.all(
      groupRows.map(async (g) => {
        const { count } = await client
          .from("group_members")
          .select("id", { count: "exact", head: true })
          .eq("group_id", g.id);
        return { ...g, memberCount: count ?? 0 } as Group;
      }),
    );

    setGroups(withCounts);
    setLoading(false);
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const loadGroupDetail = async (group: Group) => {
    const client = createClient();
    const { data: members } = await client
      .from("group_members")
      .select("user_id, role, joined_at, profiles(display_name, streak_days, avatar_url)")
      .eq("group_id", group.id);

    const mapped: GroupMember[] = (members ?? []).map((m: Record<string, unknown>) => {
      const profile = (m.profiles as Record<string, unknown> | null) ?? {};
      return {
        user_id: m.user_id as string,
        role: m.role as string,
        joined_at: m.joined_at as string,
        display_name: (profile.display_name as string | null) ?? null,
        streak_days: (profile.streak_days as number) ?? 0,
        avatar_url: (profile.avatar_url as string | null) ?? null,
      };
    });

    setSelectedGroup({ ...group, members: mapped });
  };

  const handleCreateGroup = async (name: string) => {
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const invite_code = generateInviteCode();

    const { data: newGroup, error: groupErr } = await client
      .from("groups")
      .insert({ name, owner_id: user.id, invite_code })
      .select("id")
      .single();

    if (groupErr || !newGroup) throw new Error(groupErr?.message ?? "Could not create group");

    const { error: memberErr } = await client
      .from("group_members")
      .insert({ group_id: newGroup.id, user_id: user.id, role: "owner" });

    if (memberErr) throw new Error(memberErr.message);

    setShowCreate(false);
    success("Group created!");
    await loadGroups();
  };

  const handleJoinGroup = async (code: string) => {
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: group } = await client
      .from("groups")
      .select("id, name")
      .eq("invite_code", code)
      .single();

    if (!group) throw new Error("Group not found. Check the invite code.");

    // Check member count
    const { count } = await client
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", group.id);

    if ((count ?? 0) >= 5) throw new Error("This group is full (5 members max).");

    // Check not already a member
    const { data: existing } = await client
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) throw new Error("You're already in this group.");

    const { error: joinErr } = await client
      .from("group_members")
      .insert({ group_id: group.id, user_id: user.id, role: "member" });

    if (joinErr) throw new Error(joinErr.message);

    setShowJoin(false);
    success(`Joined ${group.name}!`);
    await loadGroups();
  };

  const handleEncourage = async (toUserId: string, toName: string) => {
    // Call server action to send push notification
    const res = await fetch("/api/push/encourage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_user_id: toUserId }),
    });
    if (!res.ok) {
      toastError("Couldn't send encouragement right now");
      return;
    }
    success(`Encouragement sent to ${toName}!`);
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup || !currentUserId) return;
    const client = createClient();
    await client
      .from("group_members")
      .delete()
      .eq("group_id", selectedGroup.id)
      .eq("user_id", currentUserId);
    setSelectedGroup(null);
    success("Left the group");
    await loadGroups();
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    const client = createClient();
    await client.from("group_members").delete().eq("group_id", selectedGroup.id);
    await client.from("groups").delete().eq("id", selectedGroup.id);
    setSelectedGroup(null);
    success("Group deleted");
    await loadGroups();
  };

  // Detail view
  if (selectedGroup && currentUserId) {
    return (
      <GroupDetailView
        group={selectedGroup}
        currentUserId={currentUserId}
        onBack={() => setSelectedGroup(null)}
        onLeave={handleLeaveGroup}
        onDelete={handleDeleteGroup}
        onEncourage={handleEncourage}
      />
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading" style={{ color: "var(--text-primary)" }}>
              Groups
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Study Scripture and stay accountable together.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowJoin(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{
                background: "var(--surface-elevated)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              <LogIn size={14} />
              Join
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
                color: "#fff",
              }}
            >
              <Plus size={14} />
              New
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl p-5 space-y-2" style={{ background: "var(--surface-card)" }}>
                <div className="skeleton skeleton-title" style={{ width: "40%" }} />
                <div className="skeleton skeleton-text" style={{ width: "60%" }} />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: "rgba(201,162,39,0.1)" }}
            >
              <Users size={36} style={{ color: "var(--color-accent-500)" }} />
            </div>
            <h2 className="text-xl font-bold font-heading mb-2" style={{ color: "var(--text-primary)" }}>
              No groups yet
            </h2>
            <p className="text-sm max-w-xs leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
              Create a group or join one with an invite code to stay accountable with friends.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowJoin(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{
                  background: "var(--surface-elevated)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                <LogIn size={14} className="inline mr-1.5" />
                Join with code
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
                  color: "#fff",
                }}
              >
                <Plus size={14} className="inline mr-1.5" />
                Create group
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => loadGroupDetail(group)}
                className="w-full text-left rounded-2xl p-4 transition-all hover:scale-[1.01]"
                style={{
                  background: "var(--surface-card)",
                  boxShadow: "var(--shadow-md)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(201,162,39,0.1)", color: "var(--color-accent-500)" }}
                  >
                    <Users size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className="text-sm font-semibold font-heading truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {group.name}
                      </h3>
                      {group.owner_id === currentUserId && (
                        <Crown size={12} style={{ color: "var(--color-accent-500)", flexShrink: 0 }} />
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {group.memberCount} member{group.memberCount !== 1 ? "s" : ""} · code:{" "}
                      <strong style={{ color: "var(--text-secondary)" }}>{group.invite_code}</strong>
                    </p>
                  </div>
                  <div style={{ color: "var(--text-muted)" }}>›</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Verse footer */}
        <div
          className="mt-8 mb-4 rounded-2xl p-4 text-center"
          style={{ background: "rgba(26,58,110,0.05)", border: "1px solid rgba(26,58,110,0.08)" }}
        >
          <p
            className="text-sm italic font-heading leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            "For where two or three gather in my name, there am I with them."
          </p>
          <p className="text-xs mt-1 font-medium" style={{ color: "var(--color-accent-500)" }}>
            Matthew 18:20
          </p>
        </div>
      </div>

      {showCreate && (
        <CreateGroupModal onClose={() => setShowCreate(false)} onCreate={handleCreateGroup} />
      )}
      {showJoin && (
        <JoinGroupModal onClose={() => setShowJoin(false)} onJoin={handleJoinGroup} />
      )}
    </>
  );
}
