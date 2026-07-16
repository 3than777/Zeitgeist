import { Suspense } from "react";
import type { Metadata } from "next";
import CfoPageClient from "./cfo-client";

export const metadata: Metadata = {
  title: "AI CFO | Zeitgeist",
  description:
    "Chat with an AI CFO that answers financial questions in plain language.",
};

export default function CfoPage() {
  return (
    <Suspense>
      <CfoPageClient />
    </Suspense>
  );
}
