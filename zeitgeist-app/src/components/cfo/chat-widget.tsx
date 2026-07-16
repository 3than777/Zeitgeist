"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, Maximize2, MessageCircle, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { useConversationMessages } from "./use-conversation-messages";

// Env vars are inlined at build time — checking them costs nothing, while
// importing the Supabase client statically would put it in every page bundle.
const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// The thread pulls in the AI SDK + markdown renderer — load it only when
// the panel actually opens so every page's first load stays light.
const ChatThread = dynamic(
  () => import("./chat-thread").then((mod) => mod.ChatThread),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
      </div>
    ),
  }
);

const WIDGET_CONVERSATION_KEY = "cfo:conversationId";

/**
 * Floating AI CFO chat: a button on every page that opens a small panel,
 * expandable to the dedicated /cfo page.
 */
export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Check auth only when the panel opens — keeps closed-widget pages idle
  // and loads the Supabase client on demand.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      if (!supabase) return;
      supabase.auth.getUser().then(({ data }) => {
        if (cancelled) return;
        setUser(data.user ?? null);
        setAuthReady(true);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Adopt the widget's last conversation (shared with /cfo) on first open.
  useEffect(() => {
    if (open && !conversationId) {
      const stored = sessionStorage.getItem(WIDGET_CONVERSATION_KEY);
      const id = stored || crypto.randomUUID();
      sessionStorage.setItem(WIDGET_CONVERSATION_KEY, id);
      setConversationId(id);
    }
  }, [open, conversationId]);

  const messages = useConversationMessages(open && user ? conversationId : null);

  // Hidden until Supabase is configured, and on pages with their own chat/auth UI.
  if (!isSupabaseConfigured) return null;
  if (pathname.startsWith("/cfo") || pathname.startsWith("/login")) return null;

  return (
    <div className="dark">
      {/* Panel */}
      {open && (
        <div
          className={cn(
            "fixed bottom-24 right-4 z-50 flex flex-col overflow-hidden md:right-6",
            "h-[560px] max-h-[calc(100dvh-8rem)] w-[380px] max-w-[calc(100vw-2rem)]",
            "rounded-3xl border border-white/10 bg-[#161617] shadow-2xl"
          )}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0071e3]/15">
                <Landmark className="h-4 w-4 text-[#2997ff]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-semibold text-white">AI CFO</span>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href={conversationId ? `/cfo?c=${conversationId}` : "/cfo"}
                className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Open full page"
              >
                <Maximize2 className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          {!authReady ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
            </div>
          ) : !user ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0071e3]/15">
                <Landmark className="h-6 w-6 text-[#2997ff]" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">
                Meet your AI CFO
              </h3>
              <p className="mt-1 text-[13px] text-neutral-400">
                Sign in to ask financial questions and keep your conversations.
              </p>
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                className="mt-5 rounded-full bg-[#0071e3] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0077ed]"
              >
                Sign in
              </Link>
            </div>
          ) : conversationId && messages !== null ? (
            <ChatThread
              key={conversationId}
              conversationId={conversationId}
              initialMessages={messages}
              compact
              showSuggestions
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
            </div>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close AI CFO chat" : "Open AI CFO chat"}
        className={cn(
          "fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full md:right-6",
          "bg-[#0071e3] text-white shadow-lg shadow-black/40 transition-all hover:scale-105 hover:bg-[#0077ed]"
        )}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}

export default ChatWidget;
