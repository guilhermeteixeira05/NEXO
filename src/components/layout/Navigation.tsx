"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { signOutAction } from "@/lib/auth/actions";
import { ACCOUNT_NAV, PRIMARY_NAV, SECONDARY_NAV, TITLES } from "@/components/layout/nav-items";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/** Menu lateral: recolhido (769–1024 px) ou completo (≥ 1025 px). */
export function Sidebar() {
  const pathname = usePathname();
  const link = (i: (typeof PRIMARY_NAV)[number]) => (
    <Link
      key={i.href}
      href={i.href}
      className="nav-item"
      aria-current={isActive(pathname, i.href) ? "page" : undefined}
      aria-label={i.label}
      title={i.label}
    >
      <Icon name={i.icon} />
      <span className="nav-item__label">{i.label}</span>
    </Link>
  );
  return (
    <nav className="sidebar" aria-label="Navegação principal">
      <div className="sidebar__brand">
        <Logo href="/painel" compact />
      </div>
      <div className="sidebar__nav">{[...PRIMARY_NAV, ...SECONDARY_NAV].map(link)}</div>
      <div className="sidebar__footer">
        {ACCOUNT_NAV.map(link)}
        <form action={signOutAction}>
          <button type="submit" className="nav-item" aria-label="Sair da conta" title="Sair">
            <Icon name="sair" />
            <span className="nav-item__label">Sair</span>
          </button>
        </form>
      </div>
    </nav>
  );
}

/** Barra inferior (celular até 768 px) com gaveta "Mais". */
export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const moreActive = [...SECONDARY_NAV, ...ACCOUNT_NAV].some((i) => isActive(pathname, i.href));
  return (
    <>
      <nav className="bottom-nav" aria-label="Navegação principal">
        {PRIMARY_NAV.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`bottom-nav__item${i.href === "/assistente" ? " bottom-nav__item--assistant" : ""}`}
            aria-current={isActive(pathname, i.href) ? "page" : undefined}
          >
            <span className="bottom-nav__icon">
              <Icon name={i.icon} />
            </span>
            {i.label}
          </Link>
        ))}
        <button
          type="button"
          className="bottom-nav__item"
          aria-current={moreActive ? "page" : undefined}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span className="bottom-nav__icon">
            <Icon name="mais" />
          </span>
          Mais
        </button>
      </nav>
      <Dialog open={open} onClose={() => setOpen(false)} title="Mais opções" variant="sheet">
        <nav aria-label="Mais destinos" className="stack" style={{ gap: 4 }}>
          {[...SECONDARY_NAV, ...ACCOUNT_NAV].map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className="menu__item"
              aria-current={isActive(pathname, i.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <Icon name={i.icon} />
              {i.label}
            </Link>
          ))}
          <div className="menu__sep" />
          <form action={signOutAction}>
            <button type="submit" className="menu__item menu__item--danger" style={{ width: "100%" }}>
              <Icon name="sair" />
              Sair da conta
            </button>
          </form>
        </nav>
      </Dialog>
    </>
  );
}

export function useCurrentTitle(): string {
  const pathname = usePathname();
  const key = Object.keys(TITLES).find((k) => isActive(pathname, k));
  return key ? TITLES[key] : "NEXO";
}

export function TopbarTitle() {
  const title = useCurrentTitle();
  return <p className="topbar__title" aria-hidden="true">{title}</p>;
}
