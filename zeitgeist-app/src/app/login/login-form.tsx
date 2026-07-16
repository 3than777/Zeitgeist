"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/cfo";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const supabase = createClient();
    if (!supabase) {
      setError("Accounts aren't set up yet — Supabase isn't configured.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Full navigation so the server sees the new session cookie.
        window.location.assign(next);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          window.location.assign(next);
        } else {
          setNotice(
            "Check your email to confirm your account, then sign in."
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-white">Zeitgeist</span>
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">
          {mode === "signin" ? "Sign in" : "Create your account"}
        </h1>
        <p className="mt-2 text-[15px] text-neutral-400">
          {mode === "signin"
            ? "Chat with your AI CFO and pick up where you left off."
            : "Your conversations with the AI CFO, saved in one place."}
        </p>
      </div>

      <div className="rounded-3xl bg-[#1d1d1f] p-6">
        {!isSupabaseConfigured && (
          <p className="mb-4 rounded-xl bg-yellow-500/10 px-4 py-3 text-[13px] text-yellow-300">
            Accounts aren&apos;t configured yet. Add the Supabase environment
            variables to enable sign-in.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40"
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40"
          />

          {error && <p className="text-[13px] text-red-400">{error}</p>}
          {notice && <p className="text-[13px] text-[#2997ff]">{notice}</p>}

          <button
            type="submit"
            disabled={busy || !isSupabaseConfigured}
            className={cn(
              "w-full rounded-full bg-[#0071e3] py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#0077ed]",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {busy
              ? "One moment…"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-neutral-400">
        {mode === "signin" ? (
          <>
            New to Zeitgeist?{" "}
            <button
              onClick={() => {
                setMode("signup");
                setError(null);
                setNotice(null);
              }}
              className="text-[#2997ff] hover:underline"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => {
                setMode("signin");
                setError(null);
                setNotice(null);
              }}
              className="text-[#2997ff] hover:underline"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
