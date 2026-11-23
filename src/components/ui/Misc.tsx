import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PRIORITY_LABELS, type Priority } from "@/lib/types";

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`badge badge--${priority}`}>
      <span className="badge__dot" aria-hidden="true" />
      <span>
        <span className="sr-only">Prioridade </span>
        {PRIORITY_LABELS[priority]}
      </span>
    </span>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="progress" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="progress__bar" style={{ width: `${v}%` }} />
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
      {hint ? <span className="stat__hint">{hint}</span> : null}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="empty">
      <p className="empty__title">{title}</p>
      {children ? <div className="small">{children}</div> : null}
      {action ? (
        <Link href={action.href} className="btn btn--secondary btn--sm">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function SectionTitle({ title, id, action }: { title: string; id?: string; action?: ReactNode }) {
  return (
    <div className="section-title">
      <h2 id={id}>{title}</h2>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        <h1>{title}</h1>
        {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="actions">{actions}</div> : null}
    </header>
  );
}

export function Notice({
  tone = "info",
  icon,
  children,
}: {
  tone?: "info" | "warning" | "error" | "success";
  icon?: IconName;
  children: ReactNode;
}) {
  const defaultIcon: Record<string, IconName> = { info: "info", warning: "alerta", error: "alerta", success: "confirmar" };
  return (
    <div className={`alert alert--${tone}`}>
      <Icon name={icon ?? defaultIcon[tone]} size={18} />
      <div className="stack" style={{ gap: 4 }}>
        {children}
      </div>
    </div>
  );
}
