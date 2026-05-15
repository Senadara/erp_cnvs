"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createOutlet, updateOutlet, deleteOutlet, type OutletDetail } from "@/lib/actions/outlet-manage";
import { Store, Pencil, Trash2 } from "lucide-react";

export function OutletsManager({ initialOutlets }: { initialOutlets: OutletDetail[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<OutletDetail | null>(null);
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [copyFrom, setCopyFrom] = React.useState<string>("none");
  const [busy, setBusy] = React.useState(false);

  const openNew = () => {
    setEditing(null);
    setName("");
    setAddress("");
    setPhone("");
    setCopyFrom("none");
    setOpen(true);
  };

  const openEdit = (o: OutletDetail) => {
    setEditing(o);
    setName(o.name);
    setAddress(o.address ?? "");
    setPhone(o.phone ?? "");
    setOpen(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      if (editing) {
        await updateOutlet({ id: editing.id, name, address: address || null, phone: phone || null });
        toast.success("Outlet diperbarui");
      } else {
        await createOutlet({
          name,
          address: address || null,
          phone: phone || null,
          copyMenuFromOutletId: copyFrom === "none" ? null : copyFrom,
        });
        toast.success("Outlet dibuat");
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string, outletName: string) => {
    if (!confirm("Hapus outlet " + outletName + "? Hanya bisa jika belum ada transaksi.")) return;
    setBusy(true);
    try {
      await deleteOutlet(id);
      toast.success("Outlet dihapus");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" className="min-h-11 gap-2" onClick={openNew}>
          <Store className="size-4" />
          Tambah outlet
        </Button>
      </div>

      <div className="bg-card overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead className="text-right">Menu</TableHead>
              <TableHead className="text-right">Stok</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialOutlets.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {[o.phone, o.address].filter(Boolean).join(" · ") || "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">{o.productCount}</TableCell>
                <TableCell className="text-right tabular-nums">{o.stockCount}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button type="button" variant="ghost" size="icon" className="size-10" onClick={() => openEdit(o)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive size-10"
                      disabled={busy}
                      onClick={() => void onDelete(o.id, o.name)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit outlet" : "Outlet baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nama outlet</Label>
              <Input className="h-11" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Alamat</Label>
              <Input className="h-11" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Telepon</Label>
              <Input className="h-11" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            {!editing && initialOutlets.length > 0 && (
              <div className="grid gap-2">
                <Label>Salin menu dari outlet</Label>
                <Select value={copyFrom} onValueChange={(v) => v && setCopyFrom(v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Tidak menyalin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak menyalin</SelectItem>
                    {initialOutlets.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Konversi stok dicocokkan berdasarkan nama bahan di outlet tujuan.
                </p>
              </div>
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
