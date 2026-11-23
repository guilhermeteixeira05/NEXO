import type { IconName } from "@/components/ui/Icon";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

/** Ordem única de navegação para todas as faixas de tela (heurística H4). */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/painel", label: "Painel", icon: "painel" },
  { href: "/tarefas", label: "Tarefas", icon: "tarefas" },
  { href: "/assistente", label: "Assistente", icon: "assistente" },
  { href: "/calendario", label: "Calendário", icon: "calendario" },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/planejamento", label: "Planejamento", icon: "planejamento" },
  { href: "/objetivos", label: "Objetivos", icon: "objetivos" },
  { href: "/lembretes", label: "Lembretes", icon: "lembretes" },
  { href: "/insights", label: "Insights e histórico", icon: "insights" },
];

export const ACCOUNT_NAV: NavItem[] = [
  { href: "/perfil", label: "Perfil", icon: "perfil" },
  { href: "/configuracoes", label: "Configurações", icon: "configuracoes" },
];

export const TITLES: Record<string, string> = Object.fromEntries(
  [...PRIMARY_NAV, ...SECONDARY_NAV, ...ACCOUNT_NAV].map((i) => [i.href, i.label]),
);
