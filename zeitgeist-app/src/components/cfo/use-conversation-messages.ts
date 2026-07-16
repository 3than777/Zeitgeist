"use client";

import { useEffect, useState } from "react";
import type { UIMessage } from "ai";
import { uiMessagesFromDb, type DbMessage } from "@/types/cfo";

/**
 * Loads a conversation's stored messages once per conversation id.
 * Returns null while loading so callers can defer mounting the thread.
 */
export function useConversationMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<UIMessage[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMessages(null);

    if (!conversationId) {
      setMessages([]);
      return;
    }

    // Dynamic import keeps the Supabase client out of page bundles that
    // never open a chat.
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      if (!supabase) {
        if (!cancelled) setMessages([]);
        return;
      }

      supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .then(({ data }) => {
          if (!cancelled) {
            setMessages(uiMessagesFromDb((data as DbMessage[]) ?? []));
          }
        });
    });

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  return messages;
}
