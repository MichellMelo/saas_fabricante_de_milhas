import { Suspense } from "react";
import { PasswordResetForm } from "@/components/password-reset-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#0b1220] text-white">Carregando...</main>}>
      <PasswordResetForm />
    </Suspense>
  );
}
