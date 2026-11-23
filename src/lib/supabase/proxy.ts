import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/env";

/** Rotas da área autenticada. As demais (apresentação, entrar, cadastro, 404...) são públicas. */
const PROTECTED_PREFIXES = [
  "/painel",
  "/tarefas",
  "/assistente",
  "/calendario",
  "/planejamento",
  "/objetivos",
  "/lembretes",
  "/insights",
  "/perfil",
  "/configuracoes",
  "/configuracao-inicial",
];

function isPublic(pathname: string): boolean {
  return !PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Renova a sessão do Supabase a cada requisição e faz a checagem otimista de acesso:
 * rotas autenticadas sem sessão vão para /entrar. A verificação definitiva acontece
 * novamente no servidor (requireUser) e no banco (RLS).
 */
export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();
  const { pathname } = request.nextUrl;

  if (!env) {
    // Sem Supabase configurado, apenas páginas públicas e a página de configuração funcionam.
    if (isPublic(pathname) || pathname.startsWith("/api/")) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/configurar";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Não inserir código entre a criação do cliente e getClaims (recomendação do Supabase).
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  if (!signedIn && !isPublic(pathname) && !pathname.startsWith("/api/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("proxima", pathname);
    return NextResponse.redirect(url);
  }

  if (signedIn && (pathname === "/entrar" || pathname === "/cadastro")) {
    const url = request.nextUrl.clone();
    url.pathname = "/painel";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
