import { redirect } from "next/navigation";
import { BottomNav, Sidebar, TopbarTitle } from "@/components/layout/Navigation";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { QuickAdd } from "@/components/layout/QuickAdd";
import { Logo } from "@/components/ui/Logo";
import { ToastProvider } from "@/components/ui/Toast";
import { getProfile, requireUser } from "@/lib/auth/session";
import { listGoals } from "@/lib/profile/queries";
import { countUnread } from "@/lib/reminders/service";

/**
 * Estrutura das telas autenticadas: menu lateral (≥ 769 px), barra superior,
 * conteúdo principal e barra inferior (≤ 768 px). Verifica a sessão no servidor.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const profile = await getProfile();
  // A configuração inicial fica no grupo (onboarding), com layout próprio.
  if (!profile.onboarding_completed) redirect("/configuracao-inicial");
  const [goals, unread] = await Promise.all([listGoals(supabase, user.id, { status: "ativo" }), countUnread(supabase, user.id)]);
  const goalOptions = goals.map((g) => ({ id: g.id, title: g.title }));

  return (
    <ToastProvider>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <div className="app-shell">
        <Sidebar />
        <div className="main">
          <header className="topbar">
            <span className="topbar__brand">
              <Logo href="/painel" compact size={32} />
            </span>
            <TopbarTitle />
            <div className="topbar__actions">
              <QuickAdd goals={goalOptions} tz={profile.timezone} variant="topbar" />
              <NotificationBell initialUnread={unread} />
            </div>
          </header>
          <main id="conteudo" tabIndex={-1} className="page">
            {children}
          </main>
        </div>
      </div>
      <QuickAdd goals={goalOptions} tz={profile.timezone} variant="fab" />
      <BottomNav />
    </ToastProvider>
  );
}
