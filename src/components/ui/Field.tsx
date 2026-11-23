import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Campos com rótulo visível, dica e erro associados por aria-describedby
 * (WCAG 1.3.1, 3.3.1, 3.3.2 — heurística H9).
 */
interface BaseProps {
  label: string;
  name: string;
  hint?: string;
  errors?: string[];
  optional?: boolean;
}

function useFieldIds(name: string) {
  const uid = useId();
  const id = `${name}-${uid}`;
  return { id, hintId: `${id}-dica`, errorId: `${id}-erro` };
}

function Describe({ hint, hintId, errors, errorId }: { hint?: string; hintId: string; errors?: string[]; errorId: string }) {
  return (
    <>
      {hint ? (
        <span id={hintId} className="field__hint">
          {hint}
        </span>
      ) : null}
      {errors?.length ? (
        <span id={errorId} className="field__error">
          <Icon name="alerta" size={16} />
          {errors[0]}
        </span>
      ) : null}
    </>
  );
}

function describedBy(hint: string | undefined, errors: string[] | undefined, hintId: string, errorId: string) {
  return [hint ? hintId : null, errors?.length ? errorId : null].filter(Boolean).join(" ") || undefined;
}

function Label({ htmlFor, label, optional }: { htmlFor: string; label: string; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="field__label">
      {label} {optional ? <span className="field__optional">(opcional)</span> : null}
    </label>
  );
}

export function TextField({ label, name, hint, errors, optional, ...rest }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  const { id, hintId, errorId } = useFieldIds(name);
  return (
    <div className="field">
      <Label htmlFor={id} label={label} optional={optional} />
      <input
        id={id}
        name={name}
        className="input"
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(hint, errors, hintId, errorId)}
        {...rest}
      />
      <Describe hint={hint} hintId={hintId} errors={errors} errorId={errorId} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  hint,
  errors,
  optional,
  options,
  ...rest
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  const { id, hintId, errorId } = useFieldIds(name);
  return (
    <div className="field">
      <Label htmlFor={id} label={label} optional={optional} />
      <select
        id={id}
        name={name}
        className="select"
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(hint, errors, hintId, errorId)}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Describe hint={hint} hintId={hintId} errors={errors} errorId={errorId} />
    </div>
  );
}

export function TextAreaField({ label, name, hint, errors, optional, ...rest }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { id, hintId, errorId } = useFieldIds(name);
  return (
    <div className="field">
      <Label htmlFor={id} label={label} optional={optional} />
      <textarea
        id={id}
        name={name}
        className="textarea"
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(hint, errors, hintId, errorId)}
        {...rest}
      />
      <Describe hint={hint} hintId={hintId} errors={errors} errorId={errorId} />
    </div>
  );
}

export function SwitchField({
  label,
  name,
  description,
  defaultChecked,
  ...rest
}: { label: string; name: string; description?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const { id, hintId } = useFieldIds(name);
  return (
    <label className="switch" htmlFor={id}>
      <span className="switch__text">
        <span className="field__label">{label}</span>
        {description ? (
          <span id={hintId} className="field__hint">
            {description}
          </span>
        ) : null}
      </span>
      <input
        id={id}
        name={name}
        type="checkbox"
        role="switch"
        defaultChecked={defaultChecked}
        aria-describedby={description ? hintId : undefined}
        {...rest}
      />
    </label>
  );
}

export function FormAlert({ message, ok }: { message?: string; ok?: boolean }) {
  return (
    <div role={ok ? "status" : "alert"} aria-live={ok ? "polite" : "assertive"}>
      {message ? (
        <p className={`alert ${ok ? "alert--success" : "alert--error"}`}>
          <Icon name={ok ? "confirmar" : "alerta"} size={18} />
          <span>{message}</span>
        </p>
      ) : null}
    </div>
  );
}
