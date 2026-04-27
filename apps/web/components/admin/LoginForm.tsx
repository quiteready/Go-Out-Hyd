"use client";

import { useActionState } from "react";
import { adminLogin } from "@/app/actions/admin/auth";

interface LoginFormProps {
  defaultFrom?: string;
}

export function LoginForm({ defaultFrom }: LoginFormProps) {
  const [state, action, pending] = useActionState(adminLogin, null);

  return (
    <form action={action} className="space-y-4">
      <input name="from" type="hidden" value={defaultFrom ?? ""} />

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          placeholder="Enter admin password"
          autoComplete="current-password"
        />
      </div>

      {state?.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
