import { Suspense } from "react";
import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Sign in | Zeitgeist",
  description: "Sign in to Zeitgeist to chat with the AI CFO.",
};

export default function LoginPage() {
  return (
    <div className="dark flex min-h-screen items-center justify-center bg-black px-6">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
