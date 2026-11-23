import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { cookies } from "next/headers";
import { THEME_COOKIE } from "@/lib/constants";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/layout.css";
import "@/styles/components.css";
import "@/styles/pages.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", weight: ["500", "700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "NEXO — Assistente Pessoal Inteligente", template: "%s · NEXO" },
  description:
    "O NEXO organiza tarefas, compromissos e objetivos em um plano diário viável, conversa sobre a sua rotina e avisa antes que algo saia do controle.",
  applicationName: "NEXO",
};

// Meta viewport obrigatória (apostila, seção 5.4): width=device-width, initial-scale=1
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7fd" },
    { media: "(prefers-color-scheme: dark)", color: "#050b1a" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = (await cookies()).get(THEME_COOKIE)?.value;
  const dataTheme = theme === "claro" || theme === "escuro" ? theme : undefined;
  return (
    <html lang="pt-BR" data-theme={dataTheme} className={`${inter.variable} ${grotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
