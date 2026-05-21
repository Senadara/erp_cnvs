"use server";

import bcrypt from "bcryptjs";
import { createSessionToken, setSessionCookie, clearSessionCookie, loadSessionUser } from "@/lib/session";
import type { LoginState } from "@/lib/types/login-state";

export async function loginAction(_prev: LoginState | undefined, formData: FormData): Promise<LoginState> {
  try {
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");
    if (!email || !password) {
      return { ok: false, error: "Isi email dan kata sandi." };
    }
    const { prisma } = await import("@/lib/prisma");
    
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        include: { outlets: { select: { outletId: true } } },
      });
    } catch (dbErr) {
      // Retry once to handle cPanel MySQL stale connection on cold starts
      console.warn("[loginAction] First query failed, retrying...", dbErr);
      user = await prisma.user.findUnique({
        where: { email },
        include: { outlets: { select: { outletId: true } } },
      });
    }
    
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
    const token = await createSessionToken(user.id);
    await setSessionCookie(token);
    
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
      },
    });
    
    return { ok: true };
  } catch (e) {
    console.error("[loginAction]", e);
    const msg = e instanceof Error ? e.message : "Login gagal.";
    if (msg.includes("AUTH_SECRET")) {
      return { ok: false, error: "AUTH_SECRET belum diset di server (.env)." };
    }
    if (msg.includes("connect") || msg.includes("database") || msg.includes("Prisma")) {
      return { ok: false, error: "Database tidak terhubung. Cek DATABASE_URL di server." };
    }
    return { ok: false, error: `Login gagal: ${msg}` };
  }
}

export async function logoutAction() {
  const session = await loadSessionUser();
  if (session) {
    const { prisma } = await import("@/lib/prisma");
    try {
      await prisma.userActivityLog.create({
        data: {
          userId: session.id,
          action: "LOGOUT",
        },
      });
    } catch (e) {
      console.error("[logoutAction] log error", e);
    }
  }
  await clearSessionCookie();
}
