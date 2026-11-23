import Link from "next/link";
import { useId } from "react";

/**
 * Símbolo do NEXO: um "N" formado por dois nós conectados (gradiente azul → ciano).
 * Cada instância tem o próprio id de gradiente: com um id repetido, o navegador usa o
 * primeiro da página, e se ele estiver escondido (menu lateral no celular) o fundo some.
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  const gradId = `nexo-grad-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1F57E7" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${gradId})`} />
      <path d="M12.5 27.5V12.5L27.5 27.5V12.5" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="27.5" cy="12.5" r="3" fill="#fff" />
      <circle cx="12.5" cy="27.5" r="3" fill="#fff" />
    </svg>
  );
}

export function Logo({ href = "/", compact = false, size = 36 }: { href?: string; compact?: boolean; size?: number }) {
  return (
    <Link href={href} className={`logo${compact ? " logo--compact" : ""}`} aria-label="NEXO — página inicial">
      <LogoMark size={size} />
      <span className="logo__word" aria-hidden="true">
        NEXO
      </span>
    </Link>
  );
}
