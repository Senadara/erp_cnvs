"use client";

import { useActionState, useEffect } from "react";
import { updateProfileAction, type ProfileState } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const initial: ProfileState = { ok: false };

export function ProfileForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initial);

  useEffect(() => {
    if (state.ok && state.successMessage) {
      toast.success(state.successMessage);
      // Reset is not fully automatic with action state if fields retain values, 
      // but usually the form reset can be handled by browser if we call form.reset()
      // Because we use Server Actions, we can manually clear the password fields
      const form = document.getElementById("profile-form") as HTMLFormElement;
      if (form) {
        (form.elements.namedItem("currentPassword") as HTMLInputElement).value = "";
        (form.elements.namedItem("newPassword") as HTMLInputElement).value = "";
        (form.elements.namedItem("confirmPassword") as HTMLInputElement).value = "";
      }
    } else if (!state.ok && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form id="profile-form" action={formAction} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Informasi Akun</h3>
        <div className="space-y-2">
          <Label htmlFor="email">Email Login</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={currentEmail}
            required
            className="max-w-md h-10"
            disabled={pending}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Ubah Kata Sandi</h3>
          <p className="text-sm text-muted-foreground">Kosongkan sandi baru jika tidak ingin mengubahnya.</p>
        </div>
        <div className="space-y-2 max-w-md">
          <Label htmlFor="currentPassword">Kata sandi saat ini</Label>
          <PasswordInput
            id="currentPassword"
            name="currentPassword"
            autoComplete="current-password"
            className="h-10"
            disabled={pending}
            required
          />
          <p className="text-xs text-muted-foreground">Dibutuhkan untuk memverifikasi perubahan apa pun.</p>
        </div>
        
        <div className="space-y-2 max-w-md">
          <Label htmlFor="newPassword">Kata sandi baru</Label>
          <PasswordInput
            id="newPassword"
            name="newPassword"
            autoComplete="new-password"
            className="h-10"
            disabled={pending}
          />
        </div>

        <div className="space-y-2 max-w-md">
          <Label htmlFor="confirmPassword">Konfirmasi sandi baru</Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            className="h-10"
            disabled={pending}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="min-w-32">
          {pending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}
