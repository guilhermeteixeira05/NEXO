"use client";

import { startTransition, useActionState, type FormEvent } from "react";

/**
 * Envia um formulário para uma Server Action SEM limpar os campos.
 *
 * No React 19, `<form action={...}>` reinicia os campos depois de cada envio — inclusive
 * quando o servidor devolve erros de validação, o que faria o usuário perder o que digitou
 * (heurísticas H5 e H9). Aqui o envio é feito pelo onSubmit, preservando os valores.
 */
export function useActionForm<S>(action: (state: Awaited<S>, payload: FormData) => S | Promise<S>, initialState: Awaited<S>) {
  const [state, dispatch, pending] = useActionState(action, initialState);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter ?? undefined;
    const data = new FormData(event.currentTarget, submitter);
    startTransition(() => dispatch(data));
  };
  return { state, pending, onSubmit };
}
