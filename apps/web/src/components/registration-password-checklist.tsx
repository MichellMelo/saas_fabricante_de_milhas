import { Check, X } from "lucide-react";

const requirements = [
  { label: "Mínimo de 6 caracteres.", meets: (password: string) => Array.from(password).length >= 6 },
  { label: "Pelo menos 1 letra maiúscula.", meets: (password: string) => /\p{Lu}/u.test(password) },
  { label: "Pelo menos 1 número.", meets: (password: string) => /\p{Nd}/u.test(password) },
  { label: "Pelo menos 1 caractere especial.", meets: (password: string) => /[\p{P}\p{S}]/u.test(password) },
];

export function getPasswordChecks(password: string) {
  return requirements.map(({ label, meets }) => ({ label, met: meets(password) }));
}

export function getRegistrationPasswordStatus(password: string, confirmation: string) {
  const checks = getPasswordChecks(password);
  const exceedsLimit = new TextEncoder().encode(password).length > 72;
  const matches = password === confirmation;

  return {
    checks,
    exceedsLimit,
    matches,
    canRegister: checks.every(({ met }) => met) && !exceedsLimit && matches,
  };
}

export function RegistrationPasswordChecklist({ checks }: { checks: ReturnType<typeof getPasswordChecks> }) {
  const allMet = checks.every(({ met }) => met);

  return (
    <div id="registration-password-requirements" className="mt-2 space-y-2 text-xs">
      <ul aria-label="Requisitos da senha" className="space-y-1">
        {checks.map(({ label, met }) => {
          const Icon = met ? Check : X;
          return (
            <li key={label} className={`flex items-center gap-2 ${met ? "text-emerald-700" : "text-red-700"}`}>
              <Icon size={14} aria-hidden="true" />
              <span className="sr-only">{met ? "Atendido: " : "Pendente: "}</span>
              {label}
            </li>
          );
        })}
      </ul>
      <p role="status" className="font-medium text-emerald-700">
        {allMet ? "Senha atende a todos os requisitos" : null}
      </p>
    </div>
  );
}
