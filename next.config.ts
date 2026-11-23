import type { NextConfig } from "next";

/**
 * Configuração do Next.js para o NEXO.
 *
 * `cacheComponents` fica desativado de propósito: todas as telas autenticadas
 * leem a sessão (cookies) a cada requisição, e o modelo clássico de renderização
 * dinâmica é mais simples de manter por uma equipe de cinco integrantes.
 * Ver docs/arquitetura-aplicacao.md (Decisões técnicas).
 */
const nextConfig: NextConfig = {
  cacheComponents: false,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
