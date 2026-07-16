"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatThread } from "@/components/cfo/chat-thread";
import { ConversationSidebar } from "@/components/cfo/conversation-sidebar";
import { useConversationMessages } from "@/components/cfo/use-conversation-messages";

const WIDGET_CONVERSATION_KEY = "cfo:conversationId";

export default function CfoPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Resolve the conversation client-side: URL param → widget handoff → new.
  useEffect(() => {
    const fromUrl = searchParams.get("c");
    if (fromUrl) {
      setActiveId(fromUrl);
      return;
    }
    const fromWidget = sessionStorage.getItem(WIDGET_CONVERSATION_KEY);
    setActiveId(fromWidget || crypto.randomUUID());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the widget handoff key in sync with what's open here.
  useEffect(() => {
    if (activeId) sessionStorage.setItem(WIDGET_CONVERSATION_KEY, activeId);
  }, [activeId]);

  const selectConversation = useCallback(
    (id: string) => {
      setActiveId(id);
      setSidebarOpen(false);
      router.replace(`/cfo?c=${id}`);
    },
    [router]
  );

  const newConversation = useCallback(() => {
    selectConversation(crypto.randomUUID());
  }, [selectConversation]);

  const messages = useConversationMessages(activeId);

  return (
    <div className="dark flex h-screen overflow-hidden bg-black">
      {/* Sidebar — static on desktop, overlay on mobile */}
      <aside
        className={cn(
          "w-72 shrink-0 border-r border-white/10 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:transition-transform",
          sidebarOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full",
          "md:block"
        )}
      >
        <ConversationSidebar
          activeId={activeId}
          refreshKey={refreshKey}
          onSelect={selectConversation}
          onNew={newConversation}
          onDeleted={(id) => {
            if (id === activeId) newConversation();
            setRefreshKey((k) => k + 1);
          }}
        />
      </aside>

      {/* Mobile scrim */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main column */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen((open) => !open)}
            className="text-neutral-300 hover:text-white"
            aria-label="Toggle conversations"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-sm font-semibold text-white">AI CFO</span>
        </div>

        {activeId && messages !== null ? (
          <ChatThread
            key={activeId}
            conversationId={activeId}
            initialMessages={messages}
            autoFocus
            onAssistantFinish={() => setRefreshKey((k) => k + 1)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
          </div>
        )}
      </main>
    </div>
  );
}
