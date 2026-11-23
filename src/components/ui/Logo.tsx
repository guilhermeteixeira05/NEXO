import Link from "next/link";

/** Símbolo do NEXO: um "N" formado por dois nós conectados (gradiente azul → ciano). */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="nexo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1F57E7" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#nexo-grad)" />
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
