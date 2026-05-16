"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loadSessionUser } from "@/lib/session";

export type ProfileState = {
  ok: boolean;
  error?: string;
  successMessage?: string;
};

export async function updateProfileAction(_prev: ProfileState | undefined, formData: FormData): Promise<ProfileState> {
  const session = await loadSessionUser();
  if (!session) {
    return { ok: false, error: "Sesi tidak valid. Silakan login kembali." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email) {
    return { ok: false, error: "Email wajib diisi." };
  }

  if (newPassword && newPassword !== confirmPassword) {
    return { ok: false, error: "Konfirmasi password baru tidak cocok." };
  }

  if (!currentPassword) {
    return { ok: false, error: "Masukkan password saat ini untuk memverifikasi perubahan." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) {
      return { ok: false, error: "Pengguna tidak ditemukan." };
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return { ok: false, error: "Password saat ini salah." };
    }

    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return { ok: false, error: "Email sudah digunakan oleh akun lain." };
      }
    }

    const dataToUpdate: any = { email };

    if (newPassword) {
      dataToUpdate.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await prisma.user.update({
      where: { id: session.id },
      data: dataToUpdate,
    });

    await prisma.userActivityLog.create({
      data: {
        userId: session.id,
        action: "UPDATE_PROFILE",
        description: newPassword ? "Mengubah email dan password profil" : "Mengubah email profil",
      },
    });

    return { ok: true, successMessage: "Profil berhasil diperbarui." };
  } catch (error) {
    console.error("[updateProfileAction]", error);
    return { ok: false, error: "Terjadi kesalahan saat memperbarui profil." };
  }
}
