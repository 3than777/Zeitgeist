"use client";

import React, { useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  onSend: (text: string) => void;
  onStop: () => void;
  streaming: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  compact?: boolean;
}

export function ChatComposer({
  onSend,
  onStop,
  streaming,
  disabled = false,
  autoFocus = false,
  compact = false,
}: ChatComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || streaming || disabled) return;
    onSend(text);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  return (
    <div
      className={cn(
        "flex items-end gap-2 rounded-3xl border border-white/10 bg-[#2c2c2e] px-4 py-2",
        "focus-within:border-[#0071e3]/60"
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        autoFocus={autoFocus}
        disabled={disabled}
        rows={1}
        placeholder="Ask the CFO anything about money…"
        onChange={(e) => {
          setValue(e.target.value);
          const el = e.target;
          el.style.height = "auto";
          el.style.height = `${Math.min(el.scrollHeight, compact ? 96 : 160)}px`;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        className={cn(
          "max-h-40 flex-1 resize-none bg-transparent py-1.5 text-white placeholder:text-neutral-500 focus:outline-none",
          compact ? "text-sm" : "text-[15px]"
        )}
      />
      {streaming ? (
        <button
          onClick={onStop}
          aria-label="Stop generating"
          className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
        </button>
      ) : (
        <button
          onClick={submit}
          disabled={!value.trim() || disabled}
          aria-label="Send message"
          className={cn(
            "mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0071e3] text-white transition-all hover:bg-[#0077ed]",
            "disabled:cursor-not-allowed disabled:opacity-40"
          )}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
