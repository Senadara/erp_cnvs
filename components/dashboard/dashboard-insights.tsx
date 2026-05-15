"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyIdr, toDecimal } from "@/lib/money";
import type { CategoryRow, FinancialDayRow, ProductRankRow } from "@/lib/actions/analytics";

export function DashboardInsights({
  topSelling,
  topProfit,
  categoryRows,
  financialSeries,
}: {
  topSelling: ProductRankRow[];
  topProfit: ProductRankRow[];
  categoryRows: CategoryRow[];
  financialSeries: FinancialDayRow[];
}) {
  const catOmzet = categoryRows.map((c) => ({
    name: c.category,
    omzet: toDecimal(c.revenue).toNumber(),
    profit: toDecimal(c.profit).toNumber(),
  }));

  const finData = financialSeries.map((d) => ({
    label: d.date.slice(5),
    omzet: toDecimal(d.revenue).toNumber(),
    pengeluaran: toDecimal(d.expenses).toNumber(),
    laba: toDecimal(d.profit).toNumber(),
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produk paling laris (30 hari)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topSelling.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada penjualan.</p>
            ) : (
              topSelling.map((p, i) => (
                <div key={p.productId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">
                    <span className="text-muted-foreground mr-2 tabular-nums">{i + 1}.</span>
                    {p.name}
                  </span>
                  <span className="shrink-0 tabular-nums font-medium">{p.qty} porsi</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produk paling cuan (30 hari)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topProfit.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada data laba.</p>
            ) : (
              topProfit.map((p, i) => (
                <div key={p.productId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">
                    <span className="text-muted-foreground mr-2 tabular-nums">{i + 1}.</span>
                    {p.name}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatCurrencyIdr(p.profit)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Omzet per kategori</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {catOmzet.length === 0 ? (
              <p className="text-muted-foreground flex h-full items-center justify-center text-sm">
                Belum ada data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catOmzet} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrencyIdr(Number(v ?? 0))} />
                  <Bar dataKey="omzet" fill="#6366f1" radius={[0, 4, 4, 0]} name="Omzet" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Laba per kategori</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {catOmzet.length === 0 ? (
              <p className="text-muted-foreground flex h-full items-center justify-center text-sm">
                Belum ada data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catOmzet} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrencyIdr(Number(v ?? 0))} />
                  <Bar dataKey="profit" fill="#22c55e" radius={[0, 4, 4, 0]} name="Laba" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ringkasan keuangan (14 hari)</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {finData.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada data.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={finData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={52} />
                <Tooltip formatter={(v) => formatCurrencyIdr(Number(v ?? 0))} />
                <Legend />
                <Line type="monotone" dataKey="omzet" stroke="#6366f1" name="Omzet" dot={false} />
                <Line type="monotone" dataKey="pengeluaran" stroke="#f97316" name="Pengeluaran" dot={false} />
                <Line type="monotone" dataKey="laba" stroke="#22c55e" name="Laba bersih" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

