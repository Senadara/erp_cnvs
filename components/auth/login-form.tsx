"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/actions/auth";
import type { LoginState } from "@/lib/types/login-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

const initial: LoginState = { ok: false };

export function LoginForm({ authReady }: { authReady: boolean }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(loginAction, initial);

  useEffect(() => {
    if (state.ok) {
      router.push("/");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-sm space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Masuk</h1>
        <p className="text-muted-foreground text-sm">
          Email digunakan untuk login; outlet diatur oleh owner per akun.
        </p>
      </div>

      {!authReady && (
        <p className="bg-destructive/10 text-destructive max-w-md rounded-lg border px-3 py-2 text-sm">
          Tambahkan <code className="rounded bg-muted px-1">AUTH_SECRET</code> (≥16 karakter) di file{" "}
          <code className="rounded bg-muted px-1">.env</code> lalu restart server.
        </p>
      )}

      <form action={formAction} className="bg-card w-full max-w-sm space-y-4 rounded-xl border p-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-12"
            disabled={!authReady || pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Kata sandi</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            className="h-12"
            disabled={!authReady || pending}
          />
        </div>
        {state.error && (
          <p className="text-destructive text-sm" role="alert">
            {state.error}
          </p>
        )}
        <Button type="submit" className="h-12 w-full" disabled={!authReady || pending}>
          {pending ? "Memproses…" : "Login"}
        </Button>
      </form>
    </div>
  );
}
