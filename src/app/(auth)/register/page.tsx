import { Suspense } from "react";
import RegisterForm from "@/components/register-form";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="card p-6 text-sm text-ink/50">Loading…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
