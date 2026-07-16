"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { uiMessageText } from "@/types/cfo";
import { ChatComposer } from "./chat-composer";

const SUGGESTIONS = [
  "Explain EBITDA in plain English",
  "Help me budget a $5k/month income",
  "What's a healthy gross margin for SaaS?",
];

/** Pull a human-readable message out of a transport/server error. */
function friendlyError(error: Error): string {
  try {
    const parsed = JSON.parse(error.message);
    if (typeof parsed?.error === "string") return parsed.error;
  } catch {
    // not JSON — fall through
  }
  return error.message || "Something went wrong. Please try again.";
}

interface ChatThreadProps {
  conversationId: string;
  initialMessages: UIMessage[];
  compact?: boolean;
  autoFocus?: boolean;
  showSuggestions?: boolean;
  onAssistantFinish?: () => void;
}

export function ChatThread({
  conversationId,
  initialMessages,
  compact = false,
  autoFocus = false,
  showSuggestions = true,
  onAssistantFinish,
}: ChatThreadProps) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/cfo/chat",
        body: { conversationId },
      }),
    [conversationId]
  );

  const { messages, sendMessage, status, stop, error, regenerate, clearError } =
    useChat({
      id: conversationId,
      messages: initialMessages,
      transport,
      onFinish: () => onAssistantFinish?.(),
    });

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  const streaming = status === "submitted" || status === "streaming";
  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Messages */}
      <div
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-y-auto",
          compact ? "px-4 py-4" : "px-4 py-8 md:px-8"
        )}
      >
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0071e3]/15">
              <Landmark className="h-6 w-6 text-[#2997ff]" strokeWidth={1.5} />
            </div>
            <h2
              className={cn(
                "mt-4 font-semibold text-white",
                compact ? "text-base" : "text-xl"
              )}
            >
              Ask your CFO
            </h2>
            <p
              className={cn(
                "mt-1 max-w-xs text-neutral-400",
                compact ? "text-[13px]" : "text-[15px]"
              )}
            >
              Plain-language answers to any money question.
            </p>
            {showSuggestions && (
              <div className="mt-6 flex flex-col gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage({ text: suggestion })}
                    className={cn(
                      "rounded-full border border-white/15 px-4 py-2 text-neutral-300 transition-colors hover:border-[#0071e3] hover:text-white",
                      compact ? "text-[13px]" : "text-sm"
                    )}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "mx-auto flex w-full flex-col gap-5",
              compact ? "max-w-full" : "max-w-2xl"
            )}
          >
            {messages.map((message) =>
              message.role === "user" ? (
                <div key={message.id} className="flex justify-end">
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-[#0071e3] px-4 py-2.5 text-white",
                      compact ? "text-sm" : "text-[15px]"
                    )}
                  >
                    {uiMessageText(message)}
                  </div>
                </div>
              ) : (
                <div
                  key={message.id}
                  className={cn(
                    "prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#1d1d1f]",
                    compact ? "prose-sm" : "prose-sm md:prose-base"
                  )}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {uiMessageText(message)}
                  </ReactMarkdown>
                </div>
              )
            )}

            {/* Thinking indicator while waiting for the first token */}
            {status === "submitted" && (
              <div className="flex items-center gap-1.5 py-2">
                <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-500 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-500 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-500 [animation-delay:300ms]" />
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {friendlyError(error)}
                <button
                  onClick={() => {
                    clearError();
                    regenerate();
                  }}
                  className="ml-3 font-medium text-[#2997ff] hover:underline"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <div
        className={cn(
          "shrink-0 border-t border-white/10",
          compact ? "p-3" : "p-4 md:px-8"
        )}
      >
        <div className={cn("mx-auto", compact ? "max-w-full" : "max-w-2xl")}>
          <ChatComposer
            onSend={(text) => sendMessage({ text })}
            onStop={stop}
            streaming={streaming}
            autoFocus={autoFocus}
            compact={compact}
          />
          {!compact && (
            <p className="mt-2 text-center text-[11px] text-neutral-600">
              Educational only — not licensed financial advice.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
