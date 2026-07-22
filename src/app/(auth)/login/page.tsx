import { Suspense } from "react";
import LoginForm from "@/components/login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card p-6 text-sm text-ink/50">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
