"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addStock,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  listRestockLogs,
  updateStockItemSettings,
} from "@/lib/actions/stock";
import {
  createDisplayGroup,
  deleteDisplayGroup,
  setStockItemDisplayGroup,
} from "@/lib/actions/display-group";
import { useRouter } from "next/navigation";
import { toDecimal } from "@/lib/money";
import { History, PackagePlus, Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  currentStock: string;
  unitName: string;
  minStockAlert: string;
  trackable: boolean;
  countingBasis: string;
  displayGroupId: string | null;
  displayGroupName: string | null;
};

type RestockRow = {
  id: string;
  qtyAdded: string;
  stockBefore: string;
  stockAfter: string;
  note: string | null;
  createdAt: string;
};

export function StockManager({
  outletId,
  items,
  stockGroups,
  readOnly = false,
}: {
  outletId: string;
  items: Row[];
  stockGroups: { id: string; name: string }[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<"all" | "track" | "untrack">("all");
  const [busy, setBusy] = React.useState<string | null>(null);

  const [restockOpen, setRestockOpen] = React.useState(false);
  const [restockId, setRestockId] = React.useState<string | null>(null);
  const [restockQty, setRestockQty] = React.useState("");
  const [restockNote, setRestockNote] = React.useState("");

  const [histOpen, setHistOpen] = React.useState(false);
  const [histName, setHistName] = React.useState("");
  const [histRows, setHistRows] = React.useState<RestockRow[]>([]);
  const [histLoading, setHistLoading] = React.useState(false);

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [setRow, setSetRow] = React.useState<Row | null>(null);
  const [setTrackable, setSetTrackable] = React.useState(true);
  const [setBasis, setSetBasis] = React.useState("BIJI");
  const [setUnit, setSetUnit] = React.useState("");
  const [setMin, setSetMin] = React.useState("");

  const [formOpen, setFormOpen] = React.useState(false);
  const [formEditing, setFormEditing] = React.useState<Row | null>(null);
  const [formName, setFormName] = React.useState("");
  const [formStock, setFormStock] = React.useState("0");
  const [formUnit, setFormUnit] = React.useState("biji");
  const [formMin, setFormMin] = React.useState("0");
  const [formTrackable, setFormTrackable] = React.useState(true);
  const [formBasis, setFormBasis] = React.useState("BIJI");
  const [formGroupId, setFormGroupId] = React.useState<string | null>(null);
  const [groupFilter, setGroupFilter] = React.useState<string>("all");
  const [groupsOpen, setGroupsOpen] = React.useState(false);
  const [newGroupName, setNewGroupName] = React.useState("");

  const filteredByTab = React.useMemo(() => {
    if (tab === "track") return items.filter((i) => i.trackable);
    if (tab === "untrack") return items.filter((i) => !i.trackable);
    return items;
  }, [items, tab]);

  const filteredItems = React.useMemo(() => {
    if (groupFilter === "all") return filteredByTab;
    if (groupFilter === "none") return filteredByTab.filter((i) => !i.displayGroupId);
    return filteredByTab.filter((i) => i.displayGroupId === groupFilter);
  }, [filteredByTab, groupFilter]);

  const groupSections = React.useMemo(() => {
    if (groupFilter !== "all") return null;
    const map = new Map<string, Row[]>();
    for (const s of filteredByTab) {
      const key = s.displayGroupId ?? "__none";
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    const sections: { id: string; name: string; items: Row[] }[] = [];
    for (const g of stockGroups) {
      const list = map.get(g.id);
      if (list?.length) sections.push({ id: g.id, name: g.name, items: list });
    }
    const ungrouped = map.get("__none");
    if (ungrouped?.length) sections.push({ id: "__none", name: "Tanpa grup", items: ungrouped });
    return sections;
  }, [filteredByTab, groupFilter, stockGroups]);

  const openRestock = (r: Row) => {
    setRestockId(r.id);
    setRestockQty("");
    setRestockNote("");
    setRestockOpen(true);
  };

  const submitRestock = async () => {
    if (!restockId) return;
    if (!restockQty.trim()) {
      toast.error("Isi jumlah restok");
      return;
    }
    setBusy("restock");
    try {
      await addStock(restockId, restockQty, restockNote || null);
      toast.success("Restok tercatat");
      setRestockOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(null);
    }
  };

  const openHist = async (r: Row) => {
    setHistName(r.name);
    setHistOpen(true);
    setHistLoading(true);
    try {
      const logs = await listRestockLogs(outletId, r.id, 100);
      setHistRows(
        logs.map((l) => ({
          id: l.id,
          qtyAdded: l.qtyAdded,
          stockBefore: l.stockBefore,
          stockAfter: l.stockAfter,
          note: l.note,
          createdAt: l.createdAt,
        }))
      );
    } catch {
      toast.error("Gagal memuat riwayat");
      setHistRows([]);
    } finally {
      setHistLoading(false);
    }
  };

  const openSettings = (r: Row) => {
    setSetRow(r);
    setSetTrackable(r.trackable);
    setSetBasis(r.countingBasis === "PORSI" ? "PORSI" : "BIJI");
    setSetUnit(r.unitName);
    setSetMin(r.minStockAlert);
    setSettingsOpen(true);
  };

  const openCreate = () => {
    setFormEditing(null);
    setFormName("");
    setFormStock("0");
    setFormUnit("biji");
    setFormMin("40");
    setFormTrackable(true);
    setFormBasis("BIJI");
    setFormGroupId(null);
    setFormOpen(true);
  };

  const openEditItem = (r: Row) => {
    setFormEditing(r);
    setFormName(r.name);
    setFormStock(r.currentStock);
    setFormUnit(r.unitName);
    setFormMin(r.minStockAlert);
    setFormTrackable(r.trackable);
    setFormBasis(r.countingBasis === "PORSI" ? "PORSI" : "BIJI");
    setFormGroupId(r.displayGroupId);
    setFormOpen(true);
  };

  const saveForm = async () => {
    if (!formName.trim()) {
      toast.error("Nama bahan wajib");
      return;
    }
    setBusy("form");
    try {
      const payload = {
        name: formName,
        currentStock: formStock,
        unitName: formUnit,
        minStockAlert: formMin,
        trackable: formTrackable,
        countingBasis: formBasis,
        displayGroupId: formGroupId,
      };
      if (formEditing) {
        await updateStockItem(outletId, formEditing.id, payload);
        toast.success("Bahan diperbarui");
      } else {
        await createStockItem(outletId, payload);
        toast.success("Bahan ditambahkan");
      }
      setFormOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(null);
    }
  };

  const onDeleteItem = async (r: Row) => {
    if (!confirm(`Hapus bahan "${r.name}"? Riwayat restok/waste item ini ikut terhapus.`)) return;
    setBusy(r.id);
    try {
      await deleteStockItem(outletId, r.id);
      toast.success("Bahan dihapus");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus");
    } finally {
      setBusy(null);
    }
  };

  const saveSettings = async () => {
    if (!setRow) return;
    setBusy("set");
    try {
      await updateStockItemSettings(outletId, setRow.id, {
        trackable: setTrackable,
        countingBasis: setBasis,
        unitName: setUnit,
        minStockAlert: setMin,
      });
      toast.success("Pengaturan disimpan");
      setSettingsOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(null);
    }
  };

  const renderStockCard = (s: Row) => {
    const low = s.trackable && toDecimal(s.currentStock).lte(toDecimal(s.minStockAlert));
    return (
      <div
        key={s.id}
        className={cn(
          "bg-card flex flex-col gap-3 rounded-xl border p-4",
          low && "border-destructive/50"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold leading-snug">{s.name}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {s.displayGroupName && groupFilter === "all" && (
                <Badge variant="outline" className="text-[10px]">
                  {s.displayGroupName}
                </Badge>
              )}
              <Badge variant={s.trackable ? "secondary" : "outline"} className="text-[10px]">
                {s.trackable ? "Trackable" : "Non-trackable"}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {s.countingBasis === "PORSI" ? "Basis: porsi" : "Basis: biji"}
              </Badge>
              {low && (
                <Badge variant="destructive" className="text-[10px]">
                  Stok rendah
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span>
            Stok:{" "}
            <span className="text-foreground font-mono font-semibold tabular-nums">
              {s.currentStock}
            </span>{" "}
            {s.unitName}
          </span>
          {s.trackable && (
            <span>
              Min. alert:{" "}
              <span className="text-foreground font-mono tabular-nums">{s.minStockAlert}</span>
            </span>
          )}
        </div>

        {!readOnly && (
          <div className="grid gap-2">
            <Label className="text-muted-foreground text-xs">Grup tampilan</Label>
            <Select
              value={s.displayGroupId ?? "__none"}
              onValueChange={async (v) => {
                const gid = v === "__none" || !v ? null : v;
                setBusy(s.id);
                try {
                  await setStockItemDisplayGroup(s.id, gid);
                  toast.success("Grup diperbarui");
                  router.refresh();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Gagal");
                } finally {
                  setBusy(null);
                }
              }}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Pilih grup" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Tanpa grup</SelectItem>
                {stockGroups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {readOnly && (
          <p className="text-muted-foreground text-xs">Grup: {s.displayGroupName ?? "—"}</p>
        )}

        <div className="mt-auto flex flex-wrap gap-2">
          {!readOnly && (
            <Button
              type="button"
              variant="default"
              size="sm"
              className="min-h-10"
              onClick={() => openRestock(s)}
            >
              <PackagePlus className="mr-1 size-4" />
              Restok
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-10"
            onClick={() => void openHist(s)}
          >
            <History className="mr-1 size-4" />
            Riwayat
          </Button>
          {!readOnly && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10"
                onClick={() => openEditItem(s)}
              >
                <Pencil className="mr-1 size-4" />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10"
                onClick={() => openSettings(s)}
              >
                <Settings2 className="mr-1 size-4" />
                Atur
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive min-h-10"
                disabled={busy === s.id}
                onClick={() => void onDeleteItem(s)}
              >
                <Trash2 className="mr-1 size-4" />
                Hapus
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted/40 rounded-xl border p-4 text-sm leading-relaxed">
        <p className="font-medium">Cara pakai</p>
        <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1">
          <li>
            <strong>Trackable</strong>: bahan terhitung per {` `}
            <em>biji/unit</em> atau setara porsi menu — stok berkurang otomatis dari kasir.
          </li>
          <li>
            <strong>Non-trackable</strong>: bahan seperti saus/powder — tidak memblok penjualan;
            yang utama adalah <strong>riwayat restok</strong> (kapan dan berapa yang masuk).
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-muted-foreground shrink-0 text-xs sm:text-sm">Filter grup</Label>
          <Select value={groupFilter} onValueChange={(v) => v && setGroupFilter(v)}>
            <SelectTrigger className="h-11 w-full max-w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua grup</SelectItem>
              <SelectItem value="none">Tanpa grup</SelectItem>
              {stockGroups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {!readOnly && (
            <>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => setGroupsOpen(true)}
              >
                Kelola grup
              </Button>
              <Button type="button" className="min-h-11 gap-2" onClick={openCreate}>
                <Plus className="size-4" />
                Tambah bahan
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="all" className="min-h-10">
            Semua
          </TabsTrigger>
          <TabsTrigger value="track" className="min-h-10">
            Trackable
          </TabsTrigger>
          <TabsTrigger value="untrack" className="min-h-10">
            Non-trackable
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredItems.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border py-12 text-center text-sm">
          Tidak ada bahan untuk filter ini. Buat grup lewat &quot;Kelola grup&quot; lalu assign ke bahan.
        </p>
      ) : groupFilter === "all" && groupSections ? (
        <div className="space-y-6">
          {groupSections.map((sec) => (
            <section key={sec.id} className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b pb-2">
                <h3 className="text-lg font-semibold tracking-tight">{sec.name}</h3>
                <Badge variant="secondary">{sec.items.length} item</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {sec.items.map((item) => renderStockCard(item))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredItems.map((item) => renderStockCard(item))}
        </div>
      )}

      <Dialog open={groupsOpen} onOpenChange={setGroupsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Grup tampilan stok</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Grup khusus outlet ini. Pindahkan bahan ke grup lewat dropdown di kartu stok.
          </p>
          <div className="max-h-[50dvh] space-y-2 overflow-y-auto py-2">
            {stockGroups.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <span className="text-sm font-medium">{g.name}</span>
                {!readOnly && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    disabled={busy === "group"}
                    onClick={async () => {
                      if (!confirm(`Hapus grup "${g.name}"? Bahan di grup ini jadi tanpa grup.`))
                        return;
                      setBusy("group");
                      try {
                        await deleteDisplayGroup(g.id);
                        toast.success("Grup dihapus");
                        router.refresh();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Gagal");
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    Hapus
                  </Button>
                )}
              </div>
            ))}
            {stockGroups.length === 0 && (
              <p className="text-muted-foreground text-sm">Belum ada grup. Tambahkan di bawah.</p>
            )}
          </div>
          {!readOnly && (
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Input
                className="h-11 min-w-[120px] flex-1"
                placeholder="Nama grup baru"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <Button
                type="button"
                className="h-11"
                disabled={busy === "group"}
                onClick={async () => {
                  if (!newGroupName.trim()) {
                    toast.error("Nama grup wajib");
                    return;
                  }
                  setBusy("group");
                  try {
                    await createDisplayGroup({
                      name: newGroupName,
                      context: "STOCK",
                      outletId,
                    });
                    setNewGroupName("");
                    toast.success("Grup dibuat");
                    router.refresh();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Gagal");
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                Tambah grup
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formEditing ? "Edit bahan stok" : "Tambah bahan stok"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label>Nama bahan</Label>
              <Input className="h-11" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Stok saat ini</Label>
              <Input
                className="h-11"
                inputMode="decimal"
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Satuan</Label>
                <Input className="h-11" value={formUnit} onChange={(e) => setFormUnit(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Min. alert</Label>
                <Input
                  className="h-11"
                  inputMode="decimal"
                  value={formMin}
                  onChange={(e) => setFormMin(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Trackable</Label>
              <Switch checked={formTrackable} onCheckedChange={setFormTrackable} />
            </div>
            <div className="grid gap-2">
              <Label>Basis</Label>
              <Select value={formBasis} onValueChange={(v) => v && setFormBasis(v)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BIJI">Biji / unit</SelectItem>
                  <SelectItem value="PORSI">Porsi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Grup tampilan</Label>
              <Select
                value={formGroupId ?? "__none"}
                onValueChange={(v) => setFormGroupId(v === "__none" ? null : v)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Tanpa grup</SelectItem>
                  {stockGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={busy === "form"}>
              Batal
            </Button>
            <Button onClick={() => void saveForm()} disabled={busy === "form"}>
              {busy === "form" ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restok bahan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <p className="text-muted-foreground text-sm">
              Setiap restok tercatat di riwayat (waktu, jumlah, stok sebelum/sesudah).
            </p>
            <div className="grid gap-2">
              <Label>Jumlah masuk (+)</Label>
              <Input
                className="h-12"
                inputMode="decimal"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                placeholder="Contoh: 50"
              />
            </div>
            <div className="grid gap-2">
              <Label>Catatan (opsional)</Label>
              <Textarea
                value={restockNote}
                onChange={(e) => setRestockNote(e.target.value)}
                placeholder="Supplier, no. faktur, dll."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockOpen(false)} disabled={!!busy}>
              Batal
            </Button>
            <Button onClick={() => void submitRestock()} disabled={busy === "restock"}>
              Simpan restok
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={histOpen} onOpenChange={setHistOpen}>
        <DialogContent className="max-h-[85dvh] max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle>Riwayat restok — {histName}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[55dvh] overflow-auto rounded-md border">
            {histLoading ? (
              <p className="text-muted-foreground p-4 text-sm">Memuat…</p>
            ) : histRows.length === 0 ? (
              <p className="text-muted-foreground p-4 text-sm">Belum ada restok tercatat.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead className="text-right">+Qty</TableHead>
                    <TableHead className="text-right">Sesudah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {histRows.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(h.createdAt).toLocaleString("id-ID")}
                        {h.note && (
                          <span className="text-muted-foreground block text-[11px]">{h.note}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        +{h.qtyAdded}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {h.stockAfter}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pengaturan stok — {setRow?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="tr">Trackable</Label>
                <p className="text-muted-foreground text-xs">
                  Matikan untuk bahan yang tidak dipakai untuk batas jual otomatis.
                </p>
              </div>
              <Switch id="tr" checked={setTrackable} onCheckedChange={setSetTrackable} />
            </div>
            <div className="grid gap-2">
              <Label>Basis penghitungan</Label>
              <Select value={setBasis} onValueChange={(v) => v && setSetBasis(v)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BIJI">Per biji / unit fisik</SelectItem>
                  <SelectItem value="PORSI">Setara porsi (informasi)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Nama satuan</Label>
              <Input className="h-12" value={setUnit} onChange={(e) => setSetUnit(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Minimal alert</Label>
              <Input
                className="h-12"
                inputMode="decimal"
                value={setMin}
                onChange={(e) => setSetMin(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)} disabled={!!busy}>
              Batal
            </Button>
            <Button onClick={() => void saveSettings()} disabled={busy === "set"}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
