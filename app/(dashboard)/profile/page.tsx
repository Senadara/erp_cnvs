import { loadSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const user = await loadSessionUser();
  if (!user) redirect("/login?clear=1");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profil Pengguna</h1>
        <p className="text-muted-foreground text-sm">
          Perbarui alamat email dan kata sandi untuk akun Anda.
        </p>
      </div>
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <ProfileForm currentEmail={user.email} />
      </div>
    </div>
  );
}
