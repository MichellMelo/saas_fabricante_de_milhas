import { ForbiddenException, SetMetadata } from "@nestjs/common";

export const pageGroups = [
  {
    label: "Espaço de trabalho",
    pages: [
      { key: "dashboard", label: "Visão geral" },
      { key: "programas", label: "Programas e saldos" },
      { key: "programas-admin", label: "Cadastro de programas pessoais" },
      { key: "mile-finance", label: "Financeiro de Milhas" },
      { key: "calculadoras", label: "Calculadoras" },
      { key: "passagens", label: "Passagens e resgates" },
      { key: "historico", label: "Histórico de oportunidades" },
    ],
  },
  {
    label: "Produtos",
    pages: [
      { key: "group-vip", label: "Grupo VIP", product: "GROUP_VIP" },
      { key: "auloes", label: "Aulões", product: "AULAO" },
      { key: "mentorias", label: "Mentorias", product: "MENTORSHIP" },
    ],
  },
  {
    label: "Administrativo",
    pages: [{ key: "administrativo", label: "Administrativo · meus recebimentos" }],
  },
] as const;

export type PageKey = (typeof pageGroups)[number]["pages"][number]["key"];
export const publicRegistrationPages = ["dashboard", "programas", "programas-admin", "calculadoras", "passagens"] as const satisfies readonly PageKey[];

export function isPageKey(value: string): value is PageKey {
  return pageGroups.some(({ pages }) => pages.some(({ key }) => key === value));
}

export const PAGE_ACCESS = Symbol("page-access");

export function LoadPagePermissions() {
  return SetMetadata(PAGE_ACCESS, true);
}

export function RequirePage(firstPage: PageKey, ...otherPages: PageKey[]) {
  return SetMetadata(PAGE_ACCESS, [firstPage, ...otherPages]);
}

export function assertPageAccess(
  user: { isAdmin: boolean; allowedPages: readonly string[] },
  pages: readonly PageKey[],
) {
  if (!user.isAdmin && !pages.some((page) => user.allowedPages.includes(page))) {
    throw new ForbiddenException("Sua conta não tem acesso a esta página.");
  }
}

export function isAdministrator(user: { isAdmin: boolean; email: string }) {
  return user.isAdmin || (process.env.ADMIN_EMAILS ?? "").split(",")
    .some((email) => email.trim().toLowerCase() === user.email.trim().toLowerCase());
}
