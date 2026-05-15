"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrencyIdr } from "@/lib/money";
import { getMonthlyReport } from "@/lib/actions/report";

type Report = {
  omzet: string;
  hpp: string;
  pengeluaran: string;
  netProfit: string;
  transactionCount: number;
  mitraMode?: boolean;
};

export function ReportsClient({
  outletId,
  initialMonth,
  initialYear,
  mitraProductIds,
}: {
  outletId: string;
  initialMonth: number;
  initialYear: number;
  mitraProductIds?: string[] | null;
}) {
  const [month, setMonth] = React.useState(initialMonth);
  const [year, setYear] = React.useState(initialYear);
  const [data, setData] = React.useState<Report | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setBusy(true);
    try {
      const r = await getMonthlyReport(outletId, month, year, {
        productIds: mitraProductIds?.length ? mitraProductIds : null,
      });
      setData(r);
    } finally {
      setBusy(false);
    }
  }, [outletId, month, year, mitraProductIds]);

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-2">
          <Label>Bulan</Label>
          <select
            className="border-input bg-background h-12 rounded-md border px-3 text-sm"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label>Tahun</Label>
          <Input
            className="h-12 w-28"
            inputMode="numeric"
            value={year}
            onChange={(e) => setYear(Number(e.target.value || initialYear))}
          />
        </div>
        <Button className="min-h-12" variant="outline" disabled={busy} onClick={() => void load()}>
          Muat ulang
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Ringkasan {month}/{year}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {!data ? (
            <p className="text-muted-foreground sm:col-span-2 text-sm">Memuat…</p>
          ) : (
            <>
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Total omzet</span>
                <span className="font-semibold tabular-nums">{formatCurrencyIdr(data.omzet)}</span>
              </div>
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Transaksi</span>
                <span className="font-semibold tabular-nums">{data.transactionCount}</span>
              </div>
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Total HPP</span>
                <span className="font-semibold tabular-nums">{formatCurrencyIdr(data.hpp)}</span>
              </div>
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Pengeluaran</span>
                <span className="font-semibold tabular-nums">
                  {formatCurrencyIdr(data.pengeluaran)}
                </span>
              </div>
              <div className="sm:col-span-2 flex justify-between border-t pt-3 text-base">
                <span className="font-medium">
                  {data.mitraMode ? "Estimasi laba (item terpilih)" : "Net profit"}
                </span>
                <span className="text-primary font-semibold tabular-nums">
                  {formatCurrencyIdr(data.netProfit)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
