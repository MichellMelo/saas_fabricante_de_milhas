import { Suspense } from "react";
import { AcceptInvitationForm } from "@/components/accept-invitation-form";

export default function AcceptInvitePage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#0b1220] text-white">Carregando convite...</main>}><AcceptInvitationForm /></Suspense>;
}
