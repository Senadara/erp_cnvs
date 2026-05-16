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
import { recordExpense } from "@/lib/actions/expense";
import { closeShift, openShift } from "@/lib/actions/shift";
import { formatCurrencyIdr } from "@/lib/money";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const CATEGORIES = ["Es Batu", "Gas", "Listrik", "Parkir", "Tambah Modal", "Lainnya"];

type Shift = {
  id: string;
  openedAt: string;
  openingCash: string;
  status: string;
} | null;

export type ShiftFinancialPayload = {
  outlet: { id: string; name: string };
  sebelumBuka: { kasAwal: string; keterangan: string };
  selamaShift: {
    paidTransactionCount: number;
    paidTotal: string;
    paidCash: string;
    paidQris: string;
    unpaidCount: number;
    unpaidTotal: string;
    totalKembalian: string;
    expectedCashInDrawer: string;
    unpaidOrders: {
      id: string;
      invoiceNumber: string;
      totalAmount: string;
      createdAt: string;
    }[];
  };
  pengeluaran: {
    total: string;
    rows: {
      id: string;
      amount: string;
      category: string;
      description: string | null;
      createdAt: string;
    }[];
  };
  tambahan: {
    total: string;
    rows: {
      id: string;
      amount: string;
      category: string;
      description: string | null;
      createdAt: string;
    }[];
  };
} | null;

export function ExpensesManager({
  outletId,
  initialShift,
  shiftFinancial,
  rows,
}: {
  outletId: string;
  initialShift: Shift;
  shiftFinancial: ShiftFinancialPayload;
  rows: {
    id: string;
    amount: string;
    category: string;
    description: string | null;
    createdAt: string;
  }[];
}) {
  const router = useRouter();
  const shift = initialShift;

  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState(CATEGORIES[0]!);
  const [desc, setDesc] = React.useState("");
  const [opening, setOpening] = React.useState("");
  const [closeOpen, setCloseOpen] = React.useState(false);
  const [actualCash, setActualCash] = React.useState("");
  const [closeNote, setCloseNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const totalToday = rows.reduce((a, r) => a + Number(r.amount), 0);

  const submitExpense = async () => {
    setBusy(true);
    try {
      await recordExpense(outletId, amount, category, desc);
      toast.success("Pengeluaran tercatat");
      setAmount("");
      setDesc("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  };

  const submitOpen = async () => {
    setBusy(true);
    try {
      await openShift(outletId, opening || 0);
      toast.success("Shift dibuka");
      setOpening("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  };

  const submitClose = async () => {
    if (!shift) return;
    setBusy(true);
    try {
      await closeShift(shift.id, actualCash || 0, closeNote);
      toast.success("Shift ditutup");
      setCloseOpen(false);
      setActualCash("");
      setCloseNote("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {shiftFinancial && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ringkasan shift — {shiftFinancial.outlet.name}</CardTitle>
            <p className="text-muted-foreground text-xs">
              Pembagian kas sebelum buka, penjualan yang sudah lunas, order belum bayar, dan pengeluaran
              laci dalam periode shift ini.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="bg-muted/40 space-y-2 rounded-lg border p-3 text-sm">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Sebelum / awal buka
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {formatCurrencyIdr(shiftFinancial.sebelumBuka.kasAwal)}
              </p>
              <p className="text-muted-foreground text-xs">{shiftFinancial.sebelumBuka.keterangan}</p>
            </div>
            <div className="bg-muted/40 space-y-2 rounded-lg border p-3 text-sm">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Selama shift (sudah bayar)
              </p>
              <p className="tabular-nums">
                Omzet lunas:{" "}
                <span className="font-semibold">
                  {formatCurrencyIdr(shiftFinancial.selamaShift.paidTotal)}
                </span>
              </p>
              <p className="text-muted-foreground text-xs">
                Tunai {formatCurrencyIdr(shiftFinancial.selamaShift.paidCash)} · QRIS{" "}
                {formatCurrencyIdr(shiftFinancial.selamaShift.paidQris)} ·{" "}
                {shiftFinancial.selamaShift.paidTransactionCount} struk
              </p>
              <p className="text-muted-foreground text-xs font-medium mt-1">
                Total Kembalian Diberikan: <span className="text-orange-500">{formatCurrencyIdr(shiftFinancial.selamaShift.totalKembalian)}</span>
              </p>
              <Separator className="my-2" />
              <p className="text-muted-foreground text-xs font-medium uppercase">Belum lunas</p>
              <p className="tabular-nums">
                {shiftFinancial.selamaShift.unpaidCount} order ·{" "}
                <span className="font-semibold">
                  {formatCurrencyIdr(shiftFinancial.selamaShift.unpaidTotal)}
                </span>
              </p>
              <p className="text-muted-foreground text-xs">
                Perkiraan tunai di laci:{" "}
                <span className="text-foreground font-medium">
                  {formatCurrencyIdr(shiftFinancial.selamaShift.expectedCashInDrawer)}
                </span>
              </p>
            </div>
            <div className="bg-muted/40 space-y-2 rounded-lg border p-3 text-sm">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Pengeluaran & Tambahan
              </p>
              <div className="flex justify-between">
                <span>Pengeluaran:</span>
                <span className="font-semibold text-red-500 tabular-nums">
                  {formatCurrencyIdr(shiftFinancial.pengeluaran.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tambah Modal:</span>
                <span className="font-semibold text-green-500 tabular-nums">
                  {formatCurrencyIdr(shiftFinancial.tambahan.total)}
                </span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-semibold mt-2 bg-primary/10 p-2 rounded">
                <span className="text-primary">LACI AKTUAL:</span>
                <span className="text-primary tabular-nums">
                  {formatCurrencyIdr(shiftFinancial.selamaShift.expectedCashInDrawer)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
      <div className="bg-card space-y-4 rounded-xl border p-4">
        <h2 className="text-lg font-semibold">Shift</h2>
        {shift ? (
          <div className="space-y-2 text-sm">
            <p>
              Status: <span className="font-medium text-accent">OPEN</span>
            </p>
            <p className="text-muted-foreground">
              Dibuka: {new Date(shift.openedAt).toLocaleString("id-ID")}
            </p>
            <Button className="min-h-12 w-full" variant="outline" onClick={() => setCloseOpen(true)}>
              Tutup shift
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">Belum ada shift terbuka.</p>
            <div className="grid gap-2">
              <Label>Kas awal (Rp)</Label>
              <Input
                className="h-12"
                inputMode="decimal"
                value={opening}
                onChange={(e) => setOpening(e.target.value)}
              />
            </div>
            <Button className="min-h-12 w-full" disabled={busy} onClick={submitOpen}>
              Buka shift
            </Button>
          </div>
        )}
      </div>

      <div className="bg-card space-y-4 rounded-xl border p-4">
        <h2 className="text-lg font-semibold">Catat Pengeluaran / Tambah Modal</h2>
        <div className="grid gap-2">
          <Label>Nominal</Label>
          <Input
            className="h-12"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Kategori</Label>
          <Select value={category} onValueChange={(v) => v && setCategory(v)}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Deskripsi</Label>
          <Input className="h-12" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <Button className="min-h-12 w-full" disabled={busy} onClick={submitExpense}>
          Simpan
        </Button>
      </div>

      <div className="bg-card space-y-3 rounded-xl border p-4 lg:col-span-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold">Hari ini</h2>
          <p className="text-muted-foreground text-sm">
            Total pengeluaran:{" "}
            <span className="text-foreground font-semibold">
              {formatCurrencyIdr(totalToday)}
            </span>
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead className="text-right">Nominal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap text-xs">
                  {new Date(r.createdAt).toLocaleTimeString("id-ID")}
                </TableCell>
                <TableCell>{r.category}</TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {r.description ?? "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <span className={r.category === "Tambah Modal" ? "text-green-500 font-medium" : "text-red-500"}>
                    {r.category === "Tambah Modal" ? "+" : "-"}{formatCurrencyIdr(r.amount)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </div>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tutup shift</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label>Kas aktual di laci (Rp)</Label>
              <Input
                className="h-12"
                inputMode="decimal"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Catatan</Label>
              <Input className="h-12" value={closeNote} onChange={(e) => setCloseNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)} disabled={busy}>
              Batal
            </Button>
            <Button onClick={submitClose} disabled={busy}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
