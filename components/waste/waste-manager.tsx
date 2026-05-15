"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { recordWaste } from "@/lib/actions/stock";
import { useRouter } from "next/navigation";

export function WasteManager({
  outletId,
  stocks,
  logs,
}: {
  outletId: string;
  stocks: { id: string; name: string }[];
  logs: { id: string; qty: string; reason: string; createdAt: string; stockName: string }[];
}) {
  const router = useRouter();
  const [stockId, setStockId] = React.useState(() => stocks[0]?.id ?? "");
  const [qty, setQty] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const firstStockId = stocks[0]?.id ?? "";
  const resolvedStockId =
    stockId && stocks.some((s) => s.id === stockId) ? stockId : firstStockId;

  const submit = async () => {
    setBusy(true);
    try {
      await recordWaste(outletId, resolvedStockId, qty, reason);
      toast.success("Waste dicatat");
      setQty("");
      setReason("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="bg-card space-y-4 rounded-xl border p-4">
        <h2 className="text-lg font-semibold">Form waste</h2>
        <div className="grid gap-2">
          <Label>Stok item</Label>
          <select
            className="border-input bg-background h-12 w-full rounded-md border px-3 text-sm"
            value={resolvedStockId}
            onChange={(e) => setStockId(e.target.value)}
          >
            {stocks.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label>Jumlah (biji)</Label>
          <Input className="h-12" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Alasan</Label>
          <Input className="h-12" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <Button className="min-h-12 w-full" disabled={busy} onClick={submit}>
          Simpan
        </Button>
      </div>

      <div className="bg-card space-y-3 rounded-xl border p-4">
        <h2 className="text-lg font-semibold">Riwayat</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Alasan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="whitespace-nowrap text-xs">
                  {new Date(l.createdAt).toLocaleString("id-ID")}
                </TableCell>
                <TableCell>{l.stockName}</TableCell>
                <TableCell className="text-right tabular-nums">{l.qty}</TableCell>
                <TableCell className="max-w-[160px] truncate">{l.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
