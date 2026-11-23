import type { Metadata } from "next";
import { PasswordForm, ProactiveSwitch, ThemeSwitcher } from "@/components/profile/ProfileForms";
import { BrowserNotificationToggle } from "@/components/reminders/ReminderViews";
import { Icon } from "@/components/ui/Icon";
import { Notice, PageHeader } from "@/components/ui/Misc";
import { getProfile } from "@/lib/auth/session";
import { signOutAction } from "@/lib/auth/actions";
import { AI_PROVIDER_LABELS, getAiProvider } from "@/lib/env";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const profile = await getProfile();
  const provider = getAiProvider();
  return (
    <>
      <PageHeader title="Configurações" subtitle="Aparência, notificações, segurança e privacidade." />
      <div className="grid-2">
        <div className="stack stack--lg">
          <section className="panel" aria-labelledby="titulo-aparencia">
            <h2 id="titulo-aparencia" style={{ fontSize: "var(--text-lg)" }}>
              Aparência
            </h2>
            <p className="small secondary">“Sistema” acompanha o modo claro/escuro do seu dispositivo (prefers-color-scheme).</p>
            <ThemeSwitcher current={profile.theme} />
          </section>
          <section className="panel" aria-labelledby="titulo-notificacoes-cfg">
            <h2 id="titulo-notificacoes-cfg" style={{ fontSize: "var(--text-lg)" }}>
              Notificações e assistente
            </h2>
            <BrowserNotificationToggle />
            <ProactiveSwitch enabled={profile.proactive_enabled} />
          </section>
          <section className="panel">
            <PasswordForm />
          </section>
        </div>
        <div className="stack stack--lg">
          <section className="panel" aria-labelledby="titulo-dados-ia">
            <h2 id="titulo-dados-ia" style={{ fontSize: "var(--text-lg)" }}>
              Como o NEXO usa seus dados
            </h2>
            <ul className="stack small secondary" style={{ gap: 6, paddingLeft: 18, margin: 0 }}>
              <li>Seus dados ficam no banco do NEXO e só você tem acesso (Row Level Security).</li>
              <li>
                Ao usar o Assistente, o briefing, o planejamento revisado ou o resumo semanal, o servidor envia à IA
                {provider ? ` (${AI_PROVIDER_LABELS[provider]})` : ""} somente: nome, ocupação, preferências, objetivos, disponibilidade,
                atividades recentes, indicadores e feriados.
              </li>
              <li>E-mail, senha e identificadores de login nunca são enviados à IA.</li>
              <li>A IA não altera nada sozinha: toda mudança é uma proposta que você aprova ou rejeita.</li>
              <li>Status da IA neste ambiente: {provider ? `configurada (${AI_PROVIDER_LABELS[provider]})` : "não configurada"}.</li>
            </ul>
            {provider === "gemini" ? (
              <Notice tone="warning">
                <strong>Aviso sobre a cota gratuita do Google Gemini</strong>
                <span>
                  Este ambiente usa a cota gratuita da Gemini API. Nessa modalidade, o Google pode usar os textos enviados e as respostas
                  para melhorar os produtos dele, inclusive com revisão humana. Evite escrever dados sensíveis (saúde, documentos,
                  finanças) nas atividades e no chat.
                </span>
              </Notice>
            ) : null}
          </section>
          <section className="panel" aria-labelledby="titulo-conta">
            <h2 id="titulo-conta" style={{ fontSize: "var(--text-lg)" }}>
              Conta
            </h2>
            <form action={signOutAction}>
              <button type="submit" className="btn btn--danger">
                <Icon name="sair" size={20} /> Sair da conta
              </button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
