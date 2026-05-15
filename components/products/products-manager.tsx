"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { deleteProduct, setProductConversions, upsertProduct } from "@/lib/actions/product";
import { createDisplayGroup, deleteDisplayGroup } from "@/lib/actions/display-group";
import { uploadProductImage } from "@/lib/actions/upload";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatCurrencyIdr } from "@/lib/money";

type Conv = { id: string; stockItemId: string; ratio: string; stockName: string };
type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  hpp: string;
  imageUrl: string | null;
  isActive: boolean;
  displayGroupId: string | null;
  displayGroupName: string | null;
  conversions: Conv[];
};

export function ProductsManager({
  outletId,
  outletName,
  products,
  stockItems,
  productGroups,
}: {
  outletId: string;
  outletName: string;
  products: Product[];
  stockItems: { id: string; name: string }[];
  productGroups: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [hpp, setHpp] = React.useState("");
  const [convRows, setConvRows] = React.useState<{ stockItemId: string; ratio: string }[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState("");
  const [displayGroupId, setDisplayGroupId] = React.useState<string | null>(null);
  const [groupsOpen, setGroupsOpen] = React.useState(false);
  const [newGroupName, setNewGroupName] = React.useState("");
  const [groupFilter, setGroupFilter] = React.useState<string>("all");

  const filteredProducts = React.useMemo(() => {
    const active = products.filter((p) => p.isActive);
    if (groupFilter === "all") return active;
    if (groupFilter === "none") return active.filter((p) => !p.displayGroupId);
    return active.filter((p) => p.displayGroupId === groupFilter);
  }, [products, groupFilter]);

  const openNew = () => {
    setEditing(null);
    setName("");
    setCategory("");
    setPrice("");
    setHpp("0");
    setConvRows([{ stockItemId: stockItems[0]?.id ?? "", ratio: "1" }]);
    setImageUrl("");
    setDisplayGroupId(null);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setName(p.name);
    setCategory(p.category);
    setPrice(p.price);
    setHpp(p.hpp);
    setDisplayGroupId(p.displayGroupId);
    setConvRows(
      p.conversions.length
        ? p.conversions.map((c) => ({ stockItemId: c.stockItemId, ratio: c.ratio }))
        : [{ stockItemId: stockItems[0]?.id ?? "", ratio: "1" }]
    );
    setImageUrl(p.imageUrl ?? "");
    setOpen(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      const prod = await upsertProduct({
        id: editing?.id,
        outletId,
        name,
        category,
        price,
        hpp,
        imageUrl: imageUrl.trim() || null,
        displayGroupId,
      });
      const pid = prod.id;
      await setProductConversions(
        pid,
        outletId,
        convRows.filter((r) => r.stockItemId && r.ratio)
      );
      toast.success("Produk disimpan");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Nonaktifkan produk ini?")) return;
    setBusy(true);
    try {
      await deleteProduct(id, outletId);
      toast.success("Produk dinonaktifkan");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-muted-foreground text-xs sm:text-sm">Filter grup</Label>
          <Select value={groupFilter} onValueChange={(v) => v && setGroupFilter(v)}>
            <SelectTrigger className="h-11 w-[min(100%,220px)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="none">Tanpa grup</SelectItem>
              {productGroups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" className="min-h-12" onClick={() => setGroupsOpen(true)}>
            Kelola grup
          </Button>
          <Button className="min-h-12" onClick={openNew}>
            Tambah produk
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border">
        <ScrollArea className="max-h-[min(70dvh,720px)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>Grup</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="hidden text-right sm:table-cell">HPP</TableHead>
                <TableHead>Konversi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="w-12">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="size-10 rounded-md border object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground text-[10px]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[120px] truncate text-sm">
                      {p.displayGroupName ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrencyIdr(p.price)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {formatCurrencyIdr(p.hpp)}
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {p.conversions.map((c) => (
                          <Badge key={c.id} variant="secondary" className="text-[10px]">
                            {c.stockName}:{c.ratio}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => onDelete(p.id)}
                        disabled={busy}
                      >
                        Matikan
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit produk" : "Produk baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label>Gambar produk</Label>
              <div className="flex flex-wrap items-start gap-3">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt=""
                    width={96}
                    height={96}
                    className="size-24 rounded-lg border object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground flex size-24 items-center justify-center rounded-lg border border-dashed text-xs">
                    Belum ada
                  </div>
                )}
                <div className="grid max-w-sm gap-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="h-11"
                    disabled={busy}
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setBusy(true);
                      try {
                        const fd = new FormData();
                        fd.append("file", f);
                        fd.append("outletId", outletId);
                        const url = await uploadProductImage(fd);
                        setImageUrl(url);
                        toast.success("Gambar diunggah");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Upload gagal");
                      } finally {
                        setBusy(false);
                        e.target.value = "";
                      }
                    }}
                  />
                  <Input
                    className="h-11"
                    placeholder="Atau URL gambar (https://...)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Nama</Label>
              <Input className="h-11" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Kategori</Label>
              <Input
                className="h-11"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Grup tampilan</Label>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={displayGroupId ?? "__none"}
                  onValueChange={(v) => setDisplayGroupId(v === "__none" ? null : v)}
                >
                  <SelectTrigger className="h-11 min-w-[160px] flex-1">
                    <SelectValue placeholder="Grup" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Tanpa grup</SelectItem>
                    {productGroups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Harga</Label>
                <Input
                  className="h-11"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>HPP / porsi</Label>
                <Input
                  className="h-11"
                  inputMode="decimal"
                  value={hpp}
                  onChange={(e) => setHpp(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Konversi ke stok (biji)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setConvRows((r) => [...r, { stockItemId: stockItems[0]?.id ?? "", ratio: "1" }])
                  }
                >
                  + Baris
                </Button>
              </div>
              <div className="space-y-2">
                {convRows.map((row, idx) => (
                  <div key={idx} className="flex flex-wrap gap-2">
                    <select
                      className="border-input bg-background h-11 min-w-[160px] flex-1 rounded-md border px-2 text-sm"
                      value={row.stockItemId}
                      onChange={(e) => {
                        const v = e.target.value;
                        setConvRows((rows) =>
                          rows.map((x, i) => (i === idx ? { ...x, stockItemId: v } : x))
                        );
                      }}
                    >
                      {stockItems.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      className="h-11 w-24"
                      inputMode="decimal"
                      value={row.ratio}
                      onChange={(e) => {
                        const v = e.target.value;
                        setConvRows((rows) =>
                          rows.map((x, i) => (i === idx ? { ...x, ratio: v } : x))
                        );
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setConvRows((rows) => rows.filter((_, i) => i !== idx))}
                    >
                      Hapus
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Batal
            </Button>
            <Button onClick={save} disabled={busy}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={groupsOpen} onOpenChange={setGroupsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Grup produk</DialogTitle>
          </DialogHeader>
          <div className="max-h-[50dvh] space-y-2 overflow-y-auto py-2">
            {productGroups.map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                <span className="text-sm">{g.name}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  disabled={busy}
                  onClick={async () => {
                    if (!confirm(`Hapus grup "${g.name}"? Produk di grup ini jadi tanpa grup.`)) return;
                    setBusy(true);
                    try {
                      await deleteDisplayGroup(g.id);
                      toast.success("Grup dihapus");
                      router.refresh();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Gagal");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Hapus
                </Button>
              </div>
            ))}
            {productGroups.length === 0 && (
              <p className="text-muted-foreground text-sm">Belum ada grup. Tambahkan di bawah.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 border-t pt-3">
            <Input
              className="h-11 flex-1 min-w-[120px]"
              placeholder="Nama grup baru"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <Button
              type="button"
              className="h-11"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await createDisplayGroup({
                    name: newGroupName,
                    context: "PRODUCT",
                    outletId,
                  });
                  setNewGroupName("");
                  toast.success("Grup dibuat");
                  router.refresh();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Gagal");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Tambah grup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
