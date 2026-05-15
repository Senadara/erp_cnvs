"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOwnerPerformance } from "@/lib/actions/analytics";
import { formatCurrencyIdr, toDecimal } from "@/lib/money";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Perf = Awaited<ReturnType<typeof getOwnerPerformance>>;

export function OwnerPerformance({ initial }: { initial: Perf }) {
  const [dateStr, setDateStr] = React.useState(initial.date);
  const [outletFilter, setOutletFilter] = React.useState<string>(
    initial.focusOutletId ?? "all"
  );
  const [data, setData] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);

  const reload = async () => {
    setBusy(true);
    try {
      const d = new Date(dateStr + "T12:00:00");
      const next = await getOwnerPerformance(d, null, outletFilter);
      setData(next);
    } finally {
      setBusy(false);
    }
  };

  const chartOutlets = data.outlets.map((o) => ({
    name: o.name.length > 12 ? o.name.slice(0, 12) + "…" : o.name,
    omzet: toDecimal(o.revenue).toNumber(),
    laba: toDecimal(o.profit).toNumber(),
  }));

  const isSingle = outletFilter !== "all";
  const selectedName =
    data.outletOptions.find((o) => o.id === outletFilter)?.name ?? "Semua outlet";

  return (
    <div className="space-y-4">
      <div className="bg-card flex flex-wrap items-end gap-3 rounded-xl border p-4">
        <div className="grid gap-2">
          <Label htmlFor="perf-date">Tanggal</Label>
          <Input
            id="perf-date"
            type="date"
            className="h-11 w-[180px]"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
          />
        </div>
        <div className="grid min-w-[200px] gap-2">
          <Label>Outlet</Label>
          <Select value={outletFilter} onValueChange={(v) => v && setOutletFilter(v)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Pilih outlet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua outlet (gabungan)</SelectItem>
              {data.outletOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" className="min-h-11" disabled={busy} onClick={() => void reload()}>
          {busy ? "Memuat…" : "Muat ulang"}
        </Button>
      </div>

      <p className="text-muted-foreground text-sm">
        Menampilkan: <strong>{selectedName}</strong>
        {isSingle ? " — metrik dan grafik khusus outlet ini." : " — ringkasan gabungan semua outlet."}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {isSingle ? "Omzet outlet" : "Omzet semua outlet"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrencyIdr(data.general.revenue)}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {data.general.transactionCount} transaksi lunas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrencyIdr(data.general.expenses)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Laba bersih</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrencyIdr(data.general.profit)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Produk terlaris</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {data.topSelling.length === 0 ? (
              <p className="text-muted-foreground">—</p>
            ) : (
              data.topSelling.slice(0, 3).map((p, i) => (
                <p key={p.productId}>
                  {i + 1}. {p.name} ({p.qty} porsi)
                </p>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {!isSingle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perbandingan omzet per outlet</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {chartOutlets.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada outlet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartOutlets}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={48} />
                  <Tooltip formatter={(v) => formatCurrencyIdr(Number(v ?? 0))} />
                  <Bar dataKey="omzet" fill="#6366f1" name="Omzet" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="laba" fill="#22c55e" name="Laba" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {isSingle && data.categoryRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Omzet per kategori — {selectedName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.categoryRows.map((c) => (
              <div key={c.category} className="flex justify-between text-sm">
                <span>{c.category}</span>
                <span className="font-medium tabular-nums">{formatCurrencyIdr(c.revenue)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!isSingle && (
        <div className="bg-card overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Outlet</TableHead>
                <TableHead className="text-right">Transaksi</TableHead>
                <TableHead className="text-right">Omzet</TableHead>
                <TableHead className="text-right">Pengeluaran</TableHead>
                <TableHead className="text-right">Laba</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.outlets.map((r) => (
                <TableRow key={r.outletId}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.transactionCount}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrencyIdr(r.revenue)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrencyIdr(r.expenses)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrencyIdr(r.profit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
