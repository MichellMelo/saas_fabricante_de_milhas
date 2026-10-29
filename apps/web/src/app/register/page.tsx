import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1220] px-5 py-12">
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a6792d]">Fabricante de Milhas</p>
        <h1 className="mt-4 text-3xl font-semibold text-[#111b2b]">Acesso por convite</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Por segurança, novas contas são criadas pela administração. Use o link de convite recebido para ativar sua conta ou solicite um convite ao responsável pelo seu acesso.</p>
        <Link href="/login" className="mt-7 inline-flex rounded-xl bg-[#101a2b] px-5 py-3 text-sm font-semibold text-white">Ir para login</Link>
      </section>
    </main>
  );
}
