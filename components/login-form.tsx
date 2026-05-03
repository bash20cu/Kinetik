"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { loginAction, type LoginFormState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INITIAL_STATE: LoginFormState = {
  error: null
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="rounded-full" disabled={pending}>
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, INITIAL_STATE);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-semibold">
          Email
        </label>
        <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-semibold">
          Contrasena
        </label>
        <Input id="password" name="password" type="password" required />
      </div>

      {state.error ? (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
