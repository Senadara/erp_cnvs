"use client";

import * as React from "react";
import { toast } from "sonner";
import type { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createUser, updateUser, setUserPassword, type UserRow } from "@/lib/actions/user";
import { roleLabel, type NavFeature } from "@/lib/permissions";

const STAFF_DEF: Partial<Record<NavFeature, boolean>> = {
  dashboard: true,
  cashier: true,
  products: true,
  stock: true,
  expenses: true,
  waste: true,
  reports: true,
  receipts: true,
  owner: false,
};

const STAFF_TOGGLE: { key: NavFeature; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "cashier", label: "Kasir" },
  { key: "products", label: "Produk" },
  { key: "stock", label: "Stok" },
  { key: "expenses", label: "Pengeluaran" },
  { key: "waste", label: "Waste" },
  { key: "reports", label: "Laporan" },
  { key: "receipts", label: "Struk" },
  { key: "owner", label: "Ringkasan owner" },
];

export function UsersManager({
  initialUsers,
  outlets,
  productOptions,
  stockOptions,
}: {
  initialUsers: UserRow[];
  outlets: { id: string; name: string }[];
  productOptions: { id: string; name: string; outletId: string }[];
  stockOptions: { id: string; name: string; outletId: string }[];
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<UserRow | null>(null);
  const [email, setEmail] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("STAFF");
  const [isActive, setIsActive] = React.useState(true);
  const [selOutlets, setSelOutlets] = React.useState<string[]>([]);
  const [selProducts, setSelProducts] = React.useState<string[]>([]);
  const [selStocks, setSelStocks] = React.useState<string[]>([]);
  const [features, setFeatures] = React.useState<Partial<Record<NavFeature, boolean>>>({});
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const openNew = () => {
    setEditing(null);
    setEmail("");
    setDisplayName("");
    setPassword("");
    setRole("STAFF");
    setIsActive(true);
    setSelOutlets(outlets[0]?.id ? [outlets[0].id] : []);
    setSelProducts([]);
    setSelStocks([]);
    setFeatures({});
    setOpen(true);
  };

  const openEdit = (u: UserRow) => {
    setEditing(u);
    setEmail(u.email);
    setDisplayName(u.displayName);
    setPassword("");
    setRole(u.role);
    setIsActive(u.isActive);
    setSelOutlets([...u.outletIds]);
    setSelProducts([...u.mitraProductIds]);
    setSelStocks([...u.mitraStockIds]);
    setFeatures({ ...(u.featureOverrides ?? {}) });
    setOpen(true);
  };

  const toggleOutlet = (id: string) => {
    setSelOutlets((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleProduct = (id: string) => {
    setSelProducts((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleStock = (id: string) => {
    setSelStocks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const stocksFiltered = stockOptions.filter((s) => selOutlets.includes(s.outletId));

  const save = async () => {
    setBusy(true);
    try {
      let featureOverrides: Record<string, boolean> | null = null;
      if (role === "STAFF") {
        const o: Record<string, boolean> = {};
        for (const t of STAFF_TOGGLE) {
          const v = features[t.key] ?? STAFF_DEF[t.key] ?? false;
          const d = STAFF_DEF[t.key] ?? false;
          if (v !== d) o[t.key] = v;
        }
        featureOverrides = Object.keys(o).length ? o : null;
      }

      if (editing) {
        await updateUser({
          id: editing.id,
          displayName,
          role,
          isActive,
          outletIds: selOutlets,
          mitraProductIds: role === "MITRA" ? selProducts : [],
          mitraStockIds: role === "MITRA" ? selStocks : [],
          featureOverrides,
        });
        if (password.trim().length >= 6) {
          await setUserPassword(editing.id, password);
        }
        toast.success("Pengguna diperbarui");
      } else {
        if (!password.trim()) {
          toast.error("Kata sandi wajib untuk pengguna baru");
          return;
        }
        await createUser({
          email,
          displayName,
          password,
          role,
          outletIds: selOutlets,
          mitraProductIds: role === "MITRA" ? selProducts : [],
          mitraStockIds: role === "MITRA" ? selStocks : [],
          featureOverrides,
        });
        toast.success("Pengguna dibuat");
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" className="min-h-11" onClick={openNew}>
          Tambah pengguna
        </Button>
      </div>

      <div className="bg-card rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead>Outlet</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell>{u.displayName}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{roleLabel(u.role)}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate text-sm">
                  {u.role === "OWNER"
                    ? "Semua"
                    : u.outletIds
                        .map((id) => outlets.find((o) => o.id === id)?.name)
                        .filter(Boolean)
                        .join(", ") || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? "outline" : "destructive"}>
                    {u.isActive ? "Aktif" : "Off"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button type="button" variant="outline" size="sm" onClick={() => openEdit(u)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit pengguna" : "Pengguna baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {!editing && (
              <div className="space-y-2">
                <Label>Email (login)</Label>
                <Input className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Nama tampilan</Label>
              <Input
                className="h-11"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{editing ? "Kata sandi baru (opsional)" : "Kata sandi"}</Label>
              <Input
                type="password"
                className="h-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Peran</Label>
              {editing?.role === "OWNER" ? (
                <p className="text-muted-foreground rounded-md border px-3 py-2 text-sm">Owner</p>
              ) : (
                <select
                  className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value="STAFF">Petugas</option>
                  <option value="MITRA">Mitra</option>
                </select>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <Label>Aktif</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} disabled={editing?.role === "OWNER"} />
            </div>
            <div className="space-y-2">
              <Label>Outlet yang dapat diakses</Label>
              {role === "OWNER" && (
                <p className="text-muted-foreground text-xs">Owner otomatis mengakses semua outlet.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {outlets.map((o) => (
                  <label key={o.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selOutlets.includes(o.id)}
                      onChange={() => toggleOutlet(o.id)}
                    />
                    {o.name}
                  </label>
                ))}
              </div>
            </div>
            {role === "STAFF" && (
              <div className="space-y-2">
                <Label>Hak akses fitur (Petugas)</Label>
                <div className="grid gap-2 rounded-lg border p-3">
                  {STAFF_TOGGLE.map((t) => (
                    <div key={t.key} className="flex items-center justify-between gap-2">
                      <span className="text-sm">{t.label}</span>
                      <Switch
                        checked={features[t.key] ?? STAFF_DEF[t.key] ?? false}
                        onCheckedChange={(v) => setFeatures((f) => ({ ...f, [t.key]: v }))}
                      />
                    </div>
                  ))}
                  <p className="text-muted-foreground text-xs">
                    Matikan yang tidak perlu. Owner &amp; Pengguna selalu via owner.
                  </p>
                </div>
              </div>
            )}
            {role === "MITRA" && (
              <>
                <div className="space-y-2">
                  <Label>Produk (laporan penjualan)</Label>
                  <ScrollArea className="h-40 rounded-md border p-2">
                    <div className="space-y-2 pr-2">
                      {productOptions.map((p) => (
                        <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selProducts.includes(p.id)}
                            onChange={() => toggleProduct(p.id)}
                          />
                          {p.name}
                          <span className="text-muted-foreground text-xs">
                            ({outlets.find((o) => o.id === p.outletId)?.name ?? "?"})
                          </span>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                <div className="space-y-2">
                  <Label>Stok (hanya item di outlet terpilih di atas)</Label>
                  <ScrollArea className="h-40 rounded-md border p-2">
                    <div className="space-y-2 pr-2">
                      {stocksFiltered.map((s) => (
                        <label key={s.id} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selStocks.includes(s.id)}
                            onChange={() => toggleStock(s.id)}
                          />
                          {s.name}
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={busy}>
              Batal
            </Button>
            <Button type="button" onClick={() => void save()} disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
