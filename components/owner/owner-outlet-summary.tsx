"use client";

import * as React from "react";
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
import { Badge } from "@/components/ui/badge";
import { getOwnerOutletsSummary } from "@/lib/actions/owner";
import { formatCurrencyIdr } from "@/lib/money";

type Row = {
  outletId: string;
  name: string;
  paidTransactionCount: number;
  unpaidCount: number;
  omzet: string;
  cashSales: string;
  qrisSales: string;
  expenses: string;
  hasOpenShift: boolean;
  shiftOpenedAt: string | null;
};

export function OwnerOutletSummary({
  initialDate,
  initialRows,
}: {
  initialDate: string;
  initialRows: Row[];
}) {
  const [dateStr, setDateStr] = React.useState(initialDate);
  const [rows, setRows] = React.useState(initialRows);
  const [busy, setBusy] = React.useState(false);

  const reload = async () => {
    setBusy(true);
    try {
      const d = new Date(dateStr + "T12:00:00");
      const { outlets } = await getOwnerOutletsSummary(d);
      setRows(outlets);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card flex flex-wrap items-end gap-3 rounded-xl border p-4">
        <div className="grid gap-2">
          <Label htmlFor="d">Tanggal</Label>
          <Input
            id="d"
            type="date"
            className="h-11 w-[180px]"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
          />
        </div>
        <Button type="button" className="min-h-11" disabled={busy} onClick={() => void reload()}>
          {busy ? "Memuat…" : "Muat ulang"}
        </Button>
      </div>

      <div className="bg-card overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Outlet</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead className="text-right">Struk lunas</TableHead>
              <TableHead className="text-right">Belum lunas</TableHead>
              <TableHead className="text-right">Omzet lunas</TableHead>
              <TableHead className="text-right">Pengeluaran</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.outletId}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>
                  {r.hasOpenShift ? (
                    <Badge variant="secondary">Buka</Badge>
                  ) : (
                    <Badge variant="outline">Tidak ada shift buka</Badge>
                  )}
                  {r.shiftOpenedAt && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      {new Date(r.shiftOpenedAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.paidTransactionCount}</TableCell>
                <TableCell className="text-right tabular-nums">{r.unpaidCount}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrencyIdr(r.omzet)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrencyIdr(r.expenses)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
