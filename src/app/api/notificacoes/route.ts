import { NextResponse } from "next/server";
import { getUserOrNull } from "@/lib/auth/session";
import { countUnread, syncNotifications } from "@/lib/reminders/service";
import { DEFAULT_TZ } from "@/lib/dates";

/**
 * POST /api/notificacoes — processa lembretes vencidos e pendências do usuário logado
 * e devolve as novas notificações (para a notificação do navegador) e o total não lido.
 */
export async function POST() {
  const { supabase, user } = await getUserOrNull();
  if (!supabase || !user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).maybeSingle();
  const tz = (profile?.timezone as string) || DEFAULT_TZ;
  try {
    const created = await syncNotifications(supabase, user.id, new Date(), tz);
    const unread = await countUnread(supabase, user.id);
    return NextResponse.json({
      unread,
      created: created.map((n) => ({ id: n.id, title: n.title, body: n.body, link: n.link })),
    });
  } catch (err) {
    console.error("[notificações] falha na sincronização", err);
    return NextResponse.json({ error: "Falha ao sincronizar notificações." }, { status: 500 });
  }
}
