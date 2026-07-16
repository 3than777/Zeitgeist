"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Check, LogOut, Pencil, Plus, Trash2, TrendingUp, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Conversation } from "@/types/cfo";

interface ConversationSidebarProps {
  activeId: string | null;
  refreshKey: number;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDeleted: (id: string) => void;
}

export function ConversationSidebar({
  activeId,
  refreshKey,
  onSelect,
  onNew,
  onDeleted,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase
      .from("conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .then(({ data }) => setConversations((data as Conversation[]) ?? []));
  }, [refreshKey]);

  const renameConversation = async (id: string) => {
    const title = editingTitle.trim();
    setEditingId(null);
    if (!title) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
    const supabase = createClient();
    await supabase?.from("conversations").update({ title }).eq("id", id);
  };

  const deleteConversation = async (id: string) => {
    if (!window.confirm("Delete this conversation?")) return;
    setConversations((prev) => prev.filter((c) => c.id !== id));
    const supabase = createClient();
    await supabase?.from("conversations").delete().eq("id", id);
    onDeleted(id);
  };

  return (
    <div className="flex h-full flex-col bg-[#161617]">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">Zeitgeist</span>
        </Link>
      </div>

      <div className="px-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0077ed]"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {conversations.length === 0 && (
          <p className="px-2 py-4 text-center text-[13px] text-neutral-500">
            No conversations yet.
          </p>
        )}
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={cn(
              "group flex items-center rounded-xl transition-colors",
              conversation.id === activeId
                ? "bg-white/10"
                : "hover:bg-white/5"
            )}
          >
            {editingId === conversation.id ? (
              <div className="flex w-full items-center gap-1 px-2 py-1.5">
                <input
                  autoFocus
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") renameConversation(conversation.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="w-full rounded-lg bg-black/40 px-2 py-1 text-[13px] text-white focus:outline-none"
                />
                <button
                  onClick={() => renameConversation(conversation.id)}
                  className="p-1 text-neutral-400 hover:text-white"
                  aria-label="Save name"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-1 text-neutral-400 hover:text-white"
                  aria-label="Cancel rename"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onSelect(conversation.id)}
                  className="min-w-0 flex-1 truncate px-3 py-2 text-left text-[13px] text-neutral-200"
                  title={conversation.title}
                >
                  {conversation.title}
                </button>
                <div className="hidden shrink-0 items-center pr-2 group-hover:flex">
                  <button
                    onClick={() => {
                      setEditingId(conversation.id);
                      setEditingTitle(conversation.title);
                    }}
                    className="p-1 text-neutral-500 hover:text-white"
                    aria-label="Rename conversation"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteConversation(conversation.id)}
                    className="p-1 text-neutral-500 hover:text-red-400"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="truncate text-xs text-neutral-500">
            {user?.email ?? ""}
          </span>
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase?.auth.signOut();
              window.location.assign("/");
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
