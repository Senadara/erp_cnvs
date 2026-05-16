"use client";

import * as React from "react";
import { formatCurrencyIdr } from "@/lib/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getShiftFinancialDetail } from "@/lib/actions/shift";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ShiftListItem = {
  id: string;
  openedAt: string;
  closedAt: string | null;
  status: string;
  openingCash: string;
  actualCash: string | null;
  expectedCash: string | null;
  discrepancy: string | null;
  note: string | null;
};

export function ShiftReportsList({ initialShifts }: { initialShifts: ShiftListItem[] }) {
  const [shifts] = React.useState(initialShifts);
  const [selectedShift, setSelectedShift] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);

  const viewDetail = async (id: string) => {
    setBusy(true);
    setSelectedShift(id);
    try {
      const data = await getShiftFinancialDetail(id);
      setDetail(data);
    } catch (e) {
      toast.error("Gagal memuat detail shift");
      setSelectedShift(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu Buka</TableHead>
              <TableHead>Waktu Tutup</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Kas Awal</TableHead>
              <TableHead className="text-right">Kas Aktual</TableHead>
              <TableHead className="text-right">Selisih</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-xs">
                  {new Date(s.openedAt).toLocaleString("id-ID")}
                </TableCell>
                <TableCell className="text-xs">
                  {s.closedAt ? new Date(s.closedAt).toLocaleString("id-ID") : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={s.status === "OPEN" ? "outline" : "secondary"}>
                    {s.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrencyIdr(s.openingCash)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {s.actualCash ? formatCurrencyIdr(s.actualCash) : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {s.discrepancy ? (
                    <span className={Number(s.discrepancy) === 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrencyIdr(s.discrepancy)}
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => viewDetail(s.id)}>
                    Detail
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {shifts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Belum ada riwayat shift.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedShift} onOpenChange={(open) => !open && setSelectedShift(null)}>
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Keuangan Shift</DialogTitle>
          </DialogHeader>
          {busy ? (
            <div className="py-12 text-center text-muted-foreground">Memuat detail...</div>
          ) : detail ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Status</p>
                  <p className="font-medium">{detail.shift.status}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Outlet</p>
                  <p className="font-medium">{detail.outlet.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Dibuka Pada</p>
                  <p className="font-medium">{new Date(detail.shift.openedAt).toLocaleString("id-ID")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Ditutup Pada</p>
                  <p className="font-medium">
                    {detail.shift.closedAt ? new Date(detail.shift.closedAt).toLocaleString("id-ID") : "Masih Terbuka"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">Arus Kas Masuk</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Modal Awal (Kas Awal)</span>
                    <span className="font-medium">{formatCurrencyIdr(detail.sebelumBuka.kasAwal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Penjualan Tunai (Lunas)</span>
                    <span className="font-medium text-green-600">+{formatCurrencyIdr(detail.selamaShift.paidCash)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tambah Modal Kembalian</span>
                    <span className="font-medium text-blue-600">+{formatCurrencyIdr(detail.tambahan.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t font-semibold">
                    <span>Total Uang Masuk</span>
                    <span>{formatCurrencyIdr(Number(detail.sebelumBuka.kasAwal) + Number(detail.selamaShift.paidCash) + Number(detail.tambahan.total))}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">Arus Kas Keluar</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pengeluaran Operasional</span>
                    <span className="font-medium text-red-600">-{formatCurrencyIdr(detail.pengeluaran.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm italic text-muted-foreground">
                    <span>(Info) Total Kembalian</span>
                    <span>{formatCurrencyIdr(detail.selamaShift.totalKembalian)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 rounded-xl border p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Estimasi Uang di Laci</span>
                  <span className="text-lg font-bold">{formatCurrencyIdr(detail.selamaShift.expectedCashInDrawer)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Kas Aktual (Fisik)</span>
                  <span className="text-lg font-bold">{detail.shift.actualCash ? formatCurrencyIdr(detail.shift.actualCash) : "Belum diinput"}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold uppercase tracking-wider">Selisih (Discrepancy)</span>
                  <span className={cn(
                    "text-xl font-black",
                    Number(detail.shift.discrepancy || 0) === 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {detail.shift.discrepancy ? formatCurrencyIdr(detail.shift.discrepancy) : "—"}
                  </span>
                </div>
              </div>

              {detail.shift.note && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Catatan</p>
                  <p className="text-sm bg-muted p-2 rounded italic">"{detail.shift.note}"</p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-semibold text-sm border-b pb-1 uppercase tracking-wider text-muted-foreground">Item Terjual</h4>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="h-9 text-xs">Produk</TableHead>
                        <TableHead className="h-9 text-xs text-center">Qty</TableHead>
                        <TableHead className="h-9 text-xs text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.selamaShift.itemsSummary.map((it: any) => (
                        <TableRow key={it.name}>
                          <TableCell className="py-2 text-sm">{it.name}</TableCell>
                          <TableCell className="py-2 text-sm text-center">{it.qty}</TableCell>
                          <TableCell className="py-2 text-sm text-right tabular-nums">{formatCurrencyIdr(it.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                      {detail.selamaShift.itemsSummary.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-4 text-xs">Tidak ada item terjual.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1 uppercase tracking-wider text-muted-foreground text-red-600">Daftar Pengeluaran</h4>
                  <div className="space-y-2">
                    {detail.pengeluaran.rows.map((r: any) => (
                      <div key={r.id} className="text-xs bg-red-500/5 p-2 rounded border border-red-500/10">
                        <div className="flex justify-between font-medium">
                          <span>{r.category}</span>
                          <span className="text-red-600">-{formatCurrencyIdr(r.amount)}</span>
                        </div>
                        <p className="text-muted-foreground mt-0.5">{r.description || "Tanpa deskripsi"}</p>
                      </div>
                    ))}
                    {detail.pengeluaran.rows.length === 0 && <p className="text-xs text-muted-foreground italic">Tidak ada pengeluaran.</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1 uppercase tracking-wider text-muted-foreground text-blue-600">Daftar Tambahan Modal</h4>
                  <div className="space-y-2">
                    {detail.tambahan.rows.map((r: any) => (
                      <div key={r.id} className="text-xs bg-blue-500/5 p-2 rounded border border-blue-500/10">
                        <div className="flex justify-between font-medium">
                          <span>{r.category}</span>
                          <span className="text-blue-600">+{formatCurrencyIdr(r.amount)}</span>
                        </div>
                        <p className="text-muted-foreground mt-0.5">{r.description || "Tanpa deskripsi"}</p>
                      </div>
                    ))}
                    {detail.tambahan.rows.length === 0 && <p className="text-xs text-muted-foreground italic">Tidak ada tambahan modal.</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm border-b pb-1">Detail Transaksi QRIS (Non-Tunai)</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total QRIS</span>
                  <span className="font-medium text-indigo-600">{formatCurrencyIdr(detail.selamaShift.paidQris)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
