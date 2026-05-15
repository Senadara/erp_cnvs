"use server";

import bcrypt from "bcryptjs";
import { createSessionToken, setSessionCookie, clearSessionCookie } from "@/lib/session";
import type { LoginState } from "@/lib/types/login-state";

export async function loginAction(_prev: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { ok: false, error: "Isi email dan kata sandi." };
  }
  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where: { email },
    include: { outlets: { select: { outletId: true } } },
  });
  if (!user?.isActive) {
    return { ok: false, error: "Email atau kata sandi salah." };
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return { ok: false, error: "Email atau kata sandi salah." };
  }
  if (user.outlets.length === 0 && user.role !== "OWNER") {
    return { ok: false, error: "Akun belum ditugaskan ke outlet. Hubungi owner." };
  }
  try {
    const token = await createSessionToken(user.id);
    await setSessionCookie(token);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Konfigurasi autentikasi gagal.",
    };
  }
  return { ok: true };
}

export async function logoutAction() {
  await clearSessionCookie();
}
