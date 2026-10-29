import { Suspense } from "react";
import { AcceptAdminInvitationForm } from "@/components/accept-admin-invitation-form";

export default function AcceptAdminInvitePage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#0b1220] text-white">Carregando convite administrativo...</main>}>
      <AcceptAdminInvitationForm />
    </Suspense>
  );
}
